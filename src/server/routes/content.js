const express = require('express');
const { prepare, exec, transaction } = require('../database');
const { authenticateToken } = require('../middleware/auth');

const router = express.Router();

// ====== GET /api/content - Get all content (public) ======
router.get('/', async (req, res) => {
  try {
    const content = prepare('SELECT * FROM content').all();
    const tracks = prepare('SELECT * FROM tracks ORDER BY sort_order').all();
    const schedule = prepare('SELECT * FROM schedule ORDER BY day, sort_order').all();
    const committees = prepare('SELECT * FROM committees ORDER BY sort_order').all();
    const workshops = prepare('SELECT * FROM workshops ORDER BY sort_order').all();
    const sponsors = prepare('SELECT * FROM sponsors ORDER BY sort_order').all();
    const posters = prepare('SELECT * FROM posters ORDER BY sort_order').all();

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

    // Convert content to object
    const contentObj = {};
    content.forEach(c => { contentObj[c.key] = c.value; });

    res.json({
      hero: {
        badge: contentObj.hero_badge || 'المؤتمر العلمي الأول',
        title: contentObj.hero_title || 'مشفى حلب الجامعي',
        subtitle: contentObj.hero_subtitle || 'AUH Medical Conference 2026',
        quote: contentObj.hero_quote || 'معًا نحو نظام صحي متكامل.. رؤى طبية متجددة لغدٍ صحي أفضل',
        date: contentObj.hero_date || '2026-10-15T09:00',
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
        text: contentObj.footer_text || '© 2026 AUHMC — جميع الحقوق محفوظة',
        email: contentObj.footer_email || 'info@auhmc2026.sy',
        phone: contentObj.footer_phone || '+963 21 2XXXXXX'
      }
    });
  } catch (err) {
    console.error('Content error:', err);
    res.status(500).json({ error: 'حدث خطأ في الخادم' });
  }
});

// ====== PUT /api/content - Update content key-values (requires auth) ======
router.put('/', authenticateToken, async (req, res) => {
  try {
    const updates = req.body;
    const upsert = prepare(
      'INSERT INTO content (key, value, updated_at) VALUES (?, ?, CURRENT_TIMESTAMP) ON CONFLICT(key) DO UPDATE SET value = excluded.value, updated_at = CURRENT_TIMESTAMP'
    );

    const tx = transaction(() => {
      for (const [key, value] of Object.entries(updates)) {
        upsert.run(key, String(value));
      }
    });

    tx();
    res.json({ message: 'تم حفظ المحتوى بنجاح' });
  } catch (err) {
    console.error('Content update error:', err);
    res.status(500).json({ error: 'حدث خطأ في حفظ المحتوى' });
  }
});

// ====== PUT /api/content/bulk - Replace all content (requires auth) ======
router.put('/bulk', authenticateToken, async (req, res) => {
  try {
    const payload = req.body || {};

    const tx = transaction(() => {
      if (payload.content && typeof payload.content === 'object') {
        const upsert = prepare('INSERT INTO content (key, value) VALUES (?, ?) ON CONFLICT(key) DO UPDATE SET value = excluded.value');
        for (const [k, v] of Object.entries(payload.content)) upsert.run(k, String(v));
      }

      if (payload.tracks && Array.isArray(payload.tracks)) {
        exec('DELETE FROM tracks');
        const ins = prepare('INSERT INTO tracks (track_id, icon, title, desc, sort_order) VALUES (?, ?, ?, ?, ?)');
        payload.tracks.forEach((t, i) => ins.run(t.track_id || t.id || `track-${i}`, t.icon, t.title, t.desc, i + 1));
      }

      if (payload.schedule && typeof payload.schedule === 'object') {
        exec('DELETE FROM schedule');
        const ins = prepare('INSERT INTO schedule (day, time, title, speaker, track, sort_order) VALUES (?, ?, ?, ?, ?, ?)');
        for (const [day, items] of Object.entries(payload.schedule)) {
          (items || []).forEach((it, i) => ins.run(parseInt(day), it.time, it.title, it.speaker || '', it.track, i + 1));
        }
      }

      if (payload.committees && Array.isArray(payload.committees)) {
        exec('DELETE FROM committees');
        const ins = prepare('INSERT INTO committees (icon, title, desc, sort_order) VALUES (?, ?, ?, ?)');
        payload.committees.forEach((c, i) => ins.run(c.icon, c.title, c.desc, i + 1));
      }

      if (payload.workshops && Array.isArray(payload.workshops)) {
        exec('DELETE FROM workshops');
        const ins = prepare('INSERT INTO workshops (name, capacity, sort_order) VALUES (?, ?, ?)');
        payload.workshops.forEach((w, i) => ins.run(w.name, w.capacity, i + 1));
      }

      if (payload.sponsors && Array.isArray(payload.sponsors)) {
        exec('DELETE FROM sponsors');
        const ins = prepare('INSERT INTO sponsors (name, tier, desc, logo_url, sort_order) VALUES (?, ?, ?, ?, ?)');
        payload.sponsors.forEach((s, i) => ins.run(s.name, s.tier, s.desc || '', s.logo_url || '', i + 1));
      }

      if (payload.posters && Array.isArray(payload.posters)) {
        exec('DELETE FROM posters');
        const ins = prepare('INSERT INTO posters (title, researcher_name, specialty, image_url, description, sort_order) VALUES (?, ?, ?, ?, ?, ?)');
        payload.posters.forEach((p, i) => ins.run(p.title, p.researcher_name, p.specialty || '', p.image_url || '', p.description || '', i + 1));
      }
    });

    tx();
    res.json({ message: 'تم تحديث المحتوى بالكامل بنجاح' });
  } catch (err) {
    console.error('Bulk update error:', err);
    res.status(500).json({ error: 'حدث خطأ في تحديث المحتوى' });
  }
});

// ====== GET /api/content/posters - Get all posters (public) ======
router.get('/posters', async (req, res) => {
  try {
    const posters = prepare('SELECT * FROM posters ORDER BY sort_order').all();
    res.json(posters);
  } catch (err) {
    res.status(500).json({ error: 'حدث خطأ في تحميل البوسترات' });
  }
});

module.exports = router;