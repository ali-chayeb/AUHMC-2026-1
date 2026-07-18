// ============================================
// AUHMC 2026 - Central Configuration
// NO .env file needed - everything is here
// ============================================

module.exports = {
  // Server
  PORT: process.env.PORT || 3000,
  
  // JWT Authentication (NEVER changes on restart)
  JWT_SECRET: 'AUHMC_2026_JWT_SECURE_KEY_K9mP2qR5tW8zL3nB6vC0x',
  JWT_EXPIRES_IN: '24h',
  
  // Admin Account (created automatically on first run)
  ADMIN_EMAIL: 'admin@auhmc2026.sy',
  ADMIN_PASSWORD: 'admin2026',
  ADMIN_NAME: 'مدير الموقع',
  
  // MySQL Database (update DB_PASSWORD for production)
  DB_HOST: 'localhost',
  DB_USER: 'auhmc_admin',
  DB_PASSWORD: 'CHANGE_THIS_TO_YOUR_PLESK_PASSWORD',
  DB_NAME: 'auhmc2026',
  DB_CONNECTION_LIMIT: 10,
  
  // File Upload
  UPLOAD_DIR: 'src/frontend/uploads',
  MAX_FILE_SIZE: 10 * 1024 * 1024, // 10MB
  ALLOWED_IMAGE_TYPES: ['image/jpeg', 'image/jpg', 'image/png', 'image/gif', 'image/webp', 'image/svg+xml'],
  ALLOWED_DOC_TYPES: ['application/pdf']
};
