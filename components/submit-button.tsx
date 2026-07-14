"use client";
import { useFormStatus } from "react-dom";
export function SubmitButton({ children, className = "btn btn-primary" }: { children: React.ReactNode; className?: string }) {
  const { pending } = useFormStatus();
  return <button className={className} type="submit" disabled={pending}>{pending ? "جارٍ الحفظ..." : children}</button>;
}
