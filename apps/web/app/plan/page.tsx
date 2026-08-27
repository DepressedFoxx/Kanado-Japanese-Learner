import { PlanView } from "@/components/PlanView";

export const metadata = { title: "Lộ trình — Kanadō" };

export default function PlanPage() {
  return (
    <div className="panel">
      <div>
        <h2>Lộ trình</h2>
      </div>
      <PlanView />
    </div>
  );
}
