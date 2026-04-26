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
const { initializeDB, knex } = require('./db');
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
    
    // Map email/phone input
    const { mappedEmail, mappedPhone } = mapEmailOrPhone(email);
    const finalPhone = mappedPhone || phone; // Prefer the one extracted from 'email' field if it was a phone number

    try {
        const hashedPassword = await bcrypt.hash(password, 10);
        
        const userId = await knex.transaction(async (trx) => {
            const [id] = await trx('users').insert({
                name,
                email: mappedEmail,
                password: hashedPassword,
                role,
                phone: finalPhone
            });

            // Initialize role-specific tables
            if (role === 'patient') {
                await trx('patients').insert({ user_id: id });
            } else if (role === 'driver') {
                await trx('drivers').insert({ user_id: id, status: 'available' });
            } else if (role === 'hospital') {
                await trx('hospitals').insert({ user_id: id });
            }
            return id;
        });

        res.status(201).json({ message: 'User registered successfully', userId });
    } catch (err) {
        if (err.message.includes('UNIQUE constraint failed') || err.message.includes('duplicate key value')) {
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

    try {
        const hashedPassword = await bcrypt.hash(password, 10);
        
        const userId = await knex.transaction(async (trx) => {
            const [id] = await trx('users').insert({
                name,
                email,
                password: hashedPassword,
                role: 'driver',
                phone
            });

            await trx('drivers').insert({
                user_id: id,
                status: 'available',
                license_number,
                vehicle_number,
                dob,
                alt_phone,
                address,
                city,
                state,
                pincode,
                aadhaar_number,
                pan_number
            });
            return id;
        });

        res.status(201).json({ message: 'Driver registered successfully', userId });
    } catch (err) {
        if (err.message.includes('UNIQUE constraint failed') || err.message.includes('duplicate key value')) {
            return res.status(400).json({ error: 'Email, license, or vehicle number already exists' });
        }
        res.status(500).json({ error: err.message });
    }
});

// 1c. Register Hospital (5-step form)
app.post('/api/v1/hospitals/register', async (req, res) => {
    const data = req.body;

    try {
        const hashedPassword = await bcrypt.hash(data.password, 10);
        
        const userId = await knex.transaction(async (trx) => {
            const [id] = await trx('users').insert({
                name: data.hospital_name,
                email: data.email,
                password: hashedPassword,
                role: 'hospital',
                phone: data.reception_number
            });

            await trx('hospitals').insert({
                user_id: id,
                address: data.address,
                city: data.district, // Note: using district as city per original code
                total_beds: data.total_beds,
                available_beds: data.total_beds,
                hospital_type: data.hospital_type,
                year_established: data.year_established,
                district: data.district,
                state: data.state,
                pincode: data.pincode,
                state_health_license: data.state_health_license,
                license_expiry: data.license_expiry,
                nabh_accreditation: data.nabh_accreditation,
                nabl_accreditation: data.nabl_accreditation,
                pharmacy_license: data.pharmacy_license,
                fire_noc: data.fire_noc,
                pan_tan: data.pan_tan,
                gst: data.gst,
                reception_number: data.reception_number,
                emergency_casualty_number: data.emergency_casualty_number,
                ambulance_dispatch_number: data.ambulance_dispatch_number,
                icu_helpline: data.icu_helpline,
                admin_billing_number: data.admin_billing_number,
                website: data.website,
                icu_beds: data.icu_beds || 0,
                nicu_beds: data.nicu_beds || 0,
                picu_beds: data.picu_beds || 0,
                ccu_beds: data.ccu_beds || 0,
                ventilators: data.ventilators || 0,
                dialysis: data.dialysis || 0,
                ot: data.ot || 0,
                ambulances: data.ambulances || 0,
                departments: JSON.stringify(data.departments || []),
                ayushman_bharat: data.ayushman_bharat,
                state_insurance: data.state_insurance,
                admin_name: data.admin_name,
                designation: data.designation
            });
            return id;
        });

        res.status(201).json({ message: 'Hospital registered successfully', userId });
    } catch (err) {
        if (err.message.includes('UNIQUE constraint failed') || err.message.includes('duplicate key value')) {
            return res.status(400).json({ error: 'Email or Contact already exists' });
        }
        res.status(500).json({ error: err.message });
    }
});

