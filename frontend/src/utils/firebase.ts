import { initializeApp } from 'firebase/app';
import { getAuth, GoogleAuthProvider } from 'firebase/auth';
import { getFirestore, doc, setDoc } from 'firebase/firestore';

// Firebase configuration from environment variables or fallback to defaults
const firebaseConfig = {
  apiKey: import.meta.env.VITE_FIREBASE_API_KEY || "AIzaSyCQV1oUnC4GISVmWPAk-fIk-3UOoEYBink",
  authDomain: import.meta.env.VITE_FIREBASE_AUTH_DOMAIN || "kazakh-hub.firebaseapp.com",
  projectId: import.meta.env.VITE_FIREBASE_PROJECT_ID || "kazakh-hub",
  storageBucket: import.meta.env.VITE_FIREBASE_STORAGE_BUCKET || "kazakh-hub.firebasestorage.app",
  messagingSenderId: import.meta.env.VITE_FIREBASE_MESSAGING_SENDER_ID || "669228897264",
  appId: import.meta.env.VITE_FIREBASE_APP_ID || "1:669228897264:web:095fe725a868d1eb768335",
  measurementId: import.meta.env.VITE_FIREBASE_MEASUREMENT_ID || "G-N2X6FB3KXN"
};

// Validate that all required Firebase config values are present
const requiredConfigKeys = ['apiKey', 'authDomain', 'projectId', 'storageBucket', 'messagingSenderId', 'appId'];
const missingKeys = requiredConfigKeys.filter(key => !firebaseConfig[key as keyof typeof firebaseConfig]);

if (missingKeys.length > 0) {
  console.error('Firebase configuration error: Missing required environment variables:', missingKeys);
  console.error('Please create a .env file in the frontend directory with the following variables:');
  console.error('VITE_FIREBASE_API_KEY=your-api-key');
  console.error('VITE_FIREBASE_AUTH_DOMAIN=your-auth-domain');
  console.error('VITE_FIREBASE_PROJECT_ID=your-project-id');
  console.error('VITE_FIREBASE_STORAGE_BUCKET=your-storage-bucket');
  console.error('VITE_FIREBASE_MESSAGING_SENDER_ID=your-sender-id');
  console.error('VITE_FIREBASE_APP_ID=your-app-id');
  console.error('VITE_FIREBASE_MEASUREMENT_ID=your-measurement-id (optional)');
  throw new Error(`Firebase configuration is incomplete. Missing: ${missingKeys.join(', ')}`);
}

// Validate API key format (should start with AIza)
if (firebaseConfig.apiKey && !firebaseConfig.apiKey.startsWith('AIza')) {
  console.warn('⚠️ Firebase API key format appears invalid. API keys should start with "AIza"');
  console.warn('Please verify your API key in Firebase Console: https://console.firebase.google.com/');
}

// Log configuration status (without exposing full API key)
if (firebaseConfig.apiKey) {
  const apiKeyPreview = firebaseConfig.apiKey.substring(0, 10) + '...';
  console.log('✅ Firebase config loaded:', {
    apiKey: apiKeyPreview,
    authDomain: firebaseConfig.authDomain,
    projectId: firebaseConfig.projectId
  });
  
  // Check if API key looks valid
  if (firebaseConfig.apiKey.length < 30) {
    console.error('❌ Firebase API key appears to be too short. Please verify it in Firebase Console.');
  }
}

// Initialize Firebase with error handling
let app;
let auth: ReturnType<typeof getAuth>;
let db: ReturnType<typeof getFirestore>;

try {
  app = initializeApp(firebaseConfig);
  auth = getAuth(app);
  db = getFirestore(app);
  console.log('✅ Firebase initialized successfully');
  
  // Monitor for invalid API key errors (these appear when making API calls, not during init)
  // We'll detect them in error handlers throughout the app
} catch (error: any) {
  const errorMessage = error?.message || error?.toString() || 'Unknown error';
  console.error('❌ Firebase initialization failed:', errorMessage);
  
  if (errorMessage.includes('api-key') || errorMessage.includes('API key')) {
    console.error('');
    console.error('🔧 API KEY ERROR - Follow these steps to fix:');
    console.error('');
    console.error('1. Go to Firebase Console: https://console.firebase.google.com/');
    console.error('2. Select your project: kazakh-hub');
    console.error('3. Click ⚙️ → Project settings → Your apps');
    console.error('4. Copy the apiKey from the config snippet');
    console.error('5. Update VITE_FIREBASE_API_KEY in frontend/.env');
    console.error('6. Go to Google Cloud Console: https://console.cloud.google.com/');
    console.error('7. APIs & Services → Credentials → Find your API key');
    console.error('8. Edit API key → API restrictions: Enable "Firebase Authentication API"');
    console.error('9. Application restrictions: Set to "None" for development');
    console.error('10. Restart your dev server (npm run dev)');
    console.error('');
  }
  
  // Mark Firestore as blocked so app uses backend API only
  markFirestoreBlocked();
  // Re-throw to prevent app from running with invalid config
  // The app should handle this gracefully by using backend API
  throw error;
}

// Google Auth Provider
export const googleProvider = new GoogleAuthProvider();

// Export auth and db
export { auth, db };

// Track if Firestore is blocked to prevent repeated connection attempts
let firestoreBlocked = false;
let firestoreBlockCheckAttempts = 0;
const MAX_FIRESTORE_CHECK_ATTEMPTS = 3;

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
    // Log helpful message once
    if (!firestoreBlocked) {
      console.warn('');
      console.warn('⚠️ INVALID API KEY DETECTED');
      console.warn('The Firebase API key in your .env file appears to be invalid.');
      console.warn('The app will continue to work using the backend API, but Firebase features will be disabled.');
      console.warn('');
      console.warn('To fix this:');
      console.warn('1. Go to Firebase Console: https://console.firebase.google.com/');
      console.warn('2. Select your project: kazakh-hub');
      console.warn('3. Click ⚙️ → Project settings → Your apps');
      console.warn('4. Copy the apiKey from the config snippet');
      console.warn('5. Update VITE_FIREBASE_API_KEY in frontend/.env');
      console.warn('6. Restart your dev server');
      console.warn('');
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

/**
 * Check if Firestore is blocked (for use by other modules)
 */
export const isFirestoreBlocked = (): boolean => {
  return firestoreBlocked;
};

/**
 * Mark Firestore as blocked (called when blocking is detected)
 */
export const markFirestoreBlocked = () => {
  firestoreBlocked = true;
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
  // Skip Firestore if we've detected it's blocked
  if (firestoreBlocked) {
    return;
  }
  
  try {
    const userRef = doc(db, 'users', userData.id);
    await setDoc(userRef, {
      username: userData.username,
      email: userData.email,
      avatar: userData.avatar || null,
      updatedAt: new Date().toISOString()
    }, { merge: true }); // merge: true allows updating existing documents
    
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
    
    // Only log non-blocked errors (error suppression utility will handle console output)
    // Blocked errors are expected and non-critical
    const errorMessage = error?.message || error?.toString() || '';
    // Error suppression will handle this if it's a known pattern
    console.warn('Firestore save failed (non-critical):', errorMessage);
  }
};

export default app;
