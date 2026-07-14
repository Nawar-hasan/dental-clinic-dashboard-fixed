"use server";

import bcrypt from "bcryptjs";
import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { AppointmentStatus, Gender, PaymentMethod, VisitStatus } from "@/app/generated/prisma/client";
import { z } from "zod";
import { prisma } from "@/lib/prisma";
import { clearSession, createSession, requireUser } from "@/lib/auth";
import { generateReference, optionalText, parseDate, parseMoneyToCents, text } from "@/lib/utils";

const loginSchema = z.object({ email: z.string().email(), password: z.string().min(6) });

async function logActivity(action: string, description: string) {
  const user = await requireUser();
  await prisma.activityLog.create({ data: { userId: user.userId, action, description } });
}

export async function loginAction(formData: FormData) {
  const parsed = loginSchema.safeParse({
    email: text(formData.get("email")).toLowerCase(),
    password: text(formData.get("password"))
  });
  if (!parsed.success) redirect(`/login?error=${encodeURIComponent("يرجى إدخال بريد إلكتروني وكلمة مرور صحيحة")}`);

  let user = await prisma.user.findUnique({ where: { email: parsed.data.email } });
  if (!user && (await prisma.user.count()) === 0) {
    const adminEmail = (process.env.ADMIN_EMAIL || "admin@clinic.local").toLowerCase();
    const adminPassword = process.env.ADMIN_PASSWORD || "ChangeMe123!";
    if (parsed.data.email === adminEmail && parsed.data.password === adminPassword) {
      user = await prisma.user.create({
        data: { email: adminEmail, name: "مدير العيادة", passwordHash: await bcrypt.hash(adminPassword, 12), role: "ADMIN" }
      });
      await prisma.clinicSettings.upsert({
        where: { id: "clinic" }, update: {},
        create: { id: "clinic", clinicName: "عيادة الدكتور عمار درويش", doctorName: "الدكتور عمار درويش" }
      });
    }
  }

  if (!user || !(await bcrypt.compare(parsed.data.password, user.passwordHash))) {
    redirect(`/login?error=${encodeURIComponent("بيانات تسجيل الدخول غير صحيحة")}`);
  }

  await createSession({ userId: user.id, email: user.email, name: user.name, role: user.role });
  await prisma.activityLog.create({ data: { userId: user.id, action: "LOGIN", description: "تم تسجيل الدخول إلى النظام." } });
  redirect("/");
}

export async function logoutAction() {
  const session = await requireUser();
  await prisma.activityLog.create({ data: { userId: session.userId, action: "LOGOUT", description: "تم تسجيل الخروج." } });
  await clearSession();
  redirect("/login");
}

function checked(formData: FormData, name: string) { return formData.get(name) === "on"; }

async function imageToDataUrl(entry: FormDataEntryValue | null) {
  if (!(entry instanceof File) || entry.size === 0) return null;
  if (!entry.type.startsWith("image/")) throw new Error("يُسمح برفع الصور فقط");
  if (entry.size > 2 * 1024 * 1024) throw new Error("حجم الصورة يجب ألا يتجاوز 2MB");
  const bytes = Buffer.from(await entry.arrayBuffer());
  return `data:${entry.type};base64,${bytes.toString("base64")}`;
}

export async function createPatientAction(formData: FormData) {
  const session = await requireUser();
  const firstName = text(formData.get("firstName"));
  const lastName = text(formData.get("lastName"));
  const phone = text(formData.get("phone"));
  if (!firstName || !lastName || !phone) {
    redirect(`/patients/new?error=${encodeURIComponent("الاسم الأول واسم العائلة ورقم الهاتف مطلوبة")}`);
  }

  const fatherName = optionalText(formData.get("fatherName"));
  const fullName = [firstName, fatherName, lastName].filter(Boolean).join(" ");
  const count = await prisma.patient.count();
  const fileNumber = text(formData.get("fileNumber")) || `P-${String(count + 1).padStart(4, "0")}`;
  let photoDataUrl: string | null = null;
  try { photoDataUrl = await imageToDataUrl(formData.get("photo")); }
  catch (error) { redirect(`/patients/new?error=${encodeURIComponent(error instanceof Error ? error.message : "تعذر رفع الصورة")}`); }

  const duplicate = await prisma.patient.findUnique({ where: { fileNumber } });
  if (duplicate) redirect(`/patients/new?error=${encodeURIComponent("رقم الملف مستخدم مسبقًا")}`);

  const patient = await prisma.patient.create({
    data: {
      fileNumber, firstName, fatherName, lastName, fullName, photoDataUrl,
      gender: (text(formData.get("gender")) || "MALE") as Gender,
      birthDate: parseDate(formData.get("birthDate")), phone,
      alternativePhone: optionalText(formData.get("alternativePhone")),
      email: optionalText(formData.get("email")), address: optionalText(formData.get("address")),
      city: optionalText(formData.get("city")), occupation: optionalText(formData.get("occupation")),
      maritalStatus: optionalText(formData.get("maritalStatus")),
      emergencyContactName: optionalText(formData.get("emergencyContactName")),
      emergencyContactPhone: optionalText(formData.get("emergencyContactPhone")),
      emergencyRelation: optionalText(formData.get("emergencyRelation")), notes: optionalText(formData.get("notes")),
      medicalHistory: { create: {
        bloodType: optionalText(formData.get("bloodType")), chronicDiseases: optionalText(formData.get("chronicDiseases")),
        allergies: optionalText(formData.get("allergies")), medications: optionalText(formData.get("medications")),
        previousSurgeries: optionalText(formData.get("previousSurgeries")), pregnant: checked(formData, "pregnant"),
        smoking: checked(formData, "smoking"), hypertension: checked(formData, "hypertension"),
        diabetes: checked(formData, "diabetes"), heartDisease: checked(formData, "heartDisease"),
        bleedingDisorder: checked(formData, "bleedingDisorder"), notes: optionalText(formData.get("medicalNotes"))
      } }
    }
  });
  await prisma.activityLog.create({ data: { userId: session.userId, action: "CREATE_PATIENT", description: `إضافة المريض ${fullName} (${fileNumber}).` } });
  redirect(`/patients/${patient.id}?success=${encodeURIComponent("تمت إضافة المريض بنجاح")}`);
}

