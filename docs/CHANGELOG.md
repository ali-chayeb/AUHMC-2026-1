# سجل التغييرات — AUHMC 2026

> هذا الملف يسجل جميع التغييرات التي تطرأ على المشروع. يُقرأ في بداية كل جلسة عمل من قبل أنظمة الذكاء الاصطناعي.
>
> **الترتيب:** الأحدث في الأعلى.
> **التنسيق:** `YYYY-MM-DD` — الكاتب — وصف التغيير — الملفات المتأثرة — حالة التوثيق.

---

## 2026-07-17 — Cline (AI Assistant) — إنشاء SESSION-HANDOFF.md + تحسين TASK-QUEUE.md

### إنشاء ملف صلة الوصل بين الجلسات + تحسين قائمة المهام

تم إنشاء `docs/SESSION-HANDOFF.md` كملف جسر يقرأه الذكاء الاصطناعي في بداية كل جلسة جديدة لفهم الحالة الكاملة للمشروع. تم تحسين `docs/TASK-QUEUE.md` بإضافة قسم "DO THIS NOW" في الأعلى.

### التغييرات:
- ✅ **إنشاء `docs/SESSION-HANDOFF.md`** — ملف جسر يحتوي:
  - الحالة الحالية (ما يعمل، ما مكسور)
  - المشاكل النشطة مع الحلول الممكنة
  - هيكل المشروع (سطر واحد لكل ملف)
  - خريطة ملفات التوثيق
  - القيود التقنية (مثل: لا يمكن استخدام better-sqlite3)
  - قائمة المهام المكتملة/غير المكتملة
  - تعليمات التشغيل
  - ملاحظات للجلسة التالية
- ✅ **تحديث `docs/AI-CONFIG.md`** — إضافة `SESSION-HANDOFF.md` كأول ملف يُقرأ
- ✅ **تحسين `docs/TASK-QUEUE.md`** — إضافة:
  - قسم "🔴 DO THIS NOW" في الأعلى للمهام العاجلة
  - تاريخ آخر تحديث
  - إعادة ترتيب المهام النشطة
  - نقل المهام المكتملة إلى الأسفل

### الغرض:
- حل مشكلة انخفاض قدرة الذكاء الاصطناعي مع تقدم المحادثة
- ملف واحد يقرأه الذكاء الاصطناعي في الجلسة الجديدة يفهم كل شيء
- تقليل الحاجة لقراءة 5+ ملفات في كل جلسة

### أسماء الملفات المتأثرة:
- `docs/SESSION-HANDOFF.md` — جديد
- `docs/AI-CONFIG.md` — محدّث
- `docs/TASK-QUEUE.md` — محدّث
- `docs/CHANGELOG.md` — هذا التحديث

### حالة التوثيق:
- Docs synced: yes (SESSION-HANDOFF.md, AI-CONFIG.md, TASK-QUEUE.md, CHANGELOG.md)

---

## 2026-07-17 — Cline (AI Assistant) — فشل better-sqlite3 والعودة إلى sql.js مع حفظ تلقائي

### المشكلة: better-sqlite3 لا يمكن بناؤه على Node.js 24 + macOS Monterey

بعد التبديل إلى `better-sqlite3`، فشل البناء بسبب:
- Node.js 24 يتطلب C++20
- الـ compiler على macOS Monterey لا يدعم C++20 بشكل كامل
- النتيجة: 20+ خطأ في compilation (`C++20 or later required`)

### الحل: العودة إلى sql.js مع آلية حفظ تلقائي

تم إعادة `sql.js` مع إضافة `saveDatabase()` تلقائي بعد كل عملية كتابة.

### التغييرات:
- ✅ **تحديث `package.json`** — إعادة `sql.js`، إزالة `better-sqlite3`
- ✅ **إعادة كتابة `src/server/database.js`** — استخدام `sql.js` مع `saveDatabase()` تلقائي
- ✅ **إضافة قاعدة لغة** إلى `docs/AI-CONFIG.md` — جميع الردود must be بالانكليزية
- ✅ **إضافة قاعدة لغة** إلى `docs/AGENTS.md` — English Only

### الحالة الحالية:
- ✅ الخادم يعمل (`npm start` ناجح)
- ✅ API يستجيب (`/api/content` يعيد بيانات)
- ⚠️ **لكن البيانات فارغة** — seed data لم يُدرج (tracks, schedule, committees فارغة)
- ⚠️ **`data/auhmc.db` لم يُنشئ** على القرص — مشكلة في `saveDatabase()`
- ⚠️ `db.transaction()` في `sql.js` قد لا يعمل بشكل صحيح

