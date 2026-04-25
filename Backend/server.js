/**
 * RapidCare — Unified Backend Server
 * 
 * Combines:
 *   - Auth Server  (was: Backend/user_Registration_Login_System/server.js → port 5000)
 *   - Dev Dashboard API (was: DeveloperDashboard/server.js → port 3000)
 * 
 * Now runs everything on a single port 5000.
 * Dev Dashboard is served statically at http://localhost:5000/dev
 */

const express = require('express');
const cors = require('cors');
const bcrypt = require('bcrypt');
const jwt = require('jsonwebtoken');
const path = require('path');
const nodemailer = require('nodemailer');
const http = require('http');
const { Server } = require('socket.io');
const { getDb, initializeDB, knex } = require('./db');
require('dotenv').config({ path: path.resolve(__dirname, '.env') });

const app = express();
const server = http.createServer(app);
const io = new Server(server, {
    cors: { origin: '*' }
});

// Expose io instance to routes if needed
app.set('io', io);

// Socket.IO event handling
io.on('connection', (socket) => {
    console.log(`[Socket.IO] New client connected: ${socket.id}`);

    // Join room based on user role and id (e.g., patient_1, driver_5)
    socket.on('join', (data) => {
        const { userId, role } = data;
        if (userId && role) {
            socket.join(`${role}_${userId}`);
            console.log(`[Socket.IO] User ${userId} (${role}) joined their room: ${role}_${userId}`);
        }
    });

    // Handle real-time driver location updates
    socket.on('driver:location_update', async (data) => {
        const { userId, lat, lng } = data;
        if (!userId || lat === undefined || lng === undefined) return;

        try {
            // 1. Update the driver's current position in the database
            await knex('drivers').where({ user_id: userId }).update({
                current_lat: lat,
                current_lng: lng
            });

            // 2. Find all active trips involving this driver
            const activeTrips = await knex('trips')
                .where({ driver_id: userId })
                .whereIn('status', ['accepted', 'heading_to_patient', 'heading_to_hospital']);

            // 3. Broadcast the new location to each patient in an active trip
            activeTrips.forEach(trip => {
                io.to(`patient_${trip.patient_id}`).emit('trip:driver_location', {
                    trip_id: trip.id,
                    lat,
                    lng
                });
            });

            // Optional: Broadcast to a global "admin" room or similar for monitoring
            // io.to('admin_room').emit('global:driver_moved', { userId, lat, lng });

        } catch (err) {
            console.error('[Socket.IO] Error in driver:location_update:', err);
        }
    });

    socket.on('disconnect', () => {
        console.log(`[Socket.IO] Client disconnected: ${socket.id}`);
    });
});
const PORT = process.env.PORT || 5000;
const JWT_SECRET = process.env.JWT_SECRET || 'super_secret_rapidcare_key_2026';

// ── Services ────────────────────────────────────────────────────────────────
const notificationService = require('./services/notification.service');

// ── Global Middleware ──────────────────────────────────────────────────────────
app.use(cors());
app.use((req, res, next) => {
    res.header('Access-Control-Allow-Private-Network', 'true');
    next();
});
app.use(express.json());

// ── Static: Dev Dashboard (served at /dev) ────────────────────────────────────
app.use('/dev', express.static(path.resolve(__dirname, '../DeveloperDashboard')));

// ── Auth Middleware ───────────────────────────────────────────────────────────
const authenticateToken = (req, res, next) => {
    const authHeader = req.headers['authorization'];
    const token = authHeader && authHeader.split(' ')[1];
    if (!token) return res.sendStatus(401);

    jwt.verify(token, JWT_SECRET, (err, user) => {
        if (err) return res.sendStatus(403);
        req.user = user;
        next();
    });
};

const { authorize } = require('./middleware/rbac');

// ── Validation Middleware ─────────────────────────────────────────────────────
const { validate } = require('./middleware/validate');
const {
    registerSchema,
    loginSchema,
    requestOtpSchema,
    verifyOtpSchema
} = require('./validators/auth.validator');

// ── Rate Limiting Middleware ──────────────────────────────────────────────────
const { generalLimiter, loginLimiter, otpLimiter } = require('./middleware/rateLimiter');

// Apply general limiter to all auth routes
app.use('/api/v1/auth', generalLimiter);

// =============================================================================
// AUTH ROUTES  (/api/v1/auth/*)
// =============================================================================

