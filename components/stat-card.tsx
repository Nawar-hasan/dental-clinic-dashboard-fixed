import type { LucideIcon } from "lucide-react";
export function StatCard({ label, value, icon: Icon }: { label: string; value: string | number; icon: LucideIcon }) {
  return <div className="stat-card"><div><div className="label">{label}</div><div className="value">{value}</div></div><div className="stat-icon"><Icon size={22} /></div></div>;
}
