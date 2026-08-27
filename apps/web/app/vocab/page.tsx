import { vocab } from "@kanado/content";
import { VocabList } from "@/components/VocabList";

export const metadata = { title: "Từ vựng — Kanadō" };

export default function VocabPage() {
  const vi = vocab.filter((v) => v.source === "vi").length;

  return (
    <div className="panel">
      <div>
        <h2>Từ vựng</h2>
        <p className="lede">
          <b>{vocab.length}</b> từ. Các nhóm theo chủ đề (<b>{vi}</b> từ) có nghĩa tiếng Việt; các
          nhóm “Kho từ” lấy từ từ điển mở nên nghĩa là tiếng Anh. Tra ở đây, học thuộc ở tab
          Flashcard. Bấm vào từ để nghe.
        </p>
      </div>
      <VocabList />
    </div>
  );
}