// Helper to map phone numbers to a pseudo-email for DB constraints
const mapEmailOrPhone = (input) => {
    if (!input) return { mappedEmail: input, mappedPhone: null };
    const isPhone = /^\d{10}$/.test(input);
    if (isPhone) {
        return { mappedEmail: `${input}@phone.rapidcare.local`, mappedPhone: input };
    }
    return { mappedEmail: input, mappedPhone: null };
};

// 1. Register New User
app.post('/api/v1/auth/register', validate(registerSchema), async (req, res) => {
    const { name, email, password, role, phone } = req.body;
    const db = getDb();
    
    // Map email/phone input
    const { mappedEmail, mappedPhone } = mapEmailOrPhone(email);
    const finalPhone = mappedPhone || phone; // Prefer the one extracted from 'email' field if it was a phone number

    try {
        const hashedPassword = await bcrypt.hash(password, 10);
        const result = await db.run(
            'INSERT INTO users (name, email, password, role, phone) VALUES (?, ?, ?, ?, ?)',
            [name, mappedEmail, hashedPassword, role, finalPhone]
        );

        const userId = result.lastID;

        // Initialize role-specific tables
        if (role === 'patient') {
            await db.run('INSERT INTO patients (user_id) VALUES (?)', [userId]);
        } else if (role === 'driver') {
            await db.run('INSERT INTO drivers (user_id, status) VALUES (?, ?)', [userId, 'available']);
        } else if (role === 'hospital') {
            await db.run('INSERT INTO hospitals (user_id) VALUES (?)', [userId]);
        }

        res.status(201).json({ message: 'User registered successfully', userId });
    } catch (err) {
        if (err.message.includes('UNIQUE constraint failed')) {
            return res.status(400).json({ error: 'Email already exists' });
        }
        res.status(500).json({ error: err.message });
    }
});

// 1b. Register Driver (5-step form)
app.post('/api/v1/drivers/register', async (req, res) => {
    const {
        name, email, password, phone,
        dob, alt_phone, address, city, state, pincode,
        aadhaar_number, pan_number, license_number, vehicle_number
    } = req.body;
    const db = getDb();

    try {
        await db.run('BEGIN TRANSACTION');
        const hashedPassword = await bcrypt.hash(password, 10);
        const result = await db.run(
            'INSERT INTO users (name, email, password, role, phone) VALUES (?, ?, ?, ?, ?)',
            [name, email, hashedPassword, 'driver', phone]
        );
        const userId = result.lastID;

        await db.run(`
            INSERT INTO drivers (
                user_id, status, license_number, vehicle_number, dob, alt_phone, 
                address, city, state, pincode, aadhaar_number, pan_number
            ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
        `, [
            userId, 'available', license_number, vehicle_number, dob, alt_phone,
            address, city, state, pincode, aadhaar_number, pan_number
        ]);

        await db.run('COMMIT');
        res.status(201).json({ message: 'Driver registered successfully', userId });
    } catch (err) {
        await db.run('ROLLBACK');
        if (err.message.includes('UNIQUE constraint failed')) {
            return res.status(400).json({ error: 'Email, license, or vehicle number already exists' });
        }
        res.status(500).json({ error: err.message });
    }
});

