#!/usr/bin/env node

/**
 * RapidCare — Automatic Environment Setup Script
 *
 * Ensures every developer can go from `git clone` → `npm start` with zero friction.
 *
 * What it does:
 *   1. Checks for Node.js version compatibility
 *   2. Creates .env from .env.example if missing
 *   3. Installs npm dependencies if node_modules is missing or out-of-date
 *   4. Ensures the database directory exists
 *   5. Runs Knex migrations to bring the DB schema up to date
 *   6. Validates that critical env vars have non-placeholder values (warns only)
 *
 * Usage:
 *   node scripts/setup.js          — run manually
 *   Automatically called via:      npm run setup
 *   Also called by:                start_rapidcare.bat / setup.sh
 */

const fs = require('fs');
const path = require('path');
const { execSync } = require('child_process');

// ── Paths ────────────────────────────────────────────────────────────────────
const BACKEND_DIR = path.resolve(__dirname, '..');
const ENV_FILE = path.join(BACKEND_DIR, '.env');
const ENV_EXAMPLE = path.join(BACKEND_DIR, '.env.example');
const NODE_MODULES = path.join(BACKEND_DIR, 'node_modules');
const PACKAGE_JSON = path.join(BACKEND_DIR, 'package.json');
const PACKAGE_LOCK = path.join(BACKEND_DIR, 'package-lock.json');
const DB_DIR = path.join(BACKEND_DIR, 'user_Database');

// ── Helpers ──────────────────────────────────────────────────────────────────
const COLORS = {
    reset: '\x1b[0m',
    green: '\x1b[32m',
    yellow: '\x1b[33m',
    red: '\x1b[31m',
    cyan: '\x1b[36m',
    dim: '\x1b[2m',
    bold: '\x1b[1m',
};

function log(icon, msg) {
    console.log(`  ${icon}  ${msg}`);
}
function success(msg) { log(`${COLORS.green}✔${COLORS.reset}`, msg); }
function warn(msg) { log(`${COLORS.yellow}⚠${COLORS.reset}`, `${COLORS.yellow}${msg}${COLORS.reset}`); }
function fail(msg) { log(`${COLORS.red}✖${COLORS.reset}`, `${COLORS.red}${msg}${COLORS.reset}`); }
function info(msg) { log(`${COLORS.cyan}ℹ${COLORS.reset}`, msg); }
function step(num, total, msg) {
    console.log(`\n${COLORS.bold}[${num}/${total}]${COLORS.reset} ${msg}`);
}

function runCmd(cmd, opts = {}) {
    try {
        return execSync(cmd, {
            cwd: BACKEND_DIR,
            stdio: opts.silent ? 'pipe' : 'inherit',
            ...opts
        });
    } catch (err) {
        if (!opts.ignoreErrors) throw err;
        return null;
    }
}

