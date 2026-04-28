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

#### Step 3 — Create Web Service    DONE
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

#### Step 4 — Set Environment Variables DONE
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

#### Step 5 — Deploy & Verify   DONE
Click **Create Web Service** — Render builds and deploys automatically. Once live, verify:
- `https://rapidcare-c2jt.onrender.com/health` → health check
- `https://rapidcare-c2jt.onrender.com/` → Choose User page
- `https://rapidcare-c2jt.onrender.com/login` → Patient login
- `https://rapidcare-c2jt.onrender.com/dev` → Developer dashboard

#### Step 6 — Prevent Cold Starts   DONE
Use [UptimeRobot](https://uptimerobot.com) (free) to ping `/health` every 14 minutes to keep the service warm.

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
- [x] OTP email sends (requires valid email credentials)
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

---

## 🗺️ Feature Roadmap

Mapped against the **9-Step Emergency Cycle** and **System Architecture** diagrams.

### Emergency Cycle Coverage

| Step | Feature | Status | Notes |
|------|---------|--------|-------|
| **Step 1** | Patient SOS / Book Ambulance | ✅ **Done** | Frontend UI + `POST /api/v1/trips/request` |
| **Step 2** | Node.js API receives request | ✅ **Done** | Unified Express 5 backend on port 5000 |
| **Step 3** | Gemini AI — Triage & Prioritize | ❌ **Not Started** | No AI integration yet — see Phase 3 below |
| **Step 4** | GPS Search — Nearest Driver Found | ⚠️ **Partial** | Socket.IO tracks drivers, but no auto-dispatch algorithm |
| **Step 5** | OTP Dispatched & Verified | ✅ **Done** | Nodemailer OTP flow + `POST /api/v1/auth/verify-otp` |
| **Step 6** | GPS Tracking — Live Map / Patient ETA | ✅ **Done** | Socket.IO `driver:location_update` → Leaflet.js patient map |
| **Step 7** | Hospital Notified — Pre-ER Ready | ❌ **Not Started** | No hospital notification system yet |
| **Step 8** | Insurance — Claim Auto-Linked | ⚠️ **Partial** | Insurance API exists but not auto-linked to trips on completion |
| **Step 9** | Analytics — Admin Dashboard Updated | ✅ **Done** | `/dev` dashboard + `/api/v1/patients/:id/analytics` |

### Architecture Layer Coverage

| Layer | Component | Status |
|-------|-----------|--------|
| **Frontend** | HTML5/CSS3/Vanilla JS, 5 Portals | ✅ Done |
| **Frontend** | Leaflet.js + OpenStreetMap | ✅ Done |
| **API Gateway** | Node.js + Express.js REST API | ✅ Done |
| **API Gateway** | JWT Authentication + RBAC | ✅ Done |
| **API Gateway** | OTP Service (Dispatch Auth) | ✅ Done |
| **Backend** | Express.js Controllers | ✅ Done |
| **Backend** | WebSocket Real-time (Socket.IO) | ✅ Done |
| **Backend** | Ambulance Dispatch Engine | ⚠️ Partial — manual accept/reject only |
| **Backend** | Business Logic & Triage | ❌ Not Started — no AI scoring |
| **Database** | PostgreSQL via Knex.js | ✅ Done |
| **Database** | Patient Records, Drivers, Hospitals | ✅ Done |
| **Database** | Emergency Logs (trips table) | ✅ Done |
| **AI / Cloud** | Google Gemini AI Triage | ❌ Not Started |
| **AI / Cloud** | Google Cloud Run | ❌ Not Started (deployed on Render instead) |
| **AI / Cloud** | Firebase Integration | ⚠️ Package installed, not configured |
| **AI / Cloud** | Nominatim API (geocoding) | ❌ Not Started |

---

### 🚧 Phase 3 — Intelligent Dispatch (Next Steps)

#### Priority 1 — Nearest Driver Auto-Dispatch
- [ ] Implement Haversine distance formula to find the geographically closest available driver when a trip is requested
- [ ] Auto-assign driver instead of broadcasting to all and waiting for manual accept
- [ ] Endpoint: `POST /api/v1/trips/request` → auto-selects and notifies nearest driver via Socket.IO

#### Priority 2 — Gemini AI Triage Engine
- [ ] Integrate Google Gemini API (`@google/generative-ai`)
- [ ] On trip request, pass patient vitals + urgency category to Gemini for priority scoring
- [ ] Return triage level: `CRITICAL` / `URGENT` / `STANDARD` and factor into driver dispatch priority
- [ ] Endpoint: `POST /api/v1/triage` → returns AI triage assessment

#### Priority 3 — Hospital Pre-ER Notification
- [ ] When a trip is accepted, notify the destination hospital via Socket.IO room `hospital_{id}`
- [ ] Send patient name, blood type, urgency level, and ETA
- [ ] Hospital dashboard shows incoming patient queue in real-time

#### Priority 4 — Insurance Auto-Link on Trip Completion
- [ ] When `PUT /api/v1/trips/:id/status` → `completed`, auto-query patient's active insurance policies
- [ ] Auto-generate a draft insurance claim linked to the trip and total fare
- [ ] Endpoint: `POST /api/v1/insurance/claims/auto` triggered internally on trip completion

#### Priority 5 — Firebase Push Notifications
- [ ] Configure Firebase Admin SDK with a service account key
- [ ] Send push notifications to patient's mobile app when: driver is dispatched, driver arrives, trip is completed
- [ ] Replace SMS simulation with real Firebase Cloud Messaging (FCM) delivery

#### Priority 6 — Nominatim / Google Maps Geocoding
- [ ] Replace manual lat/lng entry with address-to-coordinates lookup
- [ ] Use Nominatim (free) or Google Maps API for forward/reverse geocoding
- [ ] Auto-populate pickup location from patient's home address in profile