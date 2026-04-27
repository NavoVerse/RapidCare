# RapidCare — Emergency Medical Response System

> A real-time healthcare management and emergency ambulance coordination platform.

---

## ✅ System Status: STABLE

The RapidCare platform has undergone a full architectural stabilization and security hardening. All previously identified technical debt—including duplicate migrations, hardcoded URLs, and static file serving—has been resolved.

- **Unified Backend**: Consolidated into a single Express 5 server.
- **Clean Routing**: Server-side routes replace relative filesystem paths.
- **Production Ready**: Optimized for PostgreSQL, PM2, and Nginx.
- **Full Coverage**: Verified with comprehensive integration tests.

---



---

## 🏗️ Architecture

```
RapidCare/
├── Frontend/                      # All client-side UI modules
│   ├── choose_User/               # Role selection landing page (entry point)
│   ├── patient_login/             # Patient Login / Register / Forgot Password
│   ├── patient_Dashboard/         # Main patient SPA (profile, map, vitals)
│   ├── driver_dashboard/          # Driver-facing interface
│   ├── driver_registration/       # Driver onboarding form
│   ├── hospital_registration/     # Hospital onboarding form
│   ├── Insurance_Interface/       # Insurance management UI
│   ├── DeveloperDashboard/        # Admin data viewer / editor
│   ├── excel_dashboard/           # Admin data export (CSV/Excel)
│   ├── login_urgency/             # Emergency triage categorization
│   └── shared_assets/             # Shared CSS theme + JS config
│       ├── css/theme.css
│       └── js/config.js, theme-manager.js
│
├── Backend/                       # Unified Express.js server (port 5000)
│   ├── server.js                  # All API routes + static serving
│   ├── db.js                      # Knex init + migration runner
│   ├── config/database.js         # Knex connection (SQLite dev / PG prod)
│   ├── knexfile.js                # Knex CLI config
│   ├── migrations/                # 13 database migration files
│   ├── seeds/                     # Core data seeding
│   ├── tests/                     # Jest + Supertest integration tests
│   ├── services/                  # Winston logger, Nodemailer
│   ├── middleware/                # RBAC, rate limiter, Zod validation
│   ├── validators/                # Zod schemas for auth routes
│   └── user_Database/             # SQLite DB file (gitignored)
│
├── index.html                     # Root redirect → role selection
├── start_rapidcare.bat            # Windows launcher script
├── ecosystem.config.js            # PM2 production config
├── nginx.conf.template            # Nginx reverse proxy template
└── README.md
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

**Last Updated**: 2026-04-26 (v3.0.0 — Post-Merge Stabilization)