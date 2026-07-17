const { DatabaseSync } = require('node:sqlite');
const bcrypt = require('bcryptjs');
const path = require('path');
const fs = require('fs');

const DB_PATH = path.join(__dirname, '..', '..', 'data', 'auhmc.db');
const dataDir = path.dirname(DB_PATH);

// Ensure data directory exists
if (!fs.existsSync(dataDir)) {
  fs.mkdirSync(dataDir, { recursive: true });
}

// Initialize SQLite database
const db = new DatabaseSync(DB_PATH);

// Enable foreign keys
db.exec('PRAGMA foreign_keys = ON');

// ====== DATABASE API (compatible with existing routes) ======
const dbApi = {
  prepare: (sql) => db.prepare(sql),

  get: (sql, params = []) => {
    const stmt = db.prepare(sql);
    return Array.isArray(params) ? stmt.get(...params) : stmt.get(params);
  },

  run: (sql, params = []) => {
    const stmt = db.prepare(sql);
    return Array.isArray(params) ? stmt.run(...params) : stmt.run(params);
  },

  all: (sql, params = []) => {
    const stmt = db.prepare(sql);
    return Array.isArray(params) ? stmt.all(...params) : stmt.all(params);
  },

  exec: (sql) => {
    try {
      db.exec(sql);
    } catch (err) {
      console.error('SQL Error (exec):', err.message, 'SQL:', sql);
      throw err;
    }
  },
  transaction: (fn) => {
    return db.transaction(fn);
  }
};

// ====== INITIALIZE DATABASE ======
function initializeDatabase() {
  // Users table (Admin accounts)
  dbApi.exec(`
    CREATE TABLE IF NOT EXISTS users (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      email TEXT UNIQUE NOT NULL,
      password TEXT NOT NULL,
      name TEXT NOT NULL,
      created_at DATETIME DEFAULT CURRENT_TIMESTAMP
    )
  `);

  // Registrations table (Attendee + Submission)
  dbApi.exec(`
    CREATE TABLE IF NOT EXISTS registrations (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      type TEXT NOT NULL DEFAULT 'attendance',
      name TEXT NOT NULL,
      phone TEXT NOT NULL,
      email TEXT,
      specialty TEXT,
      workplace TEXT,
      workshops TEXT,
      category TEXT DEFAULT '',
      created_at DATETIME DEFAULT CURRENT_TIMESTAMP
    )
  `);

  // Content management table (key-value)
  dbApi.exec(`
    CREATE TABLE IF NOT EXISTS content (
      key TEXT PRIMARY KEY,
      value TEXT NOT NULL,
      updated_at DATETIME DEFAULT CURRENT_TIMESTAMP
    )
  `);

  // Tracks table
  dbApi.exec(`
    CREATE TABLE IF NOT EXISTS tracks (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      track_id TEXT UNIQUE NOT NULL,
      icon TEXT NOT NULL,
      title TEXT NOT NULL,
      desc TEXT NOT NULL,
      sort_order INTEGER DEFAULT 0
    )
  `);

  // Schedule table
  dbApi.exec(`
    CREATE TABLE IF NOT EXISTS schedule (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      day INTEGER NOT NULL,
      time TEXT NOT NULL,
      title TEXT NOT NULL,
      speaker TEXT DEFAULT '',
      track TEXT NOT NULL,
      sort_order INTEGER DEFAULT 0
    )
  `);

  // Committees table
  dbApi.exec(`
    CREATE TABLE IF NOT EXISTS committees (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      icon TEXT NOT NULL,
      title TEXT NOT NULL,
      desc TEXT NOT NULL,
      sort_order INTEGER DEFAULT 0
    )
  `);

  // Workshops table
  dbApi.exec(`
    CREATE TABLE IF NOT EXISTS workshops (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      name TEXT NOT NULL,
      capacity INTEGER NOT NULL,
      sort_order INTEGER DEFAULT 0
    )
  `);

  // Sponsors table (with logo support)
  dbApi.exec(`
    CREATE TABLE IF NOT EXISTS sponsors (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      name TEXT NOT NULL,
      tier TEXT NOT NULL,
      desc TEXT DEFAULT '',
      logo_url TEXT DEFAULT '',
      image TEXT DEFAULT '',
      sort_order INTEGER DEFAULT 0
    )
  `);

  // Submissions table (Scientific paper/poster submissions)
  dbApi.exec(`
    CREATE TABLE IF NOT EXISTS submissions (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      name TEXT NOT NULL,
      phone TEXT NOT NULL,
      email TEXT,
      degree TEXT DEFAULT '',
      affiliation TEXT DEFAULT '',
      title TEXT NOT NULL,
      submission_type TEXT NOT NULL DEFAULT 'poster',
      status TEXT NOT NULL DEFAULT 'pending',
      cv_path TEXT DEFAULT '',
      photo_path TEXT DEFAULT '',
      created_at DATETIME DEFAULT CURRENT_TIMESTAMP
    )
  `);

  // Add cv_path and photo_path columns if they don't exist (for legacy databases)
  try { dbApi.exec("ALTER TABLE submissions ADD COLUMN cv_path TEXT DEFAULT ''"); } catch(e) {}
  try { dbApi.exec("ALTER TABLE submissions ADD COLUMN photo_path TEXT DEFAULT ''"); } catch(e) {}

  // Submission files table (uploaded files for each submission)
  dbApi.exec(`
    CREATE TABLE IF NOT EXISTS submission_files (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      submission_id INTEGER NOT NULL,
      file_type TEXT NOT NULL,
      file_path TEXT NOT NULL,
      original_name TEXT NOT NULL,
      file_size INTEGER DEFAULT 0,
      created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
      FOREIGN KEY (submission_id) REFERENCES submissions(id) ON DELETE CASCADE
    )
  `);

  // Posters table (managed by Admin)
  dbApi.exec(`
    CREATE TABLE IF NOT EXISTS posters (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      title TEXT NOT NULL,
      researcher_name TEXT NOT NULL,
      specialty TEXT DEFAULT '',
      image_url TEXT DEFAULT '',
      description TEXT DEFAULT '',
      sort_order INTEGER DEFAULT 0,
      created_at DATETIME DEFAULT CURRENT_TIMESTAMP
    )
  `);

  // Create indexes for better performance
  try {
    dbApi.exec('CREATE INDEX IF NOT EXISTS idx_tracks_track_id ON tracks(track_id)');
    dbApi.exec('CREATE INDEX IF NOT EXISTS idx_schedule_day ON schedule(day)');
    dbApi.exec('CREATE INDEX IF NOT EXISTS idx_schedule_track ON schedule(track)');
    dbApi.exec('CREATE INDEX IF NOT EXISTS idx_registrations_type ON registrations(type)');
    dbApi.exec('CREATE INDEX IF NOT EXISTS idx_submissions_status ON submissions(status)');
    dbApi.exec('CREATE INDEX IF NOT EXISTS idx_submission_files_submission_id ON submission_files(submission_id)');
  } catch (e) {
    console.warn('Index creation warning:', e.message);
  }

  // Create default admin if not exists
  const adminEmail = process.env.ADMIN_EMAIL || 'admin@auhmc2026.sy';
  const adminExists = dbApi.get('SELECT id FROM users WHERE email = ?', [adminEmail]);
  if (!adminExists) {
    const hashedPassword = bcrypt.hashSync(process.env.ADMIN_PASSWORD || 'admin2026', 10);
    dbApi.run('INSERT INTO users (email, password, name) VALUES (?, ?, ?)', [adminEmail, hashedPassword, 'مدير الموقع']);
    console.log('✅ Default admin user created:', adminEmail);
  }

  // Seed default content if database is empty
  seedDatabase();
}

function isEmpty(table) {
  const allowedTables = ['content', 'tracks', 'schedule', 'committees', 'workshops', 'sponsors', 'submissions', 'submission_files', 'posters', 'users', 'registrations'];
  if (!allowedTables.includes(table)) {
    throw new Error(`Invalid table name: ${table}`);
  }
  const result = dbApi.get(`SELECT COUNT(*) as c FROM ${table}`);
  return result.c === 0;
}

// ====== DEFAULT SEED DATA ======
const SEED = {
  content: {
    hero_badge: 'المؤتمر العلمي الأول',
    hero_title: 'مشفى حلب الجامعي',
    hero_subtitle: 'AUH Medical Conference 2026',
    hero_quote: 'معًا نحو نظام صحي متكامل.. رؤى طبية متجددة لغدٍ صحي أفضل',
    hero_date: '2026-10-15T09:00',
    hero_bgColor: '#002366',
    hero_description: 'ينطلق المؤتمر العلمي الأول لمشفى حلب الجامعي (AUHMC 2026) ليجمع الأطباء الاختصاصيين، المقيمين، والكوادر التمريضية من مختلف المشافي التعليمية والصحية في سورية، في محفل أكاديمي رائد يهدف إلى تبادل الخبرات، عرض أحدث المستجدات الطبية، وتطوير المهارات السريرية عبر محاضرات وورش عمل تفاعلية.',
    stat_days: '5',
    stat_tracks: '8',
    stat_lectures: '40+',
    stat_participants: '300+',
    theme_primary: '#002366',
    theme_gold: '#D4AF37',
    footer_text: '© 2026 AUHMC — جميع الحقوق محفوظة',
    footer_email: 'info@auhmc2026.sy',
    footer_phone: '+963 21 2XXXXXX'
  },
  tracks: [
    { track_id: 'pediatrics', icon: 'fa-baby', title: 'طب الأطفال وحديثي الولادة', desc: 'المقاربات الحديثة للإنتانات، تدبير الحالات الحرجة، وعناية الخدج.' },
    { track_id: 'surgery', icon: 'fa-scalpel', title: 'الجراحة العامة والتخصصية', desc: 'الطفرات في الجراحة التنظيرية، جراحة الأورام، وتدبير الرضوض المتعددة.' },
    { track_id: 'internal', icon: 'fa-heartbeat', title: 'الأمراض الباطنة', desc: 'مستجدات الاحتشاء القلبي الحاد، الأمراض التنفسية المزمنة، وعلاجات الغدد والصم.' },
    { track_id: 'diagnostic', icon: 'fa-microscope', title: 'الطب التشخيصي المتقدم', desc: 'الرؤى الحديثة في الطب المخبري والتصوير الشعاعي (الأشعة).' },
    { track_id: 'subspecialties', icon: 'fa-eye', title: 'الاختصاصات الدقيقة', desc: 'مستجدات أمراض الجلدية، العينية، وأمراض الأذن والأنف والحنجرة.' },
    { track_id: 'education', icon: 'fa-chalkboard-teacher', title: 'التعليم الطبي المستمر', desc: 'الأساليب الحديثة في التدريب وتقييم المحاضرات السريرية للمقيمين.' },
    { track_id: 'ai', icon: 'fa-robot', title: 'الذكاء الاصطناعي الطبي', desc: 'تطبيقات الـ AI في التشخيص والممارسة الطبية والسريرية.' },
    { track_id: 'quality', icon: 'fa-shield-alt', title: 'الجودة وسلامة المرضى', desc: 'بروتوكولات ضبط العدوى في العنايات المشددة ومعايير سلامة المنشآت.' }
  ],
  schedule: {
    1: [
      { time: '12:00 – 13:30', title: 'الافتتاح الرسمي وكلمات الإدارة + محاضرة آفاق البحث السريري', speaker: 'رئيس المؤتمر', track: 'عام' },
      { time: '13:30 – 14:00', title: 'افتتاح معرض البوسترات العلمي', speaker: '', track: 'عام' },
      { time: '14:00 – 15:30', title: 'تطبيقات الذكاء الاصطناعي وضبط العدوى + محاضرة برعاية شركة دوائية', speaker: '', track: 'الذكاء الاصطناعي الطبي' },
      { time: '15:30 – 17:00', title: 'ورشة: كتابة وقراءة الأبحاث الطبية والطب المسند بالدليل (EBM)', speaker: '', track: 'التعليم الطبي المستمر' }
    ],
    2: [
      { time: '12:00 – 13:30', title: 'الأمراض الإنتانية والمناعية + محاضرة برعاية شركة دوائية', speaker: '', track: 'طب الأطفال وحديثي الولادة' },
      { time: '14:00 – 15:30', title: 'عناية الخدج، القصور التنفسي (Surfactant)، والنزف داخل البطينات (IVH)', speaker: '', track: 'طب الأطفال وحديثي الولادة' },
      { time: '15:30 – 17:00', title: 'ورشة: أساسيات وتطبيقات تخطيط صدى القلب السريري (Echocardiography)', speaker: '', track: 'التعليم الطبي المستمر' }
    ],
    3: [
      { time: '12:00 – 13:30', title: 'احتشاء عضلة القلب والأمراض التنفسية المزمنة + محاضرة برعاية شركة أدوية', speaker: '', track: 'الأمراض الباطنة' },
      { time: '14:00 – 15:30', title: 'تدبير الحالات الإسعافية المعقدة (هضم، كلية، غدد صم)', speaker: '', track: 'الأمراض الباطنة' },
      { time: '15:30 – 17:00', title: 'ورشة: تدبير الطريق الهوائي والإنعاش القلبي الرئوي المتقدم (ACLS)', speaker: '', track: 'التعليم الطبي المستمر' }
    ],
    4: [
      { time: '12:00 – 13:30', title: 'الجراحة التنظيرية، الرضوض المتعددة (Poly-trauma)، وجراحة الأورام', speaker: '', track: 'الجراحة العامة والتخصصية' },
      { time: '14:00 – 15:30', title: 'مستجدات العيادات (جلدية، عينية، أذنية) والطب التشخيصي (مخبر وأشعة)', speaker: '', track: 'الاختصاصات الدقيقة' },
      { time: '15:30 – 17:00', title: 'الختام: إعلان التوصيات وتكريم الأبحاث الفائزة', speaker: '', track: 'عام' }
    ],
    5: [
      { time: '12:00 – 14:00', title: 'الجلسة الختامية: إصدار البيان الختامي الرسمي للمؤتمر', speaker: '', track: 'عام' },
      { time: '14:00 – 15:30', title: 'إدارة المشاريع: تحويل التوصيات العلمية إلى مشاريع تنفيذية وبروتوكولات سريرية معتمدة', speaker: '', track: 'الجودة وسلامة المرضى' }
    ]
  },
  committees: [
    { icon: 'fa-crown', title: 'اللجنة العليا', desc: 'الإشراف العام على المؤتمر والتوجيه الاستراتيجي.' },
    { icon: 'fa-flask', title: 'اللجنة العلمية', desc: 'تقييم الأبحاث والبوسترات واختيار المحاضرات العلمية.' },
    { icon: 'fa-tasks', title: 'اللجنة التنظيمية', desc: 'التنسيق اللوجستي وإدارة الفعاليات والجداول الزمنية.' },
    { icon: 'fa-truck', title: 'اللجنة اللوجستية', desc: 'تجهيز القاعات، المعرض، والمعدات الطبية.' },
    { icon: 'fa-bullhorn', title: 'اللجنة الإعلامية', desc: 'التغطية الإعلامية والتسويق والتواصل مع المشاركين.' },
    { icon: 'fa-hand-holding-heart', title: 'لجنة الرعاية', desc: 'التواصل مع الرعاة والشركاء وتنسيق المعرض الدوائي.' }
  ],
  workshops: [
    { name: 'كتابة وقراءة الأبحاث الطبية (EBM)', capacity: 30 },
    { name: 'تخطيط صدى القلب السريري (Echocardiography)', capacity: 20 },
    { name: 'الإنعاش القلبي الرئوي المتقدم (ACLS)', capacity: 25 }
  ],
  sponsors: [
    { name: 'الراعي الرسمي', tier: 'الراعي الماسي', desc: 'شركة رائدة في المجال الدوائي', logo_url: '' },
    { name: 'الراعي الثاني', tier: 'الراعي الذهبي', desc: 'شركة معدات طبية', logo_url: '' },
    { name: 'الراعي الثالث', tier: 'الراعي الذهبي', desc: 'مختبرات طبية', logo_url: '' },
    { name: 'الراعي الرابع', tier: 'الراعي الفضي', desc: 'شركة تقنية معلومات صحية', logo_url: '' }
  ]
};

function seedDatabase() {
  // content
  if (isEmpty('content')) {
    const insert = dbApi.prepare('INSERT INTO content (key, value) VALUES (?, ?)');
    for (const [k, v] of Object.entries(SEED.content)) {
      insert.run(k, String(v));
    }
    console.log('✅ Seeded content table');
  }

  // tracks
  if (isEmpty('tracks')) {
    const insert = dbApi.prepare('INSERT INTO tracks (track_id, icon, title, desc, sort_order) VALUES (?, ?, ?, ?, ?)');
    SEED.tracks.forEach((t, i) => {
      insert.run(t.track_id, t.icon, t.title, t.desc, i + 1);
    });
    console.log('✅ Seeded tracks table');
  }

  // schedule
  if (isEmpty('schedule')) {
    const insert = dbApi.prepare('INSERT INTO schedule (day, time, title, speaker, track, sort_order) VALUES (?, ?, ?, ?, ?, ?)');
    for (const [day, dayItems] of Object.entries(SEED.schedule)) {
      dayItems.forEach((it, i) => {
        insert.run(parseInt(day), it.time, it.title, it.speaker || '', it.track, i + 1);
      });
    }
    console.log('✅ Seeded schedule table');
  }

  // committees
  if (isEmpty('committees')) {
    const insert = dbApi.prepare('INSERT INTO committees (icon, title, desc, sort_order) VALUES (?, ?, ?, ?)');
    SEED.committees.forEach((c, i) => {
      insert.run(c.icon, c.title, c.desc, i + 1);
    });
    console.log('✅ Seeded committees table');
  }

  // workshops
  if (isEmpty('workshops')) {
    const insert = dbApi.prepare('INSERT INTO workshops (name, capacity, sort_order) VALUES (?, ?, ?)');
    SEED.workshops.forEach((w, i) => {
      insert.run(w.name, w.capacity, i + 1);
    });
    console.log('✅ Seeded workshops table');
  }

  // sponsors
  if (isEmpty('sponsors')) {
    const insert = dbApi.prepare('INSERT INTO sponsors (name, tier, desc, logo_url, sort_order) VALUES (?, ?, ?, ?, ?)');
    SEED.sponsors.forEach((s, i) => {
      insert.run(s.name, s.tier, s.desc || '', s.logo_url || '', i + 1);
    });
    console.log('✅ Seeded sponsors table');
  }
}

// Initialize database on load
initializeDatabase();

module.exports = dbApi;