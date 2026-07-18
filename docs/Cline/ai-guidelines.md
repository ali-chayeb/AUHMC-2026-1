# AI Development Guidelines - AUHMC 2026

## CRITICAL RULES

### 1. NO .env FILES
- ALL configuration is in src/server/config.js
- Never create or reference .env files
- JWT_SECRET is hardcoded in config.js

### 2. MySQL ONLY - NO SQLite
- Database: MySQL/MariaDB via mysql2/promise
- Never install better-sqlite3 or node:sqlite

### 3. NO TRANSACTION WRAPPERS
- Use direct async/await, not db.transaction()

### 4. DATABASE API
const db = require('../database');
await db.get(sql, [params]);  // single row
await db.all(sql, [params]);  // all rows
await db.run(sql, [params]);  // insert/update/delete
await db.exec(sql);           // create table

### 5. AUTHENTICATION
const { authenticateToken } = require('../middleware/auth');
router.get('/route', authenticateToken, async (req, res) => { });

### 6. DEFAULT ADMIN
Email: admin@auhmc2026.sy
Password: admin2026

### 7. TECH STACK
Backend: Express + MySQL (mysql2/promise) + JWT + multer
Frontend: Vanilla JavaScript SPA