// 1c. Register Hospital (5-step form)
app.post('/api/v1/hospitals/register', async (req, res) => {
    const data = req.body;
    const db = getDb();

    try {
        await db.run('BEGIN TRANSACTION');

        const hashedPassword = await bcrypt.hash(data.password, 10);
        const result = await db.run(
            'INSERT INTO users (name, email, password, role, phone) VALUES (?, ?, ?, ?, ?)',
            [data.hospital_name, data.email, hashedPassword, 'hospital', data.reception_number]
        );
        const userId = result.lastID;

        await db.run(`
            INSERT INTO hospitals (
                user_id, address, city, total_beds, available_beds,
                hospital_type, year_established, district, state, pincode,
                state_health_license, license_expiry, nabh_accreditation, nabl_accreditation,
                pharmacy_license, fire_noc, pan_tan, gst,
                reception_number, emergency_casualty_number, ambulance_dispatch_number,
                icu_helpline, admin_billing_number, website,
                icu_beds, nicu_beds, picu_beds, ccu_beds, ventilators, dialysis, ot, ambulances,
                departments, ayushman_bharat, state_insurance, admin_name, designation
            ) VALUES (
                ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?
            )
        `, [
            userId, data.address, data.district, data.total_beds, data.total_beds,
            data.hospital_type, data.year_established, data.district, data.state, data.pincode,
            data.state_health_license, data.license_expiry, data.nabh_accreditation, data.nabl_accreditation,
            data.pharmacy_license, data.fire_noc, data.pan_tan, data.gst,
            data.reception_number, data.emergency_casualty_number, data.ambulance_dispatch_number,
            data.icu_helpline, data.admin_billing_number, data.website,
            data.icu_beds || 0, data.nicu_beds || 0, data.picu_beds || 0, data.ccu_beds || 0,
            data.ventilators || 0, data.dialysis || 0, data.ot || 0, data.ambulances || 0,
            JSON.stringify(data.departments || []), data.ayushman_bharat, data.state_insurance,
            data.admin_name, data.designation
        ]);

        await db.run('COMMIT');
        res.status(201).json({ message: 'Hospital registered successfully', userId });
    } catch (err) {
        await db.run('ROLLBACK');
        if (err.message.includes('UNIQUE constraint failed')) {
            return res.status(400).json({ error: 'Email or Contact already exists' });
        }
        res.status(500).json({ error: err.message });
    }
});

// 2. Login with Password
app.post('/api/v1/auth/login', loginLimiter, validate(loginSchema), async (req, res) => {
    const { email, password } = req.body;
    const db = getDb();
    const { mappedEmail } = mapEmailOrPhone(email);

    try {
        const user = await db.get('SELECT * FROM users WHERE email = ?', [mappedEmail]);
        if (!user) {
            return res.status(404).json({ error: 'User not found' });
        }

        const validPassword = await bcrypt.compare(password, user.password);
        if (!validPassword) {
            return res.status(401).json({ error: 'Invalid password' });
        }

        const token = jwt.sign(
            { id: user.id, email: user.email, role: user.role },
            JWT_SECRET,
            { expiresIn: '24h' }
        );
        res.json({
            message: 'Login successful',
            token,
            user: { id: user.id, name: user.name, email: user.email, role: user.role }
        });
    } catch (err) {
        res.status(500).json({ error: err.message });
    }
});

// 3. Request OTP
app.post('/api/v1/auth/request-otp', otpLimiter, validate(requestOtpSchema), async (req, res) => {
    const { email } = req.body;
    const db = getDb();
    const { mappedEmail } = mapEmailOrPhone(email);

    try {
        const user = await db.get('SELECT * FROM users WHERE email = ?', [mappedEmail]);
        if (!user) {
            return res.status(404).json({ error: 'User not found. Please register first.' });
        }

        const otp = Math.floor(100000 + Math.random() * 900000).toString();
        const expiresAt = new Date(Date.now() + 10 * 60000); // 10 minutes

        await db.run('DELETE FROM otps WHERE email = ?', [mappedEmail]);
        await db.run(
            'INSERT INTO otps (email, otp, expires_at) VALUES (?, ?, ?)',
            [mappedEmail, otp, expiresAt.toISOString()]
        );

        if (email.includes('@')) {
            await notificationService.sendOTPEmail(email, otp);
            console.log(`[OTP DEBUG] OTP for ${email} (mapped: ${mappedEmail}): ${otp}`);
        } else {
            // Simulate SMS if it's a phone number
            console.log(`[OTP DEBUG] SMS Simulation. OTP for ${email} (mapped: ${mappedEmail}): ${otp}`);
        }

        res.json({ message: 'OTP sent successfully. Please check your email.' });
    } catch (err) {
        console.error('Error sending OTP:', err);
        res.status(500).json({ error: 'Failed to send OTP' });
    }
});

