# RapidCare — Complete API Reference

> Every API **defined** in the backend and every API **called** from frontend files, with exact file names, line numbers, and what they do.

---

## Table of Contents

1. [Backend API Definitions](#1-backend-api-definitions-backendserverjs)
   - [Auth Routes](#auth-routes)
   - [Patient Routes](#patient-routes)
   - [Driver Routes](#driver-routes)
   - [Hospital Routes](#hospital-routes)
   - [Trip & Dispatch Routes](#trip--dispatch-routes)
   - [Medical Records Routes](#medical-records-routes)
   - [Payments Routes](#payments-routes)
   - [Insurance Routes](#insurance-routes)
   - [Doctors & Appointments Routes](#doctors--appointments-routes)
   - [Medicine Hub Routes](#medicine-hub-routes)
   - [Admin & Developer Dashboard Routes](#admin--developer-dashboard-routes)
   - [Analytics Routes](#analytics-routes)
   - [Razorpay Payment Routes](#razorpay-payment-routes-backendRoutespaymentjs)
   - [Utility Routes](#utility-routes)
2. [Frontend API Calls](#2-frontend-api-calls)
   - [Patient Login Page](#patient-login-page)
   - [Driver Login Page](#driver-login-page)
   - [Patient Dashboard](#patient-dashboard)
   - [Driver Dashboard](#driver-dashboard)
   - [Driver Registration](#driver-registration)
   - [Hospital Registration](#hospital-registration)
   - [Insurance Interface](#insurance-interface)
   - [Excel / Admin Export Dashboard](#excel--admin-export-dashboard)
   - [Developer Dashboard](#developer-dashboard)
   - [Login Urgency (Quick OTP Flow)](#login-urgency-quick-otp-flow)
3. [RapidCareLite API Calls](#3-rapidcarelite-api-calls)
   - [Lite Patient App](#lite-patient-app)
   - [Lite Driver App](#lite-driver-app)
4. [External / Third-Party APIs Called](#4-external--third-party-apis-called)

---

## 1. Backend API Definitions (`Backend/server.js`)

> Base URL: `http://localhost:5000` (dev) / `https://your-domain.com` (prod)  
> All `/api/v1/...` routes require `Authorization: Bearer <token>` unless noted otherwise.

---

### Auth Routes

| Method | Endpoint | Line # | Auth | What It Does |
|--------|----------|--------|------|--------------|
| `POST` | `/api/v1/auth/register` | 267 | None | Registers a new user (patient, driver, or hospital). Hashes password with bcrypt. Creates role-specific row in `patients`, `drivers`, or `hospitals` table in the same transaction. |
| `POST` | `/api/v1/drivers/register` | 308 | None | Full 5-step driver registration. Creates user + detailed driver record (license, vehicle, Aadhaar, PAN, etc.). Returns JWT token immediately. |
| `POST` | `/api/v1/hospitals/register` | 443 | None | Full 5-step hospital registration. Creates user + complete hospital record with beds, licenses, departments. Returns JWT token immediately. |
| `POST` | `/api/v1/auth/login` | 514 | None | Login with email/password. Validates bcrypt hash, checks role matches `expectedRole` param. Returns JWT token (24h). Rate-limited by `loginLimiter`. |
| `POST` | `/api/v1/auth/request-otp` | 555 | None | Sends a 6-digit OTP to the user's email (or simulates SMS for phone numbers). OTP expires in 10 minutes. Rate-limited by `otpLimiter`. |
| `POST` | `/api/v1/auth/verify-otp` | 591 | None | Verifies the OTP code. Deletes OTP from DB on success (one-time use). Returns JWT token. |
| `POST` | `/api/v1/auth/reset-password` | 626 | None | Verifies OTP then resets the user's password with a new bcrypt hash. |
| `GET` | `/api/v1/auth/profile` | 659 | JWT + Any Role | Returns the logged-in user's basic profile from `users` table. |

---

### Patient Routes

| Method | Endpoint | Line # | Auth | What It Does |
|--------|----------|--------|------|--------------|
| `GET` | `/api/v1/patients/me` | 671 | JWT + Patient | Returns full patient profile joined from `users` + `patients` tables. Decrypts all sensitive fields (allergies, chronic_conditions, etc.) before returning. |
| `PUT` | `/api/v1/patients/me` | 705 | JWT + Patient | Updates patient profile. Encrypts sensitive medical fields (allergies, habits, diagnoses, etc.) with AES-256-CBC before storing. Only updates fields that are actually sent. |

---

### Driver Routes

| Method | Endpoint | Line # | Auth | What It Does |
|--------|----------|--------|------|--------------|
| `GET` | `/api/v1/drivers/me` | 1373 | JWT + Driver | Returns full driver profile joined from `users` + `drivers` tables (license, vehicle, personal info). |
| `PUT` | `/api/v1/drivers/status` | 1398 | JWT + Driver | Updates driver availability status. Allowed values: `available`, `busy`, `offline`. |
| `GET` | `/api/v1/drivers/trips` | 1415 | JWT + Driver | Returns the last 20 trips for the logged-in driver, joined with patient name and hospital name/location. |

---

### Hospital Routes

| Method | Endpoint | Line # | Auth | What It Does |
|--------|----------|--------|------|--------------|
| `GET` | `/api/v1/hospitals` | 359 | None | Returns all registered hospitals with name, location (lat/lng), bed counts, ICU, ventilators, hospital type, and address. Used by the patient map to plot hospitals. |
| `GET` | `/api/v1/hospitals/external-details` | 383 | None | Queries Google Gemini AI to infer public details (address, phone, beds, facilities) for an external hospital by name. Used for non-registered OSM hospitals on the patient map. |
| `GET` | `/api/v1/hospital/me` | 1900 | JWT + Hospital | Returns the logged-in hospital's full profile (all columns from `users` + `hospitals`). Parses `departments` JSON string. |
| `GET` | `/api/v1/hospital/status` | 1924 | JWT + Hospital | Returns current `total_beds` and `available_beds` for the logged-in hospital. |
| `PUT` | `/api/v1/hospital/status` | 1931 | JWT + Hospital | Updates `available_beds` count for the logged-in hospital. |
| `GET` | `/api/v1/hospital/incoming` | 1939 | JWT + Hospital | Returns all active incoming trips (status: accepted, heading_to_patient, heading_to_hospital, at_hospital) for this hospital, joined with patient and driver names. |

---

### Trip & Dispatch Routes

| Method | Endpoint | Line # | Auth | What It Does |
|--------|----------|--------|------|--------------|
| `POST` | `/api/v1/triage` | 1139 | JWT + Any | Standalone AI triage endpoint. Sends patient vitals (HR, BP, SpO2, complaint) to Google Gemini. Returns `triage_level` (CRITICAL / URGENT / STANDARD) and `rationale`. Falls back to rule-based logic if no API key. |
| `POST` | `/api/v1/trips/request` | 1213 | JWT + Patient | **Core dispatch endpoint.** Runs AI triage, finds nearest available driver using Haversine distance, creates trip in DB (status=`requested`), emits `trip:new_request` to driver's Socket.IO room, sets 60-second auto-cancel timeout. |
| `POST` | `/api/v1/trips/:id/accept` | 1460 | JWT + Driver | Driver accepts a trip. Updates trip status → `accepted`, driver status → `busy`. Clears timeout. Runs Gemini AI triage on patient profile. Notifies patient via Socket.IO and FCM push. Alerts hospital via Socket.IO with patient blood group and urgency level. |
| `POST` | `/api/v1/trips/:id/reject` | 1546 | JWT + Driver | Driver rejects a trip. Marks trip as `cancelled`. Clears timeout. Notifies patient via Socket.IO. |
| `PUT` | `/api/v1/trips/:id/status` | 1577 | JWT + Driver | Updates trip status sequentially (heading_to_patient → arrived → heading_to_hospital → at_hospital → completed / cancelled). On `completed`: auto-generates insurance claim if patient has active policy, releases driver back to `available`. Sends FCM push at `arrived` and `completed` milestones. |
| `POST` | `/api/v1/sos` | 1439 | JWT + Any | Emergency SOS broadcast. Emits `sos:broadcast` to all connected Socket.IO clients. |

---

### Medical Records Routes

| Method | Endpoint | Line # | Auth | What It Does |
|--------|----------|--------|------|--------------|
| `GET` | `/api/v1/medical_records` | 759 | JWT + Patient | Returns all medical records for the logged-in patient (ordered newest first), with prescriptions nested. Decrypts all encrypted medical fields. |
| `POST` | `/api/v1/medical_records` | 788 | JWT + Patient/Hospital/Admin | Creates a new medical record (optionally with prescriptions). Encrypts diagnosis, treatment_plan, clinical_notes, and all prescription fields before storing. |
| `PUT` | `/api/v1/medical_records/:id` | 896 | JWT + Patient/Hospital/Admin | Updates an existing medical record's fields (diagnosis, treatment_plan, clinical_notes, status). |
| `DELETE` | `/api/v1/medical_records/:id` | 909 | JWT + Patient/Hospital/Admin | Deletes a medical record by ID (cascades to linked prescriptions). |

---

### Payments Routes

| Method | Endpoint | Line # | Auth | What It Does |
|--------|----------|--------|------|--------------|
| `POST` | `/api/v1/payments/calculate` | 935 | JWT + Any | Calculates estimated fare. Formula: `(distance × rate_per_km) + ₹500 (hospital) + ₹40 (platform)`. Applies coupon discounts (RAPID20 = 20% off, FIRSTCARE = ₹100 off). Returns itemized breakdown. |
| `POST` | `/api/v1/payments` | 982 | JWT + Any | Records a completed payment in the `payments` table. Also updates `trip.payment_status = paid` and `trip.total_fare`. |
| `GET` | `/api/v1/payments` | 1017 | JWT + Any | Returns full payment history for the logged-in user (ordered newest first). |

---

### Insurance Routes

| Method | Endpoint | Line # | Auth | What It Does |
|--------|----------|--------|------|--------------|
| `GET` | `/api/v1/insurance/policies` | 1659 | JWT + Any | Returns all insurance policies belonging to the logged-in patient. |
| `POST` | `/api/v1/insurance/policies` | 1666 | JWT + Any | Adds a new insurance policy for the logged-in patient (policy number, provider, category, coverage amount, portal link). |
| `POST` | `/api/v1/insurance/claims/auto` | 1677 | JWT + Any | Manually triggers auto-claim generation for a completed trip. Finds active policy, creates pending claim in `insurance_claims` with `CLM-{timestamp}` reference. |
| `GET` | `/api/v1/insurance/claims` | 1717 | JWT + Any | Returns all insurance claims for the logged-in patient, joined with provider name from the linked policy. |
| `POST` | `/api/v1/insurance/claims` | 1727 | JWT + Any | Manually submits a new insurance claim. Generates a `CLM-XXXXXXXX` reference number. |

---

### Doctors & Appointments Routes

| Method | Endpoint | Line # | Auth | What It Does |
|--------|----------|--------|------|--------------|
| `GET` | `/api/v1/doctors` | 1036 | JWT + Any | Returns all doctors. Supports optional query filters: `?specialization=Cardiology` and `?hospital_id=5`. |
| `GET` | `/api/v1/doctors/:id` | 1052 | JWT + Any | Returns a single doctor by ID. |
| `POST` | `/api/v1/appointments` | 1063 | JWT + Patient | Books an appointment. Requires `doctor_id` and `appointment_date`. Automatically links to the doctor's hospital. Status starts as `pending`. |
| `GET` | `/api/v1/appointments` | 1095 | JWT + Any | Returns all appointments for the logged-in patient, joined with doctor name and specialization (ordered by date). |
| `PUT` | `/api/v1/appointments/:id` | 1113 | JWT + Any | Updates an appointment status (e.g., cancel). Patients can only update their own appointments. |

---

### Medicine Hub Routes

| Method | Endpoint | Line # | Auth | What It Does |
|--------|----------|--------|------|--------------|
| `GET` | `/api/medicines` | 836 | None | Returns medicines from the in-memory `products.json` database. Supports `?category=X` and `?search=Y` query params for filtering by category or name/molecule. |
| `POST` | `/api/chat` | 856 | None | Medula AI chat endpoint. Sends user message to Google Gemini (model: `gemini-1.5-flash`). Returns a short medical/medicine-related reply. |
| `GET` | `/api/kits` | 882 | None | Returns all first-aid kit products from the medicine database. |
| `GET` | `/api/oxygen` | 883 | None | Returns oxygen equipment data from the medicine database. |
| `GET` | `/api/devices` | 884 | None | Returns medical device products from the medicine database. |
| `GET` | `/api/ayurveda` | 885 | None | Returns Ayurvedic product list from the medicine database. |
| `POST` | `/api/order` | 888 | None | Places a medicine order. Generates a random `RC-XXXXXXXXX` order ID and logs the order. (No real payment — frontend-only simulation.) |

---

### Admin & Developer Dashboard Routes

| Method | Endpoint | Line # | Auth | What It Does |
|--------|----------|--------|------|--------------|
| `GET` | `/api/data` | 1840 | None ⚠️ | Legacy endpoint used by Developer Dashboard. Returns all patients, drivers, and hospitals in one response. Decrypts sensitive medical fields. No auth required — intentionally open for dev use. |
| `GET` | `/api/admin/data` | 1843 | JWT + Admin | Versioned, auth-protected version of `/api/data`. Same response: all users grouped by role. |
| `PUT` | `/api/admin/data` | 1846 | None ⚠️ | Updates a single field on a user record (patient, driver, or hospital). Validates allowed fields per role. Encrypts sensitive patient fields before writing. No auth currently. |
| `DELETE` | `/api/admin/data` | 1883 | None ⚠️ | Deletes a user by ID from the `users` table (cascades to role tables). No auth currently. |
| `GET` | `/api/v1/admin/export` | 1743 | JWT + Admin | Returns exportable data for hospitals, drivers, and patients formatted for Excel download. Returns all columns needed for the spreadsheet view. |

---

### Analytics Routes

| Method | Endpoint | Line # | Auth | What It Does |
|--------|----------|--------|------|--------------|
| `GET` | `/api/v1/analytics/patient` | 1955 | JWT + Any | Returns analytics metrics for the logged-in patient: average response time, total distance covered, total completed trips, and a static safety score of 92. |

---

### FCM Token Route

| Method | Endpoint | Line # | Auth | What It Does |
|--------|----------|--------|------|--------------|
| `POST` | `/api/v1/users/fcm-token` | 1707 | JWT + Any | Registers a Firebase Cloud Messaging device token for the logged-in user. Stored in server memory (`fcmTokens` Map). Used to send push notifications to patient's phone. |

---

### Razorpay Payment Routes (`Backend/routes/payment.js`)

> Mounted at `/api/v1/payments` — routes here overlap with the base payment routes.

| Method | Endpoint | Line # | Auth | What It Does |
|--------|----------|--------|------|--------------|
| `POST` | `/api/v1/payments/create-order` | 16 | None | Creates a Razorpay payment order. Converts amount to paise (×100). Returns `order` object and `key_id` for the frontend Razorpay checkout widget. |
| `POST` | `/api/v1/payments/verify-payment` | 40 | None | Verifies Razorpay payment signature using HMAC-SHA256. On success: saves payment to both Firebase Firestore (cloud) and SQLite (local). Returns payment confirmation. |

---

### Utility Routes

| Method | Endpoint | Line # | Auth | What It Does |
|--------|----------|--------|------|--------------|
| `GET` | `/health` | 2007 | None | Health check endpoint. Returns `{ status: 'ok', server: 'RapidCare Unified Backend', port }`. Used by deployment platforms (Render, Railway) to confirm the server is alive. |

---

## 2. Frontend API Calls

> All frontend files use a base URL from `RapidCareConfig.API_BASE` (set in `shared_assets/js/config.js`) which resolves to `/api/v1` relative to the current origin.

---

### Patient Login Page

**File:** `Frontend/patient_login/script.js` | `API_BASE = /api/v1/auth`

| Line # | Method | Endpoint Called | What It Does |
|--------|--------|-----------------|--------------|
| 106 | `POST` | `/api/v1/auth/register` | Submits new patient signup form. Sends name, email, password, role=`patient`. On success, switches to the login view. |
| 156 | `POST` | `/api/v1/auth/login` | Submits patient login. Sends `expectedRole: 'patient'` to enforce role check. Stores JWT + user object in `localStorage`. Redirects to `/dashboard`. |
| 223 | `POST` | `/api/v1/auth/request-otp` | Forgot password step 1 — sends OTP to user's email. |
| 260 | `POST` | `/api/v1/auth/reset-password` | Forgot password step 2 — submits OTP + new password to reset account. |

---

### Driver Login Page

**File:** `Frontend/driver_login/script.js` | `API_BASE = /api/v1/auth`

| Line # | Method | Endpoint Called | What It Does |
|--------|--------|-----------------|--------------|
| 105 | `POST` | `/api/v1/auth/login` | Submits driver login. Sends `expectedRole: 'driver'`. Redirects to `/driver` on success. |
| 172 | `POST` | `/api/v1/auth/request-otp` | Forgot password step 1 — requests OTP for driver's email. |
| 209 | `POST` | `/api/v1/auth/reset-password` | Forgot password step 2 — submits OTP + new password. |

---

### Patient Dashboard

**File:** `Frontend/patient_Dashboard/script.js` | `API_BASE = /api/v1`

| Line # | Method | Endpoint Called | What It Does |
|--------|--------|-----------------|--------------|
| 208 | `GET` | `/api/v1/patients/me` | Loads the logged-in patient's full profile on dashboard init. Falls back to `localStorage` cache if request fails. |
| 285 | `GET` | `https://nominatim.openstreetmap.org/search?format=json&q=...` | External — Geocodes the patient's `home_location` text to lat/lng coordinates. Stores result in `localStorage` for trip dispatch. |
| 445 | `PUT` | `/api/v1/patients/me` | Uploads a compressed avatar image (base64 JPEG) to update the patient's `avatar_url` in the database. |
| 507 | `GET` | `https://nominatim.openstreetmap.org/reverse?format=json&lat=...&lon=...` | External — Reverse geocodes the device's GPS coordinates to a human-readable address string (for the location display). |
| 737 | `GET` | `https://router.project-osrm.org/route/v1/driving/...` | External — Gets a real driving route between patient and hospital from the OSRM routing engine. Used to draw the polyline on the live tracking map. |
| 793 | `GET` | `/api/v1/hospitals` | Loads all registered hospitals from the backend for the map view. Also falls back to `localStorage` cache if already loaded. |
| 830 | `GET` | Overpass API (`overpass-api.de`) | External — Queries OpenStreetMap Overpass API to find real hospitals near the patient's GPS location (non-registered hospitals). |
| 926 | `POST` | `/api/v1/trips/request` | **Books an ambulance.** Sends patient GPS lat/lng and selected hospital ID. Stores `trip_id` in localStorage. |
| 968 | `GET` | `https://router.project-osrm.org/route/v1/driving/...` | External — Gets the road route from patient to a selected hospital to display the distance path on the map. |
| 1032 | `GET` | `/api/v1/hospitals/external-details?name=...` | Queries backend (which uses Gemini AI) for details about an OSM-sourced hospital not in the RapidCare database. |
| 1352 | `GET` | `https://nominatim.openstreetmap.org/search?format=json&q=...` | External — Autocomplete/geocode for the search bar. Searches for locations as the user types. |
| 1643 | `PUT` | `/api/v1/patients/me` | Saves profile edits (personal info section — name, gender, DOB, blood type, etc.) from the profile form. |
| 1829 | `PUT` | `/api/v1/patients/me` | Saves medical profile edits (allergies, chronic conditions, habits, own diagnosis, etc.). |
| 1841 | `GET` | `https://nominatim.openstreetmap.org/search?format=json&q=...` | External — Geocodes the newly entered `home_location` text after a profile update. |
| 1873 | `PUT` | `/api/v1/patients/me` | Saves detailed medical history updates (chronic disease, surgeries, family history, etc.). |
| 2253 | `POST` | `/api/v1/payments/create-order` | Initiates a Razorpay payment order. Returns the order ID used to open the Razorpay checkout widget. |
| 2273 | `POST` | `/api/v1/payments/verify-payment` | Verifies the Razorpay payment after checkout completes. Sends `razorpay_order_id`, `razorpay_payment_id`, `razorpay_signature`. |
| 2682 | `GET` | `/api/v1/medical_records` | Loads all medical records and prescriptions for the patient's history tab. |
| 2717 | `GET` | `/api/v1/payments` | Loads payment history for the payments tab. |
| 2746 | `GET` | `/api/v1/analytics/patient` | Loads analytics data (avg response time, total distance, total trips) for the analytics view. |
| 2982 | `GET` | `/api/v1/doctors` | Loads the list of doctors for the appointment booking section. |
| 3016 | `GET` | `/api/v1/appointments` | Loads the patient's upcoming/past appointments for display. |
| 3060 | `POST` | `/api/v1/appointments` | Books a new appointment with a selected doctor on a chosen date. |
| 3476 | `GET` | `/api/v1/payments` | Re-fetches payment history (second call from a different section of the dashboard). |

---

### Driver Dashboard

**File:** `Frontend/driver_dashboard/script.js` | `apiBase = /api/v1`

| Line # | Method | Endpoint Called | What It Does |
|--------|--------|-----------------|--------------|
| 12 | `GET` | `/api/v1/drivers/me` | Loads the logged-in driver's full profile on dashboard init. |
| 293 | `POST` | `/api/v1/trips/:id/accept` | Driver accepts a trip request. Triggers backend to notify patient and hospital. |
| 320 | `POST` | `/api/v1/trips/:id/reject` | Driver rejects a trip request. |
| 350 | `PUT` | `/api/v1/drivers/status` | Sets driver status to `available`, `busy`, or `offline` from the dashboard toggle. |
| 368 | `GET` | `/api/v1/drivers/trips` | Loads the driver's recent trip history for the trips panel. |
| 573 | `POST` | `/api/v1/sos` | Triggers an SOS broadcast to all connected Socket.IO clients. |

---

### Driver Registration

**File:** `Frontend/driver_registration/script.js`

| Line # | Method | Endpoint Called | What It Does |
|--------|--------|-----------------|--------------|
| 86 | `POST` | `/api/v1/drivers/register` | Submits the full 5-step driver registration form. Sends all personal, identity, and vehicle details. Returns JWT token for immediate login. |

---

### Hospital Registration

**File:** `Frontend/hospital_registration/script.js`

| Line # | Method | Endpoint Called | What It Does |
|--------|--------|-----------------|--------------|
| 129 | `POST` | `/api/v1/hospitals/register` | Submits the full 5-step hospital registration form. Sends all hospital details (beds, licenses, departments, contacts, etc.). Returns JWT token for immediate login. |

---

### Insurance Interface

**File:** `Frontend/Insurance_Interface/script.js`

| Line # | Method | Endpoint Called | What It Does |
|--------|--------|-----------------|--------------|
| 19 | `GET` | `/api/v1/insurance/policies` | Loads all insurance policies for the logged-in patient on page load. |
| 26 | `GET` | `/api/v1/insurance/claims` | Loads all insurance claims for the logged-in patient on page load. |
| 196 | `POST` | `/api/v1/insurance/policies` | Submits a new insurance policy (policy number, provider, category, coverage). |
| 224 | `POST` | `/api/v1/insurance/claims` | Manually files a new insurance claim from the interface. |

---

### Excel / Admin Export Dashboard

**File:** `Frontend/excel_dashboard/script.js`

| Line # | Method | Endpoint Called | What It Does |
|--------|--------|-----------------|--------------|
| 44 | `GET` | `/api/v1/admin/export` | Fetches all hospital, driver, and patient data formatted for Excel export. Requires Admin JWT. Returns data that the frontend converts to a downloadable `.xlsx` file. |

---

### Developer Dashboard

**File:** `Frontend/DeveloperDashboard/index.html` (inline `<script>`)

| Line # | Method | Endpoint Called | What It Does |
|--------|--------|-----------------|--------------|
| 236 | `PUT` | `/api/admin/data` | Updates a single field on a user record. Sends `{ role, id, field, value }`. Used for inline cell editing in the admin table. |
| 268 | `DELETE` | `/api/admin/data` | Deletes a user by ID from the system. Used by the delete button in the admin table. |
| 290 | `GET` | `/api/data` | Loads all patients, drivers, and hospitals data for the developer dashboard table on page load. |

---

### Login Urgency (Quick OTP Flow)

**File:** `Frontend/login_urgency/script.js`

| Line # | Method | Endpoint Called | What It Does |
|--------|--------|-----------------|--------------|
| 105 | `POST` | `/api/v1/auth/request-otp` | Step 1 of urgency login — sends OTP to patient email for quick authentication without password. |
| 212 | `POST` | `/api/v1/auth/request-otp` | Same as above — second call path (different trigger). |
| 257 | `POST` | `/api/v1/auth/verify-otp` | Step 2 — verifies OTP and logs the user in. Used when patient needs emergency access without remembering password. |

---

## 3. RapidCareLite API Calls

> Lite apps use `API_BASE = window.location.origin + '/api/v1'`

---

### Lite Patient App

**File:** `RapidCareLite/patient/app.js`

| Line # | Method | Endpoint Called | What It Does |
|--------|--------|-----------------|--------------|
| 41 | `POST` | `/api/v1/auth/login` | Logs in the patient with email/password. Stores JWT in `localStorage` (`lite_patient_token`). |
| 94 | `GET` | `/api/v1/hospitals` | Loads all registered hospitals to populate the hospital selection list. |
| 116 | `POST` | `/api/v1/trips/request` | Requests an ambulance — sends GPS coordinates and selected hospital ID. |

---

### Lite Driver App

**File:** `RapidCareLite/driver/app.js`

| Line # | Method | Endpoint Called | What It Does |
|--------|--------|-----------------|--------------|
| 54 | `GET` | `/api/v1/drivers/trips` | On page load / refresh, checks for any existing pending or active trip to restore the correct UI state. |
| 107 | `POST` | `/api/v1/auth/login` | Logs in the driver with email/password. Stores JWT in `localStorage` (`lite_driver_token`). Expects `expectedRole: 'driver'`. |
| 184 | `POST` | `/api/v1/trips/:id/accept` | Driver accepts an incoming trip request shown on the alert card. |
| 212 | `POST` | `/api/v1/trips/:id/reject` | Driver rejects an incoming trip request. |
| 237 | `PUT` | `/api/v1/trips/:id/status` | Updates trip status via the sequential action buttons (Arrived at Patient → Heading to Hospital → Trip Completed). |

---

## 4. External / Third-Party APIs Called

> These are APIs from other services, called directly by the frontend JavaScript.

| Service | Base URL | Line # / File | Method | What It Does |
|---------|----------|---------------|--------|--------------|
| **Nominatim (OpenStreetMap)** | `https://nominatim.openstreetmap.org` | `patient_Dashboard/script.js:285` | `GET` | Forward geocoding — converts `home_location` text address to GPS coordinates. |
| **Nominatim (OpenStreetMap)** | `https://nominatim.openstreetmap.org` | `patient_Dashboard/script.js:507` | `GET` | Reverse geocoding — converts GPS coordinates to a human-readable address string. |
| **Nominatim (OpenStreetMap)** | `https://nominatim.openstreetmap.org` | `patient_Dashboard/script.js:1352` | `GET` | Location autocomplete in the search bar (real-time suggestions as user types). |
| **Nominatim (OpenStreetMap)** | `https://nominatim.openstreetmap.org` | `patient_Dashboard/script.js:1841` | `GET` | Re-geocodes after a profile home location update. |
| **OSRM Routing Engine** | `https://router.project-osrm.org` | `patient_Dashboard/script.js:737` | `GET` | Gets a real road driving route between two coordinates for the live tracking map polyline. |
| **OSRM Routing Engine** | `https://router.project-osrm.org` | `patient_Dashboard/script.js:968` | `GET` | Gets the driving route from patient to hospital when highlighting distance on the overview map. |
| **Overpass API (OSM)** | `https://overpass-api.de` | `patient_Dashboard/script.js:830` | `GET` | Queries real hospital locations from OpenStreetMap data near the patient's GPS location. Used to show non-registered hospitals on the map. |
| **OpenStreetMap Tiles** | `https://{s}.tile.openstreetmap.org` | `patient_Dashboard/script.js:683` | `GET` | Map tile images for the Leaflet.js interactive map. |
| **UI Avatars** | `https://ui-avatars.com` | `patient_Dashboard/script.js:335` | `GET` | Generates a default avatar image from the user's initials when no photo is uploaded. |
| **Google Gemini AI** | Internal (via backend) | `Backend/server.js:401,868,1163,1228,1485` | Internal | Triage scoring, Medula AI chat, hospital detail inference — all called server-side from `Backend/server.js`. Not called directly from frontend. |
| **Firebase FCM** | Internal (via backend) | `Backend/server.js:71-84` | Internal | Push notifications — called server-side via Firebase Admin SDK (`admin.messaging().send()`). Not called directly from frontend. |
| **Razorpay Checkout** | `https://checkout.razorpay.com` | `patient_Dashboard/script.js` (script tag in HTML) | Script load | The Razorpay payment widget JS library loaded into the page to display the payment modal. |

---

## Summary

| Category | Count |
|----------|-------|
| Backend API endpoints (server.js) | 35 |
| Razorpay routes (routes/payment.js) | 2 |
| Total backend endpoints | **37** |
| Frontend fetch calls (internal) | **42** |
| External / third-party API calls | **9** |
| **Grand Total** | **88** |
