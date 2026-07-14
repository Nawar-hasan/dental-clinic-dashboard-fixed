import Link from "next/link";
import { Plus, Search, UserRound } from "lucide-react";
import { FlashMessage } from "@/components/flash-message";
import { genderLabels } from "@/lib/constants";
import { prisma } from "@/lib/prisma";
import { ageFromBirthDate, formatDate, formatMoney } from "@/lib/utils";

export const dynamic = "force-dynamic";

export default async function PatientsPage({ searchParams }: { searchParams: Promise<{ q?: string; error?: string; success?: string }> }) {
  const { q="", error, success } = await searchParams;
  const [settings, patients] = await Promise.all([
    prisma.clinicSettings.findUnique({ where: { id: "clinic" } }),
    prisma.patient.findMany({
      where: { isArchived: false, ...(q ? { OR: [{ fullName: { contains:q, mode:"insensitive" } }, { phone:{contains:q} }, { fileNumber:{contains:q,mode:"insensitive"} }] } : {}) },
      include: { visits:{select:{costCents:true,date:true}}, payments:{where:{deletedAt:null},select:{amountCents:true}}, appointments:{where:{startAt:{gte:new Date()},status:{in:["PENDING","CONFIRMED"]}},orderBy:{startAt:"asc"},take:1} },
      orderBy: { createdAt:"desc" }
    })
  ]);
  const currency=settings?.currency||"SYP";
  return <><div className="page-header"><div><h1>إدارة المرضى</h1><p>ملفات المرضى، بيانات التواصل، الزيارات والحسابات.</p></div><Link className="btn btn-primary" href="/patients/new"><Plus size={18}/> إضافة مريض</Link></div><FlashMessage error={error} success={success}/><div className="card"><form className="search-row"><input className="input" name="q" defaultValue={q} placeholder="بحث بالاسم أو الهاتف أو رقم الملف..."/><button className="btn btn-secondary" type="submit"><Search size={17}/> بحث</button>{q?<Link className="btn btn-ghost" href="/patients">مسح البحث</Link>:null}</form>{patients.length?<div className="table-wrap"><table className="table"><thead><tr><th>المريض</th><th>الجنس والعمر</th><th>الهاتف</th><th>آخر زيارة</th><th>الموعد القادم</th><th>التكلفة</th><th>المتبقي</th><th></th></tr></thead><tbody>{patients.map(p=>{const total=p.visits.reduce((s,v)=>s+v.costCents,0);const paid=p.payments.reduce((s,x)=>s+x.amountCents,0);const age=ageFromBirthDate(p.birthDate);const visits=[...p.visits].sort((a,b)=>b.date.getTime()-a.date.getTime());return <tr key={p.id}><td><div className="patient-cell">{p.photoDataUrl?<img className="patient-photo" src={p.photoDataUrl} alt=""/>:<div className="patient-photo">{p.fullName.slice(0,1)}</div>}<div><strong>{p.fullName}</strong><div className="muted-sm">{p.fileNumber}</div></div></div></td><td>{genderLabels[p.gender]}{age!==null?`، ${age} سنة`:""}</td><td>{p.phone}</td><td>{formatDate(visits[0]?.date)}</td><td>{formatDate(p.appointments[0]?.startAt)}</td><td>{formatMoney(total,currency)}</td><td><strong style={{color:total-paid>0?"#be123c":"#047857"}}>{formatMoney(Math.max(0,total-paid),currency)}</strong></td><td><Link className="btn btn-ghost btn-small" href={`/patients/${p.id}`}>فتح الملف</Link></td></tr>})}</tbody></table></div>:<div className="empty"><UserRound size={35} style={{margin:"0 auto 10px"}}/><strong>لا يوجد مرضى مطابقون</strong>أضيفي أول مريض أو غيّري البحث.</div>}</div></>;
}
