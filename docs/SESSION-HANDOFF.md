# SESSION HANDOFF — AUHMC 2026

> **هذا الملف هو المصدر الوحيد للحقيقة عند بدء أي جلسة جديدة.**
> اقرأ هذا الملف أولاً قبل أي شيء آخر.
> يُحدّث تلقائياً في نهاية كل جلسة عمل.

---

## 🔴 CURRENT STATUS

**آخر تحديث:** 2026-07-17 11:53 (Asia/Damascus)

| المكون | الحالة |
|---|---|
| الخادم (Server) | ✅ يعمل على `http://localhost:3000` |
| API | ✅ يستجيب (`/api/content` يعيد بيانات) |
| قاعدة البيانات (DB file) | ❌ **`data/auhmc.db` لا يُنشئ على القرص** |
| البيانات الافتراضية (Seed) | ❌ **فارغة** — tracks, schedule, committees = [] |
| لوحة التحكم (Admin) | ⚠️ لم تُختبر بعد |
| الموقع العام (Frontend) | ⚠️ لم يُختبر بعد |

**الحالة العامة:** الخادم يعمل لكن البيانات فارغة. المشكلة في `sql.js` + `saveDatabase()`.

---

## 📋 ACTIVE PROBLEMS (with attempted fixes)

### المشكلة 1: `data/auhmc.db` لا يُنشئ على القرص

**السبب الجذري:** `sql.js` يعمل في الذاكرة فقط. يجب استدعاء `saveDatabase()` يدوياً بعد كل كتابة.

**ما تم تجربته:**
- ✅ إضافة `saveDatabase()` تلقائي بعد كل `db.run()`, `db.exec()`, `db.transaction()`
- ✅ استخدام `fs.writeFileSync(DB_PATH, buffer)` لحفظ الملف
- ❌ **لكن الملف لا يُنشئ** — السبب غير مؤكد بعد

**الحلول المحتملة:**
1. التحقق من أن `db.export()` يرجع بيانات صحيحة
2. التحقق من أن `saveDatabase()` يُستدعى فعلياً بعد seeding
3. إضافة `console.log` في `saveDatabase()` لتتبع الاستدعاءات

---

### المشكلة 2: Seed data لا يُدرج تلقائياً

**السبب الجذري:** `db.transaction()` في `sql.js` قد لا يعمل كما في `better-sqlite3`.

**ما تم تجربته:**
- ✅ استخدام `db.transaction(fn)` مع `tx()` لتنفيذ
- ✅ التحقق من `isEmpty()` قبل الإدراج
- ❌ **لكن البيانات فارغة** — إما أن `isEmpty()` يرجع خطأ، أو `transaction()` لا ينفذ

**الحلول المحتملة:**
1. استبدال `db.transaction()` باستدعاءات مباشرة لـ `db.run()`
2. إضافة `console.log` في `seedDatabase()` لتتبع كل إدراج
3. التحقق من أن `isEmpty()` تعمل بشكل صحيح مع `dbApi.get()`

---

### المشكلة 3: `dbApi.all()` يرمي خطأ `stmt.all is not a function`

**تم إصلاحه جزئياً:**
- ✅ استبدال `stmt.all()` بـ حلقة `while (stmt.step())` + `getAsObject()`
- ✅ API يستجيب الآن بدون أخطاء
- ⚠️ لكن البيانات فارغة (لأن المشكلة 2 لم تُحل)

---

## 🗂️ PROJECT STRUCTURE (one-line per file)

