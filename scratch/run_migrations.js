const { initializeDB } = require('../Backend/db');

async function run() {
    try {
        console.log('Starting DB initialization and migrations...');
        await initializeDB();
        console.log('DB initialized successfully.');
        process.exit(0);
    } catch (err) {
        console.error('FAILED to initialize DB:', err);
        process.exit(1);
    }
}

run();
