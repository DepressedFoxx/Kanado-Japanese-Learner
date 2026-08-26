import { kanji } from "@kanado/content";
import { KanjiGrid } from "@/components/KanjiGrid";

export const metadata = { title: "Kanji — Kanadō" };

export default function KanjiPage() {
  return (
    <div className="panel">
      <div>
        <h2>Kanji</h2>
        <p className="lede">
          N4 yêu cầu khoảng 300 chữ. App có <b>{kanji.length}</b> chữ nền — đủ cho N5 và phần lớn
          N4, phần còn lại lấy từ giáo trình. Bấm vào chữ để nghe từ ví dụ.
        </p>
      </div>
      <KanjiGrid />
    </div>
  );
}
