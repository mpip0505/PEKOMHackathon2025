const path = require('path');
const admin = require('firebase-admin');
const logger = require('../utils/logger');

let firebaseApp;

const initializeFirebase = () => {
  try {
    // Option 1: Using service account file (Development)
    if (process.env.FIREBASE_SERVICE_ACCOUNT_PATH) {
      const resolvedPath = path.isAbsolute(process.env.FIREBASE_SERVICE_ACCOUNT_PATH)
        ? process.env.FIREBASE_SERVICE_ACCOUNT_PATH
        : path.resolve(process.cwd(), process.env.FIREBASE_SERVICE_ACCOUNT_PATH);
      const serviceAccount = require(resolvedPath);
      
      firebaseApp = admin.initializeApp({
        credential: admin.credential.cert(serviceAccount),
        databaseURL: `https://${serviceAccount.project_id}.firebaseio.com`
      });
      
      logger.info(`Firebase initialized with service account: ${serviceAccount.project_id}`);
    }
    // Option 2: Using environment variables (Production)
    else if (process.env.FIREBASE_PROJECT_ID) {
      firebaseApp = admin.initializeApp({
        credential: admin.credential.cert({
          projectId: process.env.FIREBASE_PROJECT_ID,
          privateKey: process.env.FIREBASE_PRIVATE_KEY?.replace(/\\n/g, '\n'),
          clientEmail: process.env.FIREBASE_CLIENT_EMAIL,
        })
      });
      
      logger.info(`Firebase initialized with project: ${process.env.FIREBASE_PROJECT_ID}`);
    }
    // Option 3: Default credentials (Cloud Functions)
    else {
      firebaseApp = admin.initializeApp();
      logger.info('Firebase initialized with default credentials');
    }

    // Test Firestore connection
    const db = admin.firestore();
    db.settings({ ignoreUndefinedProperties: true });
    logger.info('✅ Firestore connected successfully');

    return firebaseApp;
  } catch (error) {
    logger.error(`Firebase initialization failed: ${error.message}`);
    throw error;
  }
};

// Initialize Firebase
initializeFirebase();

// Export services
const db = admin.firestore();
const auth = admin.auth();
const storage = admin.storage();

module.exports = {
  admin,
  db,
  auth,
  storage,
  firebaseApp
};