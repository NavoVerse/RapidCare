# RapidCare — Backend Architecture Document

> **Version**: 1.0.0  
> **Date**: 2026-04-20  
> **Scope**: Full backend architecture proposal based on a complete codebase audit of all 13 frontend modules, 2 existing Node.js servers, 1 SQLite database, and 3 backend service scripts.

---

## Table of Contents

1. [Executive Summary](#1-executive-summary)
2. [Current State Audit](#2-current-state-audit)
3. [Identified Gaps & Problems](#3-identified-gaps--problems)
4. [Proposed Architecture Overview](#4-proposed-architecture-overview)
5. [Technology Stack Recommendation](#5-technology-stack-recommendation)
6. [Unified Server Design](#6-unified-server-design)
7. [Database Schema Evolution](#7-database-schema-evolution)
8. [Complete API Reference](#8-complete-api-reference)
9. [Real-Time Layer (WebSocket)](#9-real-time-layer-websocket)
10. [Authentication & Security](#10-authentication--security)
11. [Third-Party Integrations](#11-third-party-integrations)
12. [Deployment Architecture](#12-deployment-architecture)
13. [Phased Implementation Plan](#13-phased-implementation-plan)
---

## 1. Executive Summary

RapidCare is an emergency medical response platform with a rich frontend spanning 13 independent HTML/CSS/JS modules. Currently, only **2 of 13 modules** are connected to a real backend — the login page (`rapid_Care_Login`) and the developer dashboard (`DeveloperDashboard`). The remaining 11 modules either use **hardcoded mock data**, **localStorage simulation**, or **no data layer at all**.

This document proposes a **unified, modular Node.js + Express backend** that consolidates the two existing servers, introduces a real-time WebSocket layer for live emergency coordination, and provides RESTful APIs for every frontend module — all while preserving the existing SQLite-based foundation with a clear migration path to PostgreSQL for production.

---

## 2. Current State Audit

### 2.1 Existing Backend Components

| Component | Location | Port | Status |
|---|---|---|---|
| **Auth Server** | `Backend/user_Registration_Login_System/server.js` | 5000 | ✅ Functional |
| **Dev Dashboard Server** | `DeveloperDashboard/server.js` | 3000 | ✅ Functional |
| **SQLite Database** | `Backend/user_Database/rapidcare.db` | — | ✅ Has data |
| **DB Schema** | `Backend/user_Database/schema.sql` | — | ✅ Defined |
| **DB Manager (Simulated)** | `Backend/user_Database/db_manager.js` | — | ⚠️ Fake (uses localStorage) |
| **Map API Service** | `Backend/map_Integration/map_api.js` | — | ⚠️ Browser-only, no server |
| **Location Service** | `Backend/user_Location_Auto_Detection/location_service.js` | — | ⚠️ Browser-only, no server |
| **Hospital Data (Static JSON)** | `Backend/map_Integration/hospital_locations.json` | — | ⚠️ Static file, not API-driven |

### 2.2 Auth Server Capabilities (Port 5000)

The existing auth server is the most mature backend component. It provides:

| Endpoint | Method | Description | Auth Required |
|---|---|---|---|
| `/api/auth/register` | POST | User registration with bcrypt hashing | No |
| `/api/auth/login` | POST | Email/password login, returns JWT | No |
| `/api/auth/request-otp` | POST | Generates 6-digit OTP (console-logged) | No |
| `/api/auth/verify-otp` | POST | Validates OTP and returns JWT | No |
| `/api/auth/profile` | GET | Returns user profile | Yes (JWT) |

**Dependencies**: Express 5.2.1, bcrypt 6.0, jsonwebtoken 9.0.3, sqlite/sqlite3, cors, dotenv, axios.

### 2.3 Dev Dashboard Server Capabilities (Port 3000)

A simple read-only inspection server:

| Endpoint | Method | Description |
|---|---|---|
| `/api/data` | GET | Returns all patients, drivers, hospitals from SQLite |

**Dependencies**: Express 5.2.1, sqlite/sqlite3, cors.

### 2.4 Database Schema (Current)

```
users           → Core: id, name, email, password(hashed), role, phone, avatar_url, created_at
patients        → Extension: user_id(FK), blood_group, medical_history, emergency_contact
drivers         → Extension: user_id(FK), license_number, vehicle_number, vehicle_type, status, current_lat/lng, rating
hospitals       → Extension: user_id(FK), address, city, total_beds, available_beds, latitude, longitude, specialty
trips           → Logs: patient_id, driver_id, hospital_id, status, pickup_lat/lng, start/end_time, total_fare, payment_status
otps            → Temporary: email, otp, expires_at
```

### 2.5 Frontend Module Connectivity Audit

| Module | Backend Connection | Data Source |
|---|---|---|
| `choose_User` | ❌ None | Static HTML, theme in localStorage |
| `rapid_Care_Login` | ✅ **Real API** (`localhost:5000`) | `/api/auth/register`, `/api/auth/login` |
| `login_urgency` | ❌ None | Simulates OTP locally, hardcoded symptoms |
| `patient_Dashboard` | ⚠️ Partial | Uses `MapAPI` (browser fetch of JSON), `LocationService` (browser Geolocation), `DBManager` (localStorage) |
| `driver_registration` | ❌ None | Multi-step form with `alert()` on submit, no data sent |
| `hospital_registration` | ❌ None | Multi-step form with no submit handler |
| `payment_User` | ❌ None | Fully simulated: fare calculation in JS, localStorage loyalty counter |
| `history_patient` | ❌ None | 4 hardcoded `medicalRecords` objects + 2 hardcoded `doctorBookings` |
| `Insurance_Interface` | ❌ None | Accordion UI with client-side-only scheme management |
| `analytics_interface` | ❌ None | Simulated vital signs with manual input modal |
| `excel_dashboard` | ❌ None | Reads from `mockData.js` (hardcoded hospitals, drivers, patients) |
| `DeveloperDashboard` | ✅ **Real API** (`localhost:3000`) | `/api/data` → live SQLite queries |

### 2.6 Startup Process

The `start_rapidcare.bat` script starts:
1. Auth Backend on port 5000
2. Developer Dashboard on port 3000
3. Opens `choose_User/index.html` in the default browser

---

## 3. Identified Gaps & Problems

### 🔴 Critical Gaps

| # | Gap | Impact |
|---|---|---|
| 1 | **No real-time coordination** between patient, driver, and hospital | The core value proposition of an emergency system is broken |
| 2 | **Driver/Hospital registration forms don't save data** | New drivers and hospitals cannot onboard |
| 3 | **Ambulance booking is a JavaScript `alert()`** | No trip is created, no driver is notified, no hospital is alerted |
| 4 | **Payment is fully simulated** | No actual transaction processing or fare recording |
| 5 | **Medical history is hardcoded** | Patient records cannot be created, updated, or retrieved |
| 6 | **OTP is console-logged only** | No email/SMS delivery — unusable in any deployment |

### 🟡 Architectural Issues

| # | Issue | Detail |
|---|---|---|
| 7 | **Two separate Express servers** accessing the same SQLite file | Risk of write conflicts and race conditions |
| 8 | **Backend services run in the browser** | `map_api.js`, `location_service.js`, `db_manager.js` are loaded as `<script>` tags — they're not server-side |
| 9 | **No API gateway or route versioning** | Direct fetch to `localhost:PORT` — no `/api/v1/` structure |
| 10 | **Hospital data is a static JSON file** | Hospitals can't update their own bed counts or status |
| 11 | **No role-based access control beyond login** | The JWT contains `role` but no middleware enforces it on protected routes |
| 12 | **No input validation or sanitization library** | SQL injection risk for raw queries |
| 13 | **JWT secret is hardcoded in `.env`** — committed to Git | Security vulnerability |

### 🟢 Missing Features (from roadMapText.md)

- Real-time WebSocket layer (patient ↔ driver ↔ hospital)
- Live driver job queue and turn-by-turn navigation
- Hospital intake dashboard with incoming patient alerts
- Bed availability tracking integrated with hospital admin
- Pre-filled medical profiles auto-sent on dispatch
- 60-second driver acceptance timeout with fallback escalation
- Encrypted medical data (HIPAA/DISHA compliance)
- Auto-generated insurance claims from trip records
- Analytics tied to real trip/patient data

---

## 4. Proposed Architecture Overview

### 4.1 High-Level Architecture Diagram

```
┌──────────────────────────────────────────────────────────────────────┐
│                        CLIENT LAYER (Browser)                        │
│                                                                      │
│  ┌───────────┐ ┌────────────┐ ┌──────────────┐ ┌──────────────────┐  │
│  │  Login /  │ │  Patient   │ │   Driver     │ │   Hospital       │  │
│  │  Signup   │ │  Dashboard │ │   Dashboard  │ │   Dashboard      │  │
│  └─────┬─────┘ └──────┬─────┘ └───────┬──────┘ └────────┬─────────┘  │
│        │              │               │                 │            │
│        │         ┌────┴───────────────┴─────────────────┘            │
│        │         │    WebSocket (Socket.IO)                          │
│        │         │    REST API (fetch → /api/v1/...)                 │
└────────┼─────────┼───────────────────────────────────────────────────┘
         │         │
═════════╪═════════╪════════════════════════════════════════════════════
         │         │
┌────────┴─────────┴───────────────────────────────────────────────────┐
│                     UNIFIED BACKEND SERVER                           │
│                     (Node.js + Express + Socket.IO)                  │
│                     Port: 5000                                       │
│                                                                      │
│  ┌─────────────────────────────────────────────────────────────────┐ │
│  │                     MIDDLEWARE PIPELINE                         │ │
│  │  CORS → Rate Limiter → JSON Parser → Auth (JWT) → RBAC          │ │
│  └─────────────────────────────────────────────────────────────────┘ │
│                                                                      │
│  ┌──────────┐ ┌──────────┐ ┌──────────┐ ┌──────────┐ ┌───────────┐   │
│  │  Auth    │ │  Trip    │ │ Hospital │ │ Payment  │ │  Medical  │   │
│  │  Router  │ │  Router  │ │  Router  │ │  Router  │ │  Router   │   │
│  └────┬─────┘ └─────┬────┘ └─────┬────┘ └──────┬───┘ └──────┬────┘   │
│       │             │            │             │            │        │
│  ┌────┴─────────────┴────────────┴─────────────┴────────────┴──────┐ │
│  │                    SERVICE LAYER                                │ │
│  │  AuthService │ TripService │ HospitalService │ PaymentService   │ │
│  │  DriverService │ PatientService │ NotificationService           │ │
│  └────────────────────────┬────────────────────────────────────────┘ │
│                           │                                          │
│  ┌────────────────────────┴────────────────────────────────────────┐ │
│  │                    DATA ACCESS LAYER                            │ │
│  │  SQLite (Dev) ──migrate──→ PostgreSQL (Prod)                    │ │
│  │  ORM: better-sqlite3 (sync) or Knex.js (query builder)          │ │
│  └─────────────────────────────────────────────────────────────────┘ │
│                                                                      │
│  ┌─────────────────────────────────────────────────────────────────┐ │
│  │                 REAL-TIME ENGINE (Socket.IO)                    │ │
│  │  Rooms: trip:{id}, driver:{id}, hospital:{id}, admin            │ │
│  │  Events: trip:requested, trip:accepted, driver:location,        │ │
│  │          hospital:alert, trip:status_update, trip:completed     │ │
│  └─────────────────────────────────────────────────────────────────┘ │
└──────────────────────────────────────────────────────────────────────┘
         │
         ├── External: OpenStreetMap Nominatim (Geocoding)
         ├── External: OSRM (Routing / ETA)
         ├── External: Nodemailer / Twilio (OTP delivery)
         └── External: Razorpay / Stripe (Payments) [Future]
```

### 4.2 Core Design Principles

1. **Unified Server** — Merge the two existing Express servers into one on port 5000
2. **Modular Routers** — Each domain (auth, trips, hospitals, medical, payments) gets its own Express Router
3. **Service Layer** — Business logic separated from route handlers for testability
4. **Real-Time First** — Socket.IO integrated from day one for the patient-driver-hospital triad
5. **Progressive Enhancement** — SQLite for dev, PostgreSQL for production, same query interface via Knex.js
6. **Role-Based Access** — Middleware enforces `patient`, `driver`, `hospital`, `admin` permissions per route

---

## 5. Technology Stack Recommendation

### 5.1 Backend Core

| Layer | Technology | Justification |
|---|---|---|
| **Runtime** | Node.js 20 LTS | Already used; async I/O suits real-time emergency dispatch |
| **Framework** | Express 5.x | Already in use; mature, extensible |
| **Real-Time** | Socket.IO 4.x | Best Node.js WebSocket lib with room management, reconnection, and fallback polling |
| **Database (Dev)** | SQLite 3 via `better-sqlite3` | Already in use; zero-config, perfect for local dev |
| **Database (Prod)** | PostgreSQL 16 | ACID-compliant, supports concurrent writes, GIS extensions (PostGIS) for location queries |
| **Query Builder** | Knex.js | Database-agnostic queries; same code runs on SQLite and PostgreSQL |
| **Auth** | jsonwebtoken + bcrypt | Already in use; industry standard |
| **Validation** | Joi or Zod | Schema-based request validation to replace raw `if (!field)` checks |
| **OTP Delivery** | Nodemailer (email) + Twilio (SMS) | Replace console.log OTP with real delivery |
| **Rate Limiting** | express-rate-limit | Prevent abuse of OTP and auth endpoints |
| **Logging** | Winston or Pino | Structured logging for production debugging |

### 5.2 External APIs (Already Used in Frontend — Formalize on Backend)

| Service | Current Usage | Backend Role |
|---|---|---|
| **OpenStreetMap Nominatim** | `patient_Dashboard` calls it directly | Proxy through backend to add caching and rate-limit compliance |
| **OSRM Routing** | `patient_Dashboard` calls it for route polylines | Proxy through backend; cache frequent hospital routes |
| **Leaflet.js** | Frontend map rendering | No backend involvement needed (stays client-side) |

---

## 6. Unified Server Design

### 6.1 Proposed File Structure

```
Backend/
├── server.js                    # Entry point — Express + Socket.IO init
├── .env                         # Environment variables (gitignored)
├── package.json
│
├── config/
│   ├── database.js              # Knex config for SQLite/PostgreSQL
│   └── socket.js                # Socket.IO event handlers
│
├── middleware/
│   ├── auth.js                  # JWT verification middleware
│   ├── rbac.js                  # Role-based access control
│   ├── validate.js              # Request validation wrapper
│   └── rateLimiter.js           # Rate limiting config
│
├── routes/
│   ├── auth.routes.js           # /api/v1/auth/*  (login, register, OTP)
│   ├── patient.routes.js        # /api/v1/patients/*
│   ├── driver.routes.js         # /api/v1/drivers/*
│   ├── hospital.routes.js       # /api/v1/hospitals/*
│   ├── trip.routes.js           # /api/v1/trips/*
│   ├── medical.routes.js        # /api/v1/medical/*  (records, prescriptions)
│   ├── payment.routes.js        # /api/v1/payments/*
│   ├── insurance.routes.js      # /api/v1/insurance/*
│   ├── analytics.routes.js      # /api/v1/analytics/*
│   └── admin.routes.js          # /api/v1/admin/*  (dev dashboard data)
│
├── services/
│   ├── auth.service.js          # Registration, login, OTP logic
│   ├── trip.service.js          # Trip lifecycle (request → dispatch → complete)
│   ├── driver.service.js        # Driver matching, availability, location
│   ├── hospital.service.js      # Hospital data, bed tracking, status
│   ├── patient.service.js       # Patient profiles, medical records
│   ├── payment.service.js       # Fare calculation, transaction records
│   ├── notification.service.js  # OTP email/SMS, push notifications
│   └── geocoding.service.js     # Nominatim proxy with caching
│
├── models/                      # Knex query functions per table
│   ├── user.model.js
│   ├── patient.model.js
│   ├── driver.model.js
│   ├── hospital.model.js
│   ├── trip.model.js
│   ├── medical.model.js
│   └── payment.model.js
│
├── validators/                  # Joi/Zod schemas
│   ├── auth.validator.js
│   ├── trip.validator.js
│   └── hospital.validator.js
│
├── migrations/                  # Knex migration files
│   ├── 001_initial_schema.js
│   ├── 002_add_medical_records.js
│   ├── 003_add_payments_table.js
│   └── 004_add_insurance_table.js
│
├── seeds/                       # Seed data for development
│   └── dev_seed.js
│
└── user_Database/               # (Existing) SQLite file location
    ├── rapidcare.db
    └── schema.sql               # Legacy — replaced by Knex migrations
```

### 6.2 Server Entry Point Design

```javascript
// Backend/server.js — Conceptual outline

const express = require('express');
const { createServer } = require('http');
const { Server } = require('socket.io');
const cors = require('cors');
const rateLimit = require('express-rate-limit');
require('dotenv').config();

const app = express();
const httpServer = createServer(app);
const io = new Server(httpServer, {
    cors: { origin: '*', methods: ['GET', 'POST'] }
});

// ── Global Middleware ──
app.use(cors());
app.use(express.json());
app.use(rateLimit({ windowMs: 15 * 60 * 1000, max: 100 }));

// ── API Routes (versioned) ──
app.use('/api/v1/auth',      require('./routes/auth.routes'));
app.use('/api/v1/patients',   require('./routes/patient.routes'));
app.use('/api/v1/drivers',    require('./routes/driver.routes'));
app.use('/api/v1/hospitals',  require('./routes/hospital.routes'));
app.use('/api/v1/trips',      require('./routes/trip.routes'));
app.use('/api/v1/medical',    require('./routes/medical.routes'));
app.use('/api/v1/payments',   require('./routes/payment.routes'));
app.use('/api/v1/insurance',  require('./routes/insurance.routes'));
app.use('/api/v1/analytics',  require('./routes/analytics.routes'));
app.use('/api/v1/admin',      require('./routes/admin.routes'));

// ── Static serving for Dev Dashboard ──
app.use('/dev', express.static('../DeveloperDashboard'));

// ── Socket.IO Events ──
require('./config/socket')(io);

// ── Start ──
const PORT = process.env.PORT || 5000;
httpServer.listen(PORT, () => {
    console.log(`RapidCare Backend running on http://localhost:${PORT}`);
});
```

---

## 7. Database Schema Evolution

### 7.1 Tables to KEEP (from current `schema.sql`)

| Table | Changes |
|---|---|
| `users` | Add: `last_known_lat`, `last_known_lng`, `last_known_address`, `is_verified`, `updated_at` |
| `patients` | Add: `allergies`, `current_medications`, `insurance_id` |
| `drivers` | Add: `aadhaar_number`, `training_certification`, `is_verified`, `total_trips`, `updated_at` |
| `hospitals` | Add: `icu_beds`, `ambulance_count`, `emergency_phone`, `is_verified`, `updated_at` |
| `trips` | Add: `otp`, `symptoms`, `vehicle_type`, `urgency_level`, `accepted_at`, `arrived_at`, `notes` |
| `otps` | No changes needed |

### 7.2 Tables to ADD

```sql
-- MEDICAL RECORDS (replaces hardcoded medicalRecords array in history_patient)
CREATE TABLE IF NOT EXISTS medical_records (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    patient_id INTEGER NOT NULL,
    date DATE NOT NULL,
    type TEXT CHECK(type IN ('general','cardiology','lab','surgery','emergency')) NOT NULL,
    title TEXT NOT NULL,
    doctor_name TEXT,
    hospital_name TEXT,
    status TEXT DEFAULT 'completed',
    vitals_bp TEXT,
    vitals_hr TEXT,
    vitals_temp TEXT,
    vitals_weight TEXT,
    diagnosis TEXT,
    notes TEXT,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (patient_id) REFERENCES users(id) ON DELETE CASCADE
);

-- PRESCRIPTIONS (linked to medical records)
CREATE TABLE IF NOT EXISTS prescriptions (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    record_id INTEGER NOT NULL,
    medicine_name TEXT NOT NULL,
    dosage TEXT,
    frequency TEXT,
    purpose TEXT,
    FOREIGN KEY (record_id) REFERENCES medical_records(id) ON DELETE CASCADE
);

-- DOCTOR BOOKINGS (replaces hardcoded doctorBookings array)
CREATE TABLE IF NOT EXISTS bookings (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    patient_id INTEGER NOT NULL,
    doctor_name TEXT NOT NULL,
    specialty TEXT,
    date DATE NOT NULL,
    time TEXT NOT NULL,
    hospital_name TEXT,
    type TEXT DEFAULT 'Checkup',
    status TEXT DEFAULT 'upcoming',
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (patient_id) REFERENCES users(id) ON DELETE CASCADE
);

-- PAYMENTS (replaces client-side simulation in payment_User)
CREATE TABLE IF NOT EXISTS payments (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    trip_id INTEGER NOT NULL,
    patient_id INTEGER NOT NULL,
    base_fare REAL NOT NULL,
    equipment_charge REAL DEFAULT 0,
    platform_charge REAL DEFAULT 0,
    discount_amount REAL DEFAULT 0,
    discount_type TEXT,
    donation_amount REAL DEFAULT 0,
    total_amount REAL NOT NULL,
    payment_method TEXT CHECK(payment_method IN ('card','upi','cash')) NOT NULL,
    transaction_id TEXT UNIQUE,
    status TEXT DEFAULT 'pending',
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (trip_id) REFERENCES trips(id),
    FOREIGN KEY (patient_id) REFERENCES users(id)
);

-- INSURANCE POLICIES (replaces client-side-only Insurance_Interface)
CREATE TABLE IF NOT EXISTS insurance_policies (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    patient_id INTEGER NOT NULL,
    scheme_name TEXT NOT NULL,
    scheme_type TEXT CHECK(scheme_type IN ('state','central','mediclaim','private')) NOT NULL,
    description TEXT,
    portal_link TEXT,
    status TEXT DEFAULT 'linked',
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (patient_id) REFERENCES users(id) ON DELETE CASCADE
);

-- INSURANCE CLAIMS (auto-generated from trips, as suggested in roadmap)
CREATE TABLE IF NOT EXISTS insurance_claims (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    policy_id INTEGER NOT NULL,
    trip_id INTEGER NOT NULL,
    claim_amount REAL,
    status TEXT DEFAULT 'submitted',
    submitted_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    resolved_at TIMESTAMP,
    FOREIGN KEY (policy_id) REFERENCES insurance_policies(id),
    FOREIGN KEY (trip_id) REFERENCES trips(id)
);

-- DRIVER LOCATION HISTORY (for real-time tracking analytics)
CREATE TABLE IF NOT EXISTS driver_locations (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    driver_id INTEGER NOT NULL,
    lat REAL NOT NULL,
    lng REAL NOT NULL,
    recorded_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (driver_id) REFERENCES users(id)
);

-- NOTIFICATIONS LOG
CREATE TABLE IF NOT EXISTS notifications (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    user_id INTEGER NOT NULL,
    type TEXT NOT NULL,
    title TEXT NOT NULL,
    body TEXT,
    is_read INTEGER DEFAULT 0,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE
);
```

### 7.3 Complete Entity Relationship Map

```
users (1) ─────┬──── (1) patients
               ├──── (1) drivers
               ├──── (1) hospitals
               ├──── (N) trips (as patient_id)
               ├──── (N) trips (as driver_id)
               ├──── (N) medical_records
               ├──── (N) bookings
               ├──── (N) payments
               ├──── (N) insurance_policies
               ├──── (N) notifications
               └──── (N) driver_locations

trips (1) ──────┬──── (1) payments
                └──── (N) insurance_claims

medical_records (1) ── (N) prescriptions

insurance_policies (1) ── (N) insurance_claims
```

---

## 8. Complete API Reference

### 8.1 Authentication — `/api/v1/auth`

| Endpoint | Method | Body | Response | Auth |
|---|---|---|---|---|
| `/register` | POST | `{ name, email, password, role, phone }` | `{ userId, message }` | No |
| `/login` | POST | `{ email, password }` | `{ token, user }` | No |
| `/request-otp` | POST | `{ email }` | `{ message }` | No |
| `/verify-otp` | POST | `{ email, otp }` | `{ token, user }` | No |
| `/profile` | GET | — | `{ id, name, email, role, phone, ... }` | JWT |
| `/profile` | PUT | `{ name, phone, avatar_url }` | `{ updated: true }` | JWT |
| `/change-password` | POST | `{ oldPassword, newPassword }` | `{ message }` | JWT |

### 8.2 Patients — `/api/v1/patients`

| Endpoint | Method | Description | Auth |
|---|---|---|---|
| `/me` | GET | Get current patient profile with medical details | JWT (patient) |
| `/me` | PUT | Update patient profile (blood_group, allergies, emergency_contact) | JWT (patient) |
| `/me/location` | PUT | Update current lat/lng/address | JWT (patient) |
| `/me/medical-records` | GET | Get all medical records for this patient | JWT (patient) |
| `/me/bookings` | GET | Get upcoming doctor bookings | JWT (patient) |
| `/me/bookings` | POST | Create a new doctor booking | JWT (patient) |
| `/me/bookings/:id` | DELETE | Cancel a booking | JWT (patient) |
| `/me/trip-history` | GET | Get all past trips | JWT (patient) |

### 8.3 Drivers — `/api/v1/drivers`

| Endpoint | Method | Description | Auth |
|---|---|---|---|
| `/register` | POST | Submit full driver registration (personal + vehicle + training) | JWT (driver) |
| `/me` | GET | Get driver profile | JWT (driver) |
| `/me` | PUT | Update driver profile | JWT (driver) |
| `/me/status` | PUT | Toggle: `available` / `busy` / `offline` | JWT (driver) |
| `/me/location` | PUT | Update current GPS (called every 5-10 seconds during trip) | JWT (driver) |
| `/me/trips` | GET | Get assigned/completed trips | JWT (driver) |
| `/me/trips/active` | GET | Get currently active trip | JWT (driver) |
| `/nearby` | GET | Find available drivers near `?lat=&lng=&radius=` | JWT (system) |

### 8.4 Hospitals — `/api/v1/hospitals`

| Endpoint | Method | Description | Auth |
|---|---|---|---|
| `/register` | POST | Submit hospital registration (identity + compliance + infra) | JWT (hospital) |
| `/` | GET | List all hospitals (with optional `?lat=&lng=` for proximity sort) | Public |
| `/:id` | GET | Get single hospital details | Public |
| `/me` | PUT | Update hospital info (beds, status, specialty) | JWT (hospital) |
| `/me/beds` | PUT | Update bed availability: `{ total_beds, available_beds, icu_beds }` | JWT (hospital) |
| `/me/incoming` | GET | Get incoming patient alerts for this hospital | JWT (hospital) |

### 8.5 Trips — `/api/v1/trips`

| Endpoint | Method | Description | Auth |
|---|---|---|---|
| `/request` | POST | Patient requests emergency dispatch | JWT (patient) |
| `/:id` | GET | Get trip details | JWT |
| `/:id/accept` | POST | Driver accepts a trip | JWT (driver) |
| `/:id/status` | PUT | Update trip status (heading_to_patient → arrived → heading_to_hospital → completed) | JWT (driver) |
| `/:id/cancel` | POST | Cancel a trip | JWT |
| `/:id/rate` | POST | Patient rates a completed trip | JWT (patient) |

**Trip Request Body:**
```json
{
    "pickup_lat": 22.5726,
    "pickup_lng": 88.3639,
    "hospital_id": 3,
    "symptoms": ["Chest pain or pressure", "Shortness of Breath"],
    "urgency_level": "critical",
    "vehicle_type": "ICU"
}
```

**Trip Lifecycle (WebSocket Events):**
```
Patient requests → Server finds nearest driver → driver:trip_offered
Driver accepts   → trip:accepted → Patient notified → Hospital alerted
Driver moves     → driver:location_update (every 5s) → Patient sees live marker
Driver arrives   → trip:status_update (arrived)
At hospital      → trip:status_update (heading_to_hospital)
Dropped off      → trip:completed → Payment triggered
```

### 8.6 Payments — `/api/v1/payments`

| Endpoint | Method | Description | Auth |
|---|---|---|---|
| `/calculate` | POST | Calculate fare for a trip `{ distance_km, vehicle_type, discounts[] }` | JWT |
| `/` | POST | Record a payment | JWT (patient) |
| `/:id` | GET | Get payment details | JWT |
| `/me` | GET | Get patient's payment history | JWT (patient) |
| `/loyalty` | GET | Get cash ride loyalty status | JWT (patient) |

### 8.7 Medical Records — `/api/v1/medical`

| Endpoint | Method | Description | Auth |
|---|---|---|---|
| `/records` | GET | Get patient's medical records | JWT (patient) |
| `/records` | POST | Create a new record (from hospital after visit) | JWT (hospital) |
| `/records/:id` | GET | Get single record with prescriptions | JWT |
| `/records/:id/prescriptions` | POST | Add prescription to record | JWT (hospital) |

### 8.8 Insurance — `/api/v1/insurance`

| Endpoint | Method | Description | Auth |
|---|---|---|---|
| `/policies` | GET | Get patient's insurance policies | JWT (patient) |
| `/policies` | POST | Link a new insurance policy | JWT (patient) |
| `/policies/:id` | DELETE | Unlink a policy | JWT (patient) |
| `/claims` | GET | Get patient's insurance claims | JWT (patient) |
| `/claims` | POST | Submit an insurance claim for a trip | JWT (patient) |

### 8.9 Analytics — `/api/v1/analytics`

| Endpoint | Method | Description | Auth |
|---|---|---|---|
| `/patient/vitals` | GET | Get patient vitals history | JWT (patient) |
| `/dashboard` | GET | Get system-wide stats (total trips, avg response time, etc.) | JWT (admin) |
| `/hospital/:id/stats` | GET | Hospital performance metrics | JWT (hospital/admin) |

### 8.10 Admin — `/api/v1/admin`

| Endpoint | Method | Description | Auth |
|---|---|---|---|
| `/data` | GET | Full data dump (replaces current Dev Dashboard `/api/data`) | JWT (admin) |
| `/users` | GET | List all users with filters | JWT (admin) |
| `/users/:id/verify` | POST | Verify a driver or hospital | JWT (admin) |
| `/trips` | GET | All trips with filters | JWT (admin) |
| `/export/:entity` | GET | Export data as JSON (replaces `excel_dashboard` mockData) | JWT (admin) |

---

## 9. Real-Time Layer (WebSocket)

### 9.1 Socket.IO Room Architecture

```
Rooms:
  ├── trip:{tripId}          → Patient + Driver + Hospital for an active trip
  ├── driver:{driverId}      → Individual driver channel for new trip offers
  ├── hospital:{hospitalId}  → Individual hospital channel for incoming alerts
  ├── patient:{patientId}    → Individual patient for notifications
  └── admin                  → System-wide monitoring
```

### 9.2 Event Reference

| Event Name | Direction | Payload | Description |
|---|---|---|---|
| `trip:requested` | Server → Driver(s) | `{ tripId, pickup, symptoms, vehicle_type }` | Sent to nearest available drivers |
| `trip:accepted` | Server → Patient, Hospital | `{ tripId, driver, eta }` | Driver accepted the trip |
| `trip:rejected` | Driver → Server | `{ tripId, reason }` | Driver declined; server escalates to next |
| `trip:status_update` | Server → Room | `{ tripId, status, timestamp }` | Status changed (en_route, arrived, etc.) |
| `driver:location` | Driver → Server | `{ tripId, lat, lng }` | Driver GPS update during trip |
| `driver:location_broadcast` | Server → Patient | `{ lat, lng, heading }` | Forwarded to patient for live tracking |
| `hospital:incoming_alert` | Server → Hospital | `{ tripId, patient, symptoms, eta }` | New patient en route notification |
| `hospital:beds_updated` | Hospital → Server | `{ available_beds, icu_beds }` | Live bed count update |
| `trip:completed` | Server → Room | `{ tripId, fare, duration }` | Trip finished, payment flow triggered |
| `notification` | Server → User | `{ type, title, body }` | Generic push notification |

### 9.3 Driver Matching Algorithm

```
1. Patient requests a trip → Server extracts pickup coordinates
2. Query: SELECT all drivers WHERE status = 'available' 
          AND distance(current_lat, current_lng, pickup_lat, pickup_lng) < 10 km
          ORDER BY distance ASC
3. Send trip:requested to nearest driver
4. Start 60-second acceptance timer
5. If no response → escalate to next nearest driver
6. If no drivers within 10 km → expand radius to 20 km
7. If still no drivers → alert:no_driver_available → patient + admin
```

---

## 10. Authentication & Security

### 10.1 JWT Token Structure

```json
{
    "id": 42,
    "email": "patient@rapidcare.com",
    "role": "patient",
    "iat": 1713600000,
    "exp": 1713686400
}
```

### 10.2 Role-Based Access Control Middleware

```javascript
// middleware/rbac.js
const authorize = (...allowedRoles) => {
    return (req, res, next) => {
        if (!req.user || !allowedRoles.includes(req.user.role)) {
            return res.status(403).json({ error: 'Forbidden: insufficient permissions' });
        }
        next();
    };
};

// Usage in routes:
router.put('/me/beds', authenticate, authorize('hospital'), updateBeds);
router.post('/request', authenticate, authorize('patient'), requestTrip);
router.get('/data', authenticate, authorize('admin'), getAdminData);
```

### 10.3 Security Checklist

| Area | Requirement | Implementation |
|---|---|---|
| **Passwords** | bcrypt with salt rounds ≥ 10 | ✅ Already in place (rounds = 10) |
| **JWT Secret** | Strong, random, from environment variable | ⚠️ Currently `super_secret_rapidcare_key_2026` — **must change** |
| **HTTPS** | Enforce in production | Add via reverse proxy (Nginx / Caddy) |
| **Input Validation** | Validate all incoming payloads | Use Joi/Zod schemas on every route |
| **SQL Injection** | Parameterized queries only | ✅ Current code uses `?` placeholders — maintain this |
| **Rate Limiting** | OTP: 3 req/min, Login: 5 req/min, General: 100 req/15min | Add `express-rate-limit` per-route |
| **Medical Data** | Encrypt sensitive fields at rest | AES-256 encryption for diagnosis, medical_history |
| **CORS** | Restrict to known origins in production | Currently `cors()` with no restrictions — tighten |
| **`.env` file** | Never commit to Git | Add to `.gitignore` immediately |

---

## 11. Third-Party Integrations

### 11.1 OTP Delivery (Replace Console Log)

```javascript
// services/notification.service.js

// Email via Nodemailer (free for dev with Gmail/Ethereal)
const nodemailer = require('nodemailer');
const transporter = nodemailer.createTransport({
    service: 'gmail',
    auth: {
        user: process.env.EMAIL_USER,
        pass: process.env.EMAIL_APP_PASSWORD
    }
});

async function sendOTP(email, otp) {
    await transporter.sendMail({
        from: '"RapidCare" <noreply@rapidcare.com>',
        to: email,
        subject: 'Your RapidCare Verification Code',
        html: `<h2>Your OTP: <strong>${otp}</strong></h2><p>Valid for 10 minutes.</p>`
    });
}

// SMS via Twilio (paid, for production)
// const twilio = require('twilio');
// async function sendSMS(phone, otp) { ... }
```

### 11.2 Geocoding Proxy (Cache Nominatim Results)

```javascript
// services/geocoding.service.js
const cache = new Map(); // In production: use Redis

async function reverseGeocode(lat, lng) {
    const key = `${lat.toFixed(4)},${lng.toFixed(4)}`;
    if (cache.has(key)) return cache.get(key);

    const response = await fetch(
        `https://nominatim.openstreetmap.org/reverse?format=json&lat=${lat}&lon=${lng}&zoom=10`
    );
    const data = await response.json();
    const address = data.display_name || `${lat}, ${lng}`;
    
    cache.set(key, address);
    return address;
}
```

### 11.3 Fare Calculation (From payment_User Logic)

```javascript
// services/payment.service.js — Formalize the existing client-side fare logic

function calculateFare({ distance_km, vehicle_type, discounts = [] }) {
    const RATE_PER_KM = 70;           // Discounted from 100 (as per payment_User)
    const EQUIPMENT_CHARGE = 100;
    const PLATFORM_CHARGE = 40;

    let baseFare = distance_km * RATE_PER_KM;
    let equipmentCharge = EQUIPMENT_CHARGE;
    let platformCharge = PLATFORM_CHARGE;

    // Vehicle type multiplier
    const multipliers = {
        'General (AC/Non-AC)': 1.0,
        'Oxygen Support': 1.15,
        'ICU': 1.5,
        'Ventilation Support': 1.75
    };
    baseFare *= (multipliers[vehicle_type] || 1.0);

    // Apply discounts
    if (discounts.includes('platform_free')) platformCharge = 0;
    
    let subtotal = baseFare + equipmentCharge + platformCharge;
    
    let bankDiscount = 0;
    if (discounts.includes('hdfc_5')) bankDiscount = subtotal * 0.05;
    if (discounts.includes('sbi_6')) bankDiscount = subtotal * 0.06;

    const total = Math.round(subtotal - bankDiscount);

    return {
        base_fare: Math.round(baseFare),
        equipment_charge: equipmentCharge,
        platform_charge: platformCharge,
        discount_amount: Math.round(bankDiscount),
        total_amount: total
    };
}
```

---

## 12. Deployment Architecture

### 12.1 Development (Current)

```
Local Machine (Windows)
├── start_rapidcare.bat
│   ├── node Backend/server.js          → Port 5000 (unified)
│   └── open choose_User/index.html     → File protocol
└── SQLite: Backend/user_Database/rapidcare.db
```

### 12.2 Production (Recommended)

```
Cloud Provider (Railway / Render / AWS EC2)
│
├── Nginx Reverse Proxy (HTTPS termination)
│   ├── /                → Static frontend (serve from /var/www/rapidcare)
│   ├── /api/v1/*        → Proxy to Node.js :5000
│   └── /socket.io/*     → WebSocket upgrade to Node.js :5000
│
├── Node.js Backend (PM2 process manager)
│   └── Port 5000: Express + Socket.IO
│
├── PostgreSQL Database
│   └── Managed: Supabase / Neon / AWS RDS
│
└── Redis (optional, for Socket.IO scaling + geocoding cache)
```

### 12.3 Environment Variables (Production `.env`)

```env
# Server
PORT=5000
NODE_ENV=production

# Database
DB_TYPE=postgresql
DATABASE_URL=postgresql://user:pass@host:5432/rapidcare

# Auth
JWT_SECRET=<random-256-bit-hex-string>
JWT_EXPIRY=24h

# OTP
EMAIL_USER=noreply@rapidcare.com
EMAIL_APP_PASSWORD=xxxxxxxxxx
TWILIO_SID=ACxxxxx
TWILIO_TOKEN=xxxxxxx
TWILIO_PHONE=+1234567890

# External APIs
NOMINATIM_BASE_URL=https://nominatim.openstreetmap.org
OSRM_BASE_URL=https://router.project-osrm.org

# Payments (future)
RAZORPAY_KEY_ID=rzp_xxxxxxxxxx
RAZORPAY_KEY_SECRET=xxxxxxxxxxxxxxx
```

---

## 13. Phased Implementation Plan

### Phase 1: Foundation Consolidation (Week 1-2)

> **Goal**: Merge servers, formalize structure, keep everything working.

| Task | Priority | Effort |
|---|---|---|
DONE | Merge Auth Server + Dev Dashboard into single `Backend/server.js` | 🔴 High | 2 hours |
DONE | Set up Knex.js with SQLite adapter | 🔴 High | 2 hours |
DONE | Convert `schema.sql` into Knex migration files | 🔴 High | 3 hours |
| Add Joi/Zod validation on existing auth routes | 🟡 Medium | 2 hours |
| Add RBAC middleware (`authorize('patient')`, etc.) | 🟡 Medium | 2 hours |
| Add `express-rate-limit` to auth endpoints | 🟡 Medium | 1 hour |
| Move `.env` to `.gitignore`, rotate JWT secret | 🔴 High | 30 minutes |
DONE | Update `start_rapidcare.bat` to start single server | 🟡 Medium | 30 minutes |
DONE | Update `rapid_Care_Login/script.js` to use `/api/v1/auth` | 🟡 Medium | 30 minutes |
DONE | Update `DeveloperDashboard` to call unified server | 🟡 Medium | 30 minutes |

**Deliverable**: Single server on port 5000 with all existing functionality preserved.

---

### Phase 2: Registration & Data Persistence (Week 2-3)

> **Goal**: Make driver and hospital registration forms actually save data.

| Task | Priority | Effort |
|---|---|---|
| Build `POST /api/v1/drivers/register` — save all 5 steps of driver form | 🔴 High | 3 hours |
| Build `POST /api/v1/hospitals/register` — save all 5 steps of hospital form | 🔴 High | 3 hours |
| Connect `driver_registration/script.js` submit to backend API | 🔴 High | 2 hours |
| Connect `hospital_registration/script.js` submit to backend API | 🔴 High | 2 hours |
| Build `GET/PUT /api/v1/patients/me` — patient profile CRUD | 🟡 Medium | 2 hours |
| Connect `patient_Dashboard` Details view edit forms to API | 🟡 Medium | 3 hours |
| Implement real OTP delivery via Nodemailer | 🟡 Medium | 2 hours |
| Connect `login_urgency` OTP flow to `/api/v1/auth/request-otp` and `/verify-otp` | 🟡 Medium | 2 hours |

**Deliverable**: All registration forms persist data; OTPs delivered via email.

---

### Phase 3: Trip Lifecycle & Real-Time (Week 3-5)

> **Goal**: Build the core emergency dispatch system with Socket.IO.

| Task | Priority | Effort |
|---|---|---|
| Add Socket.IO to unified server | 🔴 High | 2 hours |
| Build `POST /api/v1/trips/request` — create trip + find nearest driver | 🔴 High | 4 hours |
| Implement driver matching algorithm with proximity search | 🔴 High | 4 hours |
| Build trip acceptance / rejection flow with 60s timeout | 🔴 High | 4 hours |
| Implement `driver:location` WebSocket events for live tracking | 🔴 High | 3 hours |
| Connect `patient_Dashboard` booking buttons to real trip API | 🔴 High | 3 hours |
| Replace `patient_Dashboard` simulated ambulance tracking with live WebSocket data | 🔴 High | 4 hours |
| Build `hospital:incoming_alert` WebSocket event | 🟡 Medium | 2 hours |
| Build trip status progression (en_route → arrived → at_hospital → completed) | 🟡 Medium | 3 hours |

**Deliverable**: Patients can book, drivers receive live requests, hospitals get alerts, live tracking works.

---

### Phase 4: Medical Records & Payments (Week 5-7)

> **Goal**: Digitize medical history and payment processing.

| Task | Priority | Effort |
|---|---|---|
| Create `medical_records` + `prescriptions` tables via migration | 🔴 High | 1 hour |
| Build CRUD APIs for medical records | 🔴 High | 3 hours |
| Replace hardcoded data in `history_patient/script.js` with API calls | 🔴 High | 3 hours |
| Create `payments` table via migration | 🔴 High | 1 hour |
| Build fare calculation API (`/api/v1/payments/calculate`) | 🔴 High | 2 hours |
| Build payment recording API | 🟡 Medium | 2 hours |
| Connect `payment_User/script.js` to payment APIs | 🟡 Medium | 3 hours |
| Build doctor booking APIs | 🟡 Medium | 2 hours |
| Connect booking modal in `history_patient` to API | 🟡 Medium | 2 hours |

**Deliverable**: Medical records and payments stored in DB; history page shows real data.

---

### Phase 5: Insurance, Analytics & Admin (Week 7-9)

> **Goal**: Complete the remaining modules.

| Task | Priority | Effort |
|---|---|---|
| Create `insurance_policies` + `insurance_claims` tables | 🟡 Medium | 1 hour |
| Build insurance CRUD APIs | 🟡 Medium | 3 hours |
| Connect `Insurance_Interface` to backend | 🟡 Medium | 3 hours |
| Build analytics APIs with real trip data aggregation | 🟡 Medium | 4 hours |
| Connect `analytics_interface` to real data instead of simulation | 🟡 Medium | 3 hours |
| Build admin export API to replace `excel_dashboard/mockData.js` | 🟡 Medium | 2 hours |
| Connect `excel_dashboard` to live data from `/api/v1/admin/export` | 🟡 Medium | 2 hours |
| Build hospital-facing dashboard APIs (bed management, incoming patients) | 🟡 Medium | 4 hours |

**Deliverable**: All 13 frontend modules connected to real backend APIs.

---

### Phase 6: Production Hardening (Week 9-10)

> **Goal**: Make it deployable and secure.

| Task | Priority | Effort |
|---|---|---|
| Migrate from SQLite to PostgreSQL via Knex | 🔴 High | 4 hours |
| Add Winston structured logging | 🟡 Medium | 2 hours |
| Add comprehensive error handling middleware | 🟡 Medium | 2 hours |
| Encrypt medical data fields (AES-256) | 🟡 Medium | 3 hours |
| Set up PM2 process manager | 🟡 Medium | 1 hour |
| Configure Nginx reverse proxy with HTTPS | 🟡 Medium | 2 hours |
| Write deployment docs | 🟢 Low | 2 hours |
| Write API documentation (Swagger/OpenAPI) | 🟢 Low | 4 hours |

**Deliverable**: Production-ready backend with encrypted data, logging, and HTTPS.

---

## Summary

| Metric | Current State | After Full Implementation |
|---|---|---|
| **Backend Servers** | 2 separate Express apps | 1 unified server |
| **Connected Frontend Modules** | 2 / 13 (15%) | 13 / 13 (100%) |
| **REST API Endpoints** | 6 | ~50+ |
| **Database Tables** | 6 | 14 |
| **Real-Time Events** | 0 | 12+ WebSocket events |
| **Data Persistence** | Partial (auth only) | Full (all user actions) |
| **OTP Delivery** | Console log | Email + SMS |
| **Payment Processing** | Client-side `alert()` | Server-side with transaction IDs |
| **Security** | Basic JWT | JWT + RBAC + Rate Limiting + Encryption |

---

> **The single highest-impact improvement** is Phase 3 (Trip Lifecycle & Real-Time) — it transforms RapidCare from a collection of static UI mockups into a functional emergency coordination system. Every other feature depends on this real-time backbone.
