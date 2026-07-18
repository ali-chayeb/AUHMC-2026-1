# AI Guidelines - AUHMC 2026

## RULES
1. MySQL ONLY (mysql2/promise). NO SQLite.
2. NO .env files. Config in src/server/config.js
3. NO transactions. Use async/await directly.
4. Database API: db.get(), db.all(), db.run(), db.exec() - ALL async
5. NEVER modify src/frontend/ files
6. Response messages in Arabic
7. Default admin: admin@auhmc2026.sy / admin2026
8. Plesk: App Root=/httpdocs, Doc Root=/httpdocs/src/frontend, Startup=src/server/server.js
