import { LogOut } from "lucide-react";
import { logoutAction } from "@/app/actions";
import type { SessionPayload } from "@/lib/auth";
export function Topbar({ session, clinicName }: { session: SessionPayload; clinicName: string }) {
  return <header className="topbar"><div className="topbar-title"><h2>{clinicName}</h2><p>إدارة المرضى والمواعيد والدفعات في مكان واحد</p></div><div className="user-chip"><div className="avatar-mini">{session.name.slice(0,1)}</div><div><strong>{session.name}</strong><div className="muted-sm">{session.role === "ADMIN" ? "مدير" : "موظف استقبال"}</div></div><form action={logoutAction}><button className="btn btn-ghost btn-small" type="submit" title="تسجيل الخروج"><LogOut size={16}/></button></form></div></header>;
}
