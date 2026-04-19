const sqlite3 = require('sqlite3');
const { open } = require('sqlite');
const fs = require('fs');
const path = require('path');
require('dotenv').config();

const dbPath = path.resolve(__dirname, process.env.DB_PATH || '../user_Database/rapidcare.db');
const schemaPath = path.resolve(__dirname, '../user_Database/schema.sql');

async function initializeDB() {
    const db = await open({
        filename: dbPath,
        driver: sqlite3.Database
    });

    console.log('Connected to SQLite database at:', dbPath);

    // Run existing schema if tables don't exist
    if (fs.existsSync(schemaPath)) {
        const schema = fs.readFileSync(schemaPath, 'utf8');
        await db.exec(schema);
        console.log('Base schema initialized.');
    }

    // Add OTPs table for login system
    await db.exec(`
        CREATE TABLE IF NOT EXISTS otps (
            id INTEGER PRIMARY KEY AUTOINCREMENT,
            email TEXT NOT NULL,
            otp TEXT NOT NULL,
            expires_at DATETIME NOT NULL,
            created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
        );
    `);
    console.log('OTPs table ensured.');

    return db;
}

let db;
(async () => {
    db = await initializeDB();
})();

module.exports = {
    getDb: () => db,
    initializeDB
};