// 4. Verify OTP
app.post('/api/v1/auth/verify-otp', validate(verifyOtpSchema), async (req, res) => {
    const { email, otp } = req.body;
    const db = getDb();
    const { mappedEmail } = mapEmailOrPhone(email);

    try {
        const otpRecord = await db.get(
            'SELECT * FROM otps WHERE email = ? AND otp = ?',
            [mappedEmail, otp]
        );

        if (!otpRecord) {
            return res.status(401).json({ error: 'Invalid OTP' });
        }
        if (new Date(otpRecord.expires_at) < new Date()) {
            return res.status(401).json({ error: 'OTP expired' });
        }

        const user = await db.get('SELECT * FROM users WHERE email = ?', [mappedEmail]);
        await db.run('DELETE FROM otps WHERE email = ?', [mappedEmail]);

        const token = jwt.sign(
            { id: user.id, email: user.email, role: user.role },
            JWT_SECRET,
            { expiresIn: '24h' }
        );
        res.json({
            message: 'Login successful',
            token,
            user: { id: user.id, name: user.name, email: user.email, role: user.role }
        });
    } catch (err) {
        res.status(500).json({ error: err.message });
    }
});

// 4b. Reset Password
app.post('/api/v1/auth/reset-password', async (req, res) => {
    const { email, otp, newPassword } = req.body;
    const db = getDb();
    const { mappedEmail } = mapEmailOrPhone(email);

    if (!email || !otp || !newPassword || newPassword.length < 6) {
        return res.status(400).json({ error: 'Invalid input. Password must be at least 6 characters.' });
    }

    try {
        const otpRecord = await db.get(
            'SELECT * FROM otps WHERE email = ? AND otp = ?',
            [mappedEmail, otp]
        );

        if (!otpRecord) {
            return res.status(401).json({ error: 'Invalid OTP' });
        }
        if (new Date(otpRecord.expires_at) < new Date()) {
            return res.status(401).json({ error: 'OTP expired' });
        }

        const hashedPassword = await bcrypt.hash(newPassword, 10);
        await db.run('UPDATE users SET password = ? WHERE email = ?', [hashedPassword, mappedEmail]);
        await db.run('DELETE FROM otps WHERE email = ?', [mappedEmail]);

        res.json({ message: 'Password reset successfully' });
    } catch (err) {
        res.status(500).json({ error: err.message });
    }
});

// 5. Get Profile (protected)
app.get('/api/v1/auth/profile', authenticateToken, authorize('patient', 'driver', 'hospital', 'admin'), async (req, res) => {
    const db = getDb();
    try {
        const user = await db.get(
            'SELECT id, name, email, role, phone, created_at FROM users WHERE id = ?',
            [req.user.id]
        );
        res.json(user);
    } catch (err) {
        res.status(500).json({ error: err.message });
    }
});

// 6. Get Patient Profile
app.get('/api/v1/patients/me', authenticateToken, authorize('patient'), async (req, res) => {
    const db = getDb();
    try {
        const patient = await db.get(`
            SELECT u.name, u.email, u.phone, 
                   p.gender, p.date_of_birth, p.height, p.weight, 
                   p.blood_group as blood_type, p.home_location, p.blood_pressure, 
                   p.allergies, p.chronic_conditions, p.own_diagnosis, p.health_barriers, p.habits
            FROM users u
            JOIN patients p ON u.id = p.user_id
            WHERE u.id = ?
        `, [req.user.id]);

        if (!patient) return res.status(404).json({ error: 'Patient profile not found' });
        res.json(patient);
    } catch (err) {
        res.status(500).json({ error: err.message });
    }
});

// 7. Update Patient Profile
app.put('/api/v1/patients/me', authenticateToken, authorize('patient'), async (req, res) => {
    const { name, gender, date_of_birth, height, weight, blood_type, home_location, blood_pressure, allergies, chronic_conditions, own_diagnosis, health_barriers, habits } = req.body;
    const db = getDb();

    try {
        await db.run('BEGIN TRANSACTION');
        if (name !== undefined) {
            await db.run('UPDATE users SET name = ? WHERE id = ?', [name, req.user.id]);
        }
        await db.run(`
            UPDATE patients SET 
                gender = ?, date_of_birth = ?, height = ?, weight = ?, 
                blood_group = ?, home_location = ?, blood_pressure = ?, 
                allergies = ?, chronic_conditions = ?, own_diagnosis = ?, health_barriers = ?, habits = ?
            WHERE user_id = ?
        `, [gender, date_of_birth, height, weight, blood_type, home_location, blood_pressure, allergies, chronic_conditions, own_diagnosis, health_barriers, habits, req.user.id]);
        await db.run('COMMIT');

        res.json({ message: 'Profile updated successfully' });
    } catch (err) {
        await db.run('ROLLBACK');
        res.status(500).json({ error: err.message });
    }
});


