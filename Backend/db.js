/**
 * RapidCare — Shared Database Module
 * 
 * Handles SQLite initialization for the unified Backend/server.js.
 * Reads schema from user_Database/schema.sql and ensures all base tables exist.
 */

const sqlite3 = require('sqlite3');
const { open }  = require('sqlite');
const fs        = require('fs');
const path      = require('path');
require('dotenv').config({ path: path.resolve(__dirname, '.env') });

const dbPath     = path.resolve(__dirname, process.env.DB_PATH || './user_Database/rapidcare.db');
const schemaPath = path.resolve(__dirname, './user_Database/schema.sql');

let db;

async function initializeDB() {
    db = await open({
        filename: dbPath,
        driver:   sqlite3.Database
    });

    console.log('Connected to SQLite database at:', dbPath);

    // Run the existing schema (CREATE TABLE IF NOT EXISTS — safe to re-run)
    if (fs.existsSync(schemaPath)) {
        const schema = fs.readFileSync(schemaPath, 'utf8');
        const statements = schema
            .split(';')
            .map(s => s.trim())
            .filter(s => s.length > 0);

        for (const stmt of statements) {
            try {
                await db.exec(stmt);
            } catch (err) {
                if (!err.message.includes('UNIQUE constraint')) {
                    console.warn('Schema warning:', err.message);
                }
            }
        }
        console.log('Base schema initialized.');
    }

    // Ensure OTPs table exists (may not be in legacy schema.sql)
    await db.exec(`
        CREATE TABLE IF NOT EXISTS otps (
            id         INTEGER PRIMARY KEY AUTOINCREMENT,
            email      TEXT    NOT NULL,
            otp        TEXT    NOT NULL,
            expires_at DATETIME NOT NULL,
            created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
        );
    `);
    console.log('OTPs table ensured.');

    return db;
}

module.exports = {
    getDb:        () => db,
    initializeDB
};
