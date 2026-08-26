import { KanaChart } from "@/components/KanaChart";

export const metadata = { title: "Hiragana — Kanadō" };

export default function HiraganaPage() {
  return (
    <div className="panel">
      <div>
        <h2>Hiragana — ひらがな</h2>
        <p className="lede">
          Giữ ở đây để ôn nhanh, đừng để rơi rụng trong lúc học katakana. Quét mắt 30 giây mỗi ngày
          là đủ.
        </p>
      </div>
      <KanaChart script="hiragana" />
    </div>
  );
}
