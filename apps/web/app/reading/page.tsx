import { ReadingPractice } from "@/components/ReadingPractice";

export const metadata = { title: "Đọc hiểu — Kanadō" };

export default function ReadingPage() {
  return (
    <div className="panel">
      <div>
        <h2>Đọc hiểu</h2>
        <p className="lede">
          Luyện đọc đoạn ngắn, đoạn dài và tìm thông tin theo cấu trúc JLPT N5–N3.
        </p>
      </div>
      <ReadingPractice />
    </div>
  );
}
