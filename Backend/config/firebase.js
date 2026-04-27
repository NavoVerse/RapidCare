const admin = require('firebase-admin');

// Ensure to add your firebaseServiceAccountKey.json in the Backend directory
// Or configure these variables in .env
let db;
try {
    const serviceAccount = require('../firebaseServiceAccountKey.json');
    admin.initializeApp({
        credential: admin.credential.cert(serviceAccount)
    });
    db = admin.firestore();
    console.log('Firebase initialized successfully.');
} catch (error) {
    console.log('Firebase Admin SDK warning: firebaseServiceAccountKey.json not found or invalid.');
    console.log('Payments will be stored in SQLite fallback or ignored if Firebase is not configured.');
    // Initialize without creds just to avoid crashes, though firestore won't work without it
    // admin.initializeApp(); 
}

module.exports = { admin, db };
