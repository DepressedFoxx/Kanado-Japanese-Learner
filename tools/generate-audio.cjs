/* Local-only generation. Run after building @kanado/content. */
const fs = require("node:fs/promises");
const path = require("node:path");
const { createHash } = require("node:crypto");
const { spawnSync } = require("node:child_process");
const {
  kana,
  vocab,
  kanji,
  decks,
  deckCards,
} = require("../packages/content/dist");

const audioRoot = path.resolve(__dirname, "../apps/web/public/audio");
const defaultEndpoint =
  process.env.VOICEVOX_URL || "http://127.0.0.1:50021";
const endpoints = (process.env.VOICEVOX_URLS || defaultEndpoint).split(",");
const speaker = Number(process.env.VOICEVOX_SPEAKER || 13);
const generationLimit = Number(process.env.AUDIO_LIMIT || Infinity);
const ffmpeg = process.env.FFMPEG_PATH || "ffmpeg";

const reviewSamples = [
  "こんにちは。今日は日本語を勉強します。",
  "あ、い、う、え、お。",
  "おばさん。おばあさん。きて。きって。",
  "学校で日本語を勉強しています。",
];

const texts = [
  ...new Set(
    [
      ...reviewSamples,
      ...kana.flatMap((entry) => [entry.hiragana, entry.katakana]),
      ...vocab.map((entry) => entry.reading),
      ...kanji.map((entry) => entry.example.reading),
      ...decks.flatMap((deck) =>
        deckCards(deck.id).map((card) => card.reading),
      ),
    ]
      .filter(Boolean)
      .map((text) => text.trim().normalize("NFC")),
  ),
];

async function callVoicevox(route, options, endpoint = endpoints[0]) {
  const response = await fetch(`${endpoint}${route}`, {
    ...options,
    signal: AbortSignal.timeout(120_000),
  });

  if (!response.ok) {
    const path = route.split("?")[0];
    throw new Error(`VOICEVOX ${path}: HTTP ${response.status}`);
  }

  return response;
}

async function readManifest(manifestPath) {
  try {
    return JSON.parse(await fs.readFile(manifestPath, "utf8"));
  } catch (error) {
    if (error.code === "ENOENT") return { entries: {} };
    throw error;
  }
}

async function replaceFileOnWindows(source, destination) {
  for (let attempt = 0; attempt <= 5; attempt++) {
    try {
      await fs.rename(source, destination);
      return;
    } catch (error) {
      const retryable = ["EPERM", "EBUSY", "EACCES"].includes(error.code);
      if (!retryable || attempt === 5) throw error;

      // The Next.js dev server can briefly hold the manifest open on Windows.
      await new Promise((resolve) => setTimeout(resolve, 100 * (attempt + 1)));
    }
  }
}

function createManifestWriter(manifestPath, manifest) {
  let saving = Promise.resolve();

  return {
    save() {
      saving = saving.then(async () => {
        const temporaryPath = `${manifestPath}.tmp`;
        const content = `${JSON.stringify(manifest, null, 2)}\n`;

        await fs.writeFile(temporaryPath, content);
        await replaceFileOnWindows(temporaryPath, manifestPath);
      });

      return saving;
    },
    wait() {
      return saving;
    },
  };
}

function audioName(version, text) {
  const input = JSON.stringify([version, speaker, text]);
  const hash = createHash("sha256").update(input).digest("hex").slice(0, 24);
  return `${hash}.mp3`;
}

async function fileExists(file) {
  try {
    return (await fs.stat(file)).size > 44;
  } catch {
    return false;
  }
}

async function synthesizeAudio(text, endpoint) {
  const queryRoute =
    `/audio_query?speaker=${speaker}&text=${encodeURIComponent(text)}`;
  const queryResponse = await callVoicevox(
    queryRoute,
    { method: "POST" },
    endpoint,
  );
  const query = await queryResponse.json();
  const synthesisResponse = await callVoicevox(
    `/synthesis?speaker=${speaker}`,
    {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(query),
    },
    endpoint,
  );
  const wav = Buffer.from(await synthesisResponse.arrayBuffer());

  const isWave =
    wav.toString("ascii", 0, 4) === "RIFF" &&
    wav.toString("ascii", 8, 12) === "WAVE";
  if (!isWave) throw new Error("VOICEVOX returned an invalid WAV file.");

  const encoded = spawnSync(
    ffmpeg,
    [
      "-hide_banner",
      "-loglevel",
      "error",
      "-i",
      "pipe:0",
      "-ac",
      "1",
      "-codec:a",
      "libmp3lame",
      "-b:a",
      "64k",
      "-f",
      "mp3",
      "pipe:1",
    ],
    {
      input: wav,
      windowsHide: true,
      maxBuffer: 10_000_000,
    },
  );

  if (encoded.status !== 0 || encoded.stdout.length < 100) {
    throw new Error(`FFmpeg encoding failed: ${encoded.stderr}`);
  }

  return encoded.stdout;
}

async function verifyAudioFiles() {
  const manifestPath = path.join(audioRoot, "manifest.json");
  const manifest = JSON.parse(await fs.readFile(manifestPath, "utf8"));
  const missing = [];
  let totalBytes = 0;

  for (const text of texts) {
    const entry = manifest.entries[text];
    const validUrl = entry?.url?.match(/^\/audio\/[a-f0-9]{24}\.mp3$/);

    if (!validUrl) {
      missing.push(text);
      continue;
    }

    try {
      const file = path.join(audioRoot, path.basename(entry.url));
      const size = (await fs.stat(file)).size;

      if (size < 100) missing.push(text);
      else totalBytes += size;
    } catch {
      missing.push(text);
    }
  }

  const complete = texts.length - missing.length;
  const sizeInMiB = (totalBytes / 1_048_576).toFixed(1);
  console.log(`${complete}/${texts.length} audio files present; ${sizeInMiB} MiB`);

  if (missing.length) {
    console.log("Missing examples:", missing.slice(0, 5));
    process.exitCode = 1;
  }
}

async function generateAudioFiles() {
  const ffmpegCheck = spawnSync(ffmpeg, ["-version"], { windowsHide: true });
  if (ffmpegCheck.status !== 0) {
    throw new Error(
      "FFmpeg not found. Set FFMPEG_PATH to the ffmpeg executable.",
    );
  }

  const speakers = await (await callVoicevox("/speakers")).json();
  const actor = speakers.find((candidate) =>
    candidate.styles.some((style) => style.id === speaker),
  );
  if (!actor) throw new Error(`Speaker ${speaker} not available.`);

  const version = await (await callVoicevox("/version")).json();
  for (const endpoint of endpoints.slice(1)) {
    const endpointVersion = await (
      await callVoicevox("/version", undefined, endpoint)
    ).json();

    if (endpointVersion !== version) {
      throw new Error("All engines must have the same version.");
    }
  }

  await fs.mkdir(audioRoot, { recursive: true });
  const credit = `VOICEVOX:${actor.name}`;
  const manifestPath = path.join(audioRoot, "manifest.json");
  const manifest = await readManifest(manifestPath);
  const manifestWriter = createManifestWriter(manifestPath, manifest);

  let created = 0;
  let allocated = 0;
  let nextTextIndex = 0;

  async function worker(endpoint) {
    while (nextTextIndex < texts.length) {
      const text = texts[nextTextIndex++];
      const name = audioName(version, text);
      const file = path.join(audioRoot, name);
      const url = `/audio/${name}`;
      const exists = await fileExists(file);

      if (exists && manifest.entries[text]?.url === url) continue;

      if (!exists) {
        if (allocated >= generationLimit) break;
        allocated++;

        const mp3 = await synthesizeAudio(text, endpoint);
        await fs.writeFile(`${file}.tmp`, mp3);
        await fs.rename(`${file}.tmp`, file);
        created++;
      }

      manifest.entries[text] = { url, credit, speaker, version };
      await manifestWriter.save();

      if (created && created % 25 === 0) {
        const indexed = Object.keys(manifest.entries).length;
        console.log(`Created ${created}; indexed ${indexed}/${texts.length}`);
      }
    }
  }

  const results = await Promise.allSettled(endpoints.map(worker));
  await manifestWriter.wait();

  for (const result of results) {
    if (result.status === "rejected") throw result.reason;
  }

  const indexed = Object.keys(manifest.entries).length;
  console.log(
    `Done: ${created} new MP3 files; ${indexed}/${texts.length} indexed. ${credit}`,
  );
}

async function main() {
  const validSettings =
    Number.isInteger(speaker) && speaker >= 0 && generationLimit > 0;
  if (!validSettings) throw new Error("Invalid speaker or AUDIO_LIMIT.");

  if (process.argv.includes("--dry-run")) {
    console.log(`${texts.length} unique texts; output: ${audioRoot}`);
    return;
  }

  if (process.argv.includes("--verify")) {
    await verifyAudioFiles();
    return;
  }

  await generateAudioFiles();
}

main().catch((error) => {
  console.error(error.message);
  process.exitCode = 1;
});
