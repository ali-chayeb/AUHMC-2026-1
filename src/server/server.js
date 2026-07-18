// ============================================
// AUHMC 2026 - Main Server
// NO dotenv, NO .env - uses config.js only
// ============================================

const config = require('./config');
console.log('🔑 JWT_SECRET: ' + config.JWT_SECRET.substring(0, 8) + '...');
console.log('🗄️  Database: MySQL @ ' + config.DB_HOST + '/' + config.DB_NAME);

const express = require('express');
const cors = require('cors');
const path = require('path');
const fs = require('fs');
const rateLimit = require('express-rate-limit');

const app = express();

// ============================================
// FRONTEND PATH
// ============================================
const FRONTEND_DIR = fs.existsSync(path.join(__dirname, '..', 'frontend', 'index.html'))
  ? path.join(__dirname, '..', 'frontend')
  : path.join(__dirname, '..', 'public');

console.log('📁 Frontend: ' + FRONTEND_DIR);

// ============================================
// MIDDLEWARE
// ============================================
app.use(cors());
app.use(express.json({ limit: '50mb' }));
app.use(express.urlencoded({ extended: true, limit: '50mb' }));

// Rate limiting
const limiter = rateLimit({
  windowMs: 15 * 60 * 1000,
  max: 200,
  message: { error: 'طلبات كثيرة جداً، حاول لاحقاً' }
});
app.use('/api/', limiter);

// Static files
app.use(express.static(FRONTEND_DIR));
app.use('/uploads', express.static(path.join(FRONTEND_DIR, 'uploads')));

// ============================================
// ROUTES
// ============================================
const contentRoutes = require('./routes/content');
const authRoutes = require('./routes/auth');

app.use('/api', contentRoutes);
app.use('/api/auth', authRoutes);

// ============================================
// ADMIN & FALLBACK
// ============================================
app.get('/admin', (req, res) => {
  res.sendFile(path.join(FRONTEND_DIR, 'admin.html'));
});

app.get('*', (req, res) => {
  res.sendFile(path.join(FRONTEND_DIR, 'index.html'));
});

// ============================================
// ERROR HANDLING
// ============================================
app.use((err, req, res, next) => {
  console.error('❌ Server Error:', err.message);
  if (err.code === 'LIMIT_FILE_SIZE') {
    return res.status(400).json({ error: 'حجم الملف كبير جداً' });
  }
  if (err.message && err.message.includes('غير مسموح')) {
    return res.status(400).json({ error: err.message });
  }
  res.status(500).json({ error: 'حدث خطأ في الخادم' });
});

// ============================================
// START SERVER
// ============================================
app.listen(config.PORT, () => {
  console.log('🚀 Server running on http://localhost:' + config.PORT);
  console.log('🔧 Admin: http://localhost:' + config.PORT + '/admin');
});
