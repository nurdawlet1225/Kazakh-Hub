import { initializeApp } from 'firebase/app';
import { getAuth, GoogleAuthProvider } from 'firebase/auth';
import { getFirestore, doc, setDoc } from 'firebase/firestore';

const firebaseConfig = {
  apiKey: "AIzaSyCQV1oUnC4GISVmWPAk-fIk-3UOoEYBink",
  authDomain: "kazakh-hub.firebaseapp.com",
  projectId: "kazakh-hub",
  storageBucket: "kazakh-hub.firebasestorage.app",
  messagingSenderId: "669228897264",
  appId: "1:669228897264:web:095fe725a868d1eb768335",
  measurementId: "G-N2X6FB3KXN"
};

// Initialize Firebase
const app = initializeApp(firebaseConfig);

// Initialize Firebase Authentication and get a reference to the service
export const auth = getAuth(app);

// Initialize Firestore
export const db = getFirestore(app);

// Google Auth Provider
export const googleProvider = new GoogleAuthProvider();

/**
 * Helper function to save/update user in Firestore
 * 
 * Note: This function may fail silently if Firestore is blocked by ad blockers
 * (ERR_BLOCKED_BY_CLIENT errors). This is non-critical - the app will continue
 * to work using the backend API. User authentication and core functionality
 * do not depend on Firestore.
 */
export const saveUserToFirestore = async (userData: { id: string; username: string; email: string; avatar?: string }) => {
  try {
    const userRef = doc(db, 'users', userData.id);
    await setDoc(userRef, {
      username: userData.username,
      email: userData.email,
      avatar: userData.avatar || null,
      updatedAt: new Date().toISOString()
    }, { merge: true }); // merge: true allows updating existing documents
  } catch (error: any) {
    // Silently handle Firestore errors (may be blocked by ad blockers)
    // This is not critical for authentication to work
    const errorMessage = error?.message || error?.toString() || '';
    const errorCode = error?.code || '';
    const isBlocked = 
      errorCode === 'unavailable' || 
      errorCode === 'permission-denied' ||
      errorCode === 'cancelled' ||
      errorMessage.includes('BLOCKED_BY_CLIENT') ||
      errorMessage.includes('ERR_BLOCKED_BY_CLIENT') ||
      errorMessage.includes('network') ||
      errorMessage.includes('Failed to fetch') ||
      errorMessage.includes('firestore.googleapis.com');
    
    // Only log non-blocked errors (error suppression utility will handle console output)
    // Blocked errors are expected and non-critical
    if (!isBlocked) {
      // Error suppression will handle this if it's a known pattern
      console.warn('Firestore save failed (non-critical):', errorMessage);
    }
    // Silently ignore blocked errors - they don't affect app functionality
  }
};

export default app;