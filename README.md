# نظام إدارة عيادة الدكتور عمار درويش

تطبيق عربي RTL لإدارة المرضى والجلسات والمواعيد والدفعات ومصروفات عيادة الأسنان.

## المزايا الموجودة

- تسجيل دخول محمي بكلمة مرور مشفرة وCookie آمنة.
- إنشاء أول حساب مدير تلقائيًا عندما تكون قاعدة البيانات فارغة.
- لوحة مؤشرات للإيرادات والمصروفات والمواعيد.
- إضافة المرضى مع صورة وتاريخ طبي.
- ملف تفصيلي لكل مريض.
- الجلسات وتكاليف العلاج.
- الدفعات وسندات القبض وحساب المتبقي.
- المواعيد مع اكتشاف تعارض الوقت.
- مصروفات العيادة وتصنيفاتها وصور الفواتير.
- تقارير مالية مبسطة.
- إعدادات العيادة والعملة وتغيير كلمة المرور.
- عبارة **أنشئ بواسطة HOLO NAWAR** في النظام.

## التقنية

- Next.js 16 + App Router + TypeScript
- Prisma ORM + PostgreSQL
- Server Actions داخل Next.js، دون Backend منفصل
- Tailwind CSS وتصميم مخصص

> استُخدم PostgreSQL بدل SQLite لأن نظام ملفات Vercel غير دائم، وSQLite ليست مناسبة لحفظ بيانات المرضى في الإنتاج على Vercel.

## التشغيل المحلي

1. ثبتي Node.js 20 أو 22.
2. ثبتي الحزم:

```bash
npm install
```

3. انسخي `.env.example` إلى `.env`:

```powershell
Copy-Item .env.example .env
```

4. ضعي رابط PostgreSQL وقيم الحماية في `.env`:

```env
DATABASE_URL="postgresql://USER:PASSWORD@HOST:5432/DATABASE?sslmode=require"
AUTH_SECRET="قيمة-عشوائية-طويلة-جدا"
ADMIN_EMAIL="admin@clinic.local"
ADMIN_PASSWORD="ChangeMe123!"
```

5. أنشئي الجداول:

```bash
npx prisma db push
```

6. البيانات التجريبية اختيارية:

```bash
npm run db:seed
```

7. شغلي المشروع:

```bash
npm run dev
```

ثم افتحي `http://localhost:3000`.

## الرفع على Vercel

### 1. رفع المشروع إلى GitHub

```bash
git init
git add .
git commit -m "Initial dental clinic system"
git branch -M main
git remote add origin https://github.com/YOUR_USERNAME/dental-clinic-dashboard.git
git push -u origin main
```

### 2. إنشاء المشروع في Vercel

- من Vercel اختاري **Add New > Project**.
- اربطي GitHub واختاري مستودع المشروع.
- من **Storage / Marketplace** أضيفي **Prisma Postgres** أو **Neon Postgres**.
- تأكدي أن المتغير `DATABASE_URL` أُضيف للمشروع.

### 3. متغيرات البيئة في Vercel

أضيفي ضمن **Settings > Environment Variables**:

- `AUTH_SECRET`
- `ADMIN_EMAIL`
- `ADMIN_PASSWORD`
- `DATABASE_URL` إذا لم يضفه تكامل قاعدة البيانات تلقائيًا.

لإنشاء `AUTH_SECRET`:

```bash
openssl rand -base64 32
```

### 4. أمر البناء

في **Build & Deployment > Build Command** ضعي:

```bash
npm run vercel-build
```

ثم اضغطي **Deploy**.

عند فتح رابط الموقع لأول مرة، سجّلي الدخول بالقيم الموجودة في `ADMIN_EMAIL` و`ADMIN_PASSWORD`. عندما لا يوجد أي مستخدم، ينشئ النظام حساب المدير تلقائيًا في أول دخول صحيح.

## تنبيهات قبل الاستخدام الحقيقي

- غيّري كلمة المرور الافتراضية فورًا.
- لا ترفعي `.env` إلى GitHub.
- فعّلي النسخ الاحتياطي لدى مزود PostgreSQL.
- الصور الصغيرة مخزنة داخل قاعدة البيانات في هذه النسخة لتبسيط النشر. الأفضل لاحقًا نقلها إلى Vercel Blob أو Cloudinary.
- يلزم مراجعة قوانين خصوصية البيانات الطبية في بلد تشغيل العيادة.

## المرحلة التالية المقترحة

- تعديل وحذف ناعم للجلسات والدفعات.
- مخطط أسنان تفاعلي Odontogram كامل.
- طباعة PDF لسندات القبض.
- رسائل واتساب لتذكير المواعيد.
- صلاحيات تفصيلية لموظفي الاستقبال.
- تصدير Excel وPDF.

## إصلاح خطأ Vercel: Exit handler never called

تم ضبط المشروع للنشر على Vercel عبر:

- استخدام Node.js 22.x وnpm 10.
- تثبيت الحزم بأمر `npm ci --no-audit --no-fund`.
- استخدام مستودع npm العام `https://registry.npmjs.org/`.
- إزالة أي روابط لمستودعات داخلية من `package-lock.json`.

عند تحديث المشروع على GitHub، نفّذ Redeploy في Vercel مع إلغاء خيار استخدام Build Cache لأول عملية نشر بعد التحديث.
