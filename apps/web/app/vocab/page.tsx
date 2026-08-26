import { VocabList } from "@/components/VocabList";

export const metadata = { title: "Từ vựng — Kanadō" };

export default function VocabPage() {
  return (
    <div className="panel">
      <div>
        <h2>Từ vựng</h2>
        <p className="lede">
          Tra và đọc lướt ở đây, học thuộc ở tab Flashcard. Bấm vào từ để nghe. Với từ katakana, dấu{" "}
          <span className="jp">ー</span> kéo dài nguyên âm phía trước.
        </p>
      </div>
      <VocabList />
    </div>
  );
}
