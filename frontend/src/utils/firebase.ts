import { initializeApp } from 'firebase/app';
import { getAuth, GoogleAuthProvider } from 'firebase/auth';
import { getFirestore, collection, query, where, getDocs, limit, orderBy, startAt, doc, setDoc, getDoc } from 'firebase/firestore';

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

// Helper function to save/update user in Firestore
export const saveUserToFirestore = async (userData: { id: string; username: string; email: string; avatar?: string }) => {
  try {
    const userRef = doc(db, 'users', userData.id);
    await setDoc(userRef, {
      username: userData.username,
      email: userData.email,
      avatar: userData.avatar || null,
      updatedAt: new Date().toISOString()
    }, { merge: true }); // merge: true allows updating existing documents
  } catch (error) {
    console.error('Error saving user to Firestore:', error);
  }
};

export default app;





