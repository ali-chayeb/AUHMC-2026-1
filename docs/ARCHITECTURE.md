# AUHMC 2026 — هيكلية الموقع (Architecture)

## نظرة عامة

هذا الموقع هو **تطبيق صفحة واحدة (Single Page Application - SPA)** مبني بالكامل باستخدام HTML وCSS وJavaScript الأصلي (Vanilla JS). لا يوجد أي إطار عمل (Framework) أو مكتبات خارجية ثقيلة.

الخادم الخلفي (Backend) مبني بـ **Node.js + Express + SQLite** (via `better-sqlite3`)، ويوفر API RESTful لإدارة المحتوى والتسجيلات والمصادقة.

---

## 📂 هيكل الملفات ودور كل ملف

| الملف | الدور | الحجم التقريبي |
|---|---|---|
| `src/frontend/index.html` | الهيكل (HTML) — يحتوي على جميع الأقسام والأطر | ~200 سطر |
| `src/frontend/styles.css` | التصميم (CSS) — جميع التنسيقات والألوان والاستجابة | ~900 سطر |
| `src/frontend/app.js` | المنطق البرمجي (JS) — جميع الوظائف التفاعلية | ~260 سطر |
| `src/frontend/admin.html` | لوحة التحكم (HTML) | ~300 سطر |
| `src/frontend/admin-styles.css` | تصميم لوحة التحكم (CSS) | ~400 سطر |
| `src/frontend/admin.js` | منطق لوحة التحكم (JS) | ~450 سطر |
| `src/server/server.js` | الخادم الرئيسي (Express) | ~120 سطر |
| `src/server/database.js` | قاعدة البيانات + البذور الافتراضية (better-sqlite3) | ~280 سطر |
| `src/server/routes/auth.js` | API تسجيل الدخول والتحقق | ~80 سطر |
| `src/server/routes/content.js` | API إدارة المحتوى | ~250 سطر |
| `src/server/routes/registrations.js` | API التسجيلات | ~80 سطر |
| `src/server/middleware/auth.js` | التحقق من صلاحية الدخول (JWT) | ~30 سطر |

---

## 🧱 تدفق البيانات (Data Flow)

```
[المستخدم يفتح index.html]
        │
        ▼
[تحميل styles.css ← تطبيق التصميم]
[تحميل app.js ← تنفيذ init()]
        │
        ├──→ fetchData() ← جلب البيانات من /api/content
        ├──→ applyTheme() ← تطبيق الألوان المخصصة
        ├──→ applyHero() ← تطبيق نصوص وصورة الصفحة الرئيسية
        ├──→ renderTracks() ← بناء بطاقات المسارات
        ├──→ renderCommittees() ← بناء بطاقات اللجان
        ├──→ renderSponsors() ← بناء بطاقات الرعاة
        ├──→ setupSchedule() ← بناء الجدول الزمني
        ├──→ setupRegistration() ← بناء نموذج التسجيل
        └──→ setupCountdown() ← تحديث العد التنازلي

[لوحة التحكم admin.html]
        │
        ▼
[admin.js ← قراءة البيانات من /api/content]
[admin.js ← حفظ التعديلات عبر /api/content/bulk]
        │
        ▼
[server.js ← استقبال الطلب]
[content.js ← تحديث قاعدة البيانات]
[SQLite ← حفظ البيانات]
```

---

## 🔌 API Endpoints

### عامة (لا تحتاج توثيق)
- `GET /api/content` — جلب جميع المحتوى
- `POST /api/registrations` — تسجيل جديد

### محمية (تحتاج JWT Token)
- `PUT /api/content` — تحديث المحتوى
- `POST /api/content/tracks` — إضافة مسار
- `PUT /api/content/tracks/:id` — تعديل مسار
- `DELETE /api/content/tracks/:id` — حذف مسار
- `POST /api/content/schedule` — إضافة فعالية
- `DELETE /api/content/schedule/:id` — حذف فعالية
- `POST /api/content/committees` — إضافة لجنة
- `DELETE /api/content/committees/:id` — حذف لجنة
- `POST /api/content/workshops` — إضافة ورشة
- `DELETE /api/content/workshops/:id` — حذف ورشة
- `POST /api/content/sponsors` — إضافة راعي
- `DELETE /api/content/sponsors/:id` — حذف راعي
- `GET /api/registrations` — عرض التسجيلات
- `GET /api/registrations/stats` — إحصائيات التسجيلات
- `DELETE /api/registrations/:id` — حذف تسجيل
- `POST /api/upload` — رفع صورة