// =============================================================================
// MEDICAL RECORDS & PRESCRIPTIONS API (/api/v1/medical_records)
// =============================================================================

// Get all medical records for logged-in patient
app.get('/api/v1/medical_records', authenticateToken, authorize('patient'), async (req, res) => {
    try {
        const records = await knex('medical_records')
            .where({ patient_id: req.user.id })
            .orderBy('created_at', 'desc');
            
        // Fetch prescriptions for each record
        for (let record of records) {
            record.prescriptions = await knex('prescriptions')
                .where({ medical_record_id: record.id });
        }
        res.json(records);
    } catch (err) {
        res.status(500).json({ error: err.message });
    }
});

// Create a new medical record
app.post('/api/v1/medical_records', authenticateToken, authorize('patient', 'hospital', 'admin'), async (req, res) => {
    const { patient_id, diagnosis, treatment_plan, clinical_notes, prescriptions } = req.body;
    
    // If patient is creating it, force patient_id to be themselves
    const targetPatientId = req.user.role === 'patient' ? req.user.id : patient_id;
    
    if (!targetPatientId) {
        return res.status(400).json({ error: 'patient_id is required' });
    }
    
    try {
        await knex.transaction(async trx => {
            const inserted = await trx('medical_records').insert({
                patient_id: targetPatientId,
                hospital_id: req.user.role === 'hospital' ? req.user.id : null,
                diagnosis,
                treatment_plan,
                clinical_notes
            }).returning('id');
            
            const recordId = typeof inserted[0] === 'object' ? inserted[0].id : inserted[0];

            if (prescriptions && prescriptions.length > 0) {
                const prescriptionsToInsert = prescriptions.map(p => ({
                    medical_record_id: recordId,
                    patient_id: targetPatientId,
                    medication_name: p.medication_name,
                    indication: p.indication,
                    sig: p.sig,
                    status: p.status || 'active',
                    start_date: p.start_date,
                    assigned_by: p.assigned_by || req.user.name
                }));
                await trx('prescriptions').insert(prescriptionsToInsert);
            }
        });
        
        res.status(201).json({ message: 'Medical record created successfully' });
    } catch (err) {
        res.status(500).json({ error: err.message });
    }
});

// Update a medical record
app.put('/api/v1/medical_records/:id', authenticateToken, authorize('patient', 'hospital', 'admin'), async (req, res) => {
    const { diagnosis, treatment_plan, clinical_notes, status } = req.body;
    try {
        await knex('medical_records')
            .where({ id: req.params.id })
            .update({ diagnosis, treatment_plan, clinical_notes, status, updated_at: knex.fn.now() });
        res.json({ message: 'Medical record updated' });
    } catch (err) {
        res.status(500).json({ error: err.message });
    }
});

// Delete a medical record
app.delete('/api/v1/medical_records/:id', authenticateToken, authorize('patient', 'hospital', 'admin'), async (req, res) => {
    try {
        await knex('medical_records').where({ id: req.params.id }).del();
        res.json({ message: 'Medical record deleted' });
    } catch (err) {
        res.status(500).json({ error: err.message });
    }
});


// =============================================================================
// TRIPS & REAL-TIME DISPATCH API (/api/v1/trips)
// =============================================================================

const tripTimeouts = new Map();

