-- RapidCare User Database Schema
-- Optimized for SQLite but compatible with most SQL systems

-- CORE USERS TABLE
CREATE TABLE IF NOT EXISTS users (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    name TEXT NOT NULL,
    email TEXT UNIQUE NOT NULL,
    password TEXT NOT NULL,
    role TEXT CHECK(role IN ('patient', 'driver', 'hospital')) NOT NULL,
    phone TEXT,
    avatar_url TEXT,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- PATIENT SPECIFIC DETAILS
CREATE TABLE IF NOT EXISTS patients (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    user_id INTEGER,
    blood_group TEXT,
    medical_history TEXT,
    emergency_contact TEXT,
    FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE
);

-- DRIVER SPECIFIC DETAILS
CREATE TABLE IF NOT EXISTS drivers (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    user_id INTEGER,
    license_number TEXT UNIQUE,
    vehicle_number TEXT UNIQUE,
    vehicle_type TEXT,
    status TEXT DEFAULT 'available',
    current_lat REAL,
    current_lng REAL,
    rating REAL DEFAULT 5.0,
    FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE
);

-- HOSPITAL SPECIFIC DETAILS
CREATE TABLE IF NOT EXISTS hospitals (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    user_id INTEGER,
    address TEXT,
    city TEXT,
    total_beds INTEGER DEFAULT 0,
    available_beds INTEGER DEFAULT 0,
    latitude REAL,
    longitude REAL,
    specialty TEXT,
    FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE
);

-- TRIPS / EMERGENCY LOGS
CREATE TABLE IF NOT EXISTS trips (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    patient_id INTEGER,
    driver_id INTEGER,
    hospital_id INTEGER,
    status TEXT DEFAULT 'requested', -- requested, accepted, heading_to_patient, heading_to_hospital, completed
    pickup_lat REAL,
    pickup_lng REAL,
    start_time TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    end_time TIMESTAMP,
    total_fare REAL,
    payment_status TEXT DEFAULT 'pending',
    FOREIGN KEY (patient_id) REFERENCES users(id),
    FOREIGN KEY (driver_id) REFERENCES users(id),
    FOREIGN KEY (hospital_id) REFERENCES users(id)
);

-- SEED DATA
INSERT INTO users (name, email, password, role, phone) 
VALUES ('Matt Smith', 'matt@rapidcare.com', 'hashed_pass_123', 'driver', '+1234567890');

INSERT INTO drivers (user_id, license_number, vehicle_number, vehicle_type, status)
VALUES (1, 'DL-998877', 'WB-01-A-1234', 'Advanced Life Support', 'available');

INSERT INTO users (name, email, password, role, phone)
VALUES ('City General', 'contact@citygeneral.com', 'hosp_pass_456', 'hospital', '+0987654321');

INSERT INTO hospitals (user_id, address, city, total_beds, available_beds, latitude, longitude)
VALUES (2, '123 Health Ave', 'Kolkata', 100, 45, 22.5726, 88.3639);
