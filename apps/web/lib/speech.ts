/** Đọc tiếng Nhật bằng giọng có sẵn của trình duyệt. Không có thì im lặng bỏ qua. */
export function speak(text: string) {
  if (typeof window === "undefined" || !window.speechSynthesis) return;
  try {
    const utterance = new SpeechSynthesisUtterance(text);
    utterance.lang = "ja-JP";
    utterance.rate = 0.8;
    window.speechSynthesis.cancel();
    window.speechSynthesis.speak(utterance);
  } catch {
    /* một số trình duyệt chặn khi chưa có tương tác người dùng */
  }
}
