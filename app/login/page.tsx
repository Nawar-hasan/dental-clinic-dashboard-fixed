import { LockKeyhole, ShieldCheck, Stethoscope } from "lucide-react";
import { loginAction } from "@/app/actions";
import { FlashMessage } from "@/components/flash-message";
import { SubmitButton } from "@/components/submit-button";
export const dynamic = "force-dynamic";

export default async function LoginPage({ searchParams }: { searchParams: Promise<{ error?: string }> }) {
  const { error } = await searchParams;
  return <main className="login-page"><section className="login-visual"><div className="brand-logo"><Stethoscope size={28}/></div><h1>عيادة الدكتور<br/>عمار درويش</h1><p>منصة آمنة لتنظيم ملفات المرضى والجلسات والمواعيد والدفعات ومصروفات العيادة.</p><div className="secure-line"><ShieldCheck size={20}/> جميع صفحات النظام محمية بتسجيل الدخول</div></section><section className="login-form-wrap"><div className="login-card"><div className="stat-icon login-lock"><LockKeyhole size={22}/></div><h2>تسجيل الدخول</h2><p>أدخلي بيانات حساب الإدارة للوصول إلى لوحة التحكم.</p><FlashMessage error={error}/><form action={loginAction}><div className="field"><label htmlFor="email">البريد الإلكتروني</label><input className="input" id="email" name="email" type="email" required placeholder="admin@clinic.local"/></div><div className="field"><label htmlFor="password">كلمة المرور</label><input className="input" id="password" name="password" type="password" required minLength={6}/></div><SubmitButton>دخول إلى النظام</SubmitButton></form><div className="login-footer">أنشئ بواسطة <strong>HOLOL NAWAR</strong></div></div></section></main>;
}
