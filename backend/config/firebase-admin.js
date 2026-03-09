import admin from 'firebase-admin';
import { readFileSync } from 'fs';
import { join } from 'path';

let serviceAccount;

try {
  // Option 1: Load from a JSON file (recommended for local development)
  // Ensure you download your service account JSON from Firebase Console
  // Settings > Project Settings > Service Accounts > Generate new private key
  const serviceAccountPath = process.env.FIREBASE_SERVICE_ACCOUNT_PATH || './firebase-service-account.json';
  serviceAccount = JSON.parse(readFileSync(serviceAccountPath, 'utf8'));
} catch (error) {
  // Option 2: Fallback to individual environment variables (better for production/CI/CD)
  if (process.env.FIREBASE_PROJECT_ID) {
    serviceAccount = {
      projectId: process.env.FIREBASE_PROJECT_ID,
      clientEmail: process.env.FIREBASE_CLIENT_EMAIL,
      privateKey: process.env.FIREBASE_PRIVATE_KEY?.replace(/\\n/g, '\n'),
    };
  } else {
    console.warn('⚠️ Firebase Admin service account not found. Firebase features will be disabled.');
  }
}

if (serviceAccount) {
  admin.initializeApp({
    credential: admin.credential.cert(serviceAccount),
  });
  console.log('✅ Firebase Admin SDK Initialized');
}

export default admin;