export async function archivePatientAction(formData: FormData) {
  const id = text(formData.get("id"));
  const patient = await prisma.patient.update({ where: { id }, data: { isArchived: true } });
  await logActivity("ARCHIVE_PATIENT", `أرشفة المريض ${patient.fullName}.`);
  revalidatePath("/patients");
  redirect(`/patients?success=${encodeURIComponent("تمت أرشفة المريض")}`);
}

export async function createAppointmentAction(formData: FormData) {
  await requireUser();
  const patientId = text(formData.get("patientId"));
  const startAt = parseDate(formData.get("startAt"));
  const type = text(formData.get("type"));
  const returnTo = text(formData.get("returnTo")) || "/appointments";
  if (!patientId || !startAt || !type) redirect(`${returnTo}?error=${encodeURIComponent("يرجى تعبئة المريض والوقت ونوع الموعد")}`);
  const duration = Math.max(10, Number(text(formData.get("duration"))) || 30);
  const endAt = new Date(startAt.getTime() + duration * 60000);
  const conflict = await prisma.appointment.findFirst({
    where: { status: { in: ["PENDING", "CONFIRMED"] }, startAt: { lt: endAt }, endAt: { gt: startAt } }
  });
  if (conflict) redirect(`${returnTo}?error=${encodeURIComponent("يوجد موعد متعارض مع هذا الوقت")}`);
  const appointment = await prisma.appointment.create({
    data: { patientId, startAt, endAt, type, status: (text(formData.get("status")) || "PENDING") as AppointmentStatus, notes: optionalText(formData.get("notes")) },
    include: { patient: true }
  });
  await logActivity("CREATE_APPOINTMENT", `إضافة موعد للمريض ${appointment.patient.fullName}.`);
  revalidatePath("/"); revalidatePath("/appointments");
  redirect(`${returnTo}?success=${encodeURIComponent("تمت إضافة الموعد")}`);
}

export async function updateAppointmentStatusAction(formData: FormData) {
  const id = text(formData.get("id"));
  const status = text(formData.get("status")) as AppointmentStatus;
  await prisma.appointment.update({ where: { id }, data: { status } });
  await logActivity("UPDATE_APPOINTMENT", `تحديث حالة الموعد إلى ${status}.`);
  revalidatePath("/"); revalidatePath("/appointments");
}

export async function createVisitAction(formData: FormData) {
  const patientId = text(formData.get("patientId"));
  const type = text(formData.get("type"));
  if (!patientId || !type) redirect(`/patients/${patientId}?error=${encodeURIComponent("نوع الجلسة مطلوب")}`);
  const count = await prisma.visit.count({ where: { patientId } });
  const visit = await prisma.visit.create({
    data: {
      patientId, sessionNumber: count + 1, date: parseDate(formData.get("date")) || new Date(), type,
      teeth: optionalText(formData.get("teeth")), reason: optionalText(formData.get("reason")),
      diagnosis: optionalText(formData.get("diagnosis")), procedure: optionalText(formData.get("procedure")),
      prescription: optionalText(formData.get("prescription")), doctorNotes: optionalText(formData.get("doctorNotes")),
      status: (text(formData.get("status")) || "COMPLETED") as VisitStatus,
      costCents: parseMoneyToCents(formData.get("cost")), nextFollowUp: parseDate(formData.get("nextFollowUp"))
    }, include: { patient: true }
  });
  await logActivity("CREATE_VISIT", `إضافة جلسة للمريض ${visit.patient.fullName}.`);
  revalidatePath(`/patients/${patientId}`); revalidatePath("/");
  redirect(`/patients/${patientId}?success=${encodeURIComponent("تمت إضافة الجلسة")}`);
}

