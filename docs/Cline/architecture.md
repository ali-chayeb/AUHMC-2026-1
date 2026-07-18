# Architecture

## Files
src/server/config.js - All settings
src/server/database.js - MySQL pool + Proxy
src/server/server.js - Express entry
src/server/middleware/auth.js - JWT
src/server/routes/auth.js - Login
src/server/routes/content.js - Content + registrations
src/frontend/ - DO NOT MODIFY

## API
GET /api/content
POST /api/registrations
POST /api/registrations/submit
POST /api/auth/login
PUT /api/content/bulk (auth)
GET /api/registrations (auth)
