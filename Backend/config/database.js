/**
 * RapidCare — Knex Database Configuration
 *
 * Development:  SQLite  (file: user_Database/rapidcare.db)
 * Production:   PostgreSQL (set DB_TYPE=postgresql and DATABASE_URL in .env)
 *
 * Usage:
 *   const knex = require('./config/database');
 *   const users = await knex('users').select('*');
 */

const path = require('path');
const fs = require('fs');
require('dotenv').config({ path: path.resolve(__dirname, '../.env') });

const isProduction = process.env.DB_TYPE === 'postgresql';

if (!isProduction) {
    const dbDir = path.resolve(__dirname, '../user_Database');
    if (!fs.existsSync(dbDir)) {
        fs.mkdirSync(dbDir, { recursive: true });
    }
}

const knex = require('knex')({
    client: isProduction ? 'pg' : 'better-sqlite3',

    connection: isProduction
        ? { connectionString: process.env.DATABASE_URL, ssl: { rejectUnauthorized: false } }
        : { filename: path.resolve(__dirname, '../user_Database/rapidcare.db') },

    // SQLite only: allow knex to manage foreign keys
    useNullAsDefault: true,

    // Migration + seed locations
    migrations: {
        directory: path.resolve(__dirname, '../migrations'),
        tableName:  'knex_migrations'
    },
    seeds: {
        directory: path.resolve(__dirname, '../seeds')
    },

    // Connection pool (ignored by SQLite, used by PostgreSQL)
    pool: { min: 2, max: 10 },

    // Pretty-print queries in development
    debug: process.env.NODE_ENV === 'development' && process.env.KNEX_DEBUG === 'true'
});

module.exports = knex;
