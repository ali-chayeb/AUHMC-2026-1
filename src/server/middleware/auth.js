const jwt = require('jsonwebtoken');

// Use environment variable or fallback default (for development only)
const JWT_SECRET = process.env.JWT_SECRET || 'auhmc2026_default_secret_key_change_in_production';

function authenticateToken(req, res, next) {
  const authHeader = req.headers['authorization'];
  const token = authHeader && authHeader.split(' ')[1];

  if (!token) {
    return res.status(401).json({ error: 'غير مصرح بالدخول - يرجى تسجيل الدخول' });
  }

  jwt.verify(token, JWT_SECRET, (err, user) => {
    if (err) {
      return res.status(403).json({ error: 'انتهت صلاحية الجلسة - يرجى تسجيل الدخول مجدداً' });
    }
    req.user = user;
    next();
  });
}

module.exports = { authenticateToken };
