const config = require('./config');
console.log('🔑 JWT_SECRET loaded: YES');
console.log('🗄️  Database: MySQL');

const express = require('express');
const cors = require('cors');
const path = require('path');
const fs = require('fs');
const rateLimit = require('express-rate-limit');

const app = express();
const PORT = config.PORT;

const FRONTEND_DIR = fs.existsSync(path.join(__dirname, '..', 'frontend', 'index.html'))
  ? path.join(__dirname, '..', 'frontend')
  : path.join(__dirname, '..', 'public');

console.log('📁 Frontend directory:', FRONTEND_DIR);

app.use(cors());
app.use(express.json({ limit: '50mb' }));
app.use(express.urlencoded({ extended: true, limit: '50mb' }));

const limiter = rateLimit({ windowMs: 15 * 60 * 1000, max: 200, message: { error: 'طلبات كثيرة جداً، حاول لاحقاً' } });
app.use('/api/', limiter);

app.use(express.static(FRONTEND_DIR));
app.use('/uploads', express.static(path.join(FRONTEND_DIR, 'uploads')));

app.use('/api/auth', require('./routes/auth'));
app.use('/api/content', require('./routes/content'));
app.use('/api/registrations', require('./routes/registrations'));

const multer = require('multer');
const storage = multer.diskStorage({
  destination: (req, file, cb) => {
    const uploadDir = path.join(FRONTEND_DIR, 'uploads');
    if (!fs.existsSync(uploadDir)) fs.mkdirSync(uploadDir, { recursive: true });
    cb(null, uploadDir);
  },
  filename: (req, file, cb) => {
    const uniqueSuffix = Date.now() + '-' + Math.round(Math.random() * 1E9);
    cb(null, uniqueSuffix + path.extname(file.originalname));
  }
});
const upload = multer({ storage, limits: { fileSize: config.MAX_FILE_SIZE }, fileFilter: (req, file, cb) => {
  const allowedTypes = /jpeg|jpg|png|gif|webp|svg|ico/;
  const extname = allowedTypes.test(path.extname(file.originalname).toLowerCase());
  const mimetype = allowedTypes.test(file.mimetype);
  if (extname && mimetype) return cb(null, true);
  cb(new Error('فقط الصور مسموح بها'));
}});

app.post('/api/upload', require('./middleware/auth').authenticateToken, upload.single('file'), (req, res) => {
  if (!req.file) return res.status(400).json({ error: 'لم يتم رفع أي ملف' });
  res.json({ url: `/uploads/${req.file.filename}`, filename: req.file.filename });
});

app.get('/admin', (req, res) => res.sendFile(path.join(FRONTEND_DIR, 'admin.html')));
app.get('*', (req, res) => res.sendFile(path.join(FRONTEND_DIR, 'index.html')));

app.use((err, req, res, next) => {
  console.error('Server Error:', err);
  if (err.code === 'LIMIT_FILE_SIZE') return res.status(400).json({ error: 'حجم الملف كبير جداً' });
  res.status(500).json({ error: 'حدث خطأ في الخادم' });
});

app.listen(PORT, () => {
  console.log(`🚀 AUHMC 2026 Server running on http://localhost:${PORT}`);
  console.log(`🔧 Admin: http://localhost:${PORT}/admin`);
});
