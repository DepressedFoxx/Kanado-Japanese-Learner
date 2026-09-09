import { ListeningPractice } from "@/components/ListeningPractice";

export const metadata = { title: "Luyện nghe — Kanadō" };

export default function ListeningPage() {
  return (
    <div className="panel">
      <div>
        <h2>Luyện nghe</h2>
        <p className="lede">
          Nghe hội thoại, chọn đáp án và mở transcript khi cần kiểm tra nội dung.
        </p>
      </div>
      <ListeningPractice />
    </div>
  );
}
