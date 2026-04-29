const admin = require('firebase-admin');

const fs = require('fs');
const path = require('path');

let db;
try {
    let serviceAccount;
    const defaultPath = path.resolve(__dirname, '../firebaseServiceAccountKey.json');
    
    if (fs.existsSync(defaultPath)) {
        serviceAccount = require(defaultPath);
    } else {
        const backendDir = path.resolve(__dirname, '..');
        const files = fs.readdirSync(backendDir);
        const fbFile = files.find(f => f.toLowerCase().includes('firebase') && f.endsWith('.json') && f !== 'package.json');
        if (fbFile) {
            serviceAccount = require(path.resolve(backendDir, fbFile));
        } else {
            throw new Error('No Firebase JSON file found');
        }
    }

    if (admin.apps.length === 0) {
        admin.initializeApp({
            credential: admin.credential.cert(serviceAccount)
        });
    }
    db = admin.firestore();
    console.log('Firebase initialized successfully.');
} catch (error) {
    console.log('Firebase Admin SDK warning: No matching Firebase JSON file found.');
    console.log('Payments will be stored in SQLite fallback or ignored if Firebase is not configured.');
}

module.exports = { admin, db };
