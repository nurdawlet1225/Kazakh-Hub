import { initializeApp, FirebaseApp } from 'firebase/app';
import { getAuth, Auth, GoogleAuthProvider } from 'firebase/auth';
import { getFirestore, Firestore } from 'firebase/firestore';
import { doc, setDoc } from 'firebase/firestore';

// Firebase configuration — will be initialized from SiteConfigContext
// No hardcoded API keys — these come from the backend /api/config endpoint
let app: FirebaseApp | null = null;
let auth: Auth | null = null;
let db: Firestore | null = null;
let isInitialized = false;

// Track if Firestore is blocked to prevent repeated connection attempts
let firestoreBlocked = false;
let firestoreBlockCheckAttempts = 0;
const MAX_FIRESTORE_CHECK_ATTEMPTS = 3;

/**
 * Mark Firestore as blocked (called when blocking is detected)
 */
export const markFirestoreBlocked = () => {
  firestoreBlocked = true;
};

/**
 * Initialize Firebase with configuration from the backend.
 * Call this once on app startup after fetching site config.
 */
export const initializeFirebase = (config: {
  apiKey: string;
  authDomain: string;
  projectId: string;
  storageBucket: string;
  messagingSenderId: string;
  appId: string;
  measurementId?: string;
}): boolean => {
  try {
    // Validate required config values
    const requiredKeys = ['apiKey', 'authDomain', 'projectId', 'storageBucket', 'messagingSenderId', 'appId'];
    const missingKeys = requiredKeys.filter(key => !config[key as keyof typeof config]);

    if (missingKeys.length > 0) {
      console.warn('Firebase config is incomplete. Missing:', missingKeys.join(', '));
      firestoreBlocked = true;
      return false;
    }

    // Validate API key format
    if (config.apiKey && !config.apiKey.startsWith('AIza')) {
      console.warn('Firebase API key format appears invalid. API keys should start with "AIza"');
    }

    const firebaseConfig = {
      apiKey: config.apiKey,
      authDomain: config.authDomain,
      projectId: config.projectId,
      storageBucket: config.storageBucket,
      messagingSenderId: config.messagingSenderId,
      appId: config.appId,
      ...(config.measurementId ? { measurementId: config.measurementId } : {}),
    };

    app = initializeApp(firebaseConfig);
    auth = getAuth(app);
    db = getFirestore(app);
    isInitialized = true;

    console.log('Firebase initialized successfully from backend config');
    return true;
  } catch (error: any) {
    const errorMessage = error?.message || error?.toString() || 'Unknown error';
    console.error('Firebase initialization failed:', errorMessage);

    firestoreBlocked = true;
    isInitialized = false;
    return false;
  }
};

/**
 * Check if Firebase has been initialized
 */
export const isFirebaseInitialized = (): boolean => {
  return isInitialized;
};

/**
 * Get Firebase Auth instance.
 * Returns null if Firebase is not initialized.
 */
export const getFirebaseAuth = (): Auth | null => {
  return auth;
};

/**
 * Get Firestore instance.
 * Returns null if Firebase is not initialized.
 */
export const getFirebaseDb = (): Firestore | null => {
  return db;
};

// Google Auth Provider — only create if initialized
let _googleProvider: GoogleAuthProvider | null = null;

/**
 * Get Google Auth Provider.
 * Returns null if Firebase is not initialized.
 */
export const getGoogleProvider = (): GoogleAuthProvider | null => {
  if (!isInitialized || !auth) return null;
  if (!_googleProvider) {
    _googleProvider = new GoogleAuthProvider();
  }
  return _googleProvider;
};

// Backward-compatible exports that throw if not initialized
// These maintain compatibility with code that directly imports `auth` and `db`
/** @deprecated Use getFirebaseAuth() instead */
export { auth };
/** @deprecated Use getFirebaseDb() instead */
export { db };

/**
 * Check if Firestore is blocked (for use by other modules)
 */
export const isFirestoreBlocked = (): boolean => {
  return firestoreBlocked;
};

/**
 * Helper function to save/update user in Firestore
 *
 * Note: This function may fail silently if Firestore is blocked by ad blockers
 * (ERR_BLOCKED_BY_CLIENT errors). This is non-critical - the app will continue
 * to work using the backend API. User authentication and core functionality
 * do not depend on Firestore.
 */
export const saveUserToFirestore = async (userData: { id: string; username: string; email: string; avatar?: string }) => {
  // Skip Firestore if we've detected it's blocked or not initialized
  if (firestoreBlocked || !isInitialized || !db) {
    return;
  }

  try {
    const userRef = doc(db, 'users', userData.id);
    await setDoc(userRef, {
      username: userData.username,
      email: userData.email,
      avatar: userData.avatar || null,
      updatedAt: new Date().toISOString()
    }, { merge: true });

    // Reset block check attempts on success
    firestoreBlockCheckAttempts = 0;
  } catch (error: any) {
    const isBlocked = checkFirestoreBlocked(error);

    if (isBlocked) {
      firestoreBlockCheckAttempts++;
      // After multiple blocked attempts, mark Firestore as blocked
      if (firestoreBlockCheckAttempts >= MAX_FIRESTORE_CHECK_ATTEMPTS) {
        firestoreBlocked = true;
        markFirestoreBlocked();
      }
      // Silently ignore blocked errors - they don't affect app functionality
      return;
    }

    const errorMessage = error?.message || error?.toString() || '';
    console.warn('Firestore save failed (non-critical):', errorMessage);
  }
};

/**
 * Check if Firestore is blocked by ad blocker or invalid API key
 */
const checkFirestoreBlocked = (error: any): boolean => {
  const errorMessage = error?.message || error?.toString() || '';
  const errorCode = error?.code || '';
  const errorString = JSON.stringify(error) || '';

  // Check for invalid API key errors
  const isInvalidApiKey =
    errorMessage.includes('API key not valid') ||
    errorMessage.includes('api-key-not-valid') ||
    errorMessage.includes('INVALID_ARGUMENT') ||
    errorCode === 'auth/api-key-not-valid' ||
    errorString.includes('API key not valid') ||
    errorString.includes('INVALID_ARGUMENT');

  if (isInvalidApiKey) {
    if (!firestoreBlocked) {
      console.warn('Firebase API key appears to be invalid. Falling back to backend API.');
    }
    return true;
  }

  return (
    errorCode === 'unavailable' ||
    errorCode === 'permission-denied' ||
    errorCode === 'cancelled' ||
    errorMessage.includes('BLOCKED_BY_CLIENT') ||
    errorMessage.includes('ERR_BLOCKED_BY_CLIENT') ||
    errorMessage.includes('net::ERR_BLOCKED_BY_CLIENT') ||
    errorMessage.includes('network') ||
    errorMessage.includes('Failed to fetch') ||
    errorMessage.includes('firestore.googleapis.com')
  );
};

export default app;