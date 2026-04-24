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
const cors    = require('cors');
const bcrypt  = require('bcrypt');
const jwt     = require('jsonwebtoken');
const path    = require('path');
const nodemailer = require('nodemailer');
const { getDb, initializeDB } = require('./db');
require('dotenv').config({ path: path.resolve(__dirname, '.env') });

const app  = express();
const PORT = process.env.PORT || 5000;
const JWT_SECRET = process.env.JWT_SECRET || 'super_secret_rapidcare_key_2026';

// ── Mailer Setup ──────────────────────────────────────────────────────────────
let transporter;
if (process.env.SMTP_HOST && process.env.SMTP_USER) {
    transporter = nodemailer.createTransport({
        host: process.env.SMTP_HOST,
        port: process.env.SMTP_PORT || 587,
        auth: {
            user: process.env.SMTP_USER,
            pass: process.env.SMTP_PASS
        }
    });
} else {
    nodemailer.createTestAccount((err, account) => {
        if (!err) {
            transporter = nodemailer.createTransport({
                host: account.smtp.host,
                port: account.smtp.port,
                secure: account.smtp.secure,
                auth: { user: account.user, pass: account.pass }
            });
            console.log('Nodemailer: Created Ethereal test account for email delivery.');
        }
    });
}

// ── Global Middleware ──────────────────────────────────────────────────────────
app.use(cors());
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

// 1. Register New User
app.post('/api/v1/auth/register', validate(registerSchema), async (req, res) => {
    const { name, email, password, role, phone } = req.body;
    const db = getDb();

    try {
        const hashedPassword = await bcrypt.hash(password, 10);
        const result = await db.run(
            'INSERT INTO users (name, email, password, role, phone) VALUES (?, ?, ?, ?, ?)',
            [name, email, hashedPassword, role, phone]
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

    try {
        const user = await db.get('SELECT * FROM users WHERE email = ?', [email]);
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

    try {
        const user = await db.get('SELECT * FROM users WHERE email = ?', [email]);
        if (!user) {
            return res.status(404).json({ error: 'User not found. Please register first.' });
        }

        const otp = Math.floor(100000 + Math.random() * 900000).toString();
        const expiresAt = new Date(Date.now() + 10 * 60000); // 10 minutes

        await db.run('DELETE FROM otps WHERE email = ?', [email]);
        await db.run(
            'INSERT INTO otps (email, otp, expires_at) VALUES (?, ?, ?)',
            [email, otp, expiresAt.toISOString()]
        );

        if (transporter) {
            const info = await transporter.sendMail({
                from: '"RapidCare Admin" <no-reply@rapidcare.com>',
                to: email,
                subject: "Your RapidCare OTP",
                text: `Your one-time password is: ${otp}`,
                html: `<h3>RapidCare Verification</h3><p>Your one-time password is: <strong>${otp}</strong></p><p>It will expire in 10 minutes.</p>`
            });
            console.log(`[OTP DEBUG] OTP for ${email}: ${otp}`);
            if (!process.env.SMTP_HOST) {
                console.log(`[Nodemailer] Preview URL: ${nodemailer.getTestMessageUrl(info)}`);
            }
        } else {
            console.log(`[OTP DEBUG] Transporter not ready. OTP for ${email}: ${otp}`);
        }

        res.json({ message: 'OTP sent successfully (Check server console for preview URL)' });
    } catch (err) {
        console.error('Error sending OTP:', err);
        res.status(500).json({ error: 'Failed to send OTP' });
    }
});

// 4. Verify OTP
app.post('/api/v1/auth/verify-otp', validate(verifyOtpSchema), async (req, res) => {
    const { email, otp } = req.body;
    const db = getDb();

    try {
        const otpRecord = await db.get(
            'SELECT * FROM otps WHERE email = ? AND otp = ?',
            [email, otp]
        );

        if (!otpRecord) {
            return res.status(401).json({ error: 'Invalid OTP' });
        }
        if (new Date(otpRecord.expires_at) < new Date()) {
            return res.status(401).json({ error: 'OTP expired' });
        }

        const user = await db.get('SELECT * FROM users WHERE email = ?', [email]);
        await db.run('DELETE FROM otps WHERE email = ?', [email]);

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
                   p.allergies, p.chronic_conditions
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
    const { name, gender, date_of_birth, height, weight, blood_type, home_location, blood_pressure, allergies, chronic_conditions } = req.body;
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
                allergies = ?, chronic_conditions = ?
            WHERE user_id = ?
        `, [gender, date_of_birth, height, weight, blood_type, home_location, blood_pressure, allergies, chronic_conditions, req.user.id]);
        await db.run('COMMIT');
        
        res.json({ message: 'Profile updated successfully' });
    } catch (err) {
        await db.run('ROLLBACK');
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
                   p.blood_pressure, p.home_location, p.allergies, p.chronic_conditions
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
    const patientFields = ['blood_group', 'medical_history', 'emergency_contact', 'gender', 'date_of_birth', 'height', 'weight', 'blood_pressure', 'home_location', 'allergies', 'chronic_conditions'];
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
        app.listen(PORT, () => {
            console.log('');
            console.log('╔══════════════════════════════════════════════╗');
            console.log(`║   RapidCare Unified Backend — Port ${PORT}      ║`);
            console.log('╠══════════════════════════════════════════════╣');
            console.log(`║  Auth API :  http://localhost:${PORT}/api/v1/auth  ║`);
            console.log(`║  Admin API:  http://localhost:${PORT}/api/data  ║`);
            console.log(`║  Dev Dash :  http://localhost:${PORT}/dev       ║`);
            console.log(`║  Health   :  http://localhost:${PORT}/health    ║`);
            console.log('╚══════════════════════════════════════════════╝');
            console.log('');
        });
    } catch (err) {
        console.error('Failed to start server:', err);
        process.exit(1);
    }
}

startServer();