export async function createPaymentAction(formData: FormData) {
  const patientId = text(formData.get("patientId"));
  const amountCents = parseMoneyToCents(formData.get("amount"));
  if (!patientId || amountCents <= 0) redirect(`/patients/${patientId}?error=${encodeURIComponent("قيمة الدفعة يجب أن تكون أكبر من صفر")}`);
  const payment = await prisma.payment.create({
    data: {
      patientId, visitId: optionalText(formData.get("visitId")), receiptNumber: generateReference("REC"),
      paidAt: parseDate(formData.get("paidAt")) || new Date(), amountCents,
      method: (text(formData.get("method")) || "CASH") as PaymentMethod,
      receiver: optionalText(formData.get("receiver")), notes: optionalText(formData.get("notes"))
    }, include: { patient: true }
  });
  await logActivity("CREATE_PAYMENT", `تسجيل دفعة للمريض ${payment.patient.fullName}.`);
  revalidatePath(`/patients/${patientId}`); revalidatePath("/payments"); revalidatePath("/");
  redirect(`/patients/${patientId}?success=${encodeURIComponent("تم تسجيل الدفعة")}`);
}

export async function createExpenseAction(formData: FormData) {
  const name = text(formData.get("name"));
  const amountCents = parseMoneyToCents(formData.get("amount"));
  if (!name || amountCents <= 0) redirect(`/expenses?error=${encodeURIComponent("اسم المصروف وقيمته مطلوبان")}`);
  let categoryId = optionalText(formData.get("categoryId"));
  const newCategory = optionalText(formData.get("newCategory"));
  if (!categoryId && newCategory) {
    categoryId = (await prisma.expenseCategory.upsert({ where: { name: newCategory }, update: {}, create: { name: newCategory } })).id;
  }
  let invoiceDataUrl: string | null = null;
  try { invoiceDataUrl = await imageToDataUrl(formData.get("invoiceImage")); }
  catch (error) { redirect(`/expenses?error=${encodeURIComponent(error instanceof Error ? error.message : "تعذر رفع الفاتورة")}`); }
  await prisma.expense.create({
    data: {
      expenseNumber: generateReference("EXP"), name, description: optionalText(formData.get("description")), amountCents,
      date: parseDate(formData.get("date")) || new Date(), method: (text(formData.get("method")) || "CASH") as PaymentMethod,
      categoryId, vendor: optionalText(formData.get("vendor")), invoiceNumber: optionalText(formData.get("invoiceNumber")),
      invoiceDataUrl, notes: optionalText(formData.get("notes"))
    }
  });
  await logActivity("CREATE_EXPENSE", `إضافة مصروف: ${name}.`);
  revalidatePath("/expenses"); revalidatePath("/");
  redirect(`/expenses?success=${encodeURIComponent("تمت إضافة المصروف")}`);
}

export async function updateSettingsAction(formData: FormData) {
  const session = await requireUser();
  if (session.role !== "ADMIN") redirect(`/settings?error=${encodeURIComponent("ليس لديك صلاحية")}`);
  const data = {
    clinicName: text(formData.get("clinicName")) || "عيادة الدكتور عمار درويش",
    doctorName: text(formData.get("doctorName")) || "الدكتور عمار درويش",
    phone: optionalText(formData.get("phone")), email: optionalText(formData.get("email")),
    address: optionalText(formData.get("address")), currency: text(formData.get("currency")) || "SYP",
    defaultAppointmentMins: Math.max(10, Number(text(formData.get("defaultAppointmentMins"))) || 30),
    workingHours: optionalText(formData.get("workingHours"))
  };
  await prisma.clinicSettings.upsert({ where: { id: "clinic" }, update: data, create: { id: "clinic", ...data } });
  await logActivity("UPDATE_SETTINGS", "تحديث إعدادات العيادة.");
  revalidatePath("/"); revalidatePath("/settings");
  redirect(`/settings?success=${encodeURIComponent("تم حفظ الإعدادات")}`);
}

export async function changePasswordAction(formData: FormData) {
  const session = await requireUser();
  const currentPassword = text(formData.get("currentPassword"));
  const newPassword = text(formData.get("newPassword"));
  if (newPassword.length < 8) redirect(`/settings?error=${encodeURIComponent("كلمة المرور الجديدة يجب أن تكون 8 أحرف على الأقل")}`);
  const user = await prisma.user.findUniqueOrThrow({ where: { id: session.userId } });
  if (!(await bcrypt.compare(currentPassword, user.passwordHash))) redirect(`/settings?error=${encodeURIComponent("كلمة المرور الحالية غير صحيحة")}`);
  await prisma.user.update({ where: { id: user.id }, data: { passwordHash: await bcrypt.hash(newPassword, 12) } });
  await logActivity("CHANGE_PASSWORD", "تغيير كلمة المرور.");
  redirect(`/settings?success=${encodeURIComponent("تم تغيير كلمة المرور بنجاح")}`);
}
