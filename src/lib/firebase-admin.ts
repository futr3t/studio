
import admin from 'firebase-admin';

if (!admin.apps.length) {
  try {
    const privateKey = process.env.FIREBASE_PRIVATE_KEY;
    if (!privateKey) {
      throw new Error('The FIREBASE_PRIVATE_KEY environment variable is not set.');
    }
    if (!process.env.FIREBASE_PROJECT_ID) {
      throw new Error('The FIREBASE_PROJECT_ID environment variable is not set.');
    }
    if (!process.env.FIREBASE_CLIENT_EMAIL) {
      throw new Error('The FIREBASE_CLIENT_EMAIL environment variable is not set.');
    }

    admin.initializeApp({
      credential: admin.credential.cert({
        projectId: process.env.FIREBASE_PROJECT_ID,
        clientEmail: process.env.FIREBASE_CLIENT_EMAIL,
        privateKey: privateKey.replace(/\\n/g, '\n'),
      }),
    });
    console.log('Firebase Admin SDK initialized successfully.');
  } catch (error: any) {
    console.error('Firebase Admin SDK initialization error:', error.message);
    // Optionally, re-throw or handle more gracefully depending on needs
    // For example, if running in a context where Firebase might not always be needed:
    // if (process.env.NODE_ENV === 'production') throw error; 
  }
}

export const db = admin.firestore();
export default admin;
