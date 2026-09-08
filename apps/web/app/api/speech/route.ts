import { NextRequest, NextResponse } from "next/server";

export const runtime = "nodejs";

const audioCache = new Map<string, string>();
const pendingRequests = new Map<string, Promise<string>>();

let rateLimitWindowStartedAt = Date.now();
let requestsInWindow = 0;

function errorResponse(message: string, status: number) {
  return NextResponse.json({ message }, { status });
}

function consumeRateLimit() {
  if (Date.now() - rateLimitWindowStartedAt >= 60_000) {
    rateLimitWindowStartedAt = Date.now();
    requestsInWindow = 0;
  }

  if (requestsInWindow >= 30) return false;
  requestsInWindow++;
  return true;
}

async function synthesize(text: string, voice: string, apiKey: string) {
  const response = await fetch(
    "https://texttospeech.googleapis.com/v1/text:synthesize",
    {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        "X-Goog-Api-Key": apiKey,
      },
      body: JSON.stringify({
        input: { text },
        voice: { languageCode: "ja-JP", name: voice },
        audioConfig: { audioEncoding: "MP3" },
      }),
      signal: AbortSignal.timeout(15_000),
    },
  );

  if (!response.ok) {
    throw new Error(`Google TTS trả về HTTP ${response.status}.`);
  }

  const data = await response.json();
  const audioContent = data.audioContent;

  if (
    typeof audioContent !== "string" ||
    !audioContent ||
    audioContent.length > 2_000_000
  ) {
    throw new Error("Google TTS trả về audio không hợp lệ.");
  }

  if (audioCache.size >= 100) {
    const oldestKey = audioCache.keys().next().value;
    if (oldestKey) audioCache.delete(oldestKey);
  }

  audioCache.set(JSON.stringify([voice, text]), audioContent);
  return audioContent;
}

function getOrCreateAudio(
  cacheKey: string,
  text: string,
  voice: string,
  apiKey: string,
) {
  const cached = audioCache.get(cacheKey);
  if (cached) return Promise.resolve(cached);

  const pending = pendingRequests.get(cacheKey);
  if (pending) return pending;

  if (!consumeRateLimit()) return null;

  const request = synthesize(text, voice, apiKey);
  pendingRequests.set(cacheKey, request);
  void request.finally(() => pendingRequests.delete(cacheKey)).catch(() => undefined);

  return request;
}

export async function POST(request: NextRequest) {
  const origin = request.headers.get("origin");
  if (origin && origin !== request.nextUrl.origin) {
    return errorResponse("Origin không hợp lệ.", 403);
  }

  let body: unknown;
  try {
    body = await request.json();
  } catch {
    return errorResponse("Dữ liệu không hợp lệ.", 400);
  }

  const rawText =
    typeof body === "object" && body && "text" in body ? body.text : undefined;
  const text = typeof rawText === "string" ? rawText.trim() : "";

  if (!text || text.length > 300) {
    return errorResponse("Nhập từ 1 đến 300 ký tự.", 400);
  }

  const apiKey = process.env.GOOGLE_TTS_API_KEY;
  if (!apiKey) {
    return errorResponse(
      "Chưa cấu hình GOOGLE_TTS_API_KEY trên máy chủ web.",
      503,
    );
  }

  const voice = process.env.GOOGLE_TTS_VOICE || "ja-JP-Neural2-B";
  const cacheKey = JSON.stringify([voice, text]);
  const audioRequest = getOrCreateAudio(cacheKey, text, voice, apiKey);

  if (!audioRequest) {
    return errorResponse(
      "Đã đạt giới hạn nghe thử. Thử lại sau một phút.",
      429,
    );
  }

  try {
    const audioContent = await audioRequest;
    return NextResponse.json({ audioContent, voice, provider: "google" });
  } catch {
    return errorResponse(
      "Google TTS chưa trả được audio. Kiểm tra API key, quyền Cloud Text-to-Speech, billing và quota trên máy chủ.",
      502,
    );
  }
}
