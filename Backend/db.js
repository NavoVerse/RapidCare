/**
 * RapidCare — Shared Database Module
 *
 * Exports TWO database interfaces:
 *
 *   1. knex      — Knex query builder (new, preferred going forward)
 *                  import: const knex = require('./db').knex;
 *                  or just: const knex = require('./config/database');
 *
 *   2. getDb()   — Raw sqlite async wrapper (legacy, used by server.js auth routes)
 *                  Kept alive so existing routes don't break while being migrated.
 *
 * On startup:
 *   - initializeDB() runs `knex migrate:latest` to apply any pending migrations.
 *   - Also opens the legacy sqlite connection for backward compatibility.
 */

const sqlite3   = require('sqlite3');
const { open }  = require('sqlite');
const path      = require('path');
require('dotenv').config({ path: path.resolve(__dirname, '.env') });

// ── Knex instance (single source of truth) ────────────────────────────────────
const knex = require('./config/database');

// ── Legacy sqlite connection (for existing auth routes in server.js) ──────────
const dbPath = path.resolve(__dirname, process.env.DB_PATH || './user_Database/rapidcare.db');
let legacyDb;

async function initializeDB() {
    // 1. Run Knex migrations (creates / updates tables as needed)
    console.log('Running Knex migrations...');
    await knex.migrate.latest();
    console.log('Migrations up to date.');

    // 2. Open legacy sqlite connection (keeps existing server.js routes working)
    legacyDb = await open({
        filename: dbPath,
        driver:   sqlite3.Database
    });
    console.log('Legacy SQLite connection opened at:', dbPath);

    return legacyDb;
}

module.exports = {
    knex,                       // Knex query builder — use this for new code
    getDb: () => legacyDb,      // Legacy sqlite wrapper — being phased out
    initializeDB
};
