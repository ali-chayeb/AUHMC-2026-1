module.exports = {
  JWT_SECRET: 'AUHMC_2026_SECURE_KEY_X7k9mP2qR5tW8zL3',
  JWT_EXPIRES_IN: '24h',
  ADMIN_EMAIL: 'admin@auhmc2026.sy',
  ADMIN_PASSWORD: 'admin2026',
  PORT: process.env.PORT || 3000,
  DB_HOST: process.env.DB_HOST || 'localhost',
  DB_USER: process.env.DB_USER || 'auhmc_admin',
  DB_PASSWORD: process.env.DB_PASSWORD || 'test123',
  DB_NAME: process.env.DB_NAME || 'auhmc2026',
  UPLOAD_DIR: 'src/frontend/uploads',
  MAX_FILE_SIZE: 10 * 1024 * 1024,
  ALLOWED_IMAGES: ['image/jpeg', 'image/jpg', 'image/png', 'image/gif', 'image/webp'],
  ALLOWED_DOCS: ['application/pdf']
};
