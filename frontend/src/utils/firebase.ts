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

// Initialize Firebase
const app = initializeApp(firebaseConfig);

// Initialize Firebase Authentication and get a reference to the service
export const auth = getAuth(app);

// Initialize Firestore
export const db = getFirestore(app);

// Google Auth Provider
export const googleProvider = new GoogleAuthProvider();

// Track if Firestore is blocked to prevent repeated connection attempts
let firestoreBlocked = false;
let firestoreBlockCheckAttempts = 0;
const MAX_FIRESTORE_CHECK_ATTEMPTS = 3;

/**
 * Check if Firestore is blocked by ad blocker
 */
const checkFirestoreBlocked = (error: any): boolean => {
  const errorMessage = error?.message || error?.toString() || '';
  const errorCode = error?.code || '';
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
