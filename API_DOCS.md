# RapidCare API Documentation (v1)

Base URL: `http://localhost:5000/api/v1`

## 🔐 Authentication
All non-auth routes require a Bearer token in the `Authorization` header.

### Register User
`POST /auth/register`
- Payload: `{ name, email, password, role, phone }`
- Roles: `patient`, `driver`, `hospital`

### Login
`POST /auth/login`
- Payload: `{ email, password }`
- Response: `{ token, user }`

---

## 🚑 Ambulance & Trips
### Request Trip
`POST /trips/request`
- Payload: `{ pickup_lat, pickup_lng, hospital_id }`
- Assigns the nearest available driver.

### Update Trip Status
`PUT /trips/:id/status`
- Payload: `{ status }`
- Statuses: `heading_to_patient`, `arrived`, `completed`, `cancelled`.

---

## 💳 Payments
### Calculate Fare
`POST /payments/calculate`
- Payload: `{ distance, ambulanceType, couponCode }`

### Record Payment
`POST /payments`
- Payload: `{ trip_id, amount, payment_method, coupon_used }`

---

## 📑 Medical Records
### Get Records
`GET /medical_records` (Patient only)

### Create Record
`POST /medical_records`
- Payload: `{ patient_id, diagnosis, treatment_plan, clinical_notes, prescriptions: [] }`

---

## 🏥 Hospital Module
### Get Bed Status
`GET /hospital/status`

### Update Beds
`PUT /hospital/status`
- Payload: `{ available_beds }`

### Incoming Patients
`GET /hospital/incoming`

---

## 📊 Analytics
### Patient Analytics
`GET /analytics/patient`
- Returns: `avg_response_time`, `total_distance`, `safety_score`.
