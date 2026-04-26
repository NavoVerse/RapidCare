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
const logger = require('./services/logger.service');

const app = express();
const server = http.createServer(app);
const io = new Server(server, {
    cors: { origin: '*' }
});

// Structured Logging Middleware
app.use((req, res, next) => {
    const start = Date.now();
    res.on('finish', () => {
        const duration = Date.now() - start;
        logger.info(`${req.method} ${req.originalUrl}`, {
            status: res.statusCode,
            duration: `${duration}ms`,
            ip: req.ip
        });
    });
    next();
});


// Expose io instance to routes if needed
app.set('io', io);

// Socket.IO event handling
io.on('connection', (socket) => {
    logger.info(`[Socket.IO] New client connected: ${socket.id}`);

    // Join room based on user role and id (e.g., patient_1, driver_5)
    socket.on('join', (data) => {
        const { userId, role } = data;
        if (userId && role) {
            socket.join(`${role}_${userId}`);
            logger.info(`[Socket.IO] User ${userId} (${role}) joined their room: ${role}_${userId}`);
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
            logger.error('[Socket.IO] Error in driver:location_update:', err);
        }
    });

    socket.on('disconnect', () => {
        logger.info(`[Socket.IO] Client disconnected: ${socket.id}`);
    });
});
const PORT = process.env.PORT || 5000;
const JWT_SECRET = process.env.JWT_SECRET || 'super_secret_rapidcare_key_2026';

// ── Services ────────────────────────────────────────────────────────────────
const notificationService = require('./services/notification.service');

// ── Global Middleware ──────────────────────────────────────────────────────────
app.use(cors());
app.use(express.json({ limit: '10mb' }));
app.use(express.urlencoded({ limit: '10mb', extended: true }));
app.use((req, res, next) => {
    res.header('Access-Control-Allow-Private-Network', 'true');
    next();
});

// Request Logging Middleware
app.use((req, res, next) => {
    logger.info(`${req.method} ${req.url}`, {
        ip: req.ip,
        userAgent: req.get('User-Agent')
    });
    next();
});

// ── Static: Frontend Modules ──────────────────────────────────────────────────
app.use('/shared_assets', express.static(path.resolve(__dirname, '../Frontend/shared_assets')));
app.use('/login', express.static(path.resolve(__dirname, '../Frontend/rapid_Care_Login')));
app.use('/dashboard', express.static(path.resolve(__dirname, '../Frontend/patient_Dashboard')));
app.use('/driver', express.static(path.resolve(__dirname, '../Frontend/driver_dashboard')));
app.use('/hospital-register', express.static(path.resolve(__dirname, '../Frontend/hospital_registration')));
app.use('/driver-register', express.static(path.resolve(__dirname, '../Frontend/driver_registration')));
app.use('/insurance', express.static(path.resolve(__dirname, '../Frontend/Insurance_Interface')));
app.use('/admin/export', express.static(path.resolve(__dirname, '../Frontend/excel_dashboard')));
app.use('/urgency', express.static(path.resolve(__dirname, '../Frontend/login_urgency')));
app.use('/dev', express.static(path.resolve(__dirname, '../Frontend/DeveloperDashboard')));
app.use('/', express.static(path.resolve(__dirname, '../Frontend/choose_User')));

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
            logger.debug(`[OTP DEBUG] OTP for ${email} (mapped: ${mappedEmail}): ${otp}`);
        } else {
            // Simulate SMS if it's a phone number
            logger.debug(`[OTP DEBUG] SMS Simulation. OTP for ${email} (mapped: ${mappedEmail}): ${otp}`);
        }

        res.json({ message: 'OTP sent successfully. Please check your email.' });
    } catch (err) {
        logger.error('Error sending OTP:', err);
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

        // Decrypt sensitive fields
        const sensitiveFields = [
            'allergies', 'chronic_conditions', 'own_diagnosis', 'health_barriers', 'habits',
            'chronic_disease', 'diabetes_emergencies', 'surgeries', 'family_history', 'diabetes_complications'
        ];
        sensitiveFields.forEach(field => {
            if (patient[field]) patient[field] = decrypt(patient[field]);
        });

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
            // ── Users table: only update fields that were sent ────────────
            const userUpdate = {};
            if (name !== undefined) userUpdate.name = name;
            if (avatar_url !== undefined) userUpdate.avatar_url = avatar_url;

            if (Object.keys(userUpdate).length > 0) {
                await trx('users').where({ id: req.user.id }).update(userUpdate);
            }

            // ── Patients table: only update fields that were sent ─────────
            const patientUpdate = {};
            if (gender !== undefined) patientUpdate.gender = gender;
            if (date_of_birth !== undefined) patientUpdate.date_of_birth = date_of_birth;
            if (height !== undefined) patientUpdate.height = height;
            if (weight !== undefined) patientUpdate.weight = weight;
            if (blood_type !== undefined) patientUpdate.blood_group = blood_type;
            if (home_location !== undefined) patientUpdate.home_location = home_location;
            if (blood_pressure !== undefined) patientUpdate.blood_pressure = blood_pressure;
            if (allergies !== undefined) patientUpdate.allergies = encrypt(allergies);
            if (chronic_conditions !== undefined) patientUpdate.chronic_conditions = encrypt(chronic_conditions);
            if (own_diagnosis !== undefined) patientUpdate.own_diagnosis = encrypt(own_diagnosis);
            if (health_barriers !== undefined) patientUpdate.health_barriers = encrypt(health_barriers);
            if (habits !== undefined) patientUpdate.habits = encrypt(habits);
            if (chronic_disease !== undefined) patientUpdate.chronic_disease = encrypt(chronic_disease);
            if (diabetes_emergencies !== undefined) patientUpdate.diabetes_emergencies = encrypt(diabetes_emergencies);
            if (surgeries !== undefined) patientUpdate.surgeries = encrypt(surgeries);
            if (family_history !== undefined) patientUpdate.family_history = encrypt(family_history);
            if (diabetes_complications !== undefined) patientUpdate.diabetes_complications = encrypt(diabetes_complications);

            if (Object.keys(patientUpdate).length > 0) {
                await trx('patients').where({ user_id: req.user.id }).update(patientUpdate);
            }
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
            record.diagnosis = decrypt(record.diagnosis);
            record.treatment_plan = decrypt(record.treatment_plan);
            record.clinical_notes = decrypt(record.clinical_notes);

            const prescriptions = await knex('prescriptions')
                .where({ medical_record_id: record.id });

            record.prescriptions = prescriptions.map(p => ({
                ...p,
                medication_name: decrypt(p.medication_name),
                indication: decrypt(p.indication),
                sig: decrypt(p.sig)
            }));
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
                diagnosis: encrypt(diagnosis),
                treatment_plan: encrypt(treatment_plan),
                clinical_notes: encrypt(clinical_notes)
            }).returning('id');

            const recordId = typeof inserted[0] === 'object' ? inserted[0].id : inserted[0];

            if (prescriptions && prescriptions.length > 0) {
                const prescriptionsToInsert = prescriptions.map(p => ({
                    medical_record_id: recordId,
                    patient_id: targetPatientId,
                    medication_name: encrypt(p.medication_name),
                    indication: encrypt(p.indication),
                    sig: encrypt(p.sig),
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
// PAYMENTS API (/api/v1/payments)
// =============================================================================

// Pricing Configuration (Keep in sync with frontend)
const pricingConfig = {
    normal: { rate: 70 },
    oxygen: { rate: 130 },
    icu: { rate: 180 },
    ventilator: { rate: 280 }
};
const FIXED_CHARGES = {
    hospitalReservation: 500,
    platformCharge: 40
};

// Calculate fare
app.post('/api/v1/payments/calculate', authenticateToken, async (req, res) => {
    const { distance, ambulanceType, couponCode } = req.body;

    if (!distance || !ambulanceType) {
        return res.status(400).json({ error: 'distance and ambulanceType are required' });
    }

    const config = pricingConfig[ambulanceType.toLowerCase()];
    if (!config) {
        return res.status(400).json({ error: 'Invalid ambulance type' });
    }

    try {
        const distanceCharge = Math.round(distance * config.rate);
        let total = distanceCharge + FIXED_CHARGES.hospitalReservation + FIXED_CHARGES.platformCharge;

        let discount = 0;
        if (couponCode) {
            const code = couponCode.toUpperCase();
            if (code === 'RAPID20') {
                discount = Math.round(total * 0.2);
                total -= discount;
            } else if (code === 'FIRSTCARE') {
                discount = 100;
                total -= discount;
            }
        }

        res.json({
            distanceCharge,
            hospitalReservation: FIXED_CHARGES.hospitalReservation,
            platformCharge: FIXED_CHARGES.platformCharge,
            discount,
            total,
            currency: 'INR'
        });
    } catch (err) {
        res.status(500).json({ error: err.message });
    }
});

// Record a payment
app.post('/api/v1/payments', authenticateToken, async (req, res) => {
    const { trip_id, amount, payment_method, transaction_id } = req.body;

    if (!trip_id || !amount || !payment_method) {
        return res.status(400).json({ error: 'trip_id, amount, and payment_method are required' });
    }

    try {
        await knex.transaction(async trx => {
            // 1. Insert payment record
            await trx('payments').insert({
                trip_id,
                patient_id: req.user.id,
                amount,
                payment_method,
                transaction_id,
                status: 'completed'
            });

            // 2. Update trip status
            await trx('trips')
                .where({ id: trip_id })
                .update({
                    payment_status: 'paid',
                    total_fare: amount
                });
        });

        res.status(201).json({ message: 'Payment recorded successfully' });
    } catch (err) {
        res.status(500).json({ error: err.message });
    }
});

// Get payment history for logged-in user
app.get('/api/v1/payments', authenticateToken, async (req, res) => {
    try {
        const payments = await knex('payments')
            .where({ patient_id: req.user.id })
            .orderBy('created_at', 'desc');
        res.json(payments);
    } catch (err) {
        res.status(500).json({ error: err.message });
    }
});




// =============================================================================
// DOCTORS & APPOINTMENTS API (/api/v1/doctors, /api/v1/appointments)
// =============================================================================

// Get all doctors
app.get('/api/v1/doctors', authenticateToken, async (req, res) => {
    try {
        const { specialization, hospital_id } = req.query;
        let query = knex('doctors');

        if (specialization) query = query.where({ specialization });
        if (hospital_id) query = query.where({ hospital_id });

        const doctors = await query.select('*');
        res.json(doctors);
    } catch (err) {
        res.status(500).json({ error: err.message });
    }
});

// Get single doctor
app.get('/api/v1/doctors/:id', authenticateToken, async (req, res) => {
    try {
        const doctor = await knex('doctors').where({ id: req.params.id }).first();
        if (!doctor) return res.status(404).json({ error: 'Doctor not found' });
        res.json(doctor);
    } catch (err) {
        res.status(500).json({ error: err.message });
    }
});

// Book an appointment
app.post('/api/v1/appointments', authenticateToken, authorize('patient'), async (req, res) => {
    const { doctor_id, appointment_date, type, notes } = req.body;

    if (!doctor_id || !appointment_date) {
        return res.status(400).json({ error: 'doctor_id and appointment_date are required' });
    }

    try {
        const doctor = await knex('doctors').where({ id: doctor_id }).first();
        if (!doctor) return res.status(404).json({ error: 'Doctor not found' });

        const [id] = await knex('appointments').insert({
            patient_id: req.user.id,
            doctor_id,
            hospital_id: doctor.hospital_id,
            appointment_date,
            type: type || 'in-person',
            notes,
            status: 'pending'
        }).returning('id');

        const appointmentId = typeof id === 'object' ? id.id : id;
        res.status(201).json({
            message: 'Appointment booked successfully',
            appointment_id: appointmentId
        });
    } catch (err) {
        res.status(500).json({ error: err.message });
    }
});

// Get patient's appointments
app.get('/api/v1/appointments', authenticateToken, async (req, res) => {
    try {
        const appointments = await knex('appointments')
            .join('doctors', 'appointments.doctor_id', 'doctors.id')
            .where({ 'appointments.patient_id': req.user.id })
            .select(
                'appointments.*',
                'doctors.name as doctor_name',
                'doctors.specialization as doctor_specialization'
            )
            .orderBy('appointment_date', 'asc');
        res.json(appointments);
    } catch (err) {
        res.status(500).json({ error: err.message });
    }
});

// Update appointment status (e.g., cancel)
app.put('/api/v1/appointments/:id', authenticateToken, async (req, res) => {
    const { status } = req.body;
    try {
        const appointment = await knex('appointments').where({ id: req.params.id }).first();
        if (!appointment) return res.status(404).json({ error: 'Appointment not found' });

        // Ensure user owns the appointment or is an admin/hospital
        if (req.user.role === 'patient' && appointment.patient_id !== req.user.id) {
            return res.status(403).json({ error: 'Unauthorized' });
        }

        await knex('appointments')
            .where({ id: req.params.id })
            .update({ status, updated_at: knex.fn.now() });

        res.json({ message: 'Appointment updated successfully' });
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
                logger.error('Timeout error:', err);
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
            logger.info(`[Socket.IO] Hospital ${trip.hospital_id} alerted about incoming trip ${trip.id}`);
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
// INSURANCE MODULE APIs
// =============================================================================

app.get('/api/v1/insurance/policies', authenticateToken, async (req, res) => {
    try {
        const policies = await knex('insurance_policies').where('patient_id', req.user.id);
        res.json(policies);
    } catch (err) { res.status(500).json({ error: 'Database error fetching policies' }); }
});

app.post('/api/v1/insurance/policies', authenticateToken, async (req, res) => {
    const { policy_number, provider_name, category, coverage_amount, portal_link } = req.body;
    try {
        const [id] = await knex('insurance_policies').insert({
            patient_id: req.user.id, policy_number, provider_name, category, coverage_amount, portal_link
        }).returning('id');
        const policyId = typeof id === 'object' ? id.id : id;
        res.status(201).json({ id: policyId, message: 'Policy added successfully' });
    } catch (err) { res.status(500).json({ error: 'Database error creating policy' }); }
});

app.get('/api/v1/insurance/claims', authenticateToken, async (req, res) => {
    try {
        const claims = await knex('insurance_claims as ic')
            .join('insurance_policies as ip', 'ic.policy_id', 'ip.id')
            .where('ic.patient_id', req.user.id)
            .select('ic.*', 'ip.provider_name as scheme_name');
        res.json(claims);
    } catch (err) { res.status(500).json({ error: 'Database error fetching claims' }); }
});

app.post('/api/v1/insurance/claims', authenticateToken, async (req, res) => {
    const { policy_id, amount, claim_type, hospital_id } = req.body;
    try {
        const reference_number = 'CLM-' + Math.random().toString(36).substr(2, 9).toUpperCase();
        const [id] = await knex('insurance_claims').insert({
            patient_id: req.user.id, policy_id, amount, claim_type, hospital_id, reference_number, status: 'pending'
        }).returning('id');
        const claimId = typeof id === 'object' ? id.id : id;
        res.status(201).json({ id: claimId, reference_number, message: 'Claim submitted' });
    } catch (err) { res.status(500).json({ error: 'Database error raising claim' }); }
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

const { encrypt, decrypt } = require('./utils/crypto');

async function fetchDashboardData(res) {
    try {
        const rawPatients = await knex('users as u')
            .join('patients as p', 'u.id', 'p.user_id')
            .select('u.*', 'p.blood_group', 'p.medical_history', 'p.emergency_contact',
                'p.gender', 'p.date_of_birth', 'p.height', 'p.weight',
                'p.blood_pressure', 'p.home_location', 'p.allergies', 'p.chronic_conditions', 'p.own_diagnosis', 'p.health_barriers', 'p.habits')
            .where('u.role', 'patient');

        // Decrypt medical fields
        const patients = rawPatients.map(p => ({
            ...p,
            medical_history: decrypt(p.medical_history),
            allergies: decrypt(p.allergies),
            chronic_conditions: decrypt(p.chronic_conditions),
            own_diagnosis: decrypt(p.own_diagnosis),
            habits: decrypt(p.habits)
        }));

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
        logger.error('Database error in fetchDashboardData', { error: error.message });
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
            let finalValue = value;
            const sensitiveFields = ['medical_history', 'allergies', 'chronic_conditions', 'own_diagnosis', 'habits'];
            if (sensitiveFields.includes(field)) {
                finalValue = encrypt(value);
            }
            await knex('patients').where({ user_id: id }).update({ [field]: finalValue });
        } else if (role === 'driver' && driverFields.includes(field)) {
            await knex('drivers').where({ user_id: id }).update({ [field]: value });
        } else if (role === 'hospital' && hospitalFields.includes(field)) {
            await knex('hospitals').where({ user_id: id }).update({ [field]: value });
        } else {
            return res.status(400).json({ error: 'Invalid field' });
        }
        res.json({ success: true });
    } catch (error) {
        logger.error('Update error:', error);
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
        logger.error('Delete error:', error);
        res.status(500).json({ error: 'Failed to delete user' });
    }
});

// =============================================================================
// HOSPITAL MODULE APIs
// =============================================================================

app.get('/api/v1/hospital/status', authenticateToken, authorize('hospital'), async (req, res) => {
    try {
        const hospital = await knex('hospitals').where('user_id', req.user.id).first();
        res.json({ total_beds: hospital.total_beds, available_beds: hospital.available_beds });
    } catch (err) { res.status(500).json({ error: 'Error fetching hospital status' }); }
});

app.put('/api/v1/hospital/status', authenticateToken, authorize('hospital'), async (req, res) => {
    const { available_beds } = req.body;
    try {
        await knex('hospitals').where('user_id', req.user.id).update({ available_beds });
        res.json({ message: 'Bed availability updated' });
    } catch (err) { res.status(500).json({ error: 'Error updating beds' }); }
});

app.get('/api/v1/hospital/incoming', authenticateToken, authorize('hospital'), async (req, res) => {
    try {
        const incoming = await knex('trips as t')
            .join('users as up', 't.patient_id', 'up.id')
            .join('users as ud', 't.driver_id', 'ud.id')
            .where('t.hospital_id', req.user.id)
            .whereIn('t.status', ['accepted', 'heading_to_patient', 'heading_to_hospital', 'at_hospital'])
            .select('t.*', 'up.name as patient_name', 'ud.name as driver_name');
        res.json(incoming);
    } catch (err) { res.status(500).json({ error: 'Error fetching incoming' }); }
});

// =============================================================================
// ANALYTICS MODULE APIs
// =============================================================================

app.get('/api/v1/analytics/patient', authenticateToken, async (req, res) => {
    try {
        const patientId = req.user.id;
        const trips = await knex('trips').where({ patient_id: patientId, status: 'completed' });

        let totalDistance = 0;
        let totalResponseTime = 0;

        trips.forEach(t => {
            const baseFees = 540;
            const distance = Math.max(0, (t.total_fare - baseFees) / 70);
            totalDistance += distance;

            if (t.start_time && t.end_time) {
                const start = new Date(t.start_time);
                const end = new Date(t.end_time);
                totalResponseTime += (end - start) / 1000;
            }
        });

        const avgResponseTime = trips.length > 0 ? (totalResponseTime / trips.length / 60).toFixed(1) : 0;

        res.json({
            metrics: {
                avg_response_time: parseFloat(avgResponseTime),
                total_distance: parseFloat(totalDistance.toFixed(1)),
                safety_score: 92,
                total_trips: trips.length
            }
        });
    } catch (err) { res.status(500).json({ error: 'Database error fetching analytics' }); }
});

// =============================================================================
// GLOBAL ERROR HANDLING MIDDLEWARE
// =============================================================================
app.use((err, req, res, next) => {
    logger.error(`${req.method} ${req.originalUrl} - ${err.message}`, {
        stack: err.stack,
        ip: req.ip
    });

    const statusCode = err.statusCode || 500;
    res.status(statusCode).json({
        error: process.env.NODE_ENV === 'production' ? 'Internal Server Error' : err.message,
        status: 'error'
    });
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
            logger.info(`🚀 RapidCare Unified Backend running on http://localhost:${PORT}`);
            logger.info(`🔐 Auth API: http://localhost:${PORT}/api/v1/auth`);
            logger.info(`🛠️ Admin API: http://localhost:${PORT}/api/data`);
            logger.info(`🖥️ Dev Dashboard: http://localhost:${PORT}/dev`);
            logger.info(`❤️ Health: http://localhost:${PORT}/health`);
        });
    } catch (err) {
        logger.error('Failed to start server:', err);
        process.exit(1);
    }
}


// Only start the server if this file is run directly
if (require.main === module) {
    startServer();
}

module.exports = { app, server, startServer };