// Request a new trip (Patient)
app.post('/api/v1/trips/request', authenticateToken, authorize('patient'), async (req, res) => {
    const { pickup_lat, pickup_lng, hospital_id } = req.body;
    
    if (!pickup_lat || !pickup_lng || !hospital_id) {
        return res.status(400).json({ error: 'pickup_lat, pickup_lng, and hospital_id are required' });
    }

    try {
        // Find nearest available driver
        const availableDrivers = await knex('drivers').where({ status: 'available' });

        if (availableDrivers.length === 0) {
            return res.status(404).json({ error: 'No available drivers found nearby' });
        }

        // Simple Euclidean distance for simulation (or Haversine if preferred)
        let nearestDriver = null;
        let minDistance = Infinity;

        availableDrivers.forEach(driver => {
            if (driver.current_lat && driver.current_lng) {
                // Approximate distance calculation
                const dist = Math.sqrt(
                    Math.pow(driver.current_lat - pickup_lat, 2) + 
                    Math.pow(driver.current_lng - pickup_lng, 2)
                );
                if (dist < minDistance) {
                    minDistance = dist;
                    nearestDriver = driver;
                }
            }
        });

        if (!nearestDriver) {
            // Fallback to the first available if no coords
            nearestDriver = availableDrivers[0];
        }

        // Create the trip
        const inserted = await knex('trips').insert({
            patient_id: req.user.id,
            driver_id: nearestDriver.user_id, // nearestDriver.user_id references users.id
            hospital_id,
            pickup_lat,
            pickup_lng,
            status: 'requested',
            start_time: knex.fn.now()
        }).returning('id');
        
        const tripId = typeof inserted[0] === 'object' ? inserted[0].id : inserted[0];

        const io = req.app.get('io');
        if (io) {
            io.to(`driver_${nearestDriver.user_id}`).emit('trip:new_request', {
                trip_id: tripId,
                pickup_lat,
                pickup_lng,
                hospital_id,
                patient_id: req.user.id
            });
        }

        // 60-second timeout to auto-cancel or reassign if not accepted
        const timeoutId = setTimeout(async () => {
            try {
                const trip = await knex('trips').where({ id: tripId }).first();
                if (trip && trip.status === 'requested') {
                    await knex('trips').where({ id: tripId }).update({ status: 'cancelled' });
                    if (io) {
                        io.to(`patient_${req.user.id}`).emit('trip:timeout', {
                            trip_id: tripId,
                            message: 'No driver accepted the request in time.'
                        });
                        io.to(`driver_${nearestDriver.user_id}`).emit('trip:cancelled', {
                            trip_id: tripId,
                            message: 'Trip request timed out.'
                        });
                    }
                }
                tripTimeouts.delete(tripId);
            } catch (err) {
                console.error('Timeout error:', err);
            }
        }, 60000);
        
        tripTimeouts.set(tripId, timeoutId);

        res.status(201).json({
            message: 'Trip requested successfully',
            trip_id: tripId,
            driver_id: nearestDriver.user_id
        });

    } catch (err) {
        res.status(500).json({ error: err.message });
    }
});

// Accept a trip (Driver)
app.post('/api/v1/trips/:id/accept', authenticateToken, authorize('driver'), async (req, res) => {
    try {
        const trip = await knex('trips').where({ id: req.params.id }).first();
        if (!trip || trip.driver_id !== req.user.id || trip.status !== 'requested') {
            return res.status(400).json({ error: 'Invalid trip or already processed' });
        }

        await knex('trips').where({ id: req.params.id }).update({ status: 'accepted' });
        await knex('drivers').where({ user_id: req.user.id }).update({ status: 'busy' });

        if (tripTimeouts.has(trip.id)) {
            clearTimeout(tripTimeouts.get(trip.id));
            tripTimeouts.delete(trip.id);
        }

        const io = req.app.get('io');
        if (io) {
            io.to(`patient_${trip.patient_id}`).emit('trip:accepted', {
                trip_id: trip.id,
                driver_id: req.user.id
            });

            // Notify the targeted hospital about the incoming ambulance
            io.to(`hospital_${trip.hospital_id}`).emit('hospital:incoming_alert', {
                trip_id: trip.id,
                patient_id: trip.patient_id,
                driver_id: req.user.id,
                status: 'accepted',
                message: 'An ambulance has accepted a request and is heading to your facility.'
            });
            console.log(`[Socket.IO] Hospital ${trip.hospital_id} alerted about incoming trip ${trip.id}`);
        }

        res.json({ message: 'Trip accepted successfully' });
    } catch (err) {
        res.status(500).json({ error: err.message });
    }
});

// Reject a trip (Driver)
app.post('/api/v1/trips/:id/reject', authenticateToken, authorize('driver'), async (req, res) => {
    try {
        const trip = await knex('trips').where({ id: req.params.id }).first();
        if (!trip || trip.driver_id !== req.user.id || trip.status !== 'requested') {
            return res.status(400).json({ error: 'Invalid trip or already processed' });
        }

        // Ideally, here we would re-run the driver matching for the next nearest driver.
        // For now, we'll mark it as cancelled.
        await knex('trips').where({ id: req.params.id }).update({ status: 'cancelled' });

        if (tripTimeouts.has(trip.id)) {
            clearTimeout(tripTimeouts.get(trip.id));
            tripTimeouts.delete(trip.id);
        }

        const io = req.app.get('io');
        if (io) {
            io.to(`patient_${trip.patient_id}`).emit('trip:rejected', {
                trip_id: trip.id,
                message: 'Driver was unavailable, trip cancelled.'
            });
        }

        res.json({ message: 'Trip rejected successfully' });
    } catch (err) {
        res.status(500).json({ error: err.message });
    }
});

