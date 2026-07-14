export function text(value: FormDataEntryValue | null) {
  return typeof value === "string" ? value.trim() : "";
}
export function optionalText(value: FormDataEntryValue | null) {
  return text(value) || null;
}
export function parseDate(value: FormDataEntryValue | null) {
  const raw = text(value);
  if (!raw) return null;
  const date = new Date(raw);
  return Number.isNaN(date.getTime()) ? null : date;
}
export function parseMoneyToCents(value: FormDataEntryValue | null) {
  const amount = Number(text(value).replace(",", "."));
  return Number.isFinite(amount) && amount >= 0 ? Math.round(amount * 100) : 0;
}
export function formatMoney(cents: number, currency = "SYP") {
  try {
    return new Intl.NumberFormat("ar-SY", {
      style: "currency", currency, maximumFractionDigits: currency === "SYP" ? 0 : 2
    }).format(cents / 100);
  } catch {
    return `${(cents / 100).toLocaleString("ar-SY")} ${currency}`;
  }
}
export function formatDate(date: Date | string | null | undefined) {
  if (!date) return "—";
  return new Intl.DateTimeFormat("ar-SY", { year: "numeric", month: "short", day: "numeric" }).format(new Date(date));
}
export function formatDateTime(date: Date | string | null | undefined) {
  if (!date) return "—";
  return new Intl.DateTimeFormat("ar-SY", {
    year: "numeric", month: "short", day: "numeric", hour: "2-digit", minute: "2-digit"
  }).format(new Date(date));
}
export function ageFromBirthDate(date: Date | null | undefined) {
  if (!date) return null;
  const now = new Date();
  let age = now.getFullYear() - date.getFullYear();
  const month = now.getMonth() - date.getMonth();
  if (month < 0 || (month === 0 && now.getDate() < date.getDate())) age--;
  return age;
}
export function generateReference(prefix: string) {
  const d = new Date();
  const stamp = `${d.getFullYear()}${String(d.getMonth() + 1).padStart(2, "0")}${String(d.getDate()).padStart(2, "0")}`;
  return `${prefix}-${stamp}-${Math.random().toString(36).slice(2, 7).toUpperCase()}`;
}
export function inputDateTime(date = new Date()) {
  const offset = date.getTimezoneOffset();
  return new Date(date.getTime() - offset * 60000).toISOString().slice(0, 16);
}
