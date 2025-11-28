import React, { useState, useEffect } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import { signInWithPopup, signInWithRedirect, getRedirectResult, signInWithEmailAndPassword } from 'firebase/auth';
import { auth, googleProvider, saveUserToFirestore } from '../utils/firebase';
import { apiService } from '../utils/api';
import { ensureNumericId, isNumericId } from '../utils/idConverter';
import { isCOOPBlockingPopups } from '../utils/errorSuppression';
import './Auth.css';

const Login: React.FC = () => {
  const navigate = useNavigate();
  const { t } = useTranslation();
  
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
        if (backendResponse?.user?.id && isNumericId(backendResponse.user.id)) {
          userData.id = backendResponse.user.id;
          // Update localStorage with numeric ID
          localStorage.setItem('user', JSON.stringify(userData));
        } else if (!isNumericId(userData.id)) {
          // If backend didn't return numeric ID, convert Firebase UID to numeric
          userData.id = ensureNumericId(userData.id);
          localStorage.setItem('user', JSON.stringify(userData));
        }
      }).catch((err) => {
        // Backend sync is optional - user is already logged in via Firebase
        const errorMsg = err?.message || '';
        // If user already exists, try to get the numeric ID
        if (errorMsg.includes('already exists') || errorMsg.includes('User already exists')) {
          apiService.searchUsers(userData.email).then((foundUsers) => {
            if (foundUsers && foundUsers.length > 0 && isNumericId(foundUsers[0].id)) {
              userData.id = foundUsers[0].id;
              localStorage.setItem('user', JSON.stringify(userData));
            } else if (!isNumericId(userData.id)) {
              // Convert Firebase UID to numeric ID if search didn't return numeric ID
              userData.id = ensureNumericId(userData.id);
              localStorage.setItem('user', JSON.stringify(userData));
            }
          }).catch(() => {
            // Ignore search errors, but convert ID to numeric
            if (!isNumericId(userData.id)) {
              userData.id = ensureNumericId(userData.id);
              localStorage.setItem('user', JSON.stringify(userData));
            }
          });
        } else if (!isNumericId(userData.id)) {
          // Convert Firebase UID to numeric ID if backend sync failed
          userData.id = ensureNumericId(userData.id);
          localStorage.setItem('user', JSON.stringify(userData));
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
      setError('Кіру кезінде қате орын алды. Қайталап көріңіз.');
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
          setError('Google кіру қатесі');
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
      setError('Google кіру уақыт асып кетті. Қайталап көріңіз немесе email/password арқылы кіріңіз.');
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
          setError('Google кіру қатесі. Браузер параметрлерін тексеріңіз немесе email/password арқылы кіріңіз.');
        }
      } else if (err.code === 'auth/operation-not-allowed') {
        setGoogleLoading(false);
        setError('Google аутентификациясы қосылмаған. Firebase консольда қосыңыз.');
      } else {
        setGoogleLoading(false);
        setError(err.message || 'Google кіру қатесі. Email/password арқылы кіруге тырысыңыз.');
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

    // Declare variables outside try block so they're accessible in catch
    const emailPattern = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    const isEmail = emailPattern.test(formData.emailOrUsername.trim()) || formData.emailOrUsername.includes('@');
    let email = formData.emailOrUsername.trim();
    let triedBackend = false;

    // Timeout to prevent infinite loading (30 seconds)
    const timeoutId = setTimeout(() => {
      if (loading) {
        setLoading(false);
        setError('Кіру уақыт асып кетті. Интернет байланысын тексеріңіз немесе қайталап көріңіз.');
      }
    }, 30000);

    try {
      // Determine if input is email or username
      // More strict email detection: must contain @ and have at least one character before and after @
      
      console.log('[LOGIN] Input type detection:', {
        input: email.substring(0, 3) + '***',
        isEmail,
        hasAt: formData.emailOrUsername.includes('@')
      });

      // Try backend login first (for backward compatibility with old users)
      // This works for both email and username
      try {
        // Add timeout to prevent infinite waiting on backend
        const backendLoginPromise = apiService.login(formData.emailOrUsername, formData.password);
        const backendTimeoutPromise = new Promise((_, reject) => {
          setTimeout(() => {
            reject(new Error('Backend login timeout'));
          }, 10000); // 10 seconds timeout for backend login
        });
        
        const response = await Promise.race([backendLoginPromise, backendTimeoutPromise]) as any;
        clearTimeout(timeoutId);
        // If backend login succeeds, use that (numeric ID from backend)
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
      } catch (backendErr: any) {
        // Backend login failed
        triedBackend = true;
        
        // If it's a username, we can't try Firebase (Firebase requires email)
        if (!isEmail) {
          clearTimeout(timeoutId);
          // Username login failed in backend, can't try Firebase with username
          // Provide helpful error message
          const helpfulError = new Error('Пайдаланушы табылмады немесе құпия сөз дұрыс емес. Егер сіз email арқылы тіркелген болсаңыз, email енгізіңіз (мысалы: user@example.com).');
          throw helpfulError;
        }
        
        // For email: try Firebase even if backend failed
        // Firebase will determine if user exists and if password is correct
        // If user exists in backend but password is wrong, Firebase will also fail
        // If user exists only in Firebase, Firebase will succeed
        email = formData.emailOrUsername.trim();
        // Don't throw error here - continue to Firebase authentication below
        // The error will only be shown if Firebase also fails
        // Suppress console log for expected backend failures
      }

      // Sign in with Firebase Authentication
      // This will only execute if backend failed (for email) or if it's an email login
      // Add timeout to prevent infinite waiting
      const firebaseAuthPromise = signInWithEmailAndPassword(
        auth,
        email,
        formData.password
      );
      
      const timeoutPromise = new Promise((_, reject) => {
        setTimeout(() => {
          reject(new Error('Кіру уақыт асып кетті. Интернет байланысын тексеріңіз немесе қайталап көріңіз.'));
        }, 20000); // 20 seconds timeout for Firebase auth
      });
      
      const userCredential = await Promise.race([firebaseAuthPromise, timeoutPromise]) as any;
      
      clearTimeout(timeoutId);

      const user = userCredential.user;

      // Extract user info from Firebase
      const userData = {
        id: user.uid,
        username: user.displayName || user.email?.split('@')[0] || 'User',
        email: user.email || '',
        avatar: user.photoURL || '',
      };

      // Try to get numeric ID from backend
      try {
        const backendResponse = await apiService.login(userData.email, '');
        if (backendResponse?.user?.id && isNumericId(backendResponse.user.id)) {
          // Use numeric ID from backend instead of Firebase UID
          userData.id = backendResponse.user.id;
        } else if (!isNumericId(userData.id)) {
          // Convert Firebase UID to numeric ID if backend didn't return numeric ID
          userData.id = ensureNumericId(userData.id);
        }
      } catch (err) {
        // Backend sync failed, but Firebase auth succeeded
        // Try to find user by email to get numeric ID
        try {
          const foundUsers = await apiService.searchUsers(userData.email);
          if (foundUsers && foundUsers.length > 0 && isNumericId(foundUsers[0].id)) {
            userData.id = foundUsers[0].id;
          } else if (!isNumericId(userData.id)) {
            // Convert Firebase UID to numeric ID if search didn't return numeric ID
            userData.id = ensureNumericId(userData.id);
          }
        } catch (searchErr) {
          console.log('Could not find user in backend:', searchErr);
          // Convert Firebase UID to numeric ID if search failed
          if (!isNumericId(userData.id)) {
            userData.id = ensureNumericId(userData.id);
          }
        }
        console.log('Backend sync failed, but Firebase auth succeeded');
      }

      // Ensure ID is numeric before saving
      if (!isNumericId(userData.id)) {
        userData.id = ensureNumericId(userData.id);
      }

      // Save user to localStorage (with numeric ID)
      localStorage.setItem('user', JSON.stringify(userData));
      
      // Save user to Firestore for search functionality
      try {
        await saveUserToFirestore(userData);
      } catch (firestoreErr) {
        console.error('Failed to save user to Firestore:', firestoreErr);
        // Continue even if Firestore save fails
      }
      
      // Redirect to home
      navigate('/');
    } catch (err: any) {
      // Only log if it's not a backend error that we're going to try Firebase for
      const isBackendErrorForEmail = !err.code && isEmail && triedBackend;
      
      if (!isBackendErrorForEmail) {
        console.error('Login error:', err);
      }
      
      let errorMessage = 'Кіру қатесі';
      
      // Handle Firebase auth errors
      if (err.code === 'auth/user-not-found') {
        errorMessage = 'Пайдаланушы табылмады. Тіркелгіңіз бар ма?';
      } else if (err.code === 'auth/wrong-password') {
        errorMessage = 'Құпия сөз дұрыс емес';
      } else if (err.code === 'auth/invalid-email') {
        errorMessage = 'Электрондық пошта дұрыс емес';
      } else if (err.code === 'auth/invalid-credential') {
        // If we tried backend first and it failed, this means both backend and Firebase failed
        if (triedBackend && isEmail) {
          errorMessage = 'Электрондық пошта немесе құпия сөз дұрыс емес. Төмендегілерді тексеріңіз: 1) Email дұрыс енгізілгенін тексеріңіз, 2) Құпия сөздің дұрыс енгізілгенін тексеріңіз (үлкен/кіші әріптер маңызды), 3) Егер тіркелгіңіз жоқ болса, "Тіркелу" батырмасын басып жаңа тіркелгі құрыңыз.';
        } else {
          errorMessage = 'Электрондық пошта немесе құпия сөз дұрыс емес. Тіркелгіңіздің бар екеніне және құпия сөзіңіздің дұрыс екеніне көз жеткізіңіз.';
        }
      } else if (err.code === 'auth/operation-not-allowed') {
        errorMessage = 'Email/Password аутентификациясы қосылмаған. Firebase консольда қосыңыз: https://console.firebase.google.com/project/kazakh-hub/authentication/providers. FIREBASE_SETUP.md файлын қараңыз.';
      } else if (err.code === 'auth/network-request-failed') {
        errorMessage = 'Интернет байланысы жоқ. Интернетті тексеріңіз.';
      } else if (err.code === 'auth/too-many-requests') {
        errorMessage = 'Тым көп сұраулар. Кейінірек қайталаңыз.';
      } 
      // Handle backend API errors (only show if we didn't try Firebase or if it's a username)
      else if (err.message && (err.message.includes('Пайдаланушы табылмады') || err.message.includes('құпия сөз дұрыс емес'))) {
        // If it's a username or we already tried Firebase, show the error
        if (!isEmail || !triedBackend) {
          errorMessage = err.message;
        } else {
          // This shouldn't happen if logic is correct, but just in case
          errorMessage = err.message;
        }
      }
      // Handle generic errors
      else if (err.message) {
        errorMessage = err.message;
      } else if (err.toString) {
        errorMessage = err.toString();
      }
      
      setError(errorMessage);
    } finally {
      clearTimeout(timeoutId);
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
          <h2 className="auth-title">Кіру</h2>
          <p className="auth-subtitle">Ник немесе электрондық поштаңызбен кіріңіз</p>

          <form onSubmit={handleSubmit} className="auth-form">
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

            <button type="submit" className="btn-primary" disabled={loading || googleLoading}>
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