// Update trip status (Driver)
app.put('/api/v1/trips/:id/status', authenticateToken, authorize('driver'), async (req, res) => {
    const { status } = req.body;
    const allowedStatuses = ['heading_to_patient', 'arrived', 'heading_to_hospital', 'at_hospital', 'completed', 'cancelled'];
    
    if (!allowedStatuses.includes(status)) {
        return res.status(400).json({ error: 'Invalid status' });
    }

    try {
        const trip = await knex('trips').where({ id: req.params.id }).first();
        if (!trip || trip.driver_id !== req.user.id) {
            return res.status(404).json({ error: 'Trip not found or unauthorized' });
        }

        const updateData = { status };
        if (status === 'completed') {
            updateData.end_time = knex.fn.now();
        }

        await knex('trips').where({ id: req.params.id }).update(updateData);

        // If trip is completed or cancelled, make driver available again
        if (status === 'completed' || status === 'cancelled') {
            await knex('drivers').where({ user_id: req.user.id }).update({ status: 'available' });
        }

        const io = req.app.get('io');
        if (io) {
            // Notify patient
            io.to(`patient_${trip.patient_id}`).emit('trip:status_update', {
                trip_id: trip.id,
                status
            });
            // Notify hospital
            io.to(`hospital_${trip.hospital_id}`).emit('hospital:trip_update', {
                trip_id: trip.id,
                status
            });
        }

        res.json({ message: `Trip status updated to ${status}` });
    } catch (err) {
        res.status(500).json({ error: err.message });
    }
});


// =============================================================================
// ADMIN EXPORT API (/api/v1/admin/export)
// Used by excel_dashboard to download live data.
// =============================================================================
app.get('/api/v1/admin/export', authenticateToken, authorize('admin'), async (req, res) => {
    try {
        const hospitals = await knex('hospitals')
            .join('users', 'hospitals.user_id', 'users.id')
            .select(
                'users.created_at as Timestamp',
                'users.name as Hospital Name',
                'hospitals.hospital_type as Type',
                'hospitals.total_beds as Beds',
                'hospitals.district as District',
                'hospitals.state as State',
                'hospitals.reception_number as Emergency No',
                'hospitals.icu_beds as ICU Beds',
                'hospitals.ambulances as Ambulances',
                'users.email as Email'
            );

        const drivers = await knex('drivers')
            .join('users', 'drivers.user_id', 'users.id')
            .select(
                'users.created_at as Timestamp',
                'users.name as Driver Name',
                'users.phone as Mobile',
                'drivers.city as City',
                'drivers.state as State',
                'drivers.license_number as DL Number',
                'drivers.vehicle_type as Vehicle Type',
                'drivers.vehicle_number as RC Number',
                'drivers.status as Status'
            );

        const patients = await knex('patients')
            .join('users', 'patients.user_id', 'users.id')
            .select(
                'users.created_at as Timestamp',
                'users.name as Patient Name',
                'patients.gender as Gender',
                'patients.date_of_birth as DOB',
                'patients.home_location as Location',
                'patients.chronic_conditions as Diagnosis',
                'patients.weight as Weight',
                'patients.height as Height',
                'patients.blood_pressure as Blood Pressure'
            );

        res.json({ hospitals, drivers, patients });
    } catch (err) {
        res.status(500).json({ error: err.message });
    }
});


// =============================================================================
// DEV DASHBOARD API  (/api/data)
// Legacy-compatible — fetched by DeveloperDashboard/index.html via /api/data.
// Also accessible as /api/admin/data for the new API versioning plan.
// =============================================================================