// 2. Login with Password
app.post('/api/v1/auth/login', loginLimiter, validate(loginSchema), async (req, res) => {
    const { email, password } = req.body;
    const { mappedEmail } = mapEmailOrPhone(email);

    try {
        const user = await knex('users').where({ email: mappedEmail }).first();
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
    const { mappedEmail } = mapEmailOrPhone(email);

    try {
        const user = await knex('users').where({ email: mappedEmail }).first();
        if (!user) {
            return res.status(404).json({ error: 'User not found. Please register first.' });
        }

        const otp = Math.floor(100000 + Math.random() * 900000).toString();
        const expiresAt = new Date(Date.now() + 10 * 60000); // 10 minutes

        await knex('otps').where({ email: mappedEmail }).del();
        await knex('otps').insert({
            email: mappedEmail,
            otp,
            expires_at: expiresAt.toISOString()
        });

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
    const { mappedEmail } = mapEmailOrPhone(email);

    try {
        const otpRecord = await knex('otps')
            .where({ email: mappedEmail, otp })
            .first();

        if (!otpRecord) {
            return res.status(401).json({ error: 'Invalid OTP' });
        }
        if (new Date(otpRecord.expires_at) < new Date()) {
            return res.status(401).json({ error: 'OTP expired' });
        }

        const user = await knex('users').where({ email: mappedEmail }).first();
        await knex('otps').where({ email: mappedEmail }).del();

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
    const { mappedEmail } = mapEmailOrPhone(email);

    if (!email || !otp || !newPassword || newPassword.length < 6) {
        return res.status(400).json({ error: 'Invalid input. Password must be at least 6 characters.' });
    }

    try {
        const otpRecord = await knex('otps')
            .where({ email: mappedEmail, otp })
            .first();

        if (!otpRecord) {
            return res.status(401).json({ error: 'Invalid OTP' });
        }
        if (new Date(otpRecord.expires_at) < new Date()) {
            return res.status(401).json({ error: 'OTP expired' });
        }

        const hashedPassword = await bcrypt.hash(newPassword, 10);
        await knex.transaction(async (trx) => {
            await trx('users').where({ email: mappedEmail }).update({ password: hashedPassword });
            await trx('otps').where({ email: mappedEmail }).del();
        });

        res.json({ message: 'Password reset successfully' });
    } catch (err) {
        res.status(500).json({ error: err.message });
    }
});

// 5. Get Profile (protected)
app.get('/api/v1/auth/profile', authenticateToken, authorize('patient', 'driver', 'hospital', 'admin'), async (req, res) => {
    try {
        const user = await knex('users')
            .select('id', 'name', 'email', 'role', 'phone', 'created_at')
            .where({ id: req.user.id })
            .first();
        res.json(user);
    } catch (err) {
        res.status(500).json({ error: err.message });
    }
});

app.get('/api/v1/patients/me', authenticateToken, authorize('patient'), async (req, res) => {
    try {
        const patient = await knex('users as u')
            .join('patients as p', 'u.id', 'p.user_id')
            .select(
                'u.name', 'u.email', 'u.phone', 'u.avatar_url',
                'p.gender', 'p.date_of_birth', 'p.height', 'p.weight',
                'p.blood_group as blood_type', 'p.home_location', 'p.blood_pressure',
                'p.allergies', 'p.chronic_conditions', 'p.own_diagnosis', 'p.health_barriers', 'p.habits',
                'p.chronic_disease', 'p.diabetes_emergencies', 'p.surgeries', 'p.family_history', 'p.diabetes_complications'
            )
            .where('u.id', req.user.id)
            .first();

        if (!patient) return res.status(404).json({ error: 'Patient profile not found' });
        res.json(patient);
    } catch (err) {
        res.status(500).json({ error: err.message });
    }
});

// 7. Update Patient Profile
app.put('/api/v1/patients/me', authenticateToken, authorize('patient'), async (req, res) => {
    const { 
        name, avatar_url, gender, date_of_birth, height, weight, blood_type, home_location, blood_pressure, 
        allergies, chronic_conditions, own_diagnosis, health_barriers, habits,
        chronic_disease, diabetes_emergencies, surgeries, family_history, diabetes_complications
    } = req.body;

    try {
        await knex.transaction(async (trx) => {
            const userUpdate = {};
            if (name !== undefined) userUpdate.name = name;
            if (avatar_url !== undefined) userUpdate.avatar_url = avatar_url;
            
            if (Object.keys(userUpdate).length > 0) {
                await trx('users').where({ id: req.user.id }).update(userUpdate);
            }

            await trx('patients').where({ user_id: req.user.id }).update({
                gender,
                date_of_birth,
                height,
                weight,
                blood_group: blood_type,
                home_location,
                blood_pressure,
                allergies,
                chronic_conditions,
                own_diagnosis,
                health_barriers,
                habits,
                chronic_disease,
                diabetes_emergencies,
                surgeries,
                family_history,
                diabetes_complications
            });
        });

        res.json({ message: 'Profile updated successfully' });
    } catch (err) {
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
    try {
        const patients = await knex('users as u')
            .join('patients as p', 'u.id', 'p.user_id')
            .select('u.*', 'p.blood_group', 'p.medical_history', 'p.emergency_contact',
                   'p.gender', 'p.date_of_birth', 'p.height', 'p.weight',
                   'p.blood_pressure', 'p.home_location', 'p.allergies', 'p.chronic_conditions', 'p.own_diagnosis', 'p.health_barriers', 'p.habits')
            .where('u.role', 'patient');

        const drivers = await knex('users as u')
            .join('drivers as d', 'u.id', 'd.user_id')
            .select('u.*', 'd.license_number', 'd.vehicle_number', 'd.status')
            .where('u.role', 'driver');

        const hospitals = await knex('users as u')
            .join('hospitals as h', 'u.id', 'h.user_id')
            .select('u.*', 'h.address', 'h.total_beds', 'h.specialty')
            .where('u.role', 'hospital');

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

    // Validate inputs
    const allowedRoles = ['patient', 'driver', 'hospital'];
    if (!allowedRoles.includes(role)) return res.status(400).json({ error: 'Invalid role' });

    const userFields = ['name', 'email', 'phone'];
    const patientFields = ['blood_group', 'medical_history', 'emergency_contact', 'gender', 'date_of_birth', 'height', 'weight', 'blood_pressure', 'home_location', 'allergies', 'chronic_conditions', 'own_diagnosis', 'health_barriers', 'habits'];
    const driverFields = ['license_number', 'vehicle_number', 'status'];
    const hospitalFields = ['address', 'total_beds', 'specialty'];

    try {
        if (userFields.includes(field)) {
            await knex('users').where({ id }).update({ [field]: value });
        } else if (role === 'patient' && patientFields.includes(field)) {
            await knex('patients').where({ user_id: id }).update({ [field]: value });
        } else if (role === 'driver' && driverFields.includes(field)) {
            await knex('drivers').where({ user_id: id }).update({ [field]: value });
        } else if (role === 'hospital' && hospitalFields.includes(field)) {
            await knex('hospitals').where({ user_id: id }).update({ [field]: value });
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
    if (!id) return res.status(400).json({ error: 'ID is required' });

    try {
        await knex('users').where({ id }).del();
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
