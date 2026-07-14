import { appointmentStatusLabels, visitStatusLabels } from "@/lib/constants";
export function StatusBadge({ status }: { status: string }) {
  const label = appointmentStatusLabels[status as keyof typeof appointmentStatusLabels] || visitStatusLabels[status as keyof typeof visitStatusLabels] || status;
  const kind = status === "COMPLETED" || status === "CONFIRMED" || status === "PAID" ? "success" : status === "CANCELLED" || status === "NO_SHOW" || status === "OVERDUE" ? "danger" : status === "PENDING" || status === "UPCOMING" || status === "PARTIALLY_PAID" ? "warning" : "muted";
  return <span className={`badge ${kind}`}>{label}</span>;
}