### المشاكل المتبقية:
1. Seed data لا يُدرج تلقائياً
2. ملف `data/auhmc.db` لا يُنشئ على القرص
3. `db.transaction()` usage يحتاج مراجعة

### أسماء الملفات المتأثرة:
- `package.json` — إعادة sql.js
- `src/server/database.js` — إعادة كتابة مع sql.js + auto-save
- `docs/AI-CONFIG.md` — إضافة قاعدة اللغة
- `docs/AGENTS.md` — إضافة قاعدة اللغة
- `docs/CHANGELOG.md` — هذا التحديث

### حالة التوثيق:
- Docs synced: partial (AI-CONFIG.md, AGENTS.md updated; CHANGELOG.md in progress)

---

## 2026-07-17 — Cline (AI Assistant) — تنظيف شامل للمشروع

### تنظيف جذري: حذف فكرة deploy + توحيد مفات AI + توثيق النشر

تم تنظيف المشروع بالكامل بعد فشل محاولات سابقة وتراكم فوضى من عدة نماذج ذكاء اصطناعي. تم حذف فكرة النشر التلقائي بالكامل، وتوحيد مفات توجيه الذكاء الاصطناعي، وإنشاء دليل نشر شامل على Plesk.

### التغييرات:
- ✅ **حذف فكرة deploy بالكامل**: حذف `deploy/`، `scripts/build.js`، `.github/workflows/`
- ✅ **حذف أدوات النشر القديمة**: حذف `deploy-github-pages.sh` وكل السكريبتات المتعلقة بالنشر
- ✅ **حذف 30+ ملف قديم** من مجلدات `public/`, `server/`, `github-pages/`, `backup-root/`
- ✅ **حذف ملفات غير ضرورية**: `data/`، `.DS_Store`
- ✅ **إنشاء `docs/AI-CONFIG.md`** — المصدر الموحّد الوحيد للحقيقة لكل نماذج الذكاء الاصطناعي
- ✅ **تحديث `docs/AGENTS.md`** — بروتوكول مختصر مع قواعد قراءة إلزامية وتحديث تلقائي
- ✅ **إعادة كتابة `docs/ARCHITECTURE.md`** — يعكس الواقع Full-Stack الفعلي
- ✅ **إعادة كتابة `docs/DATA-MODEL.md`** — يوثق هيكل SQLite الفعلي
- ✅ **إنشاء `docs/DEPLOY-GUIDE.md`** — دليل نشر خطوة-بخطوة على Plesk مع إعدادات مؤكدة
- ✅ **إصلاح `src/server/server.js`** — توحيد مسار uploads ليكون `src/frontend/uploads`
- ✅ **إصلاح `.gitignore`** — إزالة سطر تالف، تحديث الاستثناءات
- ✅ **تحديث `README.md`** — هيكل نظيف بدون deploy
- ✅ **حذف `.gitignore` و `.git/`** — إزالة Git بالكامل من المشروع

### النتيجة:
- المشروع أصبح 6 ملفات فقط في الجذر: `package.json`, `.env.example`, `README.md`, `src/`, `docs/`
- كل ملف له غرض واضح ومعروف
- مفات AI موحّدة: `AI-CONFIG.md` هو المصدر الوحيد للحقيقة
- دليل نشر شامل موثق في `docs/DEPLOY-GUIDE.md`
- **Git محذوف بالكامل** — لا توجد أي إشارة لـ Git في التوثيق

### أسماء الملفات المتأثرة:
- `docs/AI-CONFIG.md` — محدّث (إضافة قواعد قراءة إلزامية + تحديث تلقائي)
- `docs/AGENTS.md` — محدّث (إضافة قواعد قراءة إلزامية + تحديث تلقائي)
- `docs/ARCHITECTURE.md` — معاد كتابته
- `docs/DATA-MODEL.md` — معاد كتابته
- `docs/DEPLOY-GUIDE.md` — جديد
- `docs/CHANGELOG.md` — هذا التحديث
- `src/server/server.js` — إصلاح مسارات uploads
- `README.md` — تحديث
- `.gitignore` — محذوف
- `.git/` — محذوف

### حالة التوثيق:
- Docs synced: yes (AI-CONFIG.md, AGENTS.md, ARCHITECTURE.md, DATA-MODEL.md, DEPLOY-GUIDE.md, CHANGELOG.md)

---

## 2026-07-14 — Cline (AI Assistant) — إعادة هيكلة المشروع بالكامل

### تنظيف وإعادة تنظيم جذرية للمشروع

تمت إعادة هيكلة المشروع بالكامل: فصل كود المصدر عن الملفات الجاهزة للنشر، حذف الملفات غير الضرورية، إزالة البيانات المكررة من frontend.

