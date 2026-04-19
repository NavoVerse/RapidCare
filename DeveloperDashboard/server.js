const express = require('express');
const sqlite3 = require('sqlite3');
const { open } = require('sqlite');
const path = require('path');
const cors = require('cors');

const app = express();
const PORT = 3000;
const DB_PATH = path.resolve(__dirname, '../Backend/user_Database/rapidcare.db');

app.use(cors());
app.use(express.static(__dirname));

async function getDb() {
    return open({
        filename: DB_PATH,
        driver: sqlite3.Database
    });
}

// API Endpoint to get all data
app.get('/api/data', async (req, res) => {
    try {
        const db = await getDb();

        // Fetch Patients
        const patients = await db.all(`
            SELECT u.*, p.blood_group, p.medical_history, p.emergency_contact 
            FROM users u 
            JOIN patients p ON u.id = p.user_id 
            WHERE u.role = 'patient'
        `);

        // Fetch Drivers
        const drivers = await db.all(`
            SELECT u.*, d.license_number, d.vehicle_number, d.status 
            FROM users u 
            JOIN drivers d ON u.id = d.user_id 
            WHERE u.role = 'driver'
        `);

        // Fetch Hospitals
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
});

app.listen(PORT, () => {
    console.log(`Developer Dashboard running at http://localhost:${PORT}`);
});
