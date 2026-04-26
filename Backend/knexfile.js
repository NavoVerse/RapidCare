/**
 * knexfile.js — Knex CLI configuration
 *
 * Used by:  npx knex migrate:latest
 *           npx knex migrate:rollback
 *           npx knex seed:run
 *
 * This mirrors the config in config/database.js so both
 * the running server and the CLI use the same settings.
 */

const path = require('path');
const fs = require('fs');
require('dotenv').config({ path: path.resolve(__dirname, '.env') });

const isProduction = process.env.DB_TYPE === 'postgresql';

if (!isProduction) {
    const dbDir = path.resolve(__dirname, './user_Database');
    if (!fs.existsSync(dbDir)) {
        fs.mkdirSync(dbDir, { recursive: true });
    }
}

module.exports = {
    development: {
        client: 'sqlite3',
        connection: {
            filename: path.resolve(__dirname, './user_Database/rapidcare.db')
        },
        useNullAsDefault: true,
        migrations: {
            directory: './migrations',
            tableName:  'knex_migrations'
        },
        seeds: {
            directory: './seeds'
        }
    },

    production: {
        client: 'pg',
        connection: {
            connectionString: process.env.DATABASE_URL,
            ssl: { rejectUnauthorized: false }
        },
        pool: { min: 2, max: 10 },
        migrations: {
            directory: './migrations',
            tableName:  'knex_migrations'
        },
        seeds: {
            directory: './seeds'
        }
    }
};
