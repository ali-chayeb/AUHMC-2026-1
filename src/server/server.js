require('dotenv').config({ path: require('path').join(__dirname, '..', '..', '.env') });
console.log('🔑 JWT_SECRET loaded:', process.env.JWT_SECRET ? 'YES' : 'NO');
const express = require('express');
const cors = require('cors');
const path = require('path');
const fs = require('fs');
const rateLimit = require('express-rate-limit');

const app = express();
const PORT = process.env.PORT || 3000;

// ====== DETECT FRONTEND PATH ======
const FRONTEND_DIR = fs.existsSync(path.join(__dirname, '..', 'frontend', 'index.html'))
  ? path.join(__dirname, '..', 'frontend')
  : path.join(__dirname, '..', 'public');

console.log('📁 Frontend directory:', FRONTEND_DIR);

// ====== MIDDLEWARE ======
app.use(cors());
app.use(express.json({ limit: '50mb' }));
app.use(express.urlencoded({ extended: true, limit: '50mb' }));

// Rate limiting (protection)
const limiter = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 minutes
  max: 200, // max 200 requests per IP
  message: { error: 'طلبات كثيرة جداً، حاول لاحقاً' }
});
app.use('/api/', limiter);

// ====== STATIC FILES ======
app.use(express.static(FRONTEND_DIR));
// Serve uploads from frontend/uploads
app.use('/uploads', express.static(path.join(FRONTEND_DIR, 'uploads')));

// ====== API ROUTES ======
app.use('/api/auth', require('./routes/auth'));
app.use('/api/content', require('./routes/content'));
app.use('/api/registrations', require('./routes/registrations'));
// ====== UPLOAD ENDPOINT ======
const multer = require('multer');
const storage = multer.diskStorage({
  destination: (req, file, cb) => {
    const uploadDir = process.env.UPLOAD_DIR || path.join(FRONTEND_DIR, 'uploads');
    if (!fs.existsSync(uploadDir)) {
      fs.mkdirSync(uploadDir, { recursive: true });
    }
    cb(null, uploadDir);
  },
  filename: (req, file, cb) => {
    const uniqueSuffix = Date.now() + '-' + Math.round(Math.random() * 1E9);
    cb(null, uniqueSuffix + path.extname(file.originalname));
  }
});
const upload = multer({
  storage,
  limits: { fileSize: 5 * 1024 * 1024 }, // 5MB max
  fileFilter: (req, file, cb) => {
    const allowedTypes = /jpeg|jpg|png|gif|webp|svg|ico/;
    const extname = allowedTypes.test(path.extname(file.originalname).toLowerCase());
    const mimetype = allowedTypes.test(file.mimetype);
    if (extname && mimetype) {
      return cb(null, true);
    }
    cb(new Error('فقط الصور مسموح بها (jpg, png, gif, webp, svg)'));
  }
});

app.post('/api/upload', require('./middleware/auth').authenticateToken, upload.single('file'), (req, res) => {
  if (!req.file) {
    return res.status(400).json({ error: 'لم يتم رفع أي ملف' });
  }
  res.json({
    url: `/uploads/${req.file.filename}`,
    filename: req.file.filename
  });
});

// ====== ADMIN ROUTE ======
app.get('/admin', (req, res) => {
  res.sendFile(path.join(FRONTEND_DIR, 'admin.html'));
});

// ====== FALLBACK ======
app.get('*', (req, res) => {
  res.sendFile(path.join(FRONTEND_DIR, 'index.html'));
});

// ====== ERROR HANDLING ======
app.use((err, req, res, next) => {
  console.error('Server Error:', err);
  if (err.code === 'LIMIT_FILE_SIZE') {
    return res.status(400).json({ error: 'حجم الملف كبير جداً. الحد الأقصى 5 ميجابايت' });
  }
  if (err.message && err.message.includes('فقط الصور')) {
    return res.status(400).json({ error: err.message });
  }
  res.status(500).json({ error: 'حدث خطأ في الخادم' });
});

// ====== START SERVER ======
try {
  // Database is initialized automatically when requiring database.js
  require('./database');
  console.log('✅ Database initialized');

  app.listen(PORT, () => {
    console.log(`🚀 AUHMC 2026 Server is running!`);
    console.log(`📁 Local:    http://localhost:${PORT}`);
    console.log(`🔧 Admin:    http://localhost:${PORT}/admin`);
    console.log(`📋 API:      http://localhost:${PORT}/api/content`);
  });
} catch (err) {
  console.error('❌ Failed to start server:', err);
  process.exit(1);
}
