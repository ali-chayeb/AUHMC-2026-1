const express = require('express');
const path = require('path');
const fs = require('fs');
const multer = require('multer');
const { prepare, exec, transaction } = require('../database');
const { authenticateToken } = require('../middleware/auth');

const router = express.Router();

// ====== MULTER CONFIG for submission file uploads ======
const uploadDir = process.env.UPLOAD_DIR || path.join(__dirname, '..', '..', 'public', 'uploads');
if (!fs.existsSync(uploadDir)) {
  fs.mkdirSync(uploadDir, { recursive: true });
}

const submissionStorage = multer.diskStorage({
  destination: (req, file, cb) => cb(null, uploadDir),
  filename: (req, file, cb) => {
    const prefix = file.fieldname === 'cv' ? 'cv' : 'photo';
    const uniqueSuffix = Date.now() + '-' + Math.round(Math.random() * 1E9);
    const ext = path.extname(file.originalname);
    cb(null, prefix + '-' + uniqueSuffix + ext);
  }
});

const upload = multer({
  storage: submissionStorage,
  limits: { fileSize: 10 * 1024 * 1024 }, // 10MB max
  fileFilter: (req, file, cb) => {
    if (file.fieldname === 'cv') {
      // CV: only PDF
      if (file.mimetype === 'application/pdf') return cb(null, true);
      return cb(new Error('السيرة الذاتية يجب أن تكون بصيغة PDF'));
    }
    if (file.fieldname === 'photo') {
      // Photo: only images
      const allowed = /jpeg|jpg|png|gif|webp/;
      const ext = allowed.test(path.extname(file.originalname).toLowerCase());
      const mime = allowed.test(file.mimetype);
      if (ext && mime) return cb(null, true);
      return cb(new Error('الصورة الشخصية يجب أن تكون بصيغة jpg, png, gif, webp'));
    }
    return cb(null, true);
  }
});

// ====== POST /api/registrations - Register for attendance (public) ======
router.post('/', async (req, res) => {
  try {
    const { name, phone, email, specialty, workplace, workshops } = req.body;

    if (!name || !phone) {
      return res.status(400).json({ error: 'الاسم ورقم الهاتف مطلوبان' });
    }

    // Store workshops as JSON string for consistency
    const workshopsStr = Array.isArray(workshops) 
      ? JSON.stringify(workshops.map(w => String(w)))
      : (workshops ? JSON.stringify([String(workshops)]) : '[]');

    prepare(
      'INSERT INTO registrations (type, name, phone, email, specialty, workplace, workshops) VALUES (?, ?, ?, ?, ?, ?, ?)'
    ).run(
      'attendance',
      name.trim(),
      phone.trim(),
      (email || '').trim(),
      (specialty || '').trim(),
      (workplace || '').trim(),
      workshopsStr
    );

    res.status(201).json({ message: 'تم تسجيلك بنجاح! سيتم التواصل معك قريباً.' });
  } catch (err) {
    console.error('Registration error:', err);
    res.status(500).json({ error: 'حدث خطأ أثناء التسجيل' });
  }
});

// ====== POST /api/registrations/submit - Submit a scientific paper/poster (public) ======
router.post('/submit', upload.fields([
  { name: 'cv', maxCount: 1 },
  { name: 'photo', maxCount: 1 }
]), async (req, res) => {
  try {
    const { name, phone, email, degree, affiliation, title, submission_type } = req.body;

    if (!name || !phone || !title) {
      return res.status(400).json({ error: 'الاسم ورقم الهاتف وعنوان البحث مطلوبة' });
    }

    // Get file paths from uploaded files
    const files = req.files || {};
    const cvPath = files.cv ? '/uploads/' + files.cv[0].filename : '';
    const photoPath = files.photo ? '/uploads/' + files.photo[0].filename : '';

    prepare(
      `INSERT INTO submissions (name, phone, email, degree, affiliation, title, submission_type, status, cv_path, photo_path)
       VALUES (?, ?, ?, ?, ?, ?, ?, 'pending', ?, ?)`
    ).run(
      name.trim(),
      phone.trim(),
      (email || '').trim(),
      (degree || '').trim(),
      (affiliation || '').trim(),
      title.trim(),
      submission_type || 'poster',
      cvPath,
      photoPath
    );

    res.status(201).json({ message: 'تم تقديم البحث بنجاح! سيتم مراجعته من قبل اللجنة العلمية.' });
  } catch (err) {
    console.error('Submission error:', err);
    res.status(500).json({ error: 'حدث خطأ أثناء تقديم البحث' });
  }
});

// ====== GET /api/registrations - Get all registrations (requires auth) ======
router.get('/', authenticateToken, (req, res) => {
  const registrations = prepare('SELECT * FROM registrations ORDER BY created_at DESC').all();
  res.json(registrations);
});

// ====== GET /api/registrations/submissions - Get all submissions (requires auth) ======
router.get('/submissions', authenticateToken, (req, res) => {
  const submissions = prepare('SELECT * FROM submissions ORDER BY created_at DESC').all();
  res.json(submissions);
});

// ====== GET /api/registrations/stats - Get registration statistics (requires auth) ======
router.get('/stats', authenticateToken, (req, res) => {
  const total = prepare('SELECT COUNT(*) as c FROM registrations').get();
  const today = prepare(
    "SELECT COUNT(*) as c FROM registrations WHERE date(created_at) = date('now')"
  ).get();
  const submissionsTotal = prepare('SELECT COUNT(*) as c FROM submissions').get();
  const submissionsPending = prepare("SELECT COUNT(*) as c FROM submissions WHERE status = 'pending'").get();

  res.json({
    total: total?.c || 0,
    today: today?.c || 0,
    submissions: submissionsTotal?.c || 0,
    pendingSubmissions: submissionsPending?.c || 0
  });
});

// ====== PATCH /api/registrations/submissions/:id/status - Update submission status (requires auth) ======
router.patch('/submissions/:id/status', authenticateToken, (req, res) => {
  const { status } = req.body;
  const validStatuses = ['pending', 'approved', 'rejected'];
  if (!validStatuses.includes(status)) {
    return res.status(400).json({ error: 'حالة غير صالحة' });
  }
  prepare('UPDATE submissions SET status = ? WHERE id = ?').run(status, req.params.id);
  res.json({ message: 'تم تحديث حالة البحث' });
});

// ====== DELETE /api/registrations/:id - Delete registration (requires auth) ======
router.delete('/:id', authenticateToken, (req, res) => {
  prepare('DELETE FROM registrations WHERE id = ?').run(req.params.id);
  res.json({ message: 'تم حذف التسجيل بنجاح' });
});

// ====== DELETE /api/registrations/submissions/:id - Delete submission (requires auth) ======
router.delete('/submissions/:id', authenticateToken, (req, res) => {
  prepare('DELETE FROM submissions WHERE id = ?').run(req.params.id);
  res.json({ message: 'تم حذف البحث بنجاح' });
});

module.exports = router;