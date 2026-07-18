# AUHMC 2026 - Architecture

## File Structure
src/server/
  config.js          - All settings (JWT, DB, upload)
  database.js        - MySQL pool + table creation
  server.js          - Express app entry
  middleware/auth.js  - JWT middleware
  routes/auth.js     - Login, verify, change password
  routes/content.js  - Content, registrations, uploads

src/frontend/
  index.html         - Main site
  admin.html         - Admin panel
  app.js             - Main site JS
  admin.js           - Admin panel JS
  styles.css         - Main site CSS
  admin-styles.css   - Admin CSS
  uploads/           - Uploaded files

## API Endpoints
Public:
  GET  /api/content
  POST /api/registrations
  POST /api/registrations/submit
  POST /api/auth/login

Admin (JWT required):
  PUT    /api/content/bulk
  GET    /api/registrations
  GET    /api/registrations/submissions
  GET    /api/registrations/stats
  PATCH  /api/registrations/submissions/:id/status
  DELETE /api/registrations/:id
  DELETE /api/registrations/submissions/:id
  POST   /api/upload
