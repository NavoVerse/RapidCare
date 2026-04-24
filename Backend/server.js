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
const { getDb, initializeDB } = require('./db');
require('dotenv').config({ path: path.resolve(__dirname, '.env') });

const app  = express();
const PORT = process.env.PORT || 5000;
const JWT_SECRET = process.env.JWT_SECRET || 'super_secret_rapidcare_key_2026';

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

        console.log(`[OTP DEBUG] OTP for ${email}: ${otp}`);
        res.json({ message: 'OTP sent successfully (Check server console for debug OTP)' });
    } catch (err) {
        res.status(500).json({ error: err.message });
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
            SELECT u.*, p.blood_group, p.medical_history, p.emergency_contact
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
    const patientFields = ['blood_group', 'medical_history', 'emergency_contact'];
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
