// ============================================
// AUHMC 2026 - Authentication Routes
// Login, Verify Token, Change Password
// ============================================

const express = require('express');
const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');
const db = require('../database');
const config = require('../config');
const { authenticateToken } = require('../middleware/auth');

const router = express.Router();

// POST /api/auth/login
router.post('/login', async (req, res) => {
  try {
    const { email, password } = req.body;

    if (!email || !password) {
      return res.status(400).json({ error: 'البريد الإلكتروني وكلمة المرور مطلوبان' });
    }

    const user = await db.get('SELECT * FROM users WHERE email = ?', [email]);

    if (!user) {
      return res.status(401).json({ error: 'البريد الإلكتروني أو كلمة المرور خاطئة' });
    }

    const validPassword = bcrypt.compareSync(password, user.password);
    if (!validPassword) {
      return res.status(401).json({ error: 'البريد الإلكتروني أو كلمة المرور خاطئة' });
    }

    const token = jwt.sign(
      { id: user.id, email: user.email, name: user.name },
      config.JWT_SECRET,
      { expiresIn: config.JWT_EXPIRES_IN }
    );

    res.json({
      token,
      user: { id: user.id, email: user.email, name: user.name }
    });
  } catch (err) {
    console.error('Login error:', err);
    res.status(500).json({ error: 'حدث خطأ في الخادم' });
  }
});

// GET /api/auth/verify
router.get('/verify', (req, res) => {
  const authHeader = req.headers['authorization'];
  const token = authHeader && authHeader.split(' ')[1];

  if (!token) {
    return res.status(401).json({ valid: false });
  }

  jwt.verify(token, config.JWT_SECRET, (err, user) => {
    if (err) {
      return res.status(401).json({ valid: false });
    }
    res.json({ valid: true, user });
  });
});

// POST /api/auth/change-password
router.post('/change-password', authenticateToken, async (req, res) => {
  try {
    const { currentPassword, newPassword } = req.body;

    if (!currentPassword || !newPassword) {
      return res.status(400).json({ error: 'كلمة المرور الحالية والجديدة مطلوبتان' });
    }

    if (newPassword.length < 6) {
      return res.status(400).json({ error: 'كلمة المرور الجديدة يجب أن تكون 6 أحرف على الأقل' });
    }

    const user = await db.get('SELECT * FROM users WHERE id = ?', [req.user.id]);

    if (!bcrypt.compareSync(currentPassword, user.password)) {
      return res.status(400).json({ error: 'كلمة المرور الحالية خاطئة' });
    }

    const hashedPassword = bcrypt.hashSync(newPassword, 10);
    await db.run('UPDATE users SET password = ? WHERE id = ?', [hashedPassword, req.user.id]);

    res.json({ message: 'تم تغيير كلمة المرور بنجاح' });
  } catch (err) {
    console.error('Change password error:', err);
    res.status(500).json({ error: 'حدث خطأ في الخادم' });
  }
});

module.exports = router;
