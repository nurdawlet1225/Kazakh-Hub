import React, { useState, useEffect } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import { signInWithPopup, signInWithRedirect, getRedirectResult, createUserWithEmailAndPassword, updateProfile } from 'firebase/auth';
import { auth, googleProvider, saveUserToFirestore } from '../utils/firebase';
import { apiService } from '../utils/api';
import { ensureNumericId, isNumericId } from '../utils/idConverter';
import { isCOOPBlockingPopups } from '../utils/errorSuppression';
import './Auth.css';

const Register: React.FC = () => {
  const navigate = useNavigate();
  const { t } = useTranslation();
  const [formData, setFormData] = useState({
    username: '',
    email: '',
    password: '',
    confirmPassword: '',
  });
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);
  const [googleLoading, setGoogleLoading] = useState(false);

  const processGoogleAuth = async (user: any) => {
    try {
      // Extract user info from Firebase
      const userData = {
        id: user.uid,
        username: user.displayName || user.email?.split('@')[0] || 'User',
        email: user.email || '',
        avatar: user.photoURL || '',
      };

      // Save user to localStorage FIRST - this is critical for login state
      localStorage.setItem('user', JSON.stringify(userData));
      
      // Save user to Firestore for search functionality (non-blocking)
      saveUserToFirestore(userData).catch((err) => {
        console.warn('Firestore save failed (non-critical):', err);
      });
      
      // Try to sync with backend (non-blocking for Google auth)
      // For Google auth, we only try to register, not login (since there's no password)
      apiService.register(
        userData.username,
        userData.email,
        '', // No password for Google auth
        userData.id // Firebase UID
      ).then((backendResponse) => {
        // Use numeric ID from backend instead of Firebase UID
        if (backendResponse?.user?.id) {
          userData.id = backendResponse.user.id;
          // Update localStorage with numeric ID
          localStorage.setItem('user', JSON.stringify(userData));
        }
      }).catch((err) => {
        // Backend sync is optional - user is already logged in via Firebase
        const errorMsg = err?.message || '';
        // If user already exists, try to get the numeric ID
        if (errorMsg.includes('already exists') || errorMsg.includes('User already exists')) {
          apiService.searchUsers(userData.email).then((foundUsers) => {
            if (foundUsers && foundUsers.length > 0) {
              userData.id = foundUsers[0].id;
              localStorage.setItem('user', JSON.stringify(userData));
            }
          }).catch(() => {
            // Ignore search errors
          });
        }
        console.log('Backend sync failed (non-critical for Google auth):', err);
      });

      // Ensure Firebase auth state is maintained
      // The user is already authenticated via signInWithPopup/Redirect
      
      // Dispatch custom event to notify other components of login
      window.dispatchEvent(new Event('userProfileUpdated'));
      
      // Redirect to home
      navigate('/');
    } catch (error) {
      console.error('Error processing Google auth:', error);
      setError('Тіркелу кезінде қате орын алды. Қайталап көріңіз.');
      setGoogleLoading(false);
    }
  };

  // Handle redirect result when page loads (for signInWithRedirect fallback)
  useEffect(() => {
    const handleRedirectResult = async () => {
      try {
        const result = await getRedirectResult(auth);
        if (result && result.user) {
          setGoogleLoading(true);
          await processGoogleAuth(result.user);
        }
      } catch (err: any) {
        console.error('Redirect result error:', err);
        setGoogleLoading(false);
        if (err.code === 'auth/operation-not-allowed') {
          setError('Google аутентификациясы қосылмаған. Firebase консольда қосыңыз.');
        } else if (err.code !== 'auth/popup-closed-by-user' && err.code !== 'auth/cancelled-popup-request') {
          setError('Google тіркелу қатесі');
        }
      }
    };

    handleRedirectResult();
  }, [navigate]);

  const handleGoogleSignIn = async () => {
    setError(null);
    setGoogleLoading(true);

    let isRedirecting = false;

    // Timeout to prevent infinite loading (30 seconds)
    const timeoutId = setTimeout(() => {
      setGoogleLoading(false);
      setError('Google тіркелу уақыт асып кетті. Қайталап көріңіз немесе email/password арқылы тіркеліңіз.');
    }, 30000);

    try {
      // Check if COOP is likely blocking popups - use redirect directly if so
      const coopBlocking = isCOOPBlockingPopups();
      
      if (coopBlocking) {
        // Use redirect directly if COOP is blocking
        isRedirecting = true;
        await signInWithRedirect(auth, googleProvider);
        // The redirect will be handled by useEffect above
        return;
      }

      // Try popup first
      const result = await signInWithPopup(auth, googleProvider);
      clearTimeout(timeoutId);
      await processGoogleAuth(result.user);
    } catch (err: any) {
      clearTimeout(timeoutId);
      
      // Suppress COOP-related console errors (they're expected and handled)
      const errMessage = err?.message || err?.toString() || '';
      const isCOOPError = 
        err.code === 'auth/popup-blocked' ||
        err.code === 'auth/popup-closed-by-user' ||
        err.code === 'auth/cancelled-popup-request' ||
        errMessage.includes('Cross-Origin-Opener-Policy') ||
        errMessage.includes('window.closed') ||
        errMessage.includes('window.close');
      
      // If popup fails due to COOP or popup blocking, fall back to redirect
      if (isCOOPError) {
        try {
          // Fall back to redirect method
          isRedirecting = true;
          await signInWithRedirect(auth, googleProvider);
          // The redirect will be handled by useEffect above
          // Keep loading state true as redirect will happen
          return;
        } catch (redirectErr: any) {
          isRedirecting = false;
          setGoogleLoading(false);
          setError('Google тіркелу қатесі. Браузер параметрлерін тексеріңіз немесе email/password арқылы тіркеліңіз.');
        }
      } else if (err.code === 'auth/operation-not-allowed') {
        setGoogleLoading(false);
        setError('Google аутентификациясы қосылмаған. Firebase консольда қосыңыз.');
      } else {
        setGoogleLoading(false);
        setError(err.message || 'Google тіркелу қатесі. Email/password арқылы тіркелуге тырысыңыз.');
      }
    } finally {
      clearTimeout(timeoutId);
      // Only set loading to false if we're not redirecting
      if (!isRedirecting) {
        setGoogleLoading(false);
      }
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);

    if (formData.password !== formData.confirmPassword) {
      setError('Құпия сөздер сәйкес келмейді');
      return;
    }

    if (formData.password.length < 6) {
      setError('Құпия сөз кемінде 6 таңбадан тұруы керек');
      return;
    }

    if (!formData.username.trim()) {
      setError('Пайдаланушы атын енгізіңіз');
      return;
    }

    if (!formData.email.trim()) {
      setError('Электрондық поштаны енгізіңіз');
      return;
    }

    // Basic email validation
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(formData.email)) {
      setError('Электрондық пошта дұрыс емес');
      return;
    }

    setLoading(true);

    try {
      // Register user with Firebase Authentication
      const userCredential = await createUserWithEmailAndPassword(
        auth,
        formData.email,
        formData.password
      );

      const user = userCredential.user;

      // Update Firebase user profile with username
      await updateProfile(user, {
        displayName: formData.username,
      });

      // Extract user info from Firebase
      const userData = {
        id: user.uid,
        username: formData.username,
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
      
      // Sync with backend - this is important for user to be searchable
      try {
        const backendResponse = await apiService.register(
          userData.username,
          userData.email,
          '', // No password for Firebase auth
          userData.id // Firebase UID
        );
        console.log('User successfully registered in backend');
        
        // Use numeric ID from backend instead of Firebase UID
        if (backendResponse?.user?.id && isNumericId(backendResponse.user.id)) {
          userData.id = backendResponse.user.id;
          // Update localStorage with numeric ID
          localStorage.setItem('user', JSON.stringify(userData));
        } else if (!isNumericId(userData.id)) {
          // Convert Firebase UID to numeric ID if backend didn't return numeric ID
          userData.id = ensureNumericId(userData.id);
          localStorage.setItem('user', JSON.stringify(userData));
        }
      } catch (err: any) {
        // Backend sync failed - show error but don't block registration
        const errorMsg = err?.message || 'Backend синхрондау қатесі';
        
        // If user already exists in backend, try to get the user's numeric ID
        if (errorMsg.includes('already exists') || errorMsg.includes('User already exists') || errorMsg.includes('Пайдаланушы бар')) {
          // User already exists - try to get user by email to get numeric ID
          try {
            const foundUsers = await apiService.searchUsers(userData.email);
            if (foundUsers && foundUsers.length > 0 && isNumericId(foundUsers[0].id)) {
              userData.id = foundUsers[0].id;
              localStorage.setItem('user', JSON.stringify(userData));
            } else if (!isNumericId(userData.id)) {
              // Convert Firebase UID to numeric ID if search didn't return numeric ID
              userData.id = ensureNumericId(userData.id);
              localStorage.setItem('user', JSON.stringify(userData));
            }
          } catch (searchErr) {
            console.log('Could not find existing user:', searchErr);
            // Convert Firebase UID to numeric ID if search failed
            if (!isNumericId(userData.id)) {
              userData.id = ensureNumericId(userData.id);
              localStorage.setItem('user', JSON.stringify(userData));
            }
          }
        } else {
          // Backend registration failed, but Firebase registration succeeded
          // Convert Firebase UID to numeric ID
          if (!isNumericId(userData.id)) {
            userData.id = ensureNumericId(userData.id);
            localStorage.setItem('user', JSON.stringify(userData));
          }
        }
      }
      
      // Final check: ensure ID is numeric before redirecting
      if (!isNumericId(userData.id)) {
        userData.id = ensureNumericId(userData.id);
        localStorage.setItem('user', JSON.stringify(userData));
      }
      
      // Redirect to home
      navigate('/');
    } catch (err: any) {
      // Only log if it's not an expected error
      if (err.code !== 'auth/email-already-in-use') {
        console.error('Registration error:', err);
      }
      
      let errorMessage = 'Тіркелу қатесі';
      
      if (err.code === 'auth/email-already-in-use') {
        errorMessage = 'Бұл электрондық пошта бойынша тіркелгі бар';
      } else if (err.code === 'auth/invalid-email') {
        errorMessage = 'Электрондық пошта дұрыс емес';
      } else if (err.code === 'auth/weak-password') {
        errorMessage = 'Құпия сөз тым әлсіз (кемінде 6 таңба)';
      } else if (err.code === 'auth/operation-not-allowed') {
        errorMessage = 'Email/Password аутентификациясы қосылмаған. Firebase консольда қосыңыз: https://console.firebase.google.com/project/kazakh-hub/authentication/providers. FIREBASE_SETUP.md файлын қараңыз.';
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
            <span className="hero-title-main">{t('header.appName')}</span>
            <span className="hero-title-sub">{t('footer.description')}</span>
          </h1>
          <p className="hero-description">
            Қазақстандық дамытушылар үшін код бөлісу, білім алмасу және бірлесіп жұмыс істеу платформасы
          </p>
          <div className="hero-features">
            <div className="hero-feature">
              <span className="feature-icon">💻</span>
              <span>{t('footer.codeSharing')}</span>
            </div>
            <div className="hero-feature">
              <span className="feature-icon">👥</span>
              <span>{t('footer.collaboration')}</span>
            </div>
            <div className="hero-feature">
              <span className="feature-icon">🚀</span>
              <span>{t('footer.fastDevelopment')}</span>
            </div>
          </div>
        </div>
      </div>
      
      <div className="landing-auth">
        <div className="auth-card">
          <h2 className="auth-title">Тіркелу</h2>
          <p className="auth-subtitle">Жаңа тіркелгі құрыңыз</p>

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
            {googleLoading ? 'Тіркелу...' : 'Google арқылы тіркелу'}
          </button>

          <div className="auth-divider">
            <span>немесе</span>
          </div>

          <form onSubmit={handleSubmit} className="auth-form">
            <div className="form-group">
              <label htmlFor="username">Пайдаланушы аты</label>
              <input
                id="username"
                type="text"
                value={formData.username}
                onChange={(e) => setFormData({ ...formData, username: e.target.value })}
                placeholder="Пайдаланушы атыңыз"
                required
              />
            </div>

            <div className="form-group">
              <label htmlFor="email">Электрондық пошта</label>
              <input
                id="email"
                type="email"
                value={formData.email}
                onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                placeholder="email@example.com"
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
                placeholder="Құпия сөз"
                required
                minLength={6}
              />
            </div>

            <div className="form-group">
              <label htmlFor="confirmPassword">Құпия сөзді растау</label>
              <input
                id="confirmPassword"
                type="password"
                value={formData.confirmPassword}
                onChange={(e) => setFormData({ ...formData, confirmPassword: e.target.value })}
                placeholder="Құпия сөзді қайталаңыз"
                required
              />
            </div>

            {error && (
              <div className={`form-error ${error.includes('Email/Password аутентификациясы қосылмаған') ? 'form-error-critical' : ''}`}>
                {error.includes('Email/Password аутентификациясы қосылмаған') ? (
                  <div>
                    <div style={{ marginBottom: '0.75rem', fontWeight: '600' }}>
                      ⚠️ Email/Password аутентификациясы қосылмаған
                    </div>
                    <div style={{ marginBottom: '0.75rem', fontSize: '0.85rem', opacity: 0.9 }}>
                      Firebase консольда Email/Password әдісін қосу керек. Төмендегі батырманы басып, Firebase консольға өтіңіз.
                    </div>
                    <a
                      href="https://console.firebase.google.com/project/kazakh-hub/authentication/providers"
                      target="_blank"
                      rel="noopener noreferrer"
                      style={{
                        display: 'inline-block',
                        background: 'linear-gradient(135deg, #3b82f6 0%, #2563eb 100%)',
                        color: 'white',
                        padding: '0.75rem 1.5rem',
                        borderRadius: '10px',
                        textDecoration: 'none',
                        fontWeight: '600',
                        fontSize: '0.9rem',
                        marginTop: '0.5rem',
                        transition: 'all 0.3s',
                        boxShadow: '0 4px 12px rgba(59, 130, 246, 0.3)'
                      }}
                      onMouseEnter={(e) => {
                        e.currentTarget.style.transform = 'translateY(-2px)';
                        e.currentTarget.style.boxShadow = '0 6px 16px rgba(59, 130, 246, 0.4)';
                      }}
                      onMouseLeave={(e) => {
                        e.currentTarget.style.transform = 'translateY(0)';
                        e.currentTarget.style.boxShadow = '0 4px 12px rgba(59, 130, 246, 0.3)';
                      }}
                    >
                      Firebase Console-ға ашу →
                    </a>
                    <div style={{ marginTop: '0.75rem', fontSize: '0.8rem', opacity: 0.8 }}>
                      Немесе FIREBASE_SETUP.md файлын қараңыз
                    </div>
                  </div>
                ) : (
                  error
                )}
              </div>
            )}

            <button type="submit" className="btn-primary" disabled={loading}>
              {loading ? 'Тіркелу...' : 'Тіркелу'}
            </button>
          </form>

          <p className="auth-footer">
            Тіркелгіңіз бар ма? <Link to="/login">Кіру</Link>
          </p>
        </div>
      </div>
    </div>
  );
};

export default Register;
