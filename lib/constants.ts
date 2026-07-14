export const appointmentStatusLabels = {
  PENDING: "بانتظار التأكيد", CONFIRMED: "مؤكد", COMPLETED: "مكتمل", CANCELLED: "ملغى", NO_SHOW: "لم يحضر"
} as const;
export const visitStatusLabels = {
  UPCOMING: "قادمة", COMPLETED: "مكتملة", CANCELLED: "ملغاة", NO_SHOW: "لم يحضر"
} as const;
export const paymentMethodLabels = {
  CASH: "نقدي", CARD: "بطاقة", BANK_TRANSFER: "تحويل بنكي", OTHER: "أخرى"
} as const;
export const genderLabels = { MALE: "ذكر", FEMALE: "أنثى", OTHER: "آخر" } as const;
