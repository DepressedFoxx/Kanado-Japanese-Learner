import { GrammarList } from "@/components/GrammarList";

export const metadata = { title: "Ngữ pháp — Kanadō" };

export default function GrammarPage() {
  return (
    <div className="panel">
      <div>
        <h2>Ngữ pháp</h2>
        <p className="lede">
          Bắt đầu ở tab Nền tảng: trật tự từ và hệ thống thì. Rồi tới N5 là bộ khung câu, N4 là nơi
          động từ bắt đầu biến hình — gần như mọi mẫu N4 đều mọc ra từ thể て.
        </p>
      </div>
      <GrammarList />
    </div>
  );
}
