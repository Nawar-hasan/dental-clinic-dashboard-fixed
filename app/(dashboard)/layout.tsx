import { Footer } from "@/components/footer";
import { Sidebar } from "@/components/sidebar";
import { Topbar } from "@/components/topbar";
import { requireUser } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
export const dynamic = "force-dynamic";
export default async function DashboardLayout({ children }: { children: React.ReactNode }) {
  const session = await requireUser();
  const settings = await prisma.clinicSettings.upsert({ where: { id: "clinic" }, update: {}, create: { id: "clinic", clinicName: "عيادة الدكتور عمار درويش", doctorName: "الدكتور عمار درويش" } });
  return <div className="app-shell"><Sidebar clinicName={settings.clinicName}/><div className="main-column"><Topbar clinicName={settings.clinicName} session={session}/><main className="content">{children}</main><Footer/></div></div>;
}