### المصادقة
- `POST /api/auth/login` — تسجيل الدخول
- `GET /api/auth/verify` — التحقق من التوكن
- `POST /api/auth/change-password` — تغيير كلمة المرور

---

## 🗄️ قاعدة البيانات (SQLite via better-sqlite3)

### المكتبة المستخدمة:
- **better-sqlite3** — مكتبة SQLite متزامنة (synchronous) تكتب مباشرة للقرص
- بدلاً من `sql.js` القديم الذي كان يعمل في الذاكرة فقط

### الجداول:
1. **users** — المستخدمين (Admin)
2. **content** — المحتوى العام (key-value)
3. **tracks** — المسارات العلمية
4. **schedule** — الجدول الزمني
5. **committees** — اللجان المنظمة
6. **workshops** — ورشات العمل
7. **sponsors** — الرعاة
8. **registrations** — التسجيلات
9. **submissions** — الأبحاث المقدمة
10. **submission_files** — ملفات الأبحاث المرفوعة
11. **posters** — البوسترات العلمية

### البذور الافتراضية:
تُدرج تلقائياً عند أول تشغيل عبر `seedDatabase()` في `src/server/database.js`.

### مسار الملف:
- الافتراضي: `data/auhmc.db` (يُنشأ تلقائياً)
- قابل للتخصيص عبر متغير البيئة `DB_PATH`

---

## 🔐 المصادقة (JWT)

- يُستخدم `jsonwebtoken` لتوليد التوكنات
- ينتهي التوكن بعد 24 ساعة
- يُخزن في `localStorage` باسم `auhmc_admin_token`
- يُرسل في Header: `Authorization: Bearer <token>`

---

## 📱 الاستجابة (Responsive)

- التصميم Mobile-First
- نقاط القطع: 992px, 768px, 480px
- السايدبار في Admin يختفي تلقائياً على الشاشات الصغيرة

---

## 🎨 الألوان والثيم

- الألوان الأساسية معرفة عبر متغيرات CSS في `:root`
- `--primary`: اللون الأساسي (أزرق)
- `--gold`: اللون الذهبي
- يمكن تغييرها ديناميكياً من لوحة التحكم

---

## 📤 رفع الملفات

- يستخدم `multer` لرفع الصور
- الحد الأقصى: 5MB
- الأنواع المسموحة: jpg, png, gif, webp, svg, ico
- تُخزن في `src/frontend/uploads/`
- تُخدم عبر `/uploads/:filename`

---

## 🔄 تدفق الجلسة (Session Flow)

1. المستخدم يفتح الموقع → `index.html`
2. `app.js` يطلب `/api/content` لجلب البيانات
3. الخادم يرد ببيانات JSON
4. `app.js` يعرض البيانات
5. المدير يدخل `/admin` → `admin.html`
6. `admin.js` يطلب تسجيل الدخول → `/api/auth/login`
7. الخادم يرد بـ JWT Token
8. `admin.js` يخزن التوكن في `localStorage`
9. المدير يعدل البيانات → يحفظ عبر `/api/content/bulk`
10. الخادم يحدث قاعدة البيانات
11. الزوار يرون التعديلات فوراً

---

## 🚀 النشر على Plesk

### الإعدادات المطلوبة:
| الإعداد | القيمة |
|---|---|
| **Application Root** | `/httpdocs` |
| **Document Root** | `/httpdocs/src/frontend` |
| **Startup File** | `src/server/server.js` |
| **Node.js Version** | 22+ |

### متغيرات البيئة:
```
PORT=3000
JWT_SECRET=auhmc2026_prod_secret_xyz123
ADMIN_EMAIL=admin@auhmc2026.sy
ADMIN_PASSWORD=admin2026
UPLOAD_DIR=src/frontend/uploads
```

### ⚠️ تحذير هام
**لا تجعل Application Root = `/httpdocs/src`** — سيسبب مساراً مكرراً `/httpdocs/src/src/server/server.js`

### خطوات النشر:
1. ارفع الملفات (عدا `node_modules/`, `data/`, `.git/`, `.env`)
2. اضبط الإعدادات (Application Root, Document Root, Startup File)
3. أضف متغيرات البيئة
4. شغّل `npm install`
5. اضغط **Restart App**

> 📌 للتفاصيل الكاملة، راجع `docs/DEPLOY-GUIDE.md`

## ⚠️ ملاحظات هامة

- **لا يوجد build step** — الخادم يخدم مباشرة من `src/frontend/`
- **النشر يدوي** — ارفع الملفات مباشرة إلى السيرفر
- **قاعدة البيانات تُنشأ تلقائياً** عند أول تشغيل
- **جميع البيانات الافتراضية** موجودة في `src/server/database.js`
