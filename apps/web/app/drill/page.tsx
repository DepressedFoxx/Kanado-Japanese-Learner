import { Drill } from "@/components/Drill";

export const metadata = { title: "Luyện bảng chữ — Kanadō" };

export default function DrillPage() {
  return (
    <div className="panel">
      <div>
        <h2>Luyện bảng chữ</h2>
        <p className="lede">
          Chữ nào hay sai sẽ tự động xuất hiện nhiều hơn. Tiến độ lưu ngay trên máy, và đồng bộ lên
          tài khoản nếu bạn đã đăng nhập.
        </p>
      </div>
      <Drill />
    </div>
  );
}
