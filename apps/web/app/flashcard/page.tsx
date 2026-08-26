import { Flashcard } from "@/components/Flashcard";

export const metadata = { title: "Flashcard — Kanadō" };

export default function FlashcardPage() {
  return (
    <div className="panel">
      <div>
        <h2>Flashcard</h2>
        <p className="lede">
          Lặp lại ngắt quãng: thẻ bạn nhớ sẽ giãn dần ra (1 → 2 → 4 → 8 → 16 → 30 ngày), thẻ quên
          quay lại ngay trong phiên. Bấm vào thẻ hoặc phím <b>Space</b> để lật, rồi chấm 1 / 2 / 3.
        </p>
      </div>
      <Flashcard />
    </div>
  );
}
