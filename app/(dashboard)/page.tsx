import Link from "next/link";
import { CalendarCheck, CircleDollarSign, Clock3, ReceiptText, TrendingUp, Users } from "lucide-react";
import { StatCard } from "@/components/stat-card";
import { StatusBadge } from "@/components/status-badge";
import { prisma } from "@/lib/prisma";
import { formatDateTime, formatMoney } from "@/lib/utils";

export const dynamic = "force-dynamic";

export default async function DashboardPage() {
  const today = new Date(); today.setHours(0,0,0,0);
  const tomorrow = new Date(today); tomorrow.setDate(tomorrow.getDate()+1);
  const [settings, patientCount, todayCount, appointments, paymentTotal, expenseTotal, recentPatients, recentPayments, recentExpenses] = await Promise.all([
    prisma.clinicSettings.findUnique({ where: { id: "clinic" } }),
    prisma.patient.count({ where: { isArchived: false } }),
    prisma.appointment.count({ where: { startAt: { gte: today, lt: tomorrow } } }),
    prisma.appointment.findMany({ where: { startAt: { gte: today }, status: { in: ["PENDING","CONFIRMED"] } }, include: { patient: true }, orderBy: { startAt: "asc" }, take: 6 }),
    prisma.payment.aggregate({ where: { deletedAt: null }, _sum: { amountCents: true } }),
    prisma.expense.aggregate({ where: { deletedAt: null }, _sum: { amountCents: true } }),
    prisma.patient.findMany({ where: { isArchived: false }, orderBy: { createdAt: "desc" }, take: 5 }),
    prisma.payment.findMany({ where: { deletedAt: null }, include: { patient: true }, orderBy: { paidAt: "desc" }, take: 5 }),
    prisma.expense.findMany({ where: { deletedAt: null }, include: { category: true }, orderBy: { date: "desc" }, take: 5 })
  ]);
  const currency = settings?.currency || "SYP";
  const income = paymentTotal._sum.amountCents || 0;
  const expenses = expenseTotal._sum.amountCents || 0;

  const labels:string[]=[]; const values:number[]=[]; const now=new Date();
  for(let i=5;i>=0;i--){
    const start=new Date(now.getFullYear(),now.getMonth()-i,1); const end=new Date(now.getFullYear(),now.getMonth()-i+1,1);
    const total=await prisma.payment.aggregate({where:{paidAt:{gte:start,lt:end},deletedAt:null},_sum:{amountCents:true}});
    labels.push(new Intl.DateTimeFormat("ar-SY",{month:"short"}).format(start)); values.push(total._sum.amountCents||0);
  }
  const max=Math.max(...values,1);

  return <>
    <div className="page-header"><div><h1>لوحة التحكم</h1><p>نظرة سريعة على عمل العيادة اليوم والحالة المالية.</p></div><Link className="btn btn-primary" href="/patients/new">إضافة مريض جديد</Link></div>
    <section className="grid stats-grid"><StatCard label="إجمالي المرضى" value={patientCount} icon={Users}/><StatCard label="مواعيد اليوم" value={todayCount} icon={CalendarCheck}/><StatCard label="إجمالي الدفعات" value={formatMoney(income,currency)} icon={CircleDollarSign}/><StatCard label="صافي الدخل" value={formatMoney(income-expenses,currency)} icon={TrendingUp}/></section>
    <section className="grid two-cols">
      <div className="card"><div className="card-title"><div><h3>المواعيد القادمة</h3><p>أقرب ستة مواعيد</p></div><Link className="btn btn-ghost btn-small" href="/appointments">عرض الكل</Link></div>{appointments.length?<div className="timeline">{appointments.map(a=><div className="timeline-item" key={a.id}><div style={{display:"flex",justifyContent:"space-between",gap:12}}><h4>{a.patient.fullName}</h4><StatusBadge status={a.status}/></div><p><Clock3 size={14} style={{display:"inline",verticalAlign:"middle"}}/> {formatDateTime(a.startAt)}</p><p>{a.type}</p></div>)}</div>:<div className="empty"><strong>لا توجد مواعيد قادمة</strong>أضيفي موعدًا من قسم المواعيد.</div>}</div>
      <div className="card"><div className="card-title"><div><h3>الإيرادات خلال 6 أشهر</h3><p>إجمالي الدفعات المسجلة شهريًا</p></div></div><div className="bar-chart">{labels.map((label,i)=><div className="bar-row" key={`${label}-${i}`}><span>{label}</span><div className="bar-track"><div className="bar-fill" style={{width:`${values[i]/max*100}%`}}/></div><strong>{formatMoney(values[i],currency)}</strong></div>)}</div></div>
    </section>
    <section className="grid three-cols" style={{marginTop:18}}>
      <div className="card"><div className="card-title"><h3>آخر المرضى</h3><Users size={19}/></div>{recentPatients.map(p=><Link className="patient-cell" href={`/patients/${p.id}`} key={p.id} style={{padding:"9px 0",borderBottom:"1px solid #edf2f7"}}><div className="patient-photo">{p.fullName.slice(0,1)}</div><div><strong>{p.fullName}</strong><div className="muted-sm">{p.fileNumber}</div></div></Link>)}</div>
      <div className="card"><div className="card-title"><h3>آخر الدفعات</h3><CircleDollarSign size={19}/></div>{recentPayments.map(p=><div key={p.id} style={{padding:"9px 0",borderBottom:"1px solid #edf2f7",display:"flex",justifyContent:"space-between",gap:8}}><div><strong>{p.patient.fullName}</strong><div className="muted-sm">{formatDateTime(p.paidAt)}</div></div><strong style={{color:"#047857"}}>{formatMoney(p.amountCents,currency)}</strong></div>)}</div>
      <div className="card"><div className="card-title"><h3>آخر المصروفات</h3><ReceiptText size={19}/></div>{recentExpenses.map(e=><div key={e.id} style={{padding:"9px 0",borderBottom:"1px solid #edf2f7",display:"flex",justifyContent:"space-between",gap:8}}><div><strong>{e.name}</strong><div className="muted-sm">{e.category?.name||"بدون تصنيف"}</div></div><strong style={{color:"#be123c"}}>{formatMoney(e.amountCents,currency)}</strong></div>)}</div>
    </section>
  </>;
}
