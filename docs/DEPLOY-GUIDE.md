# دليل النشر على Plesk — AUHMC 2026

> هذا الدليل يوثق بالضبط كيف تم نشر المشروع على السيرفر.
> اتبع هذه الخطوات في كل مرة تريد رفع نسخة جديدة.

---

## 📤 الملفات المطلوب رفعها

### ✅ ارفع هذه الملفات/المجلدات:

```
AUHMC-2026/
├── ✅ package.json          ← تعريف المشروع والتبعيات
├── ✅ package-lock.json     ← قفل إصدارات الحزم
├── ✅ .env.example          ← نموذج للإعدادات (مرجع فقط)
├── ✅ .gitignore            ← قواعد الاستثناء (اختياري)
├── ✅ README.md             ← توثيق المشروع (اختياري)
│
├── ✅ src/                  ← كود الموقع + الخادم كاملاً
│   ├── ✅ frontend/         ← واجهة الموقع
│   │   ├── index.html
│   │   ├── admin.html
│   │   ├── app.js
│   │   ├── admin.js
│   │   ├── styles.css
│   │   ├── admin-styles.css
│   │   └── uploads/         ← مجلد الصور المرفوعة
│   │       └── .gitkeep     ← placeholder (يُحذف عند أول رفع صورة)
│   │
│   └── ✅ server/           ← كود الخادم
│       ├── server.js
│       ├── database.js
│       ├── middleware/
│       │   └── auth.js
│       └── routes/
│           ├── auth.js
│           ├── content.js
│           └── registrations.js
│
└── ✅ docs/                 ← توثيق + مفات AI (اختياري)
    ├── AI-CONFIG.md
    ├── AGENTS.md
    ├── ARCHITECTURE.md
    ├── DATA-MODEL.md
    ├── CHANGELOG.md
    └── TASK-QUEUE.md
```

### ❌ لا ترفع هذه:

| الملف/المجلد | السبب |
|---|---|
| `node_modules/` | يُثبّت تلقائياً عبر `npm install` على السيرفر |
| `data/` | يُنشأ تلقائياً عند أول تشغيل (قاعدة البيانات) |
| `.git/` | مجلد Git الداخلي (غير مطلوب على السيرفر) |
| `.env` | ملف سرّي — **تنشئه يدوياً على السيرفر** (لا ترفعه من جهازك) |

---

## ⚙️ إعدادات Plesk Node.js

### الإعدادات المؤكدة (muqimeen.com):

| الإعداد | القيمة | ملاحظة |
|---|---|---|
| **Node.js Version** | 22.23.1 | أو أي إصدار 18+ |
| **Application Root** | `/httpdocs` | ⚠️ **مهم**: يجب أن يكون الجذر الذي يحتوي على `src/` و `package.json` |
| **Document Root** | `/httpdocs/src/frontend` | يخدم الملفات الثابتة من هنا |
| **Application Startup File** | `src/server/server.js` | المسار نسبي من Application Root |
| **Application Mode** | production | أو development للاختبار |
| **Package Manager** | npm | لا تغيّره |

### ⚠️ تحذير هام: Application Root

**الخطأ الشائع:**
```
Application Root: /httpdocs/src    ← ❌ خطأ
Startup File: src/server/server.js
→ Plesk يبحث في: /httpdocs/src/src/server/server.js  ← مكرر!
```

**الحل الصحيح:**
```
Application Root: /httpdocs        ← ✅ صحيح
Startup File: src/server/server.js
→ Plesk يبحث في: /httpdocs/src/server/server.js  ← موجود!
```

---

## 🔑 متغيرات البيئة (Custom Environment Variables)

بعد رفع الملفات، **أضف هذه المتغيرات** في قسم **Custom environment variables** في Plesk:

| المتغير | القيمة | الوصف |
|---|---|---|
| `PORT` | `3000` | منفذ الخادم |
| `JWT_SECRET` | `auhmc2026_prod_secret_xyz123` | سرّي — غيّره لقيمة عشوائية قوية |
| `ADMIN_EMAIL` | `admin@auhmc2026.sy` | بريد المدير |
| `ADMIN_PASSWORD` | `admin2026` | كلمة سر المدير |
| `UPLOAD_DIR` | `src/frontend/uploads` | مجلد الصور المرفوعة |

> ⚠️ **بدون `JWT_SECRET` لن يعمل تسجيل الدخول** للوحة التحكم.

---

## 🚀 خطوات النشر (بالترتيب)

### 1. ارفع الملفات
- استخدم **FTP/SFTP** أو **File Manager** في Plesk
- ارفع المجلدات/الملفات المذكورة أعلاه
- **لا ترفع** `node_modules/`, `data/`, `.git/`, `.env`

### 2. اضبط إعدادات Node.js
- **Application Root** = `/httpdocs`
- **Document Root** = `/httpdocs/src/frontend`
- **Startup File** = `src/server/server.js`

### 3. أضف متغيرات البيئة
- في قسم **Custom environment variables** أضف القيم المذكورة أعلاه

### 4. ثبّت الاعتماديات
- اضغط زر **NPM install** في لوحة Plesk
- انتظر حتى ينتهي التثبيت

### 5. شغّل التطبيق
- اضغط **Restart App**
- انتظر بضع ثوانٍ حتى يبدأ الخادم

### 6. تحقق من العمل
- افتح `http://muqimeen.com` ← يجب أن يظهر الموقع
- افتح `http://muqimeen.com/admin` ← لوحة التحكم
- سجّل دخول بالبيانات الافتراضية:
  - البريد: `admin@auhmc2026.sy`
  - كلمة السر: `admin2026`

---

## 📝 ملاحظات هامة

### قاعدة البيانات
- `data/auhmc.db` تُنشأ **تلقائياً** عند أول تشغيل
- البيانات الافتراضية (المسارات، الجدول، اللجان...) تُبذر تلقائياً
- ⚠️ عند إعادة الرفع: **لا تحذف `data/`** إن أردت الاحتفاظ بالتسجيلات والبيانات المعدّلة

### الملفات المرفوعة (Uploads)
- الصور المرفوعة من لوحة التحكم تُخزن في `src/frontend/uploads/`
- هذه الملفات **لا تُرفع إلى Git** (مستثناة في `.gitignore`)
- عند إعادة الرفع: انسخ محتويات `uploads/` يدوياً أو احتفظ بالقديم

### تحديث الموقع لاحقاً
1. عدّل الكود محلياً
2. ارفع الملفات المعدّلة فقط (لا ترفع `node_modules/`)
3. اضغط **Restart App** في Plesk

---

## 🐛 حل المشاكل الشائعة

### المشكلة: "Startup file does not exist"
**السبب:** Application Root مضبوط على `/httpdocs/src` بدلاً من `/httpdocs`
**الحل:** غيّر Application Root إلى `/httpdocs`

### المشكلة: "Cannot find module"
**السبب:** لم تشغّل `npm install` بعد الرفع
**الحل:** اضغط زر **NPM install** في Plesk

### المشكلة: "JWT_SECRET is not defined"
**السبب:** لم تضف متغيرات البيئة
**الحل:** أضف `JWT_SECRET` في Custom environment variables

### المشكلة: الموقع لا يظهر (404)
**السبب:** Document Root مضبوط على `/httpdocs/public` (مجلد غير موجود)
**الحل:** غيّر Document Root إلى `/httpdocs/src/frontend`

---

## 📞 معلومات السيرفر

| البند | القيمة |
|---|---|
| **النطاق** | http://muqimeen.com |
| **لوحة التحكم** | http://muqimeen.com/admin |
| **Node.js Version** | 22.23.1 |
| **تاريخ النشر الأول** | 2026-07-17 |

---

> 📌 **تذكير:** في كل مرة ترفع نسخة جديدة:
> 1. ارفع الملفات (عدا `node_modules/`, `data/`, `.git/`, `.env`)
> 2. اضبط الإعدادات (Application Root, Document Root, Startup File)
> 3. أضف متغيرات البيئة
> 4. شغّل `npm install`
> 5. اضغط **Restart App**