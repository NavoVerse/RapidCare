# RapidCare — Emergency Medical Response System

> A real-time healthcare management and emergency ambulance coordination platform.

---

## 🚨 Current Issues

### ⚠️ Remaining Issues / Technical Debt

| # | Issue | Severity | Details |
|---|-------|----------|---------|
| 1 | **Duplicate payment migration files** | 🟡 Medium | Two migrations create the `payments` table: `009_create_payments_table.js` (detailed with fare breakdown) and `20260426131803_create_payments_table.js` (simpler). The `hasTable` guard in `009_` prevents a crash, but the second migration will fail on a fresh database since the table already exists. One should be deleted. |
| 2 | **Duplicate logger files** | 🟢 Low | Logger exists in both `utils/logger.js` and `services/logger.service.js`. Server imports from `services/`. The `utils/` copy is dead code and should be removed. |
| 3 | **Hardcoded API URLs** | 🟡 Medium | All frontend modules use `http://localhost:5000` directly. This means the app cannot be deployed to any other host without a find-and-replace across every `script.js`. Should extract into a shared `API_BASE` constant. |
| 4 | **No `.env` file in git** | 🟢 Low (by design) | `.env` is correctly gitignored. But `.env.example` only exists in `Backend/`. The `start_rapidcare.bat` handles this by auto-creating a default `.env`, but a new developer cloning the repo won't know to set `SMTP_*` variables for email OTP. |
| 5 | **3 remaining `console.error` calls** | 🟢 Low | Lines 945, 1264, 1278 in `server.js` still use `console.error` instead of `logger.error`. These bypass Winston's file rotation. |
| 6 | **`knexfile.js` uses `sqlite3` client but `better-sqlite3` is also installed** | 🟢 Low | Both packages are in `package.json`. Knex is configured to use the `sqlite3` driver. The `better-sqlite3` package is unused dead weight (~7MB). |
| 7 | **Frontend modules are static HTML files** | 🟡 Medium | All frontend modules (`patient_Dashboard`, `rapid_Care_Login`, etc.) are opened as `file://` in the browser. This means cookies, CORS, and service workers may behave unexpectedly. Consider serving them through Express or using a bundler like Vite. |

---

## 🏗️ Architecture

```
RapidCare/
├── Backend/                    # Unified Express.js server (port 5000)
│   ├── server.js               # ~1400-line monolith — all routes
│   ├── db.js                   # Knex init + migration runner
│   ├── config/database.js      # Knex connection config (SQLite dev / PG prod)
│   ├── knexfile.js             # Knex CLI config
│   ├── migrations/             # 13 database migration files
│   ├── services/
│   │   ├── logger.service.js   # Winston logger (daily rotation)
│   │   └── notification.service.js  # Nodemailer OTP emails
│   ├── middleware/
│   │   ├── rbac.js             # Role-based access control
│   │   ├── rateLimiter.js      # Express rate limiting
│   │   └── validate.js         # Zod schema validation
│   ├── validators/             # Zod schemas for auth routes
│   └── user_Database/          # SQLite DB file (gitignored)
│
├── rapid_Care_Login/           # Login / Register / Forgot Password UI
├── patient_Dashboard/          # Main patient SPA (profile, map, vitals, history)
├── DeveloperDashboard/         # Admin data viewer / editor
├── choose_User/                # Role selection landing page (entry point)
├── driver_dashboard/           # Driver-facing interface
├── driver_registration/        # Driver onboarding
├── hospital_registration/      # Hospital onboarding
├── Insurance_Interface/        # Insurance management UI
├── excel_dashboard/            # Admin data export (CSV/Excel)
├── login_urgency/              # Emergency triage categorization
├── shared_assets/              # Shared CSS theme + JS theme manager
│
├── start_rapidcare.bat         # Windows launcher script
├── backendRoadMap.md           # Development roadmap (all phases DONE)
└── README.md                   # ← You are here
```

---

## 🚀 Quick Start

### Prerequisites
- **Node.js** v18+ (tested on v24.14.1)
- **npm** v9+

### Option 1: Double-click launcher (Windows)
```
start_rapidcare.bat
```
This will:
1. Check Node.js is installed
2. Kill any process on port 5000
3. Install npm dependencies if missing
4. Run database migrations
5. Start the backend server
6. Open the app in your default browser

### Option 2: Manual start
```bash
cd Backend
npm install            # First time only
npx knex migrate:latest  # Sync database schema
node server.js         # Start on port 5000
```
Then open `choose_User/index.html` in your browser.

### Endpoints (once running)
| URL | Description |
|-----|-------------|
| `http://localhost:5000/health` | Health check |
| `http://localhost:5000/dev` | Developer Dashboard |
| `http://localhost:5000/api/v1/auth/register` | User registration |
| `http://localhost:5000/api/v1/auth/login` | User login |
| `http://localhost:5000/api/v1/patients/me` | Patient profile (auth required) |

---

## 🛠️ Technology Stack

| Layer | Technology |
|-------|-----------|
| **Runtime** | Node.js + Express 5 |
| **Database** | SQLite 3 (dev) / PostgreSQL (prod) via Knex.js |
| **Auth** | JWT + bcrypt + OTP (Nodemailer) |
| **Real-Time** | Socket.IO (WebSocket) |
| **Logging** | Winston + Daily Rotate File |
| **Validation** | Zod schemas |
| **Security** | RBAC middleware, rate limiting, AES-256 field encryption |
| **Frontend** | Vanilla JS (ES6+), HTML5, CSS3, Leaflet.js (maps) |

---

## 📋 What Needs to Happen Next

### Priority 1: Cleanup (30 min)
- [x] Delete `Backend/migrations/20260426131803_create_payments_table.js` (duplicate)
- [x] Delete `Backend/utils/logger.js` (dead code; `services/logger.service.js` is used)
- [x] Remove `better-sqlite3` and `sqlite` from `package.json` (unused)
- [x] Replace 3 remaining `console.error` calls with `logger.error`

### Priority 2: Frontend Serving (1-2 hours)
- [x] Serve all frontend modules through Express static middleware instead of `file://`
- [x] Extract `http://localhost:5000` into a shared `config.js` or environment variable
- [x] Add a top-level `index.html` redirect to `choose_User/index.html`

### Priority 3: Testing (2-3 hours)
- [ ] Write integration tests for the 5 core auth endpoints
- [ ] Write integration tests for the trip lifecycle (request → accept → complete)
- [ ] Test fresh-database startup (delete `rapidcare.db`, run migrations, seed, verify)

### Priority 4: Deployment (2-4 hours)
- [ ] Configure `DB_TYPE=postgresql` and `DATABASE_URL` for production
- [ ] Set up PM2 with `ecosystem.config.js` (already exists)
- [ ] Deploy behind Nginx using `nginx.conf.template` (already exists)
- [ ] Set `NODE_ENV=production` to disable console logging and debug mode

---

**Last Updated**: 2026-04-26 (v3.0.0 — Post-Merge Stabilization)