const assert = require("node:assert/strict");
const fs = require("node:fs");
const vm = require("node:vm");
const ts = require("typescript");

const source = ts.transpileModule(
  fs.readFileSync("apps/web/lib/speech.ts", "utf8"),
  {
    compilerOptions: {
      module: ts.ModuleKind.CommonJS,
      target: ts.ScriptTarget.ES2022,
    },
  },
).outputText;

const requested = [];
const played = [];
let fallbackCount = 0;
let resolveFetch;

const context = {
  exports: {},
  AbortController,
  console: { warn() {} },
  window: {
    setTimeout,
    clearTimeout,
    speechSynthesis: {
      cancel() {},
      speak() {
        fallbackCount++;
      },
    },
  },
  SpeechSynthesisUtterance: class {},
  Audio: class {
    constructor(url) {
      this.url = url;
    }

    async play() {
      played.push(this.url);
    }

    pause() {}
    removeAttribute() {}
    load() {}
  },
  fetch: async (url) => {
    requested.push(url);
    return {
      ok: true,
      json: async () => ({
        entries: {
          あ: { url: "/audio/a.mp3", credit: "VOICEVOX:test" },
        },
      }),
    };
  },
};

vm.runInNewContext(source, context);

async function run() {
  assert.equal(await context.exports.speak(" あ "), "VOICEVOX:test");
  assert.deepEqual(requested, ["/audio/manifest.json"]);
  assert.deepEqual(played, ["/audio/a.mp3"]);

  await context.exports.speak("missing");
  assert.equal(fallbackCount, 1);

  await assert.rejects(
    context.exports.speak("missing", { fallback: false }),
  );
  assert.equal(fallbackCount, 1, "review never substitutes browser voice");

  context.fetch = () =>
    new Promise((resolve) => {
      resolveFetch = resolve;
    });
  const staleRequest = context.exports.speak("あ");
  context.exports.stopSpeech();
  resolveFetch({
    ok: true,
    json: async () => ({
      entries: {
        あ: { url: "/audio/stale.mp3" },
      },
    }),
  });
  await staleRequest;

  assert.equal(played.length, 1, "stopped request never plays late");
  console.log(
    "Audio playback checks passed: static file, normalization, fallback, strict review, cancellation.",
  );
}

run().catch((error) => {
  console.error(error);
  process.exitCode = 1;
});