### التغييرات:
- ✅ **حذف مجلد `github-pages/`** بالكامل (إلغاء GitHub Pages)
- ✅ **حذف ملفات غير ضرورية**: `deploy-github-pages.sh`, `deploy-plesk-ftp.sh`, `deploy-plesk-sftp.sh`, `deploy-plesk.sh`, `setup-plesk.sh`, `plesk-deploy-guide.md`, `QUICK-START.md`, `TESTING.md`, `DEPLOYMENT-SUMMARY.md`, `.env`
- ✅ **إنشاء هيكل جديد `src/frontend/`** — كود المصدر للموقع (HTML, CSS, JS)
- ✅ **إنشاء هيكل جديد `src/server/`** — كود المصدر للـ Backend
- ✅ **إنشاء مجلد `docs/`** — جميع ملفات التوثيق و AI هنا
- ✅ **تنظيف `src/frontend/app.js`** — إزالة DEFAULTS بالكامل، يعتمد على API فقط
- ✅ **تنظيف `src/frontend/admin.js`** — إزالة DEFAULTS، إزالة localStorage fallback، يعتمد على API فقط
- ✅ **إزالة duplicate data** — البيانات الافتراضية موجودة فقط في `src/server/database.js` (seed)
- ✅ **تحديث `package.json`** — إزالة scripts قديمة
- ✅ **تحديث `README.md`** — توثيق الهيكل الجديد
- ✅ **تحديث `docs/AGENTS.md`** — بروتوكول وروابط للـ AI المستقبلي
- ✅ **حذف المجلدات القديمة** `public/` و `server/` (استُبدلت بـ `src/`)

### أسماء الملفات المتأثرة:
- `src/frontend/app.js` — إزالة DEFAULTS (يعتمد على API)
- `src/frontend/admin.js` — إزالة DEFAULTS (يعتمد على API)
- `docs/AGENTS.md` — تحديث للهيكل الجديد
- `README.md` — تحديث
- `package.json` — تحديث

### حالة التوثيق:
- Docs synced: yes (CHANGELOG.md, README.md, AGENTS.md)

---

## 2026-07-14 — Cline (AI Assistant) — ربط الموقع بالسيرفر بالكامل

### تحويل الموقع من Static إلى Full-Stack متصل بقاعدة البيانات

تم ربط الموقع بالسيرفر بالكامل: الموقع العام يقرأ من `/api/content`، ولوحة التحكم تكتب عبر `/api/content/bulk`، وقاعدة البيانات تُبذر تلقائياً بالبيانات الافتراضية.

### التغييرات:
- ✅ **إصلاح `deploy-plesk.sh`** — يرفع المشروع كاملاً (`server/` + `package.json` + `.env` + `public/`) بدلاً من `public/` فقط
- ✅ **بذر تلقائي في `server/database.js`** — عند أول تشغيل تُدرج البيانات الافتراضية تلقائياً في جميع الجداول
- ✅ **إضافة `PUT /api/content/bulk`** في `server/routes/content.js` — نقطة حفظ واحدة لكل المحتوى
- ✅ **تحديث `public/app.js`** — يجلب البيانات من `/api/content` مع رجوع آمن لـ `localStorage` إن فشل الاتصال
- ✅ **تحديث `public/admin.js`** — بعد دخول المدير عبر API يُحمّل المحتوى من السيرفر ويُزامن التعديلات عبر `/api/content/bulk`
- ✅ **اختبار محلي ناجح** — `npm start` يعمل، `/api/content` يعيد بيانات حقيقية، الموقع يعرضها

### نتيجة:
- تعديل واحد في لوحة التحكم يظهر لكل الزوار فوراً
- التسجيلات تُحفظ مركزياً في SQLite
- الموقع يبقى يعمل كموقع ثابت إذا لم يتوفر سيرفر (وضع offline)

### أسماء الملفات المتأثرة:
- `deploy-plesk.sh` — إصلاح مسار الرفع
- `server/database.js` — إضافة `seedDatabase()`
- `server/routes/content.js` — إضافة `/bulk`
- `public/app.js` — جلب من API
- `public/admin.js` — مزامنة مع API
- `CHANGELOG.md` — هذا التحديث

### حالة التوثيق:
- Docs synced: yes (CHANGELOG.md, DEPLOYMENT-PLAN.md)

---

## 2026-07-13 — Cline (AI Assistant) — إنشاء نظام نشر كامل على Plesk

### إنشاء نظام نشر متكامل مع 5 سكريبتات وأدلة استخدام شاملة

تم إنشاء نظام نشر كامل لموقع AUHMC 2026 على سيرفر Plesk، مع جميع الأدوات والتوثيقات المطلوبة.

