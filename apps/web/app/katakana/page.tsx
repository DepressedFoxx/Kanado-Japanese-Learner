import { KanaChart } from "@/components/KanaChart";

export const metadata = { title: "Katakana — Kanadō" };

export default function KatakanaPage() {
  return (
    <div className="panel">
      <div>
        <h2>Katakana — カタカナ</h2>
        <p className="lede">
          Bấm vào ô để nghe cách đọc. Bật “Ẩn romaji” để tự kiểm tra — ô xanh là chữ đã thuộc, ô đỏ
          là chữ hay sai trong phần Luyện bảng chữ.
        </p>
      </div>
      <KanaChart script="katakana" />
    </div>
  );
}
