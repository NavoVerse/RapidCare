# RapidCare — How This Project Actually Works

> **Version:** 3.0 — Stable  
> **Written:** May 2026  
> **Purpose:** A complete technical walkthrough of the RapidCare system architecture, data flow, and how every part connects.

---

## Table of Contents

1. [What Is RapidCare?](#1-what-is-rapidcare)
2. [Project Structure Overview](#2-project-structure-overview)
3. [The Backend — The Brain](#3-the-backend--the-brain)
4. [The Database](#4-the-database)
5. [Authentication System](#5-authentication-system)
6. [The Core Trip Lifecycle (The Most Important Flow)](#6-the-core-trip-lifecycle-the-most-important-flow)
7. [Real-Time Communication with Socket.IO](#7-real-time-communication-with-socketio)
8. [AI Integration (Google Gemini)](#8-ai-integration-google-gemini)
9. [Push Notifications (Firebase FCM)](#9-push-notifications-firebase-fcm)
10. [The Frontend (Web Dashboards)](#10-the-frontend-web-dashboards)
11. [RapidCareLite — The Lightweight Version](#11-rapidcarelite--the-lightweight-version)
12. [Medicine Hub](#12-medicine-hub)
13. [Insurance Module](#13-insurance-module)
14. [Payments System](#14-payments-system)
15. [Security Architecture](#15-security-architecture)
16. [Android App](#16-android-app)
17. [Deployment & Environment](#17-deployment--environment)
18. [How All Pieces Connect — End-to-End Flow](#18-how-all-pieces-connect--end-to-end-flow)

---

## 1. What Is RapidCare?

RapidCare is an **emergency ambulance dispatch and healthcare coordination platform**. Think of it as an Uber-for-ambulances, but with hospitals, medical records, insurance, and an AI triage system baked in.

When someone needs an ambulance:
1. **Patient** opens the web app and presses the emergency button.
2. **Backend** runs AI triage on the patient's vitals, then finds the nearest available driver using GPS math.
3. **Driver** gets a real-time alert on their dashboard and accepts/rejects in one tap.
4. **Hospital** is pre-alerted with the patient's blood group and urgency level so the room is ready.
5. After the trip, **insurance** claims are auto-generated and **payment** is recorded.

---

## 2. Project Structure Overview

```
RapidCare/
├── Backend/              ← Single Node.js/Express server (the whole backend)
│   ├── server.js         ← ~2,043-line monolithic backend file (everything is here)
│   ├── db.js             ← Database module (Knex instance + migration runner)
│   ├── knexfile.js       ← Knex DB config: SQLite (dev) / PostgreSQL (prod)
│   ├── config/           ← database.js (Knex config factory)
│   ├── middleware/       ← rbac.js (role guard), validate.js (Zod), rateLimiter.js
│   ├── migrations/       ← 14 incremental schema migration files
│   ├── services/         ← logger.service.js, notification.service.js (email OTP)
│   ├── utils/            ← crypto.js (AES-256 encrypt/decrypt for medical data)
│   ├── routes/           ← payment.js (Razorpay routes)
│   ├── validators/       ← auth.validator.js (Zod schemas for register/login/OTP)
│   ├── seeds/            ← Seed data for development
│   └── user_Database/    ← rapidcare.db (SQLite file, dev only)
│
├── Frontend/             ← Static HTML/CSS/JS pages (served by the backend itself)
│   ├── choose_User/      ← Landing page (served at /)
│   ├── patient_login/    ← Patient login (served at /login)
│   ├── driver_login/     ← Driver login (served at /driver-login)
│   ├── patient_Dashboard/← Patient dashboard (served at /dashboard)
│   ├── driver_dashboard/ ← Driver dashboard (served at /driver)
│   ├── hospital_Dashboard/← Hospital dashboard
│   ├── hospital_registration/ ← 5-step hospital sign-up form
│   ├── driver_registration/   ← 5-step driver sign-up form
│   ├── Insurance_Interface/   ← Patient insurance management
│   ├── excel_dashboard/  ← Admin export tool (served at /admin/export)
│   ├── DeveloperDashboard/    ← Admin panel to view/edit all data (served at /dev)
│   ├── login_urgency/    ← Quick triage login flow
│   └── shared_assets/    ← CSS, JS, fonts, images shared across all pages
│
├── RapidCareLite/        ← Minimalist single-page apps for low-end devices
│   ├── patient/          ← Lite patient view (served at /lite/patient)
│   └── driver/           ← Lite driver view (served at /lite/driver)
│
├── medicine_hub/         ← Standalone medicine e-commerce section (served at /medicine-hub)
│   ├── index.html        ← Full product catalogue + Medula AI chat
│   └── backend/products.json ← Medicine product database (JSON file)
│
├── android_app/          ← Capacitor-wrapped Android app (wraps the web frontend)
│   └── android/          ← Native Android project
│
└── windows_app/          ← Windows desktop app wrapper
```

---

## 3. The Backend — The Brain

### Single File Architecture

The entire backend lives in **one massive file: `Backend/server.js`** (~2,043 lines). It is a Node.js/Express monolithic server that handles:

| Responsibility | How |
|---|---|
| HTTP REST API | Express routes (`app.get`, `app.post`, etc.) |
| Real-time bidirectional events | Socket.IO server |
| Database access | Knex.js query builder |
| Authentication | JWT tokens + bcrypt password hashing |
| AI features | Google Gemini API (`@google/generative-ai`) |
| Push notifications | Firebase Admin SDK (FCM) |
| Email OTP | Nodemailer via SMTP |
| File serving | `express.static` for all frontend pages |
| Encryption | Node.js built-in `crypto` (AES-256-CBC) |

### Server Startup Flow

```
startServer()
  └── initializeDB()          ← runs Knex migrations (creates/updates tables)
      └── server.listen(5000) ← starts listening
```

On startup:
1. Firebase Admin SDK is initialized (looks for `firebase-service-account.json`).
2. The `medicine_hub/backend/products.json` file is loaded into memory as `medicineDb`.
3. All middlewares are registered (CORS, JSON parser, rate limiters, logging).
4. All frontend pages are mounted as static file servers.
5. All API routes are registered.
6. Socket.IO event handlers are attached.
7. Database migrations run — tables are created if missing.

### Everything Runs on Port 5000

The backend serves everything from a single port. Frontend pages are served as static files:

| URL Path | What's Served |
|---|---|
| `/` | `Frontend/choose_User/` — the landing page |
| `/login` | `Frontend/patient_login/` |
| `/driver-login` | `Frontend/driver_login/` |
| `/dashboard` | `Frontend/patient_Dashboard/` |
| `/driver` | `Frontend/driver_dashboard/` |
| `/dev` | `Frontend/DeveloperDashboard/` |
| `/medicine-hub` | `medicine_hub/` |
| `/lite/patient` | `RapidCareLite/patient/` |
| `/lite/driver` | `RapidCareLite/driver/` |

All API calls go to `/api/v1/...` — same origin, no CORS complications.

---

## 4. The Database

### Dual-Database Strategy

| Environment | Database | Location |
|---|---|---|
| Development | SQLite 3 | `Backend/user_Database/rapidcare.db` |
| Production | PostgreSQL | Cloud service (via `DATABASE_URL` env var) |

The same Knex query code runs on both — Knex abstracts the difference.

### Schema (Core Tables)

The schema is built incrementally through **14 migration files**:

```
users             ← Base table: all actors (patients, drivers, hospitals share this)
  id, name, email, password, role (patient|driver|hospital), phone, avatar_url

patients          ← Extended profile for users with role=patient
  user_id → users.id
  blood_group, gender, date_of_birth, height, weight, home_location
  allergies*, chronic_conditions*, own_diagnosis*  ← AES-256 encrypted fields
  chronic_disease*, surgeries*, family_history*    ← AES-256 encrypted fields

drivers           ← Extended profile for users with role=driver
  user_id → users.id
  license_number (UNIQUE), vehicle_number (UNIQUE), vehicle_type
  status (available|busy|offline)
  current_lat, current_lng                         ← GPS updated in real-time
  aadhaar_number, pan_number, dob, address...

hospitals         ← Extended profile for users with role=hospital
  user_id → users.id
  latitude, longitude, total_beds, available_beds
  icu_beds, nicu_beds, ventilators, ot, ambulances
  departments (JSON string), hospital_type, licenses...

trips             ← Every ambulance dispatch event
  patient_id → users.id
  driver_id  → users.id
  hospital_id → users.id
  status: requested → accepted → heading_to_patient → arrived → heading_to_hospital → completed
  pickup_lat, pickup_lng, start_time, end_time, total_fare, payment_status

otps              ← Temporary OTP storage for email/phone login
  email, otp, expires_at (10 min TTL)

medical_records   ← Patient health records (encrypted)
prescriptions     ← Linked to medical records (encrypted)
doctors           ← Doctor registry
appointments      ← Booking system (patient ↔ doctor)
payments          ← Payment records for trips
insurance_policies ← Patient insurance policy storage
insurance_claims   ← Claims generated (manually or auto on trip completion)
```

> **Important:** All sensitive medical text (allergies, diagnosis, etc.) is **encrypted before insertion** and **decrypted on read** using AES-256-CBC via `utils/crypto.js`.

---

## 5. Authentication System

### Two Login Methods

#### Method 1: Password Login
```
POST /api/v1/auth/login
  → bcrypt.compare(password, storedHash)
  → JWT token signed (24h expiry)
  → Returns: { token, user: { id, name, email, role } }
```

#### Method 2: OTP Login (Email or Phone)
```
POST /api/v1/auth/request-otp
  → Generate 6-digit OTP
  → Store in `otps` table (expires in 10 min)
  → Send via email (Nodemailer) or simulate SMS for phone numbers

POST /api/v1/auth/verify-otp
  → Check OTP in DB, verify not expired
  → Delete OTP from DB (one-time use)
  → Return JWT token (same as password login)
```

### Phone Number Trick

Phone numbers are stored in the `users.email` column using a pseudo-email format:
```
10-digit phone → stored as: "9876543210@phone.rapidcare.local"
```
This avoids adding a separate column while maintaining the `UNIQUE email` constraint.

### JWT Token

Every protected API route checks the token using the `authenticateToken` middleware:
```
Authorization: Bearer <jwt_token>
  → jwt.verify(token, JWT_SECRET)
  → Sets req.user = { id, email, role }
```

### Role-Based Access Control (RBAC)

After token verification, the `authorize()` middleware checks the user's role:
```javascript
app.get('/api/v1/patients/me', authenticateToken, authorize('patient'), ...)
// Only users with role='patient' can access this route
```

Roles: `patient`, `driver`, `hospital`, `admin`

---

## 6. The Core Trip Lifecycle (The Most Important Flow)

This is the heart of RapidCare. Here's exactly what happens step by step:

### Step 1: Patient Requests an Ambulance

```
POST /api/v1/trips/request
Body: { pickup_lat, pickup_lng, hospital_id, heart_rate, blood_pressure, spo2, complaint }
Auth: Patient JWT required
```

**What the server does:**
1. **AI Triage** — Sends vitals to Google Gemini AI → gets back `CRITICAL`, `URGENT`, or `STANDARD`.
2. **Find nearest driver** — Queries all drivers with `status = 'available'`, then calculates distance to each using the **Haversine formula** (great-circle distance on a sphere).
3. **Select nearest driver** — The driver with lowest distance is chosen.
4. **Create trip record** — Inserts into `trips` table with `status = 'requested'`.
5. **Notify driver via Socket.IO** — Emits `trip:new_request` event to the driver's private room.
6. **60-second timeout** — If driver doesn't accept within 60 seconds, trip auto-cancels and patient is notified.

```
Response: { trip_id, driver_id }
```

### Step 2: Driver Accepts the Trip

```
POST /api/v1/trips/:id/accept
Auth: Driver JWT required
```

**What the server does:**
1. Validates the trip belongs to this driver and is in `requested` state.
2. Updates trip `status → 'accepted'`.
3. Updates driver `status → 'busy'` (no new trips assigned).
4. Clears the 60-second timeout.
5. Runs **Gemini AI triage again** on patient profile (blood pressure, history).
6. Notifies patient via Socket.IO: `trip:accepted`.
7. Sends **FCM push notification** to patient's phone: "Ambulance Dispatched".
8. Notifies hospital via Socket.IO: `hospital:incoming_alert` with patient blood group, urgency level, and ETA.

### Step 3: Driver Updates Trip Status (Sequential)

```
PUT /api/v1/trips/:id/status
Body: { status: 'heading_to_patient' | 'arrived' | 'heading_to_hospital' | 'completed' }
Auth: Driver JWT required
```

Each status change:
- Updates the `trips` table.
- Emits `trip:status_update` to patient and `hospital:trip_update` to hospital.
- On `arrived`: FCM push to patient — "Driver Arrived".
- On `completed`: FCM push to patient — "Trip Completed", marks driver back as `available`, **auto-generates insurance claim** if patient has active policy.

### Step 4: Driver Streams Location in Real-Time

While a trip is active, drivers continuously emit their GPS coordinates via Socket.IO:

```
Socket event: driver:location_update
Data: { userId, lat, lng }
```

Server:
1. Updates `drivers.current_lat/lng` in the database.
2. Finds all active trips for this driver.
3. Emits `trip:driver_location` to each patient's Socket.IO room.
4. Patient map updates in real-time.

### Trip Status State Machine

```
requested → accepted → heading_to_patient → arrived → heading_to_hospital → at_hospital → completed
                                                     ↘ cancelled (at any point, or by timeout)
```

---

## 7. Real-Time Communication with Socket.IO

All real-time features use Socket.IO with a **room-based model**:

```
Room name pattern: "{role}_{userId}"

Example rooms:
  patient_42       ← Patient with user_id=42 listens here
  driver_7         ← Driver with user_id=7 listens here
  hospital_15      ← Hospital with user_id=15 listens here
```

### How Rooms Work

When a user opens their dashboard, the frontend immediately connects to Socket.IO and joins their private room:
```javascript
socket.emit('join', { userId: 42, role: 'patient' });
// Server: socket.join('patient_42')
```

The backend then pushes events directly to that room — nobody else sees it.

### All Socket.IO Events

| Event | Direction | Meaning |
|---|---|---|
| `join` | Client → Server | User joins their private room |
| `driver:location_update` | Client → Server | Driver sends GPS coordinates |
| `trip:new_request` | Server → Driver | New trip assigned to this driver |
| `trip:accepted` | Server → Patient | Driver accepted the trip |
| `trip:rejected` | Server → Patient | Driver rejected the trip |
| `trip:driver_location` | Server → Patient | Real-time driver GPS |
| `trip:status_update` | Server → Patient | Trip status changed |
| `trip:timeout` | Server → Patient | Trip cancelled (no driver in 60s) |
| `trip:cancelled` | Server → Driver | Trip cancelled |
| `hospital:incoming_alert` | Server → Hospital | New patient incoming |
| `hospital:trip_update` | Server → Hospital | Trip status update |
| `sos:broadcast` | Server → All | SOS alert from any user |

---

## 8. AI Integration (Google Gemini)

The project uses `gemini-1.5-flash` model in three places:

### 1. AI Triage (at trip request + at trip acceptance)

```
Input: heart_rate, blood_pressure, spo2, complaint text
Output: { triage_level: "CRITICAL" | "URGENT" | "STANDARD", rationale: "..." }
Endpoint: POST /api/v1/triage  (standalone)
Also called automatically inside: POST /api/v1/trips/request
Also called at: POST /api/v1/trips/:id/accept
```

Fallback: If Gemini fails or no API key, simple rule-based logic applies:
- `SpO2 < 90` OR `HR > 130/< 45` OR `Systolic BP > 180` → CRITICAL
- `SpO2 < 94` OR `HR >= 110/<= 55` OR `Systolic BP >= 140` → URGENT

### 2. Medula AI — Medicine Chat Assistant

```
Endpoint: POST /api/chat
Model instruction: "You are Medula, a friendly medical assistant for RapidCare."
Input: user's message
Output: Short medical advice / medicine recommendations
```

Available inside the Medicine Hub section of the app.

### 3. Hospital External Details

```
Endpoint: GET /api/v1/hospitals/external-details?name=Apollo
Input: Hospital name string
Output: { address, phone, website, beds, facilities, response_class }
```

Gemini is used to "infer" details about hospitals not registered in the system — useful for the patient's map view when showing nearby non-partner hospitals.

---

## 9. Push Notifications (Firebase FCM)

Firebase Cloud Messaging (FCM) is used for mobile push notifications.

### How It Works

1. When a user opens the app (on Android), the frontend registers the device with Firebase and gets an FCM token.
2. The token is stored server-side in an **in-memory Map** (not persisted):
   ```
   POST /api/v1/users/fcm-token
   Body: { fcm_token }
   → fcmTokens.set(userId, token)
   ```
3. When a trip milestone happens (accepted, arrived, completed), the server calls `sendPushNotification(patientId, title, body)`.
4. The function looks up the patient's FCM token and sends via Firebase Admin SDK.
5. If no FCM token (web user) or Firebase not configured → logs to console as simulation.

---

## 10. The Frontend (Web Dashboards)

All frontend pages are plain **HTML + CSS + Vanilla JavaScript**. No frontend framework (no React, Vue, etc.). Pages are served as static files by the Express backend.

### Key Pages

#### Landing Page (`/`)
- Animated globe, particle canvas, role-selection cards.
- Clicking "Patient" → navigates to `/login`.
- Clicking "Driver" → navigates to `/driver-login`.
- Clicking "Hospital" → navigates to `/hospital-register`.
- Floating Medicine Hub popup opens `/medicine-hub`.

#### Patient Dashboard (`/dashboard`)
- Connects to Socket.IO on load.
- Shows map (using Leaflet.js or Google Maps) with nearest hospitals.
- Has "Request Ambulance" button → calls `POST /api/v1/trips/request`.
- Displays live driver location on map via `trip:driver_location` socket events.
- Shows medical records, prescriptions, insurance, appointments.

#### Driver Dashboard (`/driver`)
- Connects to Socket.IO on load, joins `driver_{userId}` room.
- When `trip:new_request` fires → shows alert card with patient info and triage level.
- Continuously sends GPS via `driver:location_update` events.
- Buttons to update trip status sequentially.

#### Hospital Dashboard
- Joins `hospital_{userId}` Socket.IO room.
- Shows real-time incoming patient alerts via `hospital:incoming_alert`.
- Can update bed availability.
- Views incoming/active trips.

#### Developer Dashboard (`/dev`)
- Password-free admin panel (uses `/api/data` — no auth required currently!).
- Shows all patients, drivers, hospitals in editable table.
- Supports live editing of user records and deletion.

### Authentication Flow in Frontend

1. Login form → `POST /api/v1/auth/login` → receives JWT token.
2. Token stored in `localStorage`.
3. Every subsequent API call includes:
   ```
   Authorization: Bearer <token>
   ```
4. On page load, frontend checks `localStorage` for token — if missing, redirects to `/login`.

---

## 11. RapidCareLite — The Lightweight Version

`RapidCareLite` contains two ultra-minimal single-page applications designed for drivers and patients on slow connections or low-end devices.

### Lite Driver App (`/lite/driver`)

This is the most important one. It is a self-contained SPA (all in `app.js` + HTML) that:
1. Shows a login form.
2. On login → stores JWT in `localStorage` (key: `lite_driver_token`).
3. Connects Socket.IO and joins `driver_{userId}` room.
4. On `trip:new_request` → shows an accept/reject card with patient name, hospital, triage level.
5. On accept → calls `POST /api/v1/trips/:id/accept`.
6. Shows sequential status update buttons: "Arrived at Patient" → "Heading to Hospital" → "Trip Completed".
7. On page refresh, calls `GET /api/v1/drivers/trips` to restore active trip state.

This is the primary interface meant for ambulance drivers in the field.

### Lite Patient App (`/lite/patient`)

Similar minimal interface for patients who just need the core SOS functionality without the full dashboard.

---

## 12. Medicine Hub

The Medicine Hub is a **mini e-commerce platform** for medical supplies, served at `/medicine-hub`.

### How It Works

- Product data lives in `medicine_hub/backend/products.json` (loaded into server memory on startup).
- Frontend calls `GET /api/medicines?category=X&search=Y` → server filters the in-memory array.
- Also has endpoints for kits (`/api/kits`), oxygen (`/api/oxygen`), devices (`/api/devices`), ayurveda (`/api/ayurveda`).
- Order placement: `POST /api/order` → generates a random order ID (no real payment, just a receipt ID).
- **Medula AI chat**: `POST /api/chat` → Google Gemini answers medicine-related questions.

---

## 13. Insurance Module

Patients can register their insurance policies and file claims, either manually or automatically.

### Auto-Claim on Trip Completion

When a driver marks a trip as `completed`:
1. Server checks if patient has an **active** insurance policy.
2. If yes, automatically inserts a row into `insurance_claims` with:
   - Amount: trip's `total_fare` (or ₹500 fallback).
   - Claim type: `Inpatient`.
   - Status: `pending`.
   - Reference: `CLM-{timestamp}`.

### Manual Claim

```
POST /api/v1/insurance/claims
Body: { policy_id, amount, claim_type, hospital_id }
→ Generates CLM-XXXXXXXX reference number
```

---

## 14. Payments System

### Fare Calculation

```
POST /api/v1/payments/calculate
Input: { distance (km), ambulanceType, couponCode }

Formula:
  distanceCharge = distance × rate_per_km
  total = distanceCharge + ₹500 (hospital reservation) + ₹40 (platform)
  
Rates (per km):
  normal:     ₹70/km
  oxygen:     ₹130/km
  icu:        ₹180/km
  ventilator: ₹280/km

Coupons:
  RAPID20    → 20% off total
  FIRSTCARE  → ₹100 flat off
```

### Recording Payment

```
POST /api/v1/payments
Body: { trip_id, amount, payment_method, transaction_id }
→ Inserts into payments table
→ Updates trip: payment_status = 'paid', total_fare = amount
```

### Razorpay Integration

A separate route file `routes/payment.js` handles the Razorpay payment gateway for actual card/UPI payments — mounted at `/api/v1/payments` (layered on top of the basic payments logic).

---

## 15. Security Architecture

### Password Security
- All passwords hashed with **bcrypt (10 salt rounds)** before storage.
- Plaintext passwords never stored or logged.

### Medical Data Encryption
- Sensitive fields (allergies, diagnosis, medical history, etc.) encrypted with **AES-256-CBC** before database insertion.
- IV (initialization vector) is random per encryption, prepended to the ciphertext as hex.
- Format stored in DB: `"<iv_hex>:<encrypted_hex>"`.
- Decrypted transparently on read — frontend always receives plaintext.

### JWT Tokens
- Signed with `JWT_SECRET` env variable (24-hour expiry).
- Passed as `Authorization: Bearer <token>` header.
- Server verifies signature on every protected route.

### Rate Limiting
Three tiers of rate limiters (from `middleware/rateLimiter.js`):
- `generalLimiter` → applied to all `/api/v1/auth` routes.
- `loginLimiter` → extra strict on `POST /api/v1/auth/login`.
- `otpLimiter` → prevents OTP spam on `POST /api/v1/auth/request-otp`.

### Input Validation
The `validate()` middleware uses **Zod schemas** to validate request bodies on auth routes (register, login, OTP request/verify). Invalid data is rejected before reaching the database.

### RBAC
The `authorize()` middleware rejects requests where the JWT role doesn't match what the route requires — e.g., a driver token cannot access patient-only routes.

---

## 16. Android App

The Android app in `android_app/` is a **Capacitor** wrapper — it loads the existing web frontend inside a native Android WebView. This means:

- No separate Android codebase.
- The same HTML/CSS/JS from the web frontend runs inside the app.
- Capacitor provides native bridges: push notifications (FCM), GPS access.
- Built with `npx cap build android` → generates a standard Android Studio project.
- APK is built from the `android/` subfolder using Gradle.

---

## 17. Deployment & Environment

### Environment Variables (`.env` in `Backend/`)

| Variable | Purpose |
|---|---|
| `PORT` | Server port (default: 5000) |
| `JWT_SECRET` | JWT signing key |
| `ENCRYPTION_KEY` | AES-256 key (must be exactly 32 characters) |
| `DB_TYPE` | `sqlite3` (dev) or `postgresql` (prod) |
| `DATABASE_URL` | PostgreSQL connection string (prod) |
| `GEMINI_API_KEY` | Google AI API key |
| `SMTP_HOST/USER/PASS/PORT` | Email OTP sending |
| `CORS_ORIGIN` | Allowed CORS origins for Socket.IO |

### Production Setup

- **Process manager:** PM2 (`ecosystem.config.js` — cluster mode with 2 instances).
- **Reverse proxy:** Nginx (`nginx.conf.template` — proxies port 80 → 5000, handles SSL).
- **Database:** PostgreSQL (Knex migrates on startup automatically).
- **Platform:** Designed for cloud hosting (Render, Railway, etc.) with `Procfile` for Heroku-style deploys.

### Dev Startup

```bash
cd Backend
npm install
npm run dev
# → Server running at http://localhost:5000
```

Or use the convenience script at the root:
```
start_rapidcare.bat  ← Windows batch file that starts the backend
```

---

## 18. How All Pieces Connect — End-to-End Flow

Here is the complete journey of a single emergency, from start to finish:

```
┌─────────────────────────────────────────────────────────────────────────┐
│  PATIENT opens /dashboard                                               │
│  → Frontend connects Socket.IO → joins room "patient_42"               │
│  → Patient fills vitals and presses "Request Ambulance"                 │
│  → Frontend calls POST /api/v1/trips/request                            │
└───────────────────────────┬─────────────────────────────────────────────┘
                            │
                            ▼
┌─────────────────────────────────────────────────────────────────────────┐
│  BACKEND (server.js)                                                    │
│  → Gemini AI evaluates vitals → triage_level = "URGENT"                 │
│  → Haversine math finds Driver #7 is 1.2km away                        │
│  → INSERT into trips: { patient_42, driver_7, hospital_15, 'requested'} │
│  → io.to('driver_7').emit('trip:new_request', { triage, patient, ... }) │
│  → setTimeout(60s) → auto-cancel if no accept                           │
└───────────────────────────┬─────────────────────────────────────────────┘
                            │
                            ▼
┌─────────────────────────────────────────────────────────────────────────┐
│  DRIVER opens /lite/driver (or /driver)                                 │
│  → Frontend connected to Socket.IO room "driver_7"                     │
│  → Receives 'trip:new_request' event → ACCEPT/REJECT card appears      │
│  → Driver taps ACCEPT → POST /api/v1/trips/tripId/accept               │
└───────────────────────────┬─────────────────────────────────────────────┘
                            │
                            ▼
┌─────────────────────────────────────────────────────────────────────────┐
│  BACKEND                                                                │
│  → trips.status → 'accepted', drivers.status → 'busy'                  │
│  → Gemini AI rechecks patient profile → urgency confirmed               │
│  → io.to('patient_42').emit('trip:accepted')                            │
│  → FCM push to patient phone: "Ambulance Dispatched 🚨"                │
│  → io.to('hospital_15').emit('hospital:incoming_alert', {               │
│       patient_name, blood_group: 'O+', urgency: 'URGENT', eta: '8min'  │
│     })                                                                  │
└───────────────────────────┬─────────────────────────────────────────────┘
                            │
              ┌─────────────┴──────────────┐
              ▼                            ▼
┌─────────────────────┐       ┌────────────────────────────┐
│  PATIENT sees map   │       │  HOSPITAL receives alert    │
│  Driver moving live │       │  Prepares ICU bed, blood    │
│  (GPS stream every  │       │  O+, trauma team on standby │
│   few seconds via   │       └────────────────────────────┘
│   Socket.IO)        │
└─────────────────────┘
                            │
                            ▼
         [Driver updates: arrived → heading_to_hospital → completed]
                            │
                            ▼
┌─────────────────────────────────────────────────────────────────────────┐
│  ON COMPLETION                                                          │
│  → drivers.status → 'available' (ready for next trip)                  │
│  → Insurance auto-claim created (if active policy found)               │
│  → Payment recorded via POST /api/v1/payments                          │
│  → FCM push: "Trip Completed. Get well soon! 💚"                       │
└─────────────────────────────────────────────────────────────────────────┘
```

---

## Summary

RapidCare is a **full-stack emergency response platform** where:

- The **backend is a single Express server** handling REST API, Socket.IO, and static file serving — all on port 5000.
- The **database is Knex-managed** with SQLite in dev and PostgreSQL in production, with auto-migration on startup.
- **Authentication** uses bcrypt passwords and/or OTP-via-email, protected by JWT tokens with role-based access.
- **Medical data** is encrypted at rest with AES-256-CBC, transparent to the frontend.
- The **trip lifecycle** is the core feature — Haversine-based nearest-driver matching, AI triage via Gemini, real-time dispatch via Socket.IO rooms, FCM push notifications, and auto insurance claims.
- **All frontends** are plain HTML/CSS/JS, served statically, communicating with the backend over the same origin.
- **RapidCareLite** provides a minimal interface for drivers in the field on limited hardware.
- The **Android app** wraps the web frontend in a Capacitor shell, inheriting all features.
