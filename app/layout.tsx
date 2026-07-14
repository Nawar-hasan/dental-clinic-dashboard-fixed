import type { Metadata } from "next";
import "./globals.css";
export const metadata: Metadata = { title: "عيادة الدكتور عمار درويش", description: "نظام إدارة عيادة الأسنان" };
export default function RootLayout({ children }: Readonly<{ children: React.ReactNode }>) { return <html lang="ar" dir="rtl"><body>{children}</body></html>; }
