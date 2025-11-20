import React, { useState, useEffect } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { signInWithPopup, signInWithRedirect, getRedirectResult, signInWithEmailAndPassword } from 'firebase/auth';
import { auth, googleProvider, saveUserToFirestore } from '../utils/firebase';
import { apiService } from '../utils/api';
import './Auth.css';

const Login: React.FC = () => {
  const navigate = useNavigate();
  
  // Сақталған логин деректерін жүктеу
  const savedEmail = localStorage.getItem('savedEmail') || '';
  const savedUsername = localStorage.getItem('savedUsername') || '';
  const savedLogin = savedEmail || savedUsername;
  
  const [formData, setFormData] = useState({
    emailOrUsername: savedLogin,
    password: '',
  });
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);
  const [googleLoading, setGoogleLoading] = useState(false);

  // Handle redirect result when page loads (for signInWithRedirect fallback)
  useEffect(() => {
    const handleRedirectResult = async () => {
      try {
        const result = await getRedirectResult(auth);
        if (result && result.user) {
          setGoogleLoading(true);
          const user = result.user;

          // Extract user info from Firebase
          const userData = {
            id: user.uid,
            username: user.displayName || user.email?.split('@')[0] || 'User',
            email: user.email || '',
            avatar: user.photoURL || '',
          };

          // Save user to localStorage
          localStorage.setItem('user', JSON.stringify(userData));
          
          // Save user to Firestore for search functionality
          await saveUserToFirestore(userData);
          
          // Optionally sync with your backend
          try {
            await apiService.register(
              userData.username,
              userData.email,
              '', // No password for Google auth
              userData.id // Firebase UID
            );
          } catch (err) {
            // User might already exist, try to login
            try {
              await apiService.login(userData.email, '');
            } catch (loginErr) {
              // If both fail, continue anyway since Firebase auth succeeded
              console.log('Backend sync failed, but Firebase auth succeeded:', loginErr);
            }
          }

          // Redirect to home
          navigate('/');
        }
      } catch (err: any) {
        console.error('Redirect result error:', err);
        setError('Google кіру қатесі');
      } finally {
        setGoogleLoading(false);
      }
    };

    handleRedirectResult();
  }, [navigate]);

  const processGoogleAuth = async (user: any) => {
    // Extract user info from Firebase
    const userData = {
      id: user.uid,
      username: user.displayName || user.email?.split('@')[0] || 'User',
      email: user.email || '',
      avatar: user.photoURL || '',
    };

    // Save user to localStorage
    localStorage.setItem('user', JSON.stringify(userData));
    
    // Save user to Firestore for search functionality
    await saveUserToFirestore(userData);
    
    // Optionally sync with your backend
    try {
      // Check if user exists in backend, if not create
      await apiService.register(
        userData.username,
        userData.email,
        '', // No password for Google auth
        userData.id // Firebase UID
      );
    } catch (err) {
      // User might already exist, try to login
      try {
        await apiService.login(userData.email, '');
      } catch (loginErr) {
        // If both fail, continue anyway since Firebase auth succeeded
        console.log('Backend sync failed, but Firebase auth succeeded:', loginErr);
      }
    }

    // Redirect to home
    navigate('/');
  };

  const handleGoogleSignIn = async () => {
    setError(null);
    setGoogleLoading(true);

    try {
      // Try popup first
      const result = await signInWithPopup(auth, googleProvider);
      await processGoogleAuth(result.user);
    } catch (err: any) {
      // If popup fails due to COOP or popup blocking, fall back to redirect
      if (
        err.code === 'auth/popup-blocked' ||
        err.code === 'auth/popup-closed-by-user' ||
        err.code === 'auth/cancelled-popup-request' ||
        err.message?.includes('Cross-Origin-Opener-Policy') ||
        err.message?.includes('window.closed')
      ) {
        try {
          // Fall back to redirect method
          await signInWithRedirect(auth, googleProvider);
          // The redirect will be handled by useEffect above
          return;
        } catch (redirectErr: any) {
          setError('Google кіру қатесі. Браузер параметрлерін тексеріңіз.');
        }
      } else if (err.code === 'auth/operation-not-allowed') {
        setError('Google аутентификациясы қосылмаған. Firebase консольда қосыңыз.');
      } else {
        setError(err.message || 'Google кіру қатесі');
      }
    } finally {
      setGoogleLoading(false);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);

    // Validation
    if (!formData.emailOrUsername.trim()) {
      setError('Ник немесе электрондық поштаны енгізіңіз');
      return;
    }

    if (!formData.password.trim()) {
      setError('Құпия сөзді енгізіңіз');
      return;
    }

    setLoading(true);

    try {
      // Determine if input is email or username
      const isEmail = formData.emailOrUsername.includes('@');
      let email = formData.emailOrUsername;

      // If username, try to find email from backend (for backward compatibility)
      if (!isEmail) {
        try {
          // Try to login with backend first to get email
          const response = await apiService.login(formData.emailOrUsername, formData.password);
          // If backend login succeeds, use that
          const userData = response.user;
          localStorage.setItem('user', JSON.stringify(userData));
          
          // Save user to Firestore for search functionality
          try {
            await saveUserToFirestore(userData);
          } catch (firestoreErr) {
            console.error('Failed to save user to Firestore:', firestoreErr);
            // Continue even if Firestore save fails
          }
          
          navigate('/');
          return;
        } catch (backendErr) {
          // If backend fails, try Firebase with username as email (might work if user registered with Firebase)
          email = formData.emailOrUsername;
        }
      }

      // Sign in with Firebase Authentication
      const userCredential = await signInWithEmailAndPassword(
        auth,
        email,
        formData.password
      );

      const user = userCredential.user;

      // Extract user info from Firebase
      const userData = {
        id: user.uid,
        username: user.displayName || user.email?.split('@')[0] || 'User',
        email: user.email || '',
        avatar: user.photoURL || '',
      };

      // Save user to localStorage
      localStorage.setItem('user', JSON.stringify(userData));
      
      // Save user to Firestore for search functionality
      try {
        await saveUserToFirestore(userData);
      } catch (firestoreErr) {
        console.error('Failed to save user to Firestore:', firestoreErr);
        // Continue even if Firestore save fails
      }
      
      // Optionally sync with your backend
      try {
        await apiService.login(userData.email, '');
      } catch (err) {
        // Backend sync failed, but Firebase auth succeeded
        console.log('Backend sync failed, but Firebase auth succeeded');
      }
      
      // Redirect to home
      navigate('/');
    } catch (err: any) {
      console.error('Login error:', err);
      let errorMessage = 'Кіру қатесі';
      
      if (err.code === 'auth/user-not-found') {
        errorMessage = 'Пайдаланушы табылмады. Тіркелгіңіз бар ма?';
      } else if (err.code === 'auth/wrong-password') {
        errorMessage = 'Құпия сөз дұрыс емес';
      } else if (err.code === 'auth/invalid-email') {
        errorMessage = 'Электрондық пошта дұрыс емес';
      } else if (err.code === 'auth/invalid-credential') {
        errorMessage = 'Электрондық пошта немесе құпия сөз дұрыс емес';
      } else if (err.code === 'auth/operation-not-allowed') {
        errorMessage = 'Email/Password аутентификациясы қосылмаған. Firebase консольда қосыңыз. FIREBASE_SETUP.md файлын қараңыз.';
      } else if (err.code === 'auth/network-request-failed') {
        errorMessage = 'Интернет байланысы жоқ. Интернетті тексеріңіз.';
      } else if (err.code === 'auth/too-many-requests') {
        errorMessage = 'Тым көп сұраулар. Кейінірек қайталаңыз.';
      } else if (err.message) {
        errorMessage = err.message;
      } else if (err.toString) {
        errorMessage = err.toString();
      }
      
      setError(errorMessage);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="landing-page">
      <div className="landing-hero">
        <div className="hero-content">
          <h1 className="hero-title">
            <span className="hero-title-main">Kazakh Hub</span>
            <span className="hero-title-sub">Код бөлісу және ынтымақтастық платформасы</span>
          </h1>
          <p className="hero-description">
            Қазақстандық дамытушылар үшін код бөлісу, білім алмасу және бірлесіп жұмыс істеу платформасы
          </p>
          <div className="hero-features">
            <div className="hero-feature">
              <span className="feature-icon">💻</span>
              <span>Код бөлісу</span>
            </div>
            <div className="hero-feature">
              <span className="feature-icon">👥</span>
              <span>Ынтымақтастық</span>
            </div>
            <div className="hero-feature">
              <span className="feature-icon">🚀</span>
              <span>Жылдам даму</span>
            </div>
          </div>
        </div>
      </div>
      
      <div className="landing-auth">
        <div className="auth-card">
          <h2 className="auth-title">Кіру</h2>
          <p className="auth-subtitle">Ник немесе электрондық поштаңызбен кіріңіз</p>

          <button
            type="button"
            onClick={handleGoogleSignIn}
            className="btn-google"
            disabled={googleLoading || loading}
          >
            <svg width="18" height="18" viewBox="0 0 18 18" fill="none">
              <path
                d="M17.64 9.2c0-.637-.057-1.251-.164-1.84H9v3.481h4.844c-.209 1.125-.843 2.078-1.796 2.717v2.258h2.908c1.702-1.567 2.684-3.874 2.684-6.615z"
                fill="#4285F4"
              />
              <path
                d="M9 18c2.43 0 4.467-.806 5.965-2.184l-2.908-2.258c-.806.54-1.837.86-3.057.86-2.35 0-4.34-1.587-5.053-3.716H.957v2.332C2.438 15.983 5.482 18 9 18z"
                fill="#34A853"
              />
              <path
                d="M3.947 10.702c-.18-.54-.282-1.117-.282-1.702s.102-1.162.282-1.702V4.966H.957C.348 6.175 0 7.55 0 9s.348 2.825.957 4.034l2.99-2.332z"
                fill="#FBBC05"
              />
              <path
                d="M9 3.58c1.321 0 2.508.454 3.44 1.345l2.582-2.58C13.463.891 11.426 0 9 0 5.482 0 2.438 2.017.957 4.966L3.947 7.3C4.66 5.163 6.65 3.58 9 3.58z"
                fill="#EA4335"
              />
            </svg>
            {googleLoading ? 'Кіру...' : 'Google арқылы кіру'}
          </button>

          <div className="auth-divider">
            <span>немесе</span>
          </div>

          <form onSubmit={handleSubmit} className="auth-form">
            <div className="form-group">
              <label htmlFor="emailOrUsername">Ник немесе электрондық пошта</label>
              <input
                id="emailOrUsername"
                type="text"
                value={formData.emailOrUsername}
                onChange={(e) => setFormData({ ...formData, emailOrUsername: e.target.value })}
                placeholder="Ник немесе email@example.com"
                required
              />
            </div>

            <div className="form-group">
              <label htmlFor="password">Құпия сөз</label>
              <input
                id="password"
                type="password"
                value={formData.password}
                onChange={(e) => setFormData({ ...formData, password: e.target.value })}
                placeholder="Құпия сөзіңізді енгізіңіз"
                required
              />
            </div>

            {error && (
              <div className="form-error">
                {error}
              </div>
            )}

            <button type="submit" className="btn-primary" disabled={loading}>
              {loading ? 'Кіру...' : 'Кіру'}
            </button>
          </form>

          <p className="auth-footer">
            Тіркелгіңіз жоқ па? <Link to="/register">Тіркелу</Link>
          </p>
        </div>
      </div>
    </div>
  );
};

export default Login;

