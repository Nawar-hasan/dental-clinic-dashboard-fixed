import Link from "next/link";
import { CircleDollarSign } from "lucide-react";
import { paymentMethodLabels } from "@/lib/constants";
import { prisma } from "@/lib/prisma";
import { formatDateTime, formatMoney } from "@/lib/utils";
export const dynamic = "force-dynamic";

export default async function PaymentsPage(){
  const [payments,settings,totals]=await Promise.all([
    prisma.payment.findMany({where:{deletedAt:null},include:{patient:true,visit:true},orderBy:{paidAt:"desc"},take:200}),
    prisma.clinicSettings.findUnique({where:{id:"clinic"}}),
    prisma.payment.aggregate({where:{deletedAt:null},_sum:{amountCents:true},_count:true})
  ]); const currency=settings?.currency||"SYP";
  return <><div className="page-header"><div><h1>الدفعات والحسابات</h1><p>جميع سندات القبض المسجلة للمرضى.</p></div></div><div className="grid stats-grid"><div className="stat-card"><div><div className="label">إجمالي الدفعات</div><div className="value">{formatMoney(totals._sum.amountCents||0,currency)}</div></div><div className="stat-icon"><CircleDollarSign size={22}/></div></div><div className="stat-card"><div><div className="label">عدد السندات</div><div className="value">{totals._count}</div></div></div></div><div className="card">{payments.length?<div className="table-wrap"><table className="table"><thead><tr><th>رقم السند</th><th>المريض</th><th>التاريخ</th><th>الطريقة</th><th>الجلسة</th><th>المستلم</th><th>المبلغ</th></tr></thead><tbody>{payments.map(p=><tr key={p.id}><td>{p.receiptNumber}</td><td><Link href={`/patients/${p.patientId}`}><strong>{p.patient.fullName}</strong></Link></td><td>{formatDateTime(p.paidAt)}</td><td>{paymentMethodLabels[p.method]}</td><td>{p.visit?.type||"دفعة عامة"}</td><td>{p.receiver||"—"}</td><td><strong style={{color:"#047857"}}>{formatMoney(p.amountCents,currency)}</strong></td></tr>)}</tbody></table></div>:<div className="empty"><strong>لا توجد دفعات بعد</strong>سجّلي الدفعة من ملف المريض.</div>}</div></>;
}
