const mysql = require('mysql2/promise');
const bcrypt = require('bcryptjs');

const pool = mysql.createPool({
  host: process.env.DB_HOST || 'localhost',
  user: process.env.DB_USER || 'auhmc_admin',
  password: process.env.DB_PASSWORD || 'test123',
  database: process.env.DB_NAME || 'auhmc2026',
  waitForConnections: true,
  connectionLimit: 10,
  queueLimit: 0
});

const dbApi = {
  get: async (sql, params = []) => {
    const [rows] = await pool.execute(sql, params);
    return rows[0] || null;
  },
  all: async (sql, params = []) => {
    const [rows] = await pool.execute(sql, params);
    return rows;
  },
  run: async (sql, params = []) => {
    const [result] = await pool.execute(sql, params);
    return { lastInsertRowid: result.insertId, changes: result.affectedRows };
  },
  exec: async (sql) => {
    await pool.execute(sql);
  },
  transaction: (fn) => fn,
  getConnection: async () => await pool.getConnection()
};

async function initializeDatabase() {
  const conn = await pool.getConnection();
  try {
    await conn.execute(`CREATE TABLE IF NOT EXISTS users (id INT AUTO_INCREMENT PRIMARY KEY, email VARCHAR(255) UNIQUE NOT NULL, password VARCHAR(255) NOT NULL, name VARCHAR(255) NOT NULL, created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci`);
    await conn.execute(`CREATE TABLE IF NOT EXISTS registrations (id INT AUTO_INCREMENT PRIMARY KEY, type VARCHAR(50) NOT NULL DEFAULT 'attendance', name VARCHAR(255) NOT NULL, phone VARCHAR(50) NOT NULL, email VARCHAR(255), specialty VARCHAR(255), workplace VARCHAR(255), workshops TEXT, category VARCHAR(100) DEFAULT '', created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP, INDEX idx_type (type)) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci`);
    await conn.execute(`CREATE TABLE IF NOT EXISTS content (id INT AUTO_INCREMENT PRIMARY KEY, \`key\` VARCHAR(100) UNIQUE NOT NULL, value TEXT NOT NULL, updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci`);
    await conn.execute(`CREATE TABLE IF NOT EXISTS tracks (id INT AUTO_INCREMENT PRIMARY KEY, track_id VARCHAR(100) UNIQUE NOT NULL, icon VARCHAR(100) NOT NULL, title VARCHAR(255) NOT NULL, \`desc\` TEXT NOT NULL, sort_order INT DEFAULT 0) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci`);
    await conn.execute(`CREATE TABLE IF NOT EXISTS schedule (id INT AUTO_INCREMENT PRIMARY KEY, day INT NOT NULL, time VARCHAR(100) NOT NULL, title VARCHAR(255) NOT NULL, speaker VARCHAR(255) DEFAULT '', track VARCHAR(255) NOT NULL, sort_order INT DEFAULT 0) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci`);
    await conn.execute(`CREATE TABLE IF NOT EXISTS committees (id INT AUTO_INCREMENT PRIMARY KEY, icon VARCHAR(100) NOT NULL, title VARCHAR(255) NOT NULL, \`desc\` TEXT NOT NULL, sort_order INT DEFAULT 0) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci`);
    await conn.execute(`CREATE TABLE IF NOT EXISTS workshops (id INT AUTO_INCREMENT PRIMARY KEY, name VARCHAR(255) NOT NULL, capacity INT NOT NULL, sort_order INT DEFAULT 0) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci`);
    await conn.execute(`CREATE TABLE IF NOT EXISTS sponsors (id INT AUTO_INCREMENT PRIMARY KEY, name VARCHAR(255) NOT NULL, tier VARCHAR(100) NOT NULL, \`desc\` TEXT DEFAULT '', logo_url VARCHAR(500) DEFAULT '', image VARCHAR(500) DEFAULT '', sort_order INT DEFAULT 0) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci`);
    await conn.execute(`CREATE TABLE IF NOT EXISTS submissions (id INT AUTO_INCREMENT PRIMARY KEY, name VARCHAR(255) NOT NULL, phone VARCHAR(50) NOT NULL, email VARCHAR(255), degree VARCHAR(255) DEFAULT '', affiliation VARCHAR(255) DEFAULT '', title VARCHAR(500) NOT NULL, submission_type VARCHAR(50) NOT NULL DEFAULT 'poster', status VARCHAR(50) NOT NULL DEFAULT 'pending', cv_path VARCHAR(500) DEFAULT '', photo_path VARCHAR(500) DEFAULT '', created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci`);
    await conn.execute(`CREATE TABLE IF NOT EXISTS submission_files (id INT AUTO_INCREMENT PRIMARY KEY, submission_id INT NOT NULL, file_type VARCHAR(50) NOT NULL, file_path VARCHAR(500) NOT NULL, original_name VARCHAR(255) NOT NULL, file_size INT DEFAULT 0, created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP, FOREIGN KEY (submission_id) REFERENCES submissions(id) ON DELETE CASCADE) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci`);
    await conn.execute(`CREATE TABLE IF NOT EXISTS posters (id INT AUTO_INCREMENT PRIMARY KEY, title VARCHAR(255) NOT NULL, researcher_name VARCHAR(255) NOT NULL, specialty VARCHAR(255) DEFAULT '', image_url VARCHAR(500) DEFAULT '', description TEXT DEFAULT '', sort_order INT DEFAULT 0, created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci`);

    const [adminRows] = await conn.execute('SELECT id FROM users WHERE email = ?', ['admin@auhmc2026.sy']);
    if (adminRows.length === 0) {
      const hashedPassword = bcrypt.hashSync('admin2026', 10);
      await conn.execute('INSERT INTO users (email, password, name) VALUES (?, ?, ?)', ['admin@auhmc2026.sy', hashedPassword, 'مدير الموقع']);
      console.log('✅ Default admin created');
    }

    const [contentRows] = await conn.execute('SELECT COUNT(*) as c FROM content');
    if (contentRows[0].c === 0) {
      const seedContent = [
        ['hero_badge', 'المؤتمر العلمي الأول'], ['hero_title', 'مشفى حلب الجامعي'],
        ['hero_subtitle', 'AUH Medical Conference 2026'], ['hero_date', '2026-10-15T09:00'],
        ['hero_bgColor', '#002366'], ['stat_days', '5'], ['stat_tracks', '8'],
        ['stat_lectures', '40+'], ['stat_participants', '300+'],
        ['theme_primary', '#002366'], ['theme_gold', '#D4AF37'],
        ['footer_text', '© 2026 AUHMC — جميع الحقوق محفوظة'],
        ['footer_email', 'info@auhmc2026.sy'], ['footer_phone', '+963 21 2XXXXXX']
      ];
      for (const [k, v] of seedContent) {
        await conn.execute('INSERT INTO content (`key`, value) VALUES (?, ?)', [k, v]);
      }
      console.log('✅ Seeded content');
    }
    console.log('✅ MySQL database initialized');
  } catch (err) {
    console.error('❌ Database init error:', err);
  } finally {
    conn.release();
  }
}

initializeDatabase();
module.exports = dbApi;
