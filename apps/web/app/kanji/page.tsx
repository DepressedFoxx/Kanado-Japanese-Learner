import { kanji } from "@kanado/content";
import { KanjiGrid } from "@/components/KanjiGrid";

export const metadata = { title: "Kanji — Kanadō" };

export default function KanjiPage() {
  const vi = kanji.filter((k) => k.source === "vi").length;

  return (
    <div className="panel">
      <div>
        <h2>Kanji</h2>
        <p className="lede">
          <b>{kanji.length}</b> chữ, phủ trọn mức N5 đến N3. Trong đó <b>{vi}</b> chữ có nghĩa
          tiếng Việt và từ ví dụ chọn lọc; số còn lại lấy từ từ điển mở nên nghĩa là tiếng Anh,
          đánh dấu <span className="entag">EN</span>. Mỗi chữ đều có <b>âm Hán Việt</b> — dùng nó
          để đoán nghĩa chữ chưa gặp. Bấm vào chữ để nghe.
        </p>
      </div>
      <KanjiGrid />
    </div>
  );
}
