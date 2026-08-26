import { TestRunner } from "@/components/TestRunner";

export const metadata = { title: "Kiểm tra — Kanadō" };

export default function TestPage() {
  return (
    <div className="panel">
      <div>
        <h2>Kiểm tra</h2>
        <p className="lede">
          Khác với Luyện tập: ở đây không báo đúng sai từng câu. Làm hết đề rồi mới chấm, có tính
          giờ — sát với cảm giác thi thật. Câu sai được liệt kê kèm giải thích.
        </p>
      </div>
      <TestRunner />
    </div>
  );
}
