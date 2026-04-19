const express = require('express');
const cors = require('cors');
const bcrypt = require('bcrypt');
const jwt = require('jsonwebtoken');
const { getDb } = require('./db');
require('dotenv').config();

const app = express();
app.use(cors());
app.use(express.json());

const PORT = process.env.PORT || 5000;
const JWT_SECRET = process.env.JWT_SECRET || 'secret';

// --- MIDDLEWARE ---
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

// --- AUTH ROUTES ---

// 1. Register New User
app.post('/api/auth/register', async (req, res) => {
    const { name, email, password, role, phone } = req.body;
    const db = getDb();

    if (!name || !email || !password || !role) {
        return res.status(400).json({ error: 'Missing required fields' });
    }

    try {
        const hashedPassword = await bcrypt.hash(password, 10);
        const result = await db.run(
            'INSERT INTO users (name, email, password, role, phone) VALUES (?, ?, ?, ?, ?)',
            [name, email, hashedPassword, role, phone]
        );

        const userId = result.lastID;

        // Optionally initialize role-specific tables
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
app.post('/api/auth/login', async (req, res) => {
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

        const token = jwt.sign({ id: user.id, email: user.email, role: user.role }, JWT_SECRET, { expiresIn: '24h' });
        res.json({ message: 'Login successful', token, user: { id: user.id, name: user.name, email: user.email, role: user.role } });
    } catch (err) {
        res.status(500).json({ error: err.message });
    }
});

// 3. Request OTP
app.post('/api/auth/request-otp', async (req, res) => {
    const { email } = req.body;
    const db = getDb();

    try {
        const user = await db.get('SELECT * FROM users WHERE email = ?', [email]);
        if (!user) {
            return res.status(404).json({ error: 'User not found. Please register first.' });
        }

        // Generate a 6-digit OTP
        const otp = Math.floor(100000 + Math.random() * 900000).toString();
        const expiresAt = new Date(Date.now() + 10 * 60000); // 10 minutes expiry

        // Store OTP in database (Delete old ones for this email first)
        await db.run('DELETE FROM otps WHERE email = ?', [email]);
        await db.run('INSERT INTO otps (email, otp, expires_at) VALUES (?, ?, ?)', [email, otp, expiresAt.toISOString()]);

        console.log(`[OTP DEBUG] OTP for ${email}: ${otp}`); // For testing without email service

        res.json({ message: 'OTP sent successfully (Check console for debug)' });
    } catch (err) {
        res.status(500).json({ error: err.message });
    }
});

// 4. Verify OTP (Login with OTP)
app.post('/api/auth/verify-otp', async (req, res) => {
    const { email, otp } = req.body;
    const db = getDb();

    try {
        const otpRecord = await db.get('SELECT * FROM otps WHERE email = ? AND otp = ?', [email, otp]);
        
        if (!otpRecord) {
            return res.status(401).json({ error: 'Invalid OTP' });
        }

        if (new Date(otpRecord.expires_at) < new Date()) {
            return res.status(401).json({ error: 'OTP expired' });
        }

        // OTP is valid, get user details
        const user = await db.get('SELECT * FROM users WHERE email = ?', [email]);
        
        // Delete OTP after successful use
        await db.run('DELETE FROM otps WHERE email = ?', [email]);

        const token = jwt.sign({ id: user.id, email: user.email, role: user.role }, JWT_SECRET, { expiresIn: '24h' });
        res.json({ message: 'Login successful', token, user: { id: user.id, name: user.name, email: user.email, role: user.role } });
    } catch (err) {
        res.status(500).json({ error: err.message });
    }
});

// 5. Get Profile (Protected Example)
app.get('/api/auth/profile', authenticateToken, async (req, res) => {
    const db = getDb();
    try {
        const user = await db.get('SELECT id, name, email, role, phone, created_at FROM users WHERE id = ?', [req.user.id]);
        res.json(user);
    } catch (err) {
        res.status(500).json({ error: err.message });
    }
});

// Start Server after DB initialization
const startServer = async () => {
    // Wait for DB to be initialized if needed, though db.js handles it
    // But we need to ensure getDb() returns a valid db object
    // We can just add a small delay or use an event emitter
    setTimeout(() => {
        app.listen(PORT, () => {
            console.log(`Server running on http://localhost:${PORT}`);
        });
    }, 1000); 
};

startServer();
