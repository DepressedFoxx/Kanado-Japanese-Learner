interface AudioManifestEntry {
  url: string;
  credit: string;
}

interface AudioManifest {
  entries?: Record<string, AudioManifestEntry>;
}

interface SpeakOptions {
  fallback?: boolean;
  source?: "google" | "local";
}

interface ResolvedAudio {
  url: string;
  credit: string;
}

let generation = 0;
let activeAudio: HTMLAudioElement | null = null;
let activeRequest: AbortController | null = null;

export function stopSpeech() {
  generation++;
  activeRequest?.abort();
  activeRequest = null;

  if (activeAudio) {
    activeAudio.pause();
    activeAudio.removeAttribute("src");
    activeAudio.load();
    activeAudio = null;
  }

  if (typeof window !== "undefined") {
    window.speechSynthesis?.cancel();
  }
}

export function speakBrowser(text: string) {
  stopSpeech();
  if (typeof window === "undefined" || !window.speechSynthesis) return;

  try {
    const utterance = new SpeechSynthesisUtterance(text);
    utterance.lang = "ja-JP";
    utterance.rate = 0.8;

    window.speechSynthesis.cancel();
    window.speechSynthesis.speak(utterance);
  } catch {
    /* Một số trình duyệt chặn khi chưa có tương tác người dùng. */
  }
}

async function resolveLocalAudio(
  text: string,
  signal: AbortSignal,
): Promise<ResolvedAudio> {
  const response = await fetch("/audio/manifest.json", { signal });
  if (!response.ok) {
    throw new Error("Chưa có kho audio VOICEVOX.");
  }

  const manifest = (await response.json()) as AudioManifest;
  const normalizedText = text.trim().normalize("NFC");
  const entry = manifest.entries?.[normalizedText];

  if (!entry) {
    throw new Error("Chưa tạo audio VOICEVOX cho nội dung này.");
  }

  return { url: entry.url, credit: entry.credit };
}

async function resolveGoogleAudio(
  text: string,
  signal: AbortSignal,
): Promise<ResolvedAudio> {
  const response = await fetch("/api/speech", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ text }),
    signal,
  });
  const data = await response.json();

  if (!response.ok) {
    throw new Error(data.message || "Không tải được giọng Google.");
  }

  return {
    url: `data:audio/mpeg;base64,${data.audioContent}`,
    credit: data.voice as string,
  };
}

/** Trang review tắt fallback để không nghe nhầm giọng trình duyệt. */
export async function speak(text: string, options: SpeakOptions = {}) {
  if (typeof window === "undefined" || !text.trim()) return;

  stopSpeech();
  const currentGeneration = generation;
  const controller = new AbortController();
  const timeout = window.setTimeout(() => controller.abort(), 20_000);
  activeRequest = controller;

  try {
    const source = options.source ?? "local";
    const resolvedAudio =
      source === "google"
        ? await resolveGoogleAudio(text, controller.signal)
        : await resolveLocalAudio(text, controller.signal);

    if (currentGeneration !== generation) return;

    activeAudio = new Audio(resolvedAudio.url);
    await activeAudio.play();
    return resolvedAudio.credit;
  } catch (error) {
    if (currentGeneration !== generation) return;
    if (options.fallback === false) throw error;

    console.warn("Audio không khả dụng; đang dùng giọng trình duyệt.");
    speakBrowser(text);
  } finally {
    window.clearTimeout(timeout);
  }
}
