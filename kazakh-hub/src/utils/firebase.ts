import { initializeApp } from 'firebase/app';
import { getAuth, GoogleAuthProvider } from 'firebase/auth';

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

// Google Auth Provider
export const googleProvider = new GoogleAuthProvider();

export default app;





