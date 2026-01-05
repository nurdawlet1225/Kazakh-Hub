import React, { useState, useRef, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import { faEye, faEyeSlash } from '@fortawesome/free-solid-svg-icons';
import { apiService } from '../utils/api';
import Button from '../components/Button';
import DragonAnimation from '../components/DragonAnimation';
import Parallax from 'parallax-js';
import './Auth.css';

const Login: React.FC = () => {
  const navigate = useNavigate();
  const { t } = useTranslation();
  const heroRef = useRef<HTMLDivElement>(null);
  
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
  const [showLoginForm, setShowLoginForm] = useState(false);
  const [showPassword, setShowPassword] = useState(false);
  const hoverTimeoutRef = useRef<NodeJS.Timeout | null>(null);
  const parallaxRef = useRef<Parallax | null>(null);
  const parallaxSceneRef = useRef<HTMLDivElement>(null);

  // Hide scrollbar on mount
  useEffect(() => {
    // Hide scrollbar on body and html
    const originalBodyOverflow = document.body.style.overflow;
    const originalHtmlOverflow = document.documentElement.style.overflow;
    const originalBodyHeight = document.body.style.height;
    const originalHtmlHeight = document.documentElement.style.height;
    
    document.body.style.overflow = 'hidden';
    document.body.style.height = '100vh';
    document.documentElement.style.overflow = 'hidden';
    document.documentElement.style.height = '100vh';
    
    return () => {
      // Restore original styles on unmount
      document.body.style.overflow = originalBodyOverflow;
      document.body.style.height = originalBodyHeight;
      document.documentElement.style.overflow = originalHtmlOverflow;
      document.documentElement.style.height = originalHtmlHeight;
    };
  }, []);

  // Initialize Parallax effect on landing-hero
  useEffect(() => {
    const sceneElement = parallaxSceneRef.current;
    const heroElement = heroRef.current;
    
    if (sceneElement && heroElement && !parallaxRef.current) {
      // Small delay to ensure DOM is ready
      const initTimer = setTimeout(() => {
        try {
          // Initialize parallax with hero element as input container
          parallaxRef.current = new Parallax(sceneElement, {
            relativeInput: true,
            hoverOnly: false,
            inputElement: heroElement,
            scalarX: 50.0,
            scalarY: 50.0,
            frictionX: 0.1,
            frictionY: 0.1,
            limitX: false,
            limitY: false,
            invertX: false,
            invertY: false,
            pointerEvents: true,
            clipRelativeInput: false,
            precision: 1,
          });
          console.log('✅ Parallax initialized successfully', {
            scene: sceneElement,
            input: heroElement,
            instance: parallaxRef.current
          });
        } catch (error) {
          console.error('❌ Parallax initialization error:', error);
        }
      }, 100);

      return () => {
        clearTimeout(initTimer);
        if (parallaxRef.current) {
          try {
            parallaxRef.current.destroy();
            console.log('Parallax destroyed');
          } catch (error) {
            console.error('Parallax destroy error:', error);
          }
          parallaxRef.current = null;
        }
      };
    }
  }, []);

  // Clear password when form is closed
  useEffect(() => {
    if (!showLoginForm) {
      setFormData(prev => ({ ...prev, password: '' }));
      setShowPassword(false);
      setError(null);
    }
  }, [showLoginForm]);

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
      // Login with backend API
      const response = await apiService.login(formData.emailOrUsername, formData.password);
      
      // Save user to localStorage
      const userData = response.user;
      localStorage.setItem('user', JSON.stringify(userData));
      
      // Dispatch custom event to notify other components of login
      window.dispatchEvent(new Event('userProfileUpdated'));
      
      // Redirect to home
      navigate('/');
    } catch (err: any) {
      console.error('Login error:', err);
      
      let errorMessage = 'Кіру қатесі';
      
      if (err.message) {
        if (err.message.includes('Invalid credentials') || err.message.includes('Пайдаланушы табылмады') || err.message.includes('құпия сөз дұрыс емес')) {
          errorMessage = 'Пайдаланушы табылмады немесе құпия сөз дұрыс емес';
        } else {
          errorMessage = err.message;
        }
      }
      
      setError(errorMessage);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="landing-page">
      <div className="landing-hero" ref={heroRef}>
        <div id="parallax-scene" ref={parallaxSceneRef}>
          {/* Deep background layer - moves slowest */}
          <div data-depth="0.1" className="parallax-layer">
            <div className="parallax-bg-layer">
              <div className="animated-stars"></div>
              <div className="animated-stars"></div>
              <div className="animated-stars"></div>
            </div>
          </div>
          
          {/* Background gradient layer */}
          <div data-depth="0.2" className="parallax-layer">
            <div className="parallax-gradient-layer"></div>
          </div>
          
          {/* Almaty 3D Mountains Background */}
          <div data-depth="0.15" className="parallax-layer">
            <div className="almaty-3d-scene">
              <div className="mountain-range mountain-back"></div>
              <div className="mountain-range mountain-middle"></div>
              <div className="mountain-range mountain-front"></div>
            </div>
          </div>
          
          {/* Almaty City Skyline */}
          <div data-depth="0.25" className="parallax-layer">
            <div className="almaty-city-skyline">
              <div className="building building-1"></div>
              <div className="building building-2"></div>
              <div className="building building-3"></div>
              <div className="building building-4"></div>
              <div className="building building-5"></div>
              <div className="building building-6"></div>
            </div>
          </div>
          
          {/* Geometric shapes layer */}
          <div data-depth="0.3" className="parallax-layer">
            <div className="geometric-shapes">
              <div className="shape shape-1"></div>
              <div className="shape shape-2"></div>
              <div className="shape shape-3"></div>
              <div className="shape shape-4"></div>
            </div>
          </div>
          
          {/* Dragon animation layer */}
          <div data-depth="0.4" className="parallax-layer">
            <DragonAnimation containerRef={heroRef} forceOrbit={showLoginForm} />
          </div>
          
          {/* Foreground particles */}
          <div data-depth="0.8" className="parallax-layer">
            <div className="parallax-particles">
              <div className="particle particle-1"></div>
              <div className="particle particle-2"></div>
              <div className="particle particle-3"></div>
              <div className="particle particle-4"></div>
              <div className="particle particle-5"></div>
            </div>
          </div>
          
          {/* Foreground glow layer */}
          <div data-depth="1.0" className="parallax-layer">
            <div className="parallax-foreground-layer"></div>
          </div>
        </div>
        
        {/* Hero content - outside parallax scene, always visible */}
        <div className={`hero-content-wrapper-fixed ${showLoginForm ? 'form-open' : ''}`}>
          <div className="hero-content">
            <h1 className="hero-title">
              <span className="hero-title-main" data-text={t('header.appName')}>
                {t('header.appName')}
              </span>
            </h1>
          </div>
        </div>
      </div>
      
      <div className="landing-auth">
        {!showLoginForm ? (
          <button 
            className="login-trigger-btn"
            onMouseEnter={() => {
              if (hoverTimeoutRef.current) {
                clearTimeout(hoverTimeoutRef.current);
              }
              hoverTimeoutRef.current = setTimeout(() => {
                setShowLoginForm(true);
              }, 300); // 300ms delay for hover
            }}
            onMouseLeave={() => {
              if (hoverTimeoutRef.current) {
                clearTimeout(hoverTimeoutRef.current);
              }
            }}
            onClick={() => {
              if (hoverTimeoutRef.current) {
                clearTimeout(hoverTimeoutRef.current);
              }
              setShowLoginForm(true);
            }}
          >
            Кіру
          </button>
        ) : (
          <div 
            className="auth-card" 
            onMouseEnter={() => {
              if (hoverTimeoutRef.current) {
                clearTimeout(hoverTimeoutRef.current);
              }
            }}
            onMouseLeave={() => {
              hoverTimeoutRef.current = setTimeout(() => {
                setShowLoginForm(false);
              }, 200); // 200ms delay before closing
            }}
          >
            <h2 className="auth-title">Кіру</h2>

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

            <div className="form-group password-group">
              <label htmlFor="password">Құпия сөз</label>
              <div className="password-input-wrapper">
                <input
                  id="password"
                  type={showPassword ? "text" : "password"}
                  value={formData.password}
                  onChange={(e) => setFormData({ ...formData, password: e.target.value })}
                  placeholder="Құпия сөзіңізді енгізіңіз"
                  required
                />
                <button
                  type="button"
                  className="password-toggle-btn"
                  onClick={() => setShowPassword(!showPassword)}
                  aria-label={showPassword ? "Парольді жасыру" : "Парольді көрсету"}
                >
                  <FontAwesomeIcon icon={showPassword ? faEye : faEyeSlash} />
                </button>
              </div>
            </div>

            {error && (
              <div className="form-error">
                {error}
              </div>
            )}

            <Button type="submit" variant="primary" fullWidth disabled={loading}>
              {loading ? 'Кіру...' : 'Кіру'}
            </Button>
          </form>
          </div>
        )}
      </div>
    </div>
  );
};

export default Login;