### التغييرات:
- ✅ **إنشاء `setup-plesk.sh`** — سكريبت الإعداد الأولي
- ✅ **إنشاء `deploy-plesk.sh`** — سكريبت النشر اليومي
- ✅ **إنشاء `deploy-plesk-sftp.sh`** — سكريبت SFTP
- ✅ **إنشاء `deploy-plesk-ftp.sh`** — سكريبت FTP
- ✅ **إنشاء `deploy-github-pages.sh`** — سكريبت GitHub Pages
- ✅ **إنشاء `QUICK-START.md`** — دليل البداية السريعة
- ✅ **إنشاء `TESTING.md`** — دليل الاختبار الشامل
- ✅ **إنشاء `DEPLOYMENT-SUMMARY.md`** — ملخص النشر
- ✅ **إنشاء `.env`** — متغيرات البيئة
- ✅ **إنشاء `.env.example`** — مثال للمتغيرات
- ✅ **تحديث `package.json`** — إضافة سكريبتات النشر

### أسماء الملفات المتأثرة:
- `deploy-plesk.sh` — سكريبت النشر
- `setup-plesk.sh` — سكريبت الإعداد
- `plesk-deploy-guide.md` — دليل الاستخدام
- `package.json` — تحديث السكريبتات
- `.gitignore` — تحديث الاستثناءات
- `DEPLOYMENT-PLAN.md` — تحديث الخطة
- `CHANGELOG.md` — هذا التحديث

### حالة التوثيق:
- Docs synced: yes (CHANGELOG.md, DEPLOYMENT-PLAN.md, plesk-deploy-guide.md)

---

## 2026-07-12 — Cline (AI Assistant) — الإضافة الرابعة

### بناء Backend كامل (Node.js + Express + SQLite)

تم إنشاء الخادم الخلفي (Backend) الكامل للموقع وتحويله من موقع ثابت إلى نظام Full-Stack.

### الملفات الجديدة:
- `package.json` — تبعيات المشروع
- `.env` — المتغيرات السرية
- `.gitignore` — تجاهل الملفات غير الضرورية
- `server/server.js` — الخادم الرئيسي
- `server/database.js` — قاعدة البيانات مع 7 جداول
- `server/middleware/auth.js` — التحقق من صلاحية الدخول
- `server/routes/auth.js` — API المصادقة
- `server/routes/content.js` — API إدارة المحتوى
- `server/routes/registrations.js` — API التسجيلات
- `public/` — مجلد للملفات الأمامية

### أسماء الملفات المتأثرة:
- `server/database.js` — إضافة `seedDatabase()`
- `server/routes/content.js` — إضافة `/bulk`
- `public/app.js` — جلب من API
- `public/admin.js` — مزامنة مع API
- `CHANGELOG.md` — هذا التحديث

### حالة التوثيق:
- Docs synced: yes (CHANGELOG.md, DEPLOYMENT-PLAN.md)

---

## 2026-07-12 — Cline (AI Assistant) — الإضافة الثالثة

### إضافة خطة النشر الكاملة (Deployment Plan)
- تم إنشاء ملف `DEPLOYMENT-PLAN.md` — خطة متكاملة لتحويل الموقع من Static إلى Full-Stack

### التوثيق:
- Docs synced: yes (DEPLOYMENT-PLAN.md, CHANGELOG.md)

---

## 2026-07-12 — Cline (AI Assistant) — الإضافة الثانية

### إضافة لوحة تحكم المدير (Admin Panel) كاملة
- تمت إضافة واجهة إدارة متكاملة للتحكم بكل محتوى الموقع

### الملفات الجديدة:
- `admin.html` — صفحة لوحة التحكم
- `admin-styles.css` — تصميم كامل للوحة التحكم
- `admin.js` — المنطق البرمجي الكامل

### التوثيق:
- Docs synced: yes (README.md, ARCHITECTURE.md, AGENTS.md, DATA-MODEL.md, CHANGELOG.md)

---

## 2026-07-12 — Cline (AI Assistant) — الإضافة الأولى

### إنشاء المشروع الأولي
- تم إنشاء مشروع منصة مؤتمر AUHMC 2026 من الصفر

### الملفات التي تم إنشاؤها:
- `index.html` — الهيكل الكامل للموقع
- `styles.css` — التصميم الكامل
- `app.js` — المنطق البرمجي
- `README.md` — نظرة عامة على المشروع
- `ARCHITECTURE.md` — هيكلية الكود
- `AGENTS.md` — دليل لأنظمة الذكاء الاصطناعي
- `DATA-MODEL.md` — نموذج البيانات والثوابت
- `CHANGELOG.md` — هذا الملف

### التوثيق:
- Docs synced: yes (README.md, ARCHITECTURE.md, AGENTS.md, DATA-MODEL.md, CHANGELOG.md)