// ── Main Setup ───────────────────────────────────────────────────────────────
async function main() {
    const TOTAL_STEPS = 5;

    console.log('');
    console.log(`${COLORS.bold}${COLORS.cyan}╔══════════════════════════════════════════════╗${COLORS.reset}`);
    console.log(`${COLORS.bold}${COLORS.cyan}║       🚑  RapidCare Environment Setup       ║${COLORS.reset}`);
    console.log(`${COLORS.bold}${COLORS.cyan}╚══════════════════════════════════════════════╝${COLORS.reset}`);

    // ── Step 1: Check Node.js version ────────────────────────────────────────
    step(1, TOTAL_STEPS, 'Checking Node.js version...');
    const nodeVersion = process.version;
    const major = parseInt(nodeVersion.slice(1).split('.')[0], 10);
    if (major < 18) {
        fail(`Node.js ${nodeVersion} is too old. RapidCare requires Node.js 18 or higher.`);
        fail('Download the latest LTS from https://nodejs.org/');
        process.exit(1);
    }
    success(`Node.js ${nodeVersion} — OK`);

    // ── Step 2: Create .env from .env.example ────────────────────────────────
    step(2, TOTAL_STEPS, 'Checking environment configuration...');
    if (!fs.existsSync(ENV_FILE)) {
        if (fs.existsSync(ENV_EXAMPLE)) {
            fs.copyFileSync(ENV_EXAMPLE, ENV_FILE);
            success('Created .env from .env.example');
            warn('Please review Backend/.env and fill in your SMTP credentials and secrets.');
        } else {
            // Create a minimal .env so the server can at least start
            const minimalEnv = [
                '# RapidCare Backend — Auto-generated .env',
                '# Please fill in real values for production use.',
                '',
                'PORT=5000',
                'NODE_ENV=development',
                'DB_TYPE=sqlite',
                'DB_PATH=./user_Database/rapidcare.db',
                'JWT_SECRET=dev_' + require('crypto').randomBytes(24).toString('hex'),
                'JWT_EXPIRY=24h',
                'ENCRYPTION_KEY=rapidcare_default_secret_key_32_c',
                '',
                '# SMTP (leave blank for development — OTPs will be logged to console)',
                'SMTP_HOST=',
                'SMTP_PORT=587',
                'SMTP_USER=',
                'SMTP_PASS=',
                'EMAIL_FROM="RapidCare Support <no-reply@rapidcare.com>"',
                ''
            ].join('\n');
            fs.writeFileSync(ENV_FILE, minimalEnv);
            success('Created a minimal .env (no .env.example found)');
            warn('Please review Backend/.env and configure your settings.');
        }
    } else {
        success('.env file exists');
    }

    // Validate critical env vars
    validateEnv();

    // ── Step 3: Install dependencies ─────────────────────────────────────────
    step(3, TOTAL_STEPS, 'Checking npm dependencies...');
    if (needsInstall()) {
        info('Installing dependencies (this may take a minute)...');
        runCmd('npm install');
        success('Dependencies installed');
    } else {
        success('Dependencies are up to date');
    }

    // ── Step 4: Ensure database directory ────────────────────────────────────
    step(4, TOTAL_STEPS, 'Checking database...');
    if (!fs.existsSync(DB_DIR)) {
        fs.mkdirSync(DB_DIR, { recursive: true });
        success('Created user_Database directory');
    } else {
        success('Database directory exists');
    }

    // ── Step 5: Run migrations ───────────────────────────────────────────────
    step(5, TOTAL_STEPS, 'Running database migrations...');
    try {
        runCmd('npx knex migrate:latest');
        success('Database schema is up to date');
    } catch (err) {
        warn('Migration encountered an issue (this may be OK on first run).');
        warn('The server will retry migrations on startup.');
    }

    // ── Done ─────────────────────────────────────────────────────────────────
    console.log('');
    console.log(`${COLORS.bold}${COLORS.green}╔══════════════════════════════════════════════╗${COLORS.reset}`);
    console.log(`${COLORS.bold}${COLORS.green}║         ✅  Setup Complete!                  ║${COLORS.reset}`);
    console.log(`${COLORS.bold}${COLORS.green}╚══════════════════════════════════════════════╝${COLORS.reset}`);
    console.log('');
    info(`Start the server:  ${COLORS.bold}npm start${COLORS.reset}`);
    info(`Or use the launcher: ${COLORS.bold}start_rapidcare.bat${COLORS.reset} (Windows)`);
    info(`                     ${COLORS.bold}./setup.sh${COLORS.reset} (Mac/Linux)`);
    console.log('');
}

/**
 * Checks whether npm install needs to run.
 * Returns true if:
 *   - node_modules doesn't exist
 *   - package-lock.json is newer than node_modules
 */
function needsInstall() {
    if (!fs.existsSync(NODE_MODULES)) return true;

    try {
        const lockStat = fs.statSync(PACKAGE_LOCK);
        const nmStat = fs.statSync(NODE_MODULES);
        // If package-lock.json was modified after node_modules was last touched,
        // dependencies are probably out of sync
        if (lockStat.mtimeMs > nmStat.mtimeMs) return true;
    } catch {
        // If we can't stat, just run install to be safe
        return true;
    }

    return false;
}

/**
 * Reads .env and warns about placeholder / empty values for critical keys.
 */
function validateEnv() {
    try {
        const envContent = fs.readFileSync(ENV_FILE, 'utf-8');
        const envVars = {};
        envContent.split('\n').forEach(line => {
            const trimmed = line.trim();
            if (!trimmed || trimmed.startsWith('#')) return;
            const eqIdx = trimmed.indexOf('=');
            if (eqIdx === -1) return;
            envVars[trimmed.slice(0, eqIdx)] = trimmed.slice(eqIdx + 1);
        });

        const criticalVars = [
            { key: 'JWT_SECRET', placeholders: ['your_jwt_secret_here', ''] },
            { key: 'PORT', placeholders: [''] },
        ];

        const optionalVars = [
            { key: 'SMTP_HOST', msg: 'Email OTPs will be logged to console instead of sent.' },
            { key: 'SMTP_USER', msg: 'Email OTPs will be logged to console instead of sent.' },
        ];

        criticalVars.forEach(({ key, placeholders }) => {
            const val = envVars[key];
            if (val === undefined || placeholders.includes(val)) {
                warn(`${key} is not set in .env — please update it before deploying.`);
            }
        });

        optionalVars.forEach(({ key, msg }) => {
            const val = envVars[key];
            if (!val) {
                info(`${key} is not configured. ${msg}`);
            }
        });
    } catch {
        // .env doesn't exist yet or can't be read — will be caught elsewhere
    }
}

// Run
main().catch(err => {
    fail(`Setup failed: ${err.message}`);
    process.exit(1);
});