async function fetchDashboardData(res) {
    const db = getDb();
    try {
        const patients = await db.all(`
            SELECT u.*, p.blood_group, p.medical_history, p.emergency_contact,
                   p.gender, p.date_of_birth, p.height, p.weight,
                   p.blood_pressure, p.home_location, p.allergies, p.chronic_conditions, p.own_diagnosis, p.health_barriers, p.habits
            FROM users u
            JOIN patients p ON u.id = p.user_id
            WHERE u.role = 'patient'
        `);

        const drivers = await db.all(`
            SELECT u.*, d.license_number, d.vehicle_number, d.status
            FROM users u
            JOIN drivers d ON u.id = d.user_id
            WHERE u.role = 'driver'
        `);

        const hospitals = await db.all(`
            SELECT u.*, h.address, h.total_beds, h.specialty
            FROM users u
            JOIN hospitals h ON u.id = h.user_id
            WHERE u.role = 'hospital'
        `);

        res.json({ patients, drivers, hospitals });
    } catch (error) {
        console.error('Database error:', error);
        res.status(500).json({ error: 'Failed to fetch data' });
    }
}

// Legacy endpoint (used by DeveloperDashboard/index.html when served at /dev)
app.get('/api/data', (req, res) => fetchDashboardData(res));

// Future-ready versioned endpoint (Admin only)
app.get('/api/admin/data', authenticateToken, authorize('admin'), (req, res) => fetchDashboardData(res));

// Update endpoint for Developer Dashboard
app.put('/api/admin/data', express.json(), async (req, res) => {
    const { role, id, field, value } = req.body;
    const db = getDb();

    // Validate inputs
    const allowedRoles = ['patient', 'driver', 'hospital'];
    if (!allowedRoles.includes(role)) return res.status(400).json({ error: 'Invalid role' });

    const userFields = ['name', 'email', 'phone'];
    const patientFields = ['blood_group', 'medical_history', 'emergency_contact', 'gender', 'date_of_birth', 'height', 'weight', 'blood_pressure', 'home_location', 'allergies', 'chronic_conditions', 'own_diagnosis', 'health_barriers', 'habits'];
    const driverFields = ['license_number', 'vehicle_number', 'status'];
    const hospitalFields = ['address', 'total_beds', 'specialty'];

    try {
        if (userFields.includes(field)) {
            await db.run(`UPDATE users SET ${field} = ? WHERE id = ?`, [value, id]);
        } else if (role === 'patient' && patientFields.includes(field)) {
            await db.run(`UPDATE patients SET ${field} = ? WHERE user_id = ?`, [value, id]);
        } else if (role === 'driver' && driverFields.includes(field)) {
            await db.run(`UPDATE drivers SET ${field} = ? WHERE user_id = ?`, [value, id]);
        } else if (role === 'hospital' && hospitalFields.includes(field)) {
            await db.run(`UPDATE hospitals SET ${field} = ? WHERE user_id = ?`, [value, id]);
        } else {
            return res.status(400).json({ error: 'Invalid field' });
        }
        res.json({ success: true });
    } catch (error) {
        console.error('Update error:', error);
        res.status(500).json({ error: 'Failed to update data' });
    }
});

// Delete endpoint for Developer Dashboard
app.delete('/api/admin/data', express.json(), async (req, res) => {
    const { id } = req.body;
    const db = getDb();
    if (!id) return res.status(400).json({ error: 'ID is required' });

    try {
        await db.run('DELETE FROM users WHERE id = ?', [id]);
        res.json({ success: true });
    } catch (error) {
        console.error('Delete error:', error);
        res.status(500).json({ error: 'Failed to delete user' });
    }
});

// =============================================================================
// HEALTH CHECK
// =============================================================================
app.get('/health', (req, res) => {
    res.json({ status: 'ok', server: 'RapidCare Unified Backend', port: PORT });
});

// =============================================================================
// START SERVER (after DB is ready)
// =============================================================================
async function startServer() {
    try {
        await initializeDB();
        server.listen(PORT, () => {
            console.log('');
            console.log('╔════════════════════════════════════════════════╗');
            console.log(`║   RapidCare Unified Backend — Port ${PORT}        ║`);
            console.log('╠════════════════════════════════════════════════╣');
            console.log(`║  Auth API :  http://localhost:${PORT}/api/v1/auth ║`);
            console.log(`║  Admin API:  http://localhost:${PORT}/api/data    ║`);
            console.log(`║  Dev Dash :  http://localhost:${PORT}/dev         ║`);
            console.log(`║  Health   :  http://localhost:${PORT}/health      ║`);
            console.log('╚════════════════════════════════════════════════╝');
            console.log('');
        });
    } catch (err) {
        console.error('Failed to start server:', err);
        process.exit(1);
    }
}

startServer();
