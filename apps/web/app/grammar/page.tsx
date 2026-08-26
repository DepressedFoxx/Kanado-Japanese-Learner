import { GrammarList } from "@/components/GrammarList";

export const metadata = { title: "Ngữ pháp — Kanadō" };

export default function GrammarPage() {
  return (
    <div className="panel">
      <div>
        <h2>Ngữ pháp</h2>
        <p className="lede">
          N5 là bộ khung câu; N4 là nơi động từ bắt đầu biến hình. Học trợ từ trước, rồi thể て —
          gần như mọi mẫu N4 đều mọc ra từ thể て.
        </p>
      </div>
      <GrammarList />
    </div>
  );
}
