/**
 * RapidCare — Shared Database Module
 *
 * Exports the Knex query builder, which is the single source of truth
 * for database interactions in the application.
 */

const path = require('path');
require('dotenv').config({ path: path.resolve(__dirname, '.env') });

// ── Knex instance ─────────────────────────────────────────────────────────────
const knex = require('./config/database');

async function initializeDB() {
    // Run Knex migrations (creates / updates tables as needed)
    console.log('Checking database migrations...');
    try {
        await knex.migrate.latest();
        console.log('Database schema is up to date.');
    } catch (err) {
        console.error('Migration failed:', err);
        throw err;
    }
}

module.exports = {
    knex,
    initializeDB
};
