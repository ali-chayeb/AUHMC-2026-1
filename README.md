# AUHMC 2026 — المؤتمر العلمي الأول لمشفى حلب الجامعي

**Aleppo University Hospital Medical Conference 2026**

منصة رقمية متكاملة للمؤتمر العلمي الأول لمشفى حلب الجامعي.

> **الشعار:** "معًا نحو نظام صحي متكامل.. رؤى طبية متجددة لغدٍ صحي أفضل"

---

## 📁 هيكل المشروع

```
AUHMC-2026/
├── src/
│   ├── frontend/          ← كود الموقع (HTML, CSS, JS)
│   │   ├── index.html     ← الصفحة الرئيسية
│   │   ├── admin.html     ← لوحة التحكم
│   │   ├── app.js         ← كود الموقع الرئيسي
│   │   ├── admin.js       ← كود لوحة التحكم
│   │   ├── styles.css     ← تنسيق الموقع
│   │   ├── admin-styles.css ← تنسيق لوحة التحكم
│   │   └── uploads/       ← ملفات مرفوعة (صور)
│   │
│   └── server/            ← كود الخادم (Express + SQLite)
│       ├── server.js      ← تشغيل الخادم
│       ├── database.js    ← قاعدة البيانات + البذور
│       ├── middleware/
│       │   └── auth.js    ← المصادقة (JWT)
│       └── routes/
│           ├── auth.js    ← تسجيل الدخول
│           ├── content.js ← إدارة المحتوى
│           └── registrations.js ← التسجيلات والتقديمات
│
├── docs/                  ← توثيق + مفات AI
│   ├── AI-CONFIG.md       ← المصدر الموحّد للحقيقة
│   ├── AGENTS.md          ← بروتوكول سريع للذكاء الاصطناعي
│   ├── CHANGELOG.md       ← سجل التغييرات
│   ├── TASK-QUEUE.md      ← قائمة المهام
│   ├── ARCHITECTURE.md    ← هيكلية الكود
│   └── DATA-MODEL.md      ← نموذج البيانات
│
├── package.json           ← تعريف المشروع
├── .env.example           ← نموذج الإعدادات
├── .gitignore             ← قواعد الاستثناء
└── README.md              ← هذا الملف
```

---

## 🚀 بدء الاستخدام (محلي)

```bash
# 1. ثبت الاعتماديات
npm install

# 2. شغّل الخادم
npm start

# 3. افتح المتصفح
http://localhost:3000
```

---

## 🔑 بيانات الدخول الافتراضية

- **الرابط:** http://localhost:3000/admin
- **البريد:** admin@auhmc2026.sy
- **كلمة السر:** admin2026

> ⚠️ غيّر كلمة السر فوراً بعد أول تسجيل دخول!

---

## 🛠️ التقنيات

- **Frontend:** HTML5 + CSS3 + Vanilla JS
- **Backend:** Node.js + Express
- **قاعدة بيانات:** SQLite (بذر تلقائي)
- **مصادقة:** JWT Tokens
- **أيقونات:** Font Awesome 6.5.1
- **خطوط:** IBM Plex Sans Arabic + Inter

---

## 📚 التوثيق

| الملف | المحتوى |
|---|---|
| **[docs/AI-CONFIG.md](docs/AI-CONFIG.md)** | المصدر الموحّد للحقيقة — اقرأه أولاً |
| **[docs/AGENTS.md](docs/AGENTS.md)** | بروتوكول سريع للذكاء الاصطناعي |
| **[docs/ARCHITECTURE.md](docs/ARCHITECTURE.md)** | هيكلية الكود وتدفق البيانات |
| **[docs/DATA-MODEL.md](docs/DATA-MODEL.md)** | نموذج البيانات والثوابت |
| **[docs/CHANGELOG.md](docs/CHANGELOG.md)** | سجل التغييرات |
| **[docs/TASK-QUEUE.md](docs/TASK-QUEUE.md)** | قائمة المهام |

---

## 📝 الترخيص

© 2026 AUHMC — جميع الحقوق محفوظة