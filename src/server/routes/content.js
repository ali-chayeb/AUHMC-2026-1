// ============================================
// AUHMC 2026 - Content, Registrations & Upload Routes
// ============================================

const express = require('express');
const path = require('path');
const fs = require('fs');
const multer = require('multer');
const db = require('../database');
const config = require('../config');
const { authenticateToken } = require('../middleware/auth');

const router = express.Router();

// ============================================
// MULTER CONFIG (File Uploads)
// ============================================
const uploadDir = path.join(__dirname, '..', '..', 'frontend', 'uploads');
if (!fs.existsSync(uploadDir)) {
  fs.mkdirSync(uploadDir, { recursive: true });
}

const storage = multer.diskStorage({
  destination: (req, file, cb) => cb(null, uploadDir),
  filename: (req, file, cb) => {
    const uniqueSuffix = Date.now() + '-' + Math.round(Math.random() * 1E9);
    cb(null, uniqueSuffix + path.extname(file.originalname));
  }
});

const upload = multer({
  storage,
  limits: { fileSize: config.MAX_FILE_SIZE },
  fileFilter: (req, file, cb) => {
    // Images for general upload
    if (config.ALLOWED_IMAGE_TYPES.includes(file.mimetype)) {
      return cb(null, true);
    }
    // PDFs for CV
    if (file.fieldname === 'cv' && file.mimetype === 'application/pdf') {
      return cb(null, true);
    }
    cb(new Error('نوع الملف غير مسموح به'));
  }
});

// ============================================
// PUBLIC ROUTES (No Auth Required)
// ============================================

// GET /api/content - Get all site content
router.get('/content', async (req, res) => {
  try {
    const content = await db.all('SELECT * FROM content');
    const tracks = await db.all('SELECT * FROM tracks ORDER BY sort_order');
    const schedule = await db.all('SELECT * FROM schedule ORDER BY day, sort_order');
    const committees = await db.all('SELECT * FROM committees ORDER BY sort_order');
    const workshops = await db.all('SELECT * FROM workshops ORDER BY sort_order');
    const sponsors = await db.all('SELECT * FROM sponsors ORDER BY sort_order');
    const posters = await db.all('SELECT * FROM posters ORDER BY sort_order');

    // Group schedule by day
    const scheduleByDay = {};
    schedule.forEach(item => {
      if (!scheduleByDay[item.day]) scheduleByDay[item.day] = [];
      scheduleByDay[item.day].push({
        time: item.time,
        title: item.title,
        speaker: item.speaker,
        track: item.track
      });
    });

    // Convert content array to object
    const contentObj = {};
    content.forEach(c => { contentObj[c.key] = c.value; });

    res.json({
      hero: {
        badge: contentObj.hero_badge || '',
        title: contentObj.hero_title || '',
        subtitle: contentObj.hero_subtitle || '',
        quote: contentObj.hero_quote || '',
        date: contentObj.hero_date || '',
        bgColor: contentObj.hero_bgColor || '#002366'
      },
      stats: {
        days: contentObj.stat_days || '5',
        tracks: contentObj.stat_tracks || '8',
        lectures: contentObj.stat_lectures || '40+',
        participants: contentObj.stat_participants || '300+',
        description: contentObj.hero_description || ''
      },
      tracks,
      schedule: scheduleByDay,
      committees,
      workshops,
      sponsors,
      posters,
      media: {
        logo: contentObj.media_logo || '',
        bgImage: contentObj.media_bgImage || '',
        overlayOpacity: contentObj.media_overlayOpacity || '0.6',
        favicon: contentObj.media_favicon || ''
      },
      theme: {
        primary: contentObj.theme_primary || '#002366',
        gold: contentObj.theme_gold || '#D4AF37'
      },
      footer: {
        text: contentObj.footer_text || '',
        email: contentObj.footer_email || '',
        phone: contentObj.footer_phone || ''
      }
    });
  } catch (err) {
    console.error('Content GET error:', err);
    res.status(500).json({ error: 'حدث خطأ في الخادم' });
  }
});

// POST /api/registrations - Submit registration (public)
router.post('/registrations', async (req, res) => {
  try {
    const { name, phone, email, specialty, workplace, workshops } = req.body;

    if (!name || !phone) {
      return res.status(400).json({ error: 'الاسم ورقم الهاتف مطلوبان' });
    }

    const workshopsStr = Array.isArray(workshops)
      ? JSON.stringify(workshops.map(w => String(w)))
      : (workshops ? JSON.stringify([String(workshops)]) : '[]');

    await db.run(
      'INSERT INTO registrations (type, name, phone, email, specialty, workplace, workshops) VALUES (?, ?, ?, ?, ?, ?, ?)',
      ['attendance', name.trim(), phone.trim(), (email || '').trim(), (specialty || '').trim(), (workplace || '').trim(), workshopsStr]
    );

    res.status(201).json({ message: 'تم تسجيلك بنجاح! سيتم التواصل معك قريباً.' });
  } catch (err) {
    console.error('Registration error:', err);
    res.status(500).json({ error: 'حدث خطأ أثناء التسجيل' });
  }
});

// POST /api/registrations/submit - Submit scientific paper (public)
router.post('/registrations/submit', upload.fields([
  { name: 'cv', maxCount: 1 },
  { name: 'photo', maxCount: 1 }
]), async (req, res) => {
  try {
    const { name, phone, email, degree, affiliation, title, submission_type } = req.body;

    if (!name || !phone || !title) {
      return res.status(400).json({ error: 'الاسم ورقم الهاتف وعنوان البحث مطلوبة' });
    }

    const files = req.files || {};
    const cvPath = files.cv ? '/uploads/' + files.cv[0].filename : '';
    const photoPath = files.photo ? '/uploads/' + files.photo[0].filename : '';

    await db.run(
      `INSERT INTO submissions (name, phone, email, degree, affiliation, title, submission_type, status, cv_path, photo_path)
       VALUES (?, ?, ?, ?, ?, ?, ?, 'pending', ?, ?)`,
      [name.trim(), phone.trim(), (email || '').trim(), (degree || '').trim(), (affiliation || '').trim(), title.trim(), submission_type || 'poster', cvPath, photoPath]
    );

    res.status(201).json({ message: 'تم تقديم البحث بنجاح! سيتم مراجعته من قبل اللجنة العلمية.' });
  } catch (err) {
    console.error('Submission error:', err);
    res.status(500).json({ error: 'حدث خطأ أثناء تقديم البحث' });
  }
});

// ============================================
// ADMIN ROUTES (Auth Required)
// ============================================

// PUT /api/content/bulk - Update all content
router.put('/content/bulk', authenticateToken, async (req, res) => {
  try {
    const payload = req.body || {};

    // Update content key-values
    if (payload.content && typeof payload.content === 'object') {
      for (const [k, v] of Object.entries(payload.content)) {
        await db.run(
          'INSERT INTO content (`key`, value) VALUES (?, ?) ON DUPLICATE KEY UPDATE value = VALUES(value)',
          [k, String(v)]
        );
      }
    }

    // Update tracks
    if (payload.tracks && Array.isArray(payload.tracks)) {
      await db.exec('DELETE FROM tracks');
      for (let i = 0; i < payload.tracks.length; i++) {
        const t = payload.tracks[i];
        await db.run(
          'INSERT INTO tracks (track_id, icon, title, `desc`, sort_order) VALUES (?, ?, ?, ?, ?)',
          [t.track_id || t.id || `track-${i}`, t.icon, t.title, t.desc, i + 1]
        );
      }
    }

    // Update schedule
    if (payload.schedule && typeof payload.schedule === 'object') {
      await db.exec('DELETE FROM schedule');
      for (const [day, items] of Object.entries(payload.schedule)) {
        if (Array.isArray(items)) {
          for (let i = 0; i < items.length; i++) {
            const it = items[i];
            await db.run(
              'INSERT INTO schedule (day, time, title, speaker, track, sort_order) VALUES (?, ?, ?, ?, ?, ?)',
              [parseInt(day), it.time, it.title, it.speaker || '', it.track, i + 1]
            );
          }
        }
      }
    }

    // Update committees
    if (payload.committees && Array.isArray(payload.committees)) {
      await db.exec('DELETE FROM committees');
      for (let i = 0; i < payload.committees.length; i++) {
        const c = payload.committees[i];
        await db.run(
          'INSERT INTO committees (icon, title, `desc`, sort_order) VALUES (?, ?, ?, ?)',
          [c.icon, c.title, c.desc, i + 1]
        );
      }
    }

    // Update workshops
    if (payload.workshops && Array.isArray(payload.workshops)) {
      await db.exec('DELETE FROM workshops');
      for (let i = 0; i < payload.workshops.length; i++) {
        const w = payload.workshops[i];
        await db.run(
          'INSERT INTO workshops (name, capacity, sort_order) VALUES (?, ?, ?)',
          [w.name, w.capacity, i + 1]
        );
      }
    }

    // Update sponsors
    if (payload.sponsors && Array.isArray(payload.sponsors)) {
      await db.exec('DELETE FROM sponsors');
      for (let i = 0; i < payload.sponsors.length; i++) {
        const s = payload.sponsors[i];
        await db.run(
          'INSERT INTO sponsors (name, tier, `desc`, logo_url, sort_order) VALUES (?, ?, ?, ?, ?)',
          [s.name, s.tier, s.desc || '', s.logo_url || '', i + 1]
        );
      }
    }

    // Update posters
    if (payload.posters && Array.isArray(payload.posters)) {
      await db.exec('DELETE FROM posters');
      for (let i = 0; i < payload.posters.length; i++) {
        const p = payload.posters[i];
        await db.run(
          'INSERT INTO posters (title, researcher_name, specialty, image_url, description, sort_order) VALUES (?, ?, ?, ?, ?, ?)',
          [p.title, p.researcher_name, p.specialty || '', p.image_url || '', p.description || '', i + 1]
        );
      }
    }

    res.json({ message: 'تم تحديث المحتوى بالكامل بنجاح' });
  } catch (err) {
    console.error('Bulk update error:', err);
    res.status(500).json({ error: 'حدث خطأ في تحديث المحتوى' });
  }
});

// GET /api/registrations - Get all registrations (admin)
router.get('/registrations', authenticateToken, async (req, res) => {
  try {
    const registrations = await db.all('SELECT * FROM registrations ORDER BY created_at DESC');
    res.json(registrations);
  } catch (err) {
    console.error('Get registrations error:', err);
    res.status(500).json({ error: 'حدث خطأ في الخادم' });
  }
});

// GET /api/registrations/submissions - Get all submissions (admin)
router.get('/registrations/submissions', authenticateToken, async (req, res) => {
  try {
    const submissions = await db.all('SELECT * FROM submissions ORDER BY created_at DESC');
    res.json(submissions);
  } catch (err) {
    console.error('Get submissions error:', err);
    res.status(500).json({ error: 'حدث خطأ في الخادم' });
  }
});

// GET /api/registrations/stats - Get stats (admin)
router.get('/registrations/stats', authenticateToken, async (req, res) => {
  try {
    const total = await db.get('SELECT COUNT(*) as c FROM registrations');
    const today = await db.get("SELECT COUNT(*) as c FROM registrations WHERE DATE(created_at) = CURDATE()");
    const submissionsTotal = await db.get('SELECT COUNT(*) as c FROM submissions');
    const submissionsPending = await db.get("SELECT COUNT(*) as c FROM submissions WHERE status = 'pending'");

    res.json({
      total: total?.c || 0,
      today: today?.c || 0,
      submissions: submissionsTotal?.c || 0,
      pendingSubmissions: submissionsPending?.c || 0
    });
  } catch (err) {
    console.error('Stats error:', err);
    res.status(500).json({ error: 'حدث خطأ في الخادم' });
  }
});

// PATCH /api/registrations/submissions/:id/status
router.patch('/registrations/submissions/:id/status', authenticateToken, async (req, res) => {
  try {
    const { status } = req.body;
    const validStatuses = ['pending', 'approved', 'rejected'];
    if (!validStatuses.includes(status)) {
      return res.status(400).json({ error: 'حالة غير صالحة' });
    }
    await db.run('UPDATE submissions SET status = ? WHERE id = ?', [status, req.params.id]);
    res.json({ message: 'تم تحديث حالة البحث' });
  } catch (err) {
    console.error('Update status error:', err);
    res.status(500).json({ error: 'حدث خطأ في الخادم' });
  }
});

// DELETE /api/registrations/:id
router.delete('/registrations/:id', authenticateToken, async (req, res) => {
  try {
    await db.run('DELETE FROM registrations WHERE id = ?', [req.params.id]);
    res.json({ message: 'تم حذف التسجيل بنجاح' });
  } catch (err) {
    console.error('Delete registration error:', err);
    res.status(500).json({ error: 'حدث خطأ في الخادم' });
  }
});

// DELETE /api/registrations/submissions/:id
router.delete('/registrations/submissions/:id', authenticateToken, async (req, res) => {
  try {
    await db.run('DELETE FROM submissions WHERE id = ?', [req.params.id]);
    res.json({ message: 'تم حذف البحث بنجاح' });
  } catch (err) {
    console.error('Delete submission error:', err);
    res.status(500).json({ error: 'حدث خطأ في الخادم' });
  }
});

// POST /api/upload - Upload image (admin)
router.post('/upload', authenticateToken, upload.single('file'), (req, res) => {
  if (!req.file) {
    return res.status(400).json({ error: 'لم يتم رفع أي ملف' });
  }
  res.json({
    url: `/uploads/${req.file.filename}`,
    filename: req.file.filename
  });
});

module.exports = router;
