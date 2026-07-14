import Link from "next/link";
import { CalendarDays, CircleDollarSign, ClipboardList, LayoutDashboard, ReceiptText, Settings, Stethoscope, Users } from "lucide-react";
const links = [
  ["/", "لوحة التحكم", LayoutDashboard], ["/patients", "المرضى", Users], ["/appointments", "المواعيد", CalendarDays],
  ["/payments", "الدفعات", CircleDollarSign], ["/expenses", "مصروفات العيادة", ReceiptText], ["/reports", "التقارير", ClipboardList], ["/settings", "الإعدادات", Settings]
] as const;
export function Sidebar({ clinicName }: { clinicName: string }) {
  return <aside className="sidebar"><div className="brand"><div className="brand-logo"><Stethoscope size={25}/></div><div><h1>{clinicName}</h1><small>نظام إدارة العيادة</small></div></div><nav className="nav">{links.map(([href,label,Icon]) => <Link className="nav-link" href={href} key={href}><Icon size={19}/><span>{label}</span></Link>)}</nav><div className="sidebar-footer">نظام مبسّط لإدارة المرضى والجلسات والحسابات.<br/>أنشئ بواسطة <strong>HOLOL NAWAR</strong></div></aside>;
}