```
AUHMC-2026-1/
├── .env.example              # مثال لمتغيرات البيئة (لا يحتوي أسرار)
├── package.json              # تبعيات: sql.js, express, bcryptjs, cors, multer
├── README.md                 # نظرة عامة على المشروع
├── data/                     # مجلد قاعدة البيانات (يجب أن يحتوي auhmc.db)
│
├── docs/                     # جميع ملفات التوثيق والذكاء الاصطناعي
│   ├── AI-CONFIG.md          # ⚠️ اقرأ هذا أولاً في كل جلسة
│   ├── AGENTS.md             # بروتوكول مختصر للذكاء الاصطناعي
│   ├── SESSION-HANDOFF.md    # ⚠️ هذا الملف — صلة الوصل بين الجلسات
│   ├── CHANGELOG.md          # سجل جميع التغييرات
│   ├── TASK-QUEUE.md         # قائمة المهام النشطة والمكتملة
│   ├── ARCHITECTURE.md       # هيكلية المشروع
│   ├── DATA-MODEL.md         # نموذج البيانات والجداول
│   └── DEPLOY-GUIDE.md       # دليل النشر على Plesk
│
└── src/
    ├── frontend/             # كود الموقع العام (HTML, CSS, JS)
    │   ├── index.html        # الصفحة الرئيسية
    │   ├── styles.css        # التصميم
    │   ├── app.js            # منطق الموقع العام
    │   ├── admin.html        # لوحة التحكم
    │   ├── admin-styles.css  # تصميم لوحة التحكم
    │   ├── admin.js          # منطق لوحة التحكم
    │   └── uploads/          # مجلد رفع الصور
    │
    └── server/               # كود الخادم (Node.js + Express)
        ├── server.js         # الخادم الرئيسي + routes
        ├── database.js       # ⚠️ المشكلة هنا — sql.js + saveDatabase()
        ├── middleware/
        │   └── auth.js       # التحقق من JWT
        └── routes/
            ├── auth.js       # API تسجيل الدخول
            ├── content.js    # API إدارة المحتوى
            └── registrations.js # API التسجيلات
```

---

## 📚 DOC FILES MAP (which doc to read for what)

| الملف | الغرض | متى تقرأه |
|---|---|---|
| **SESSION-HANDOFF.md** | الحالة الحالية + المشاكل النشطة | **أول شيء في كل جلسة جديدة** |
| **AI-CONFIG.md** | إعدادات الذكاء الاصطناعي + القواعد | في بداية كل جلسة |
| **TASK-QUEUE.md** | المهام النشطة والمكتملة | قبل بدء أي مهمة |
| **CHANGELOG.md** | سجل التغييرات التاريخي | عند الحاجة لفهم لماذا تم تغيير شيء |
| **ARCHITECTURE.md** | هيكلية المشروع التقنية | عند إضافة ميزات جديدة |
| **DATA-MODEL.md** | هيكل قاعدة البيانات + الجداول | عند تعديل الـ API أو الـ DB |
| **DEPLOY-GUIDE.md** | دليل النشر على Plesk | عند النشر على السيرفر |
| **AGENTS.md** | بروتوكول مختصر للذكاء الاصطناعي | مرجع سريع |

---

## 🔧 TECH STACK & CONSTRAINTS

### البيئة الحالية
- **Node.js:** v24.16.0
- **npm:** 10.8.2
- **نظام التشغيل:** macOS Monterey
- **المحرر:** Visual Studio Code

### القيود التقنية (مهم جداً!)
1. **لا يمكن استخدام `better-sqlite3`** — يفشل في البناء بسبب C++20
   - الخطأ: `C++20 or later required`
   - السبب: الـ compiler على macOS Monterey لا يدعم C++20
   - **الحل:** البقاء على `sql.js` مع `saveDatabase()` يدوي

2. **`sql.js` يعمل في الذاكرة فقط** — لا يكتب للقرص تلقائياً
   - **الحل:** استدعاء `saveDatabase()` بعد كل عملية كتابة
   - **المشكلة الحالية:** `saveDatabase()` لا يعمل بشكل صحيح بعد

3. **لا يوجد Git في المشروع** — تم حذفه بالكامل
   - لا تعتمد على `git log` أو `git diff`
   - استخدم `CHANGELOG.md` بدلاً من ذلك

### التبعيات الحالية (package.json)
```json
{
  "dependencies": {
    "express": "^4.18.2",
    "sql.js": "^1.8.0",
    "bcryptjs": "^2.4.3",
    "cors": "^2.8.5",
    "express-rate-limit": "^7.1.5",
    "multer": "^1.4.5-lts.1",
    "dotenv": "^16.3.1"
  }
}
```

---

## ✅ DONE / ❌ NOT DONE (checklist)

### ✅ مكتمل
- [x] إنشاء المشروع بالكامل (HTML + CSS + JS)
- [x] إنشاء الخادم (Node.js + Express)
- [x] إنشاء قاعدة البيانات (SQLite مع 8 جداول)
- [x] نظام المصادقة (JWT + bcrypt)
- [x] API إدارة المحتوى (/api/content)
- [x] API التسجيلات (/api/registrations)
- [x] لوحة التحكم (Admin Panel)
- [x] رفع الصور (/api/upload)
- [x] توحيد مفات الذكاء الاصطناعي (AI-CONFIG.md)
- [x] توثيق النشر على Plesk (DEPLOY-GUIDE.md)
- [x] تنظيف المشروع من الملفات القديمة
- [x] حذف Git من المشروع
- [x] إضافة قواعد قراءة إلزامية للذكاء الاصطناعي

### ❌ غير مكتمل / مكسور
- [ ] **إصلاح `saveDatabase()`** — الملف لا يُنشئ على القرص
- [ ] **إصلاح seed data** — البيانات الافتراضية لا تُدرج
- [ ] **إصلاح `db.transaction()`** — قد لا يعمل في sql.js
- [ ] اختبار الموقع العام (Frontend)
- [ ] اختبار لوحة التحكم (Admin)
- [ ] إنشاء `database-schema.md` لتوثيق هيكل DB

---

## 🚀 HOW TO START (في الجلسة الجديدة)

### 1. قراءة إلزامية (بالترتيب)
```bash
# 1. اقرأ هذا الملف أولاً
cat docs/SESSION-HANDOFF.md

# 2. ثم اقرأ قائمة المهام
cat docs/TASK-QUEUE.md

# 3. ثم اقرأ سجل التغييرات
cat docs/CHANGELOG.md
```

### 2. تشغيل المشروع
```bash
# تثبيت التبعيات (إذا لم تكن مثبتة)
npm install

# تشغيل الخادم
npm start
```

### 3. اختبار سريع
```bash
# في terminal آخر — تحقق من أن الخادم يعمل
curl http://localhost:3000/api/content

# تحقق من إنشاء ملف قاعدة البيانات
ls -lh data/auhmc.db
```

### 4. المهام التالية (الأولوية القصوى)
1. **إصلاح `saveDatabase()`** — تحقق من أن الملف يُنشئ على القرص
2. **إصلاح seed data** — تحقق من أن البيانات الافتراضية تُدرج
3. **اختبار الموقع** — افتح `http://localhost:3000` وتحقق من العرض

---

## 📝 NOTES FOR NEXT SESSION

### ما يجب أن تعرفه:
1. **المشروع في حالة "يعمل لكن فارغ"** — الخادم يعمل لكن لا توجد بيانات
2. **المشكلة في `src/server/database.js`** — بالضبط في `saveDatabase()` و `seedDatabase()`
3. **لا تحاول التبديل إلى `better-sqlite3`** — يفشل على Node 24 + macOS Monterey
4. **لا تحذف أي ملفات** — تم تنظيف المشروع بالكامل في الجلسة السابقة
5. **اقرأ AI-CONFIG.md أولاً** — يحتوي قواعد إلزامية للذكاء الاصطناعي

### ما يجب ألا تفعله:
1. ❌ لا تحذف `docs/` أو `src/` أو `data/`
2. ❌ لا تحذف `SESSION-HANDOFF.md` أو `AI-CONFIG.md`
3. ❌ لا تحذف `package.json` أو `package-lock.json`
4. ❌ لا تحذف `.env.example`
5. ❌ لا تحذف `README.md`

### نقاط الضعف في الكود:
1. `database.js` — `saveDatabase()` لا يعمل بشكل صحيح
2. `database.js` — `db.transaction()` قد لا يعمل في sql.js
3. `database.js` — `seedDatabase()` لا يُدرج بيانات
4. `server.js` — لا يوجد logging كافٍ لتتبع الأخطاء

---

## 🔗 QUICK LINKS

- **المشروع على GitHub:** https://github.com/ali-chayeb/AUHMC-2026.git
- **الموقع المحلي:** http://localhost:3000
- **لوحة التحكم:** http://localhost:3000/admin
- **API:** http://localhost:3000/api/content

---

## 📊 SESSION STATS

| المقياس | القيمة |
|---|---|
| عدد الجلسات | 3+ |
| آخر جلسة | 2026-07-17 |
| الملفات المعدّلة | 15+ |
| الملفات المحذوفة | 30+ |
| المهام المكتملة | 12 |
| المهام النشطة | 3 |
| المشاكل الحرجة | 3 |

---

**آخر تحديث:** 2026-07-17 11:53 (Asia/Damascus)
**تم التحديث بواسطة:** Cline (AI Assistant)
**الحالة:** ⚠️ قيد العمل — مشاكل في قاعدة البيانات