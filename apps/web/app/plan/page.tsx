import { PlanView } from "@/components/PlanView";

export const metadata = { title: "Lộ trình tới N4 — Kanadō" };

export default function PlanPage() {
  return (
    <div className="panel">
      <div>
        <h2>Lộ trình tới N4</h2>
        <p className="lede">
          Từ vị trí hiện tại (xong hiragana, đang katakana) tới đủ sức thi N4 là khoảng{" "}
          <b>9–12 tháng nếu học 1 giờ/ngày</b>, hoặc <b>6–7 tháng nếu học 2 giờ/ngày</b> và không bỏ
          ngày. Các mốc dưới đây tính theo nhịp 1 giờ/ngày.
        </p>
      </div>
      <PlanView />
    </div>
  );
}
