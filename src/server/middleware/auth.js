const jwt = require('jsonwebtoken');
const config = require('../config');

function authenticateToken(req, res, next) {
  const authHeader = req.headers['authorization'];
  const token = authHeader && authHeader.split(' ')[1];

  if (!token) {
    return res.status(401).json({ error: 'غير مصرح بالدخول - يرجى تسجيل الدخول' });
  }

  jwt.verify(token, config.JWT_SECRET, (err, user) => {
    if (err) {
      return res.status(403).json({ error: 'انتهت صلاحية الجلسة - يرجى تسجيل الدخول مجدداً' });
    }
    req.user = user;
    next();
  });
}

module.exports = { authenticateToken };
