# AUHMC 2026 — نموذج البيانات (Data Model)

## نظرة عامة

هذا الملف يوثق هيكل قاعدة البيانات والبيانات الافتراضية. جميع البيانات مخزنة في **SQLite** في جدول واحد أو أكثر حسب النوع.

---

## 🗄️ الجداول (Tables)

### 1. users — المستخدمين (Admin)
| الحقل | النوع | الوصف |
|---|---|---|
| id | INTEGER | المعرف الفريد |
| email | TEXT | البريد الإلكتروني (فريد) |
| password | TEXT | كلمة المرور المشفرة (bcrypt) |
| name | TEXT | الاسم الكامل |
| created_at | DATETIME | تاريخ الإنشاء |

### 2. content — المحتوى العام (key-value)
| الحقل | النوع | الوصف |
|---|---|---|
| key | TEXT | المفتاح (فريد) |
| value | TEXT | القيمة |
| updated_at | DATETIME | تاريخ آخر تحديث |

**المفاتيح المستخدمة:**
- `hero_badge`, `hero_title`, `hero_subtitle`, `hero_quote`, `hero_date`, `hero_bgColor`, `hero_description`
- `stat_days`, `stat_tracks`, `stat_lectures`, `stat_participants`
- `theme_primary`, `theme_gold`
- `footer_text`, `footer_email`, `footer_phone`

### 3. tracks — المسارات العلمية
| الحقل | النوع | الوصف |
|---|---|---|
| id | INTEGER | المعرف الفريد |
| track_id | TEXT | المعرف الفريد للمسار (مثال: `pediatrics`) |
| icon | TEXT | أيقونة Font Awesome (مثال: `fa-baby`) |
| title | TEXT | عنوان المسار |
| desc | TEXT | وصف المسار |
| sort_order | INTEGER | ترتيب العرض |

### 4. schedule — الجدول الزمني
| الحقل | النوع | الوصف |
|---|---|---|
| id | INTEGER | المعرف الفريد |
| day | INTEGER | رقم اليوم (1-5) |
| time | TEXT | الوقت (مثال: `12:00 – 13:30`) |
| title | TEXT | عنوان الفعالية |
| speaker | TEXT | اسم المتحدث |
| track | TEXT | اسم المسار |
| sort_order | INTEGER | ترتيب العرض |

### 5. committees — اللجان المنظمة
| الحقل | النوع | الوصف |
|---|---|---|
| id | INTEGER | المعرف الفريد |
| icon | TEXT | أيقونة Font Awesome |
| title | TEXT | اسم اللجنة |
| desc | TEXT | وصف اللجنة |
| sort_order | INTEGER | ترتيب العرض |

### 6. workshops — ورشات العمل
| الحقل | النوع | الوصف |
|---|---|---|
| id | INTEGER | المعرف الفريد |
| name | TEXT | اسم الورشة |
| capacity | INTEGER | الطاقة الاستيعابية |
| sort_order | INTEGER | ترتيب العرض |

### 7. sponsors — الرعاة
| الحقل | النوع | الوصف |
|---|---|---|
| id | INTEGER | المعرف الفريد |
| name | TEXT | اسم الراعي |
| tier | TEXT | التصنيف (مثال: `gold`, `silver`, `bronze`) |
| desc | TEXT | وصف الراعي |
| logo_url | TEXT | رابط الشعار |
| image | TEXT | رابط الصورة |
| sort_order | INTEGER | ترتيب العرض |

### 8. registrations — التسجيلات (حضور + مشاركات)
| الحقل | النوع | الوصف |
|---|---|---|
| id | INTEGER | المعرف الفريد |
| type | TEXT | النوع: `attendance` أو `submission` |
| name | TEXT | الاسم الكامل |
| phone | TEXT | رقم الهاتف |
| email | TEXT | البريد الإلكتروني |
| specialty | TEXT | الاختصاص |
| workplace | TEXT | مكان العمل |
| workshops | TEXT | ورشات العمل المختارة (JSON) |
| category | TEXT | الفئة |
| created_at | DATETIME | تاريخ التسجيل |

### 9. submissions — المشاركات العلمية (أبحاث/بوسترات)
| الحقل | النوع | الوصف |
|---|---|---|
| id | INTEGER | المعرف الفريد |
| name | TEXT | الاسم الكامل |
| phone | TEXT | رقم الهاتف |
| email | TEXT | البريد الإلكتروني |
| degree | TEXT | الشهادة |
| affiliation | TEXT | الانتماء |
| title | TEXT | عنوان البحث |
| submission_type | TEXT | النوع: `poster` أو `paper` |
| status | TEXT | الحالة: `pending`, `accepted`, `rejected` |
| cv_path | TEXT | مسار السيرة الذاتية المرفوعة |
| photo_path | TEXT | مسار الصورة الشخصية |
| created_at | DATETIME | تاريخ التقديم |

### 10. submission_files — ملفات المشاركات
| الحقل | النوع | الوصف |
|---|---|---|
| id | INTEGER | المعرف الفريد |
| submission_id | INTEGER | معرف المشاركة (مفتاح خارجي) |
| file_type | TEXT | نوع الملف (مثال: `cv`, `photo`, `paper`) |
| file_path | TEXT | مسار الملف على السيرفر |
| original_name | TEXT | اسم الملف الأصلي |
| file_size | INTEGER | حجم الملف بالبايت |
| created_at | DATETIME | تاريخ الرفع |

### 11. posters — البوسترات العلمية
| الحقل | النوع | الوصف |
|---|---|---|
| id | INTEGER | المعرف الفريد |
| title | TEXT | عنوان البوستر |
| researcher_name | TEXT | اسم الباحث |
| specialty | TEXT | الاختصاص |
| image_url | TEXT | رابط صورة البوستر |
| description | TEXT | وصف البحث |
| sort_order | INTEGER | ترتيب العرض |
| created_at | DATETIME | تاريخ الإنشاء |

---

## 🌱 البيانات الافتراضية (Seed Data)

### المحتوى (content)
```javascript
{
  hero_badge: 'المؤتمر العلمي الأول',
  hero_title: 'مشفى حلب الجامعي',
  hero_subtitle: 'AUH Medical Conference 2026',
  hero_quote: 'معًا نحو نظام صحي متكامل.. رؤى طبية متجددة لغدٍ صحي أفضل',
  hero_date: '2026-10-15T09:00',
  hero_bgColor: '#002366',
  hero_description: 'ينطلق المؤتمر العلمي الأول لمشفى حلب الجامعي...',
  stat_days: '5',
  stat_tracks: '8',
  stat_lectures: '40+',
  stat_participants: '300+',
  theme_primary: '#002366',
  theme_gold: '#D4AF37',
  footer_text: '© 2026 AUHMC — جميع الحقوق محفوظة',
  footer_email: 'info@auhmc2026.sy',
  footer_phone: '+963 21 2XXXXXX'
}
```

### المسارات (tracks)
1. **طب الأطفال وحديثي الولادة** — `fa-baby`
2. **الجراحة العامة والتخصصية** — `fa-scalpel`
3. **الأمراض الباطنة** — `fa-heartbeat`
4. **الطب التشخيصي المتقدم** — `fa-microscope`
5. **الاختصاصات الدقيقة** — `fa-eye`
6. **التعليم الطبي المستمر** — `fa-chalkboard-teacher`
7. **الذكاء الاصطناعي الطبي** — `fa-robot`
8. **الجودة وسلامة المرضى** — `fa-shield-alt`

### الجدول الزمني (schedule)
- **اليوم 1:** الافتتاح، محاضرة آفاق البحث السريري، افتتاح معرض البوسترات، تطبيقات الذكاء الاصطناعي، ورشة كتابة الأبحاث
- **اليوم 2-5:** محاضرات وورشات متنوعة حسب المسارات

### اللجان (committees)
1. اللجنة العلمية
2. اللجنة التنظيمية
3. لجنة العلاقات العامة
4. اللجنة الفنية
5. لجنة التسجيل
6. اللجنة الإعلامية

### الورشات (workshops)
1. كتابة وقراءة الأبحاث الطبية (EBM)
2. مهارات التواصل الطبي
3. التدريب على المحاكاة السريرية

### الرعاة (sponsors)
1. راعي ماسي
2. راعي ذهبي
3. راعي فضي
4. راعي برونزي

---

## 📝 ملاحظات

- جميع البيانات الافتراضية موجودة في `src/server/database.js` داخل دالة `seedDatabase()`
- لتعديل البيانات الافتراضية، عدّل `seedDatabase()` مباشرة
- قاعدة البيانات تُنشأ تلقائياً عند أول تشغيل
- الملف يُخزن في `data/auhmc.db` (يُستثنى من Git)