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

## 🛠️ Driver Interface Backend Integration (TODO)

This section tracks the progress of connecting the newly designed Driver Dashboard to the RapidCare backend infrastructure.

### Phase 1: Authentication & Identity
- [x] **Session Persistence**: Implement JWT validation on dashboard entry.
- [x] **Profile API**: Implement `GET /api/v1/drivers/me` to populate the sidebar and profile cards.
- [ ] **Document Verification**: Fetch status of DL, RC, and Aadhaar for the profile checkmarks.

### Phase 2: Real-Time Coordination
- [x] **Availability Sync**: Link the "LIVE" toggle to the `drivers` table `status` field.
- [x] **Live Tracking**: Implement `driver:location_update` emits via Socket.IO for active ambulance tracking.
- [x] **Incoming Alert**: Socket.IO listener to trigger the "Active Call" overlay for new emergency requests.

### Phase 3: Trip Management
- [ ] **Status Workflow**: Map "Arrived", "Picked Up", and "Hospital Transfer" buttons to `PUT /api/v1/trips/:id/status`.
- [ ] **Dynamic Navigation**: Load coordinates for pickup and hospital drop-off onto the Leaflet map.
- [ ] **Emergency SOS**: Connect the SOS button to a high-priority backend alert system.

### Phase 4: Analytics & Insights
- [ ] **Performance Stats**: Dynamically calculate "Completed Trips" and "Efficiency" for the stat cards.
- [x] **Trip History**: Fetch and render the "Recent Trips" list from the database.
- [ ] **Invoice Generation**: (Bonus) Implement the "Invoices" tab to show billing data for completed trips.

---

## ☁️ Free Deployment Guide

Deploy RapidCare to the internet at **$0/month** using free-tier cloud services.

### Platform Comparison

| Feature | **Render** ⭐ Recommended | **Railway** | **Koyeb** |
|---|---|---|---|
| Free compute | 750 hrs/month (sleeps after inactivity) | $5 credit/month | 1 nano instance (always-on) |
| Free PostgreSQL | ✅ 256 MB (90-day expiry) | ✅ 500 MB (within credit) | ❌ (use external) |
| WebSocket support | ✅ Native | ✅ Native | ✅ Native |
| Custom domain | ✅ Free | ✅ Free | ✅ Free |
| Auto-deploy from GitHub | ✅ | ✅ | ✅ |
| Cold start | ~30–50s | ~5–10s | ~5s (always-on) |

### Pre-Deployment Checklist

Before deploying to any platform, complete these steps:

**1. Generate secrets:**
```bash
# JWT_SECRET (64 random characters)
node -e "console.log(require('crypto').randomBytes(64).toString('hex'))"

# ENCRYPTION_KEY (32 characters for AES-256)
node -e "console.log(require('crypto').randomBytes(16).toString('hex'))"
```

**2. Prepare email credentials** — You need `EMAIL_USER` and `EMAIL_PASS` for OTP delivery. Use a Gmail App Password or a transactional email service.

**3. Verify PostgreSQL compatibility** — The Knex config already supports PG via `DB_TYPE=postgresql`. SQLite **will not work** on cloud platforms (ephemeral filesystems wipe data on each deploy).

### Option A: Deploy on Render (Recommended)

#### Step 1 — Push to GitHub    DONE
```bash
git add -A && git commit -m "Prepare for deployment" && git push origin main
```

#### Step 2 — Create Free PostgreSQL Database   DONE
1. Go to [render.com](https://render.com) → **New** → **PostgreSQL**
2. Name: `rapidcare-db` · Plan: **Free** · Region: closest to your users
3. Click **Create Database**
4. Copy the **Internal Database URL** (`postgres://...`)

#### Step 3 — Create Web Service
1. Go to **New** → **Web Service** → Connect your GitHub repo
2. Configure:

| Setting | Value |
|---|---|
| **Name** | `rapidcare` |
| **Region** | Same as your database |
| **Runtime** | Node |
| **Root Directory** | `Backend` |
| **Build Command** | `npm install` |
| **Start Command** | `node server.js` |
| **Plan** | Free |

#### Step 4 — Set Environment Variables
In the Render dashboard → **Environment** tab:

| Key | Value |
|---|---|
| `PORT` | `10000` |
| `NODE_ENV` | `production` |
| `DB_TYPE` | `postgresql` |
| `DATABASE_URL` | *(Internal DB URL from Step 2)* |
| `JWT_SECRET` | *(your generated secret)* |
| `ENCRYPTION_KEY` | *(your 32-char key)* |
| `EMAIL_USER` | *(your email for OTP)* |
| `EMAIL_PASS` | *(your email app password)* |
| `CORS_ORIGIN` | `https://rapidcare.onrender.com` |

> **Note:** Render assigns port via `PORT` env var — the server reads `process.env.PORT || 5000` automatically.

#### Step 5 — Deploy & Verify
Click **Create Web Service** — Render builds and deploys automatically. Once live, verify:
- `https://rapidcare.onrender.com/health` → health check
- `https://rapidcare.onrender.com/` → Choose User page
- `https://rapidcare.onrender.com/login` → Patient login
- `https://rapidcare.onrender.com/dev` → Developer dashboard

#### Step 6 — Prevent Cold Starts
Use [UptimeRobot](https://uptimerobot.com) (free) to ping `/health` every 14 minutes to keep the service warm.

### Option B: Deploy on Railway

1. Go to [railway.app](https://railway.app) → **New Project** → **Deploy from GitHub**
2. Add a **PostgreSQL** plugin (click **+ New** → **Database** → **PostgreSQL**)
3. Railway auto-injects `DATABASE_URL` — add these env vars:

| Key | Value |
|---|---|
| `DB_TYPE` | `postgresql` |
| `JWT_SECRET` | *(your secret)* |
| `ENCRYPTION_KEY` | *(your key)* |
| `NODE_ENV` | `production` |

4. Set **Root Directory** to `Backend`, **Start Command** to `node server.js`

> ⚠️ Railway's $5/month credit covers ~15–20 days of continuous uptime for one service + database.

### Option C: Deploy on Koyeb

1. Go to [koyeb.com](https://www.koyeb.com) → **Create App** → **GitHub**
2. Set **Root Directory** to `Backend`, **Run command** to `node server.js`
3. Add env vars (same as Render)
4. For the database, use a free external PostgreSQL provider (see below)

> Koyeb's free nano instance is always-on (no cold starts), but you need an external database.

### Free PostgreSQL Providers

If your platform doesn't include a free database, or Render's 90-day limit is a concern:

| Provider | Free Tier | Notes |
|---|---|---|
| [**Neon**](https://neon.tech) | 0.5 GB, serverless, always-on | Best free PG option overall |
| [**Supabase**](https://supabase.com) | 500 MB, 2 free projects | Also includes auth, storage, realtime |
| [**Aiven**](https://aiven.io) | 5 GB, 1 free service | Most generous storage |

### Post-Deployment Verification

- [ ] `GET /health` returns 200
- [ ] User registration via `POST /api/v1/auth/register`
- [ ] Login returns a JWT via `POST /api/v1/auth/login`
- [ ] Patient dashboard loads at `/dashboard`
- [ ] Driver dashboard loads at `/driver`
- [ ] Developer dashboard loads at `/dev`
- [ ] Socket.IO connects (check browser console)
- [ ] OTP email sends (requires valid email credentials)
- [ ] Leaflet.js map tiles load
- [ ] HTTPS works (provided by platform automatically)

### Known Gotchas

| Issue | Solution |
|---|---|
| Cold starts on Render | Use UptimeRobot to ping `/health` every 14 min |
| `bcrypt` native build fails | Switch to `bcryptjs`: `npm uninstall bcrypt && npm install bcryptjs`, then replace `require('bcrypt')` → `require('bcryptjs')` in server.js |
| SQLite data lost on deploy | Cloud filesystems are ephemeral — always use PostgreSQL |
| Render 90-day DB expiry | Set a reminder; recreate DB and update `DATABASE_URL`, or use Neon |
| Socket.IO falls back to polling | All three platforms support WebSocket upgrade natively |

---

**Last Updated**: 2026-04-28 (v3.2.0 — Free Deployment Guide & Pre-Deploy Hardening)