# سجل المحادثة — مشروع AUHMC 2026

> تم توثيق هذا الملف آلياً من محادثة العمل على المشروع بتاريخ 17/07/2026

## 1. السياق العام

- **اسم المشروع:** AUHMC 2026 — المؤتمر العلمي الأول لمشفى حلب الجامعي
- **المجلد الصحيح:** `/Users/chayeb/AUHMC-2026-1`
- **تحذير مهم:** كان هناك خلط مع مجلد `AUHMC-2026` موجود على سطح المكتب (`/Users/chayeb/Desktop/AUHMC-2026`) وهو نسخة قديمة/مختلفة لا تحتوي على `src/server/`. يجب دائماً العمل داخل `AUHMC-2026-1`.
- **التقنيات:** Node.js + Express + `node:sqlite` (قاعدة بيانات مدمجة) + واجهة أمامية ثابتة في `src/frontend/`

## 2. البنية الحالية للمشروع

```
AUHMC-2026-1/
├── data/
│   ├── auhmc.db              # قاعدة البيانات (SQLite عبر node:sqlite)
│   └── _archive/auhmc.json   # نسخة احتياطية من ملف JSON القديم
├── docs/                     # توثيق المشروع
├── src/
│   ├── frontend/             # الواجهة الأمامية (index.html, app.js, admin.html, admin.js)
│   │   └── uploads/
│   ├── public/               # مجلد فارغ (كان الخادم يخدم منه بالخطأ)
│   │   └── uploads/
│   └── server/
│       ├── database.js       # طبقة قاعدة البيانات + البذر (seeding)
│       ├── server.js         # نقطة الدخول + المسارات الثابتة
│       ├── middleware/auth.js
│       └── routes/
│           ├── auth.js
│           ├── content.js
│           └── registrations.js
├── package.json
└── README.md
```

## 3. المشاكل التي تم حلها

### 3.1 مشكلة: قاعدة البيانات لا تُبذر (Seeding fails)

**الأعراض:**
- الخادم يقلع لكن `/api/content` يرجع بيانات فارغة
- ظهور خطأ `column index out of range` عند تشغيل `initializeDatabase`

**السبب الجذري:**
1. في `src/server/database.js`، دوال `dbApi.get/run/all` كانت تستقبل `params` وتعيد تمريرها كقيمة واحدة (`stmt.get(params)`) بدل نشرها (`stmt.get(...params)`)، مما يسبب فشل الاستعلامات.
2. استعلامات التهيئة والبذر كانت تستخدم صيغة `$1, $2` (PostgreSQL-style) بينما `node:sqlite` يتطلب `?`.

**الإصلاح المطبق في `src/server/database.js`:**
```js
const dbApi = {
  prepare: (sql) => db.prepare(sql),
  get: (sql, params = []) => {
    const stmt = db.prepare(sql);
    return Array.isArray(params) ? stmt.get(...params) : stmt.get(params);
  },
  run: (sql, params = []) => {
    const stmt = db.prepare(sql);
    return Array.isArray(params) ? stmt.run(...params) : stmt.run(params);
  },
  all: (sql, params = []) => {
    const stmt = db.prepare(sql);
    return Array.isArray(params) ? stmt.all(...params) : stmt.all(params);
  },
  exec: (sql) => { try { db.exec(sql); } catch (err) { console.error(...); throw err; } },
  transaction: (fn) => db.transaction(fn)
};
```
وتم تحويل جميع استعلامات `initializeDatabase` و `seedDatabase` من `$1` إلى `?`.

**النتيجة:** البذر نجح:
- `tracks` = 8 صفوف
- `schedule` = 15 صفاً
- `committees` = 6 صفوف
- `content`, `workshops`, `sponsors` مُبذرة
- المستخدم المدير: `admin@auhmc2026.sy` / كلمة المرور الافتراضية `admin2026`

---

### 3.2 مشكلة: `localhost:3000` لا يعرض الموقع (404)

**السبب:** في `src/server/server.js` كان كشف مسار الملفات الثابتة يختار `src/public` لأنه موجود (فارغ)، بينما ملفات الموقع الفعلية في `src/frontend`.

**الإصلاح:**
```js
const FRONTEND_DIR = fs.existsSync(path.join(__dirname, '..', 'frontend', 'index.html'))
  ? path.join(__dirname, '..', 'frontend')
  : path.join(__dirname, '..', 'public');
```

**ملاحظة إضافية:** الـ VPN على جهاز المستخدم كان يمنع أحياناً الوصول إلى `localhost` — إيقافه حل المشكلة الظاهرية.

---

### 3.3 إجراءات تنظيفية

- حذف `data/auhmc.db` القديم الفارغ (`rm -f data/auhmc.db`)
- نقل `data/auhmc.json` القديم إلى `data/_archive/auhmc.json` (ملف قديم غير مستخدم من نسخة سابقة)

---

## 4. المشكلة المفتوحة: "الموقع لا يحفظ أي شيء"

### 4.1 الوصف
بعد حل المشاكل السابقة، لاحظ المستخدم أن التعديلات في لوحة التحكم (`/admin`) لا تُحفظ فعلياً — أي أنها تختفي عند إعادة تحميل الصفحة أو تغيير الجهاز.

### 4.2 التحليل التقني (من فحص الكود)

**لوحة التحكم (`src/frontend/admin.js`):**
- تستخدم دالة `saveData()` التي تحفظ كائن `data` في **`localStorage` فقط** (متصفح المستخدم المحلي).
- مثال: `data.committees.push({...}); saveData();` — لا يرسل أي طلب للخادم.
- دالة `loadData()` تقرأ من `localStorage` أولاً، وإذا لم يوجد تطلب `/api/content`.

**الخادم (`src/server/routes/content.js`):**
- يدعم `PUT /api/content` (تحديث مفاتيح `content` فردية)
- يدعم `PUT /api/content/bulk` (استبدال كامل لـ content/tracks/schedule/committees/workshops/sponsors/posters)
- كلاهما يتطلب `authenticateToken` (توكن JWT في الترويسة)

**الفجوة:** `admin.js` لا يربط `saveData()` بأي من هذه الـ APIs. لذلك:
- التعديلات تبقى محلية في المتصفح فقط
- عند النشر على السيرفر أو فتح جهاز آخر، تظهر البيانات الافتراضية المبذرة فقط

### 4.3 ما هو مطلوب لإصلاحها (TODO)
1. تعديل `saveData()` في `admin.js` لإرسال `PUT /api/content/bulk` مع التوكن.
2. التأكد أن `loadData()` يقرأ من `/api/content` كمصدر أساسي (مع دمج `localStorage` كطبقة تخزين مؤقت اختيارية).
3. معالجة أخطاء الشبكة بعرض رسالة واضحة للمستخدم.
4. التحقق من أن صور الوسائط (logo/bg) تُرفع عبر `/api/upload` بدل تخزينها كـ base64 في `localStorage`.

---

## 5. نقاط يجب الانتباه لها عند النشر على السيرفر (Plesk)

- `node:sqlite` يتطلب Node.js 22+ (مدمج). التأكد من إصدار Node على السيرفر.
- متغير البيئة `JWT_SECRET` يجب تعيينه على السيرفر (حالياً يستخدم قيمة افتراضية للتطوير).
- مجلد `data/` يجب أن يكون قابلاً للكتابة من عملية Node.
- مسار الملفات الثابتة هو `src/frontend` — عند النشر قد يحتاج تعديل بسيط حسب بنية Plesk.
- رفع الملفات (CV/صور) يذهب إلى `src/frontend/uploads` محلياً، وعلى السيرفر إلى `public/uploads` حسب `UPLOAD_DIR`.

## 6. كيفية التشغيل محلياً

```bash
cd /Users/chayeb/AUHMC-2026-1
node src/server/server.js
# ثم افتح: http://localhost:3000
# لوحة التحكم: http://localhost:3000/admin
# الدخول: admin@auhmc2026.sy / admin2026
```

## 7. ملخص الحالة (17/07/2026 — 14:43)

| العنصر | الحالة |
|--------|--------|
| قاعدة البيانات (بذر) | ✅ يعمل |
| عرض الموقع على localhost | ✅ يعمل |
| لوحة التحكم (عرض البيانات) | ✅ يعمل |
| حفظ تعديلات الأدمن للخادم | ❌ غير مربوط (يحفظ محلياً فقط) |
| نماذج التسجيل والتقديم | ✅ تعمل (تحفظ في DB) |
| عرض التسجيلات/التقديمات في الأدمن | ✅ يعمل (يتطلب تسجيل دخول) |