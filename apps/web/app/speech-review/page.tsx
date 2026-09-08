"use client";

import { useEffect, useState } from "react";
import { speak, speakBrowser, stopSpeech } from "@/lib/speech";

const REVIEW_SAMPLES = [
  "あ、い、う、え、お。",
  "おばさん。おばあさん。きて。きって。",
  "学校で日本語を勉強しています。",
];

type SpeechSource = "google" | "local";

export default function SpeechReview() {
  const [text, setText] = useState("こんにちは。今日は日本語を勉強します。");
  const [status, setStatus] = useState("");
  const [busy, setBusy] = useState(false);

  useEffect(() => () => stopSpeech(), []);

  async function preview(source: SpeechSource) {
    setBusy(true);
    setStatus("Đang tải audio…");

    try {
      const voice = await speak(text, { fallback: false, source });
      setStatus(voice ? `Đang phát · ${voice}` : "Đã dừng.");
    } catch (error) {
      const message =
        error instanceof Error ? error.message : "Không phát được audio.";
      setStatus(message);
    } finally {
      setBusy(false);
    }
  }

  function previewBrowserVoice() {
    speakBrowser(text);
    setStatus("Giọng trình duyệt · tốc độ 0,8×");
  }

  function stopPreview() {
    stopSpeech();
    setStatus("Đã dừng.");
  }

  return (
    <section style={{ maxWidth: 760, margin: "40px auto", padding: 24 }}>
      <h1>Nghe thử giọng tiếng Nhật</h1>
      <p>
        VOICEVOX phát từ file tạo sẵn. Google cần API key. Mỗi nút báo lỗi
        nếu nguồn chưa sẵn sàng.
      </p>

      <label htmlFor="speech-text">Nội dung tiếng Nhật</label>
      <textarea
        id="speech-text"
        value={text}
        maxLength={300}
        rows={4}
        onChange={(event) => setText(event.target.value)}
        style={{ width: "100%", margin: "12px 0", padding: 12, fontSize: 22 }}
      />

      <div style={{ display: "flex", gap: 12, flexWrap: "wrap" }}>
        <button
          className="chip"
          disabled={busy || !text.trim()}
          onClick={() => preview("local")}
        >
          Nghe VOICEVOX
        </button>
        <button
          className="chip"
          disabled={busy || !text.trim()}
          onClick={() => preview("google")}
        >
          Nghe Google
        </button>
        <button className="chip" disabled={busy} onClick={previewBrowserVoice}>
          Nghe giọng cũ
        </button>
        <button className="chip" onClick={stopPreview}>
          Dừng
        </button>
      </div>

      <p role="status" aria-live="polite">
        {status}
      </p>

      <p>Mẫu kiểm tra âm dài, âm ngắt và câu:</p>
      {REVIEW_SAMPLES.map((sample) => (
        <button
          className="chip"
          key={sample}
          onClick={() => setText(sample)}
          style={{ margin: 4 }}
        >
          {sample}
        </button>
      ))}
    </section>
  );
}
