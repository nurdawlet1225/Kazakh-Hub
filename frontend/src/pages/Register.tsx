import React, { useState, useRef, useEffect } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import { faEye, faEyeSlash } from '@fortawesome/free-solid-svg-icons';
import { apiService } from '../utils/api';
import Button from '../components/Button';
import Parallax from 'parallax-js';
import './Auth.css';

const Register: React.FC = () => {
  const navigate = useNavigate();
  const heroRef = useRef<HTMLDivElement>(null);
  const parallaxRef = useRef<Parallax | null>(null);
  const parallaxSceneRef = useRef<HTMLDivElement>(null);
  const [formData, setFormData] = useState({
    username: '',
    email: '',
    password: '',
    confirmPassword: '',
  });
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);

  // Hide scrollbar on mount
  useEffect(() => {
    const originalBodyOverflow = document.body.style.overflow;
    const originalHtmlOverflow = document.documentElement.style.overflow;
    const originalBodyHeight = document.body.style.height;
    const originalHtmlHeight = document.documentElement.style.height;
    
    document.body.style.overflow = 'hidden';
    document.body.style.height = '100vh';
    document.documentElement.style.overflow = 'hidden';
    document.documentElement.style.height = '100vh';
    
    return () => {
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
      const initTimer = setTimeout(() => {
        try {
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
        } catch (error) {
          console.error('Parallax initialization error:', error);
        }
      }, 100);

      return () => {
        clearTimeout(initTimer);
        if (parallaxRef.current) {
          try {
            parallaxRef.current.destroy();
          } catch (error) {
            console.error('Parallax destroy error:', error);
          }
          parallaxRef.current = null;
        }
      };
    }
  }, []);

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
      // Register user with backend API
      const response = await apiService.register(
        formData.username,
        formData.email,
        formData.password
      );
      
      // Save user to localStorage
      const userData = response.user;
      localStorage.setItem('user', JSON.stringify(userData));
      
      // Dispatch custom event to notify other components of registration
      window.dispatchEvent(new Event('userProfileUpdated'));
      
      // Redirect to home
      navigate('/');
    } catch (err: any) {
      console.error('Registration error:', err);
      
      let errorMessage = 'Тіркелу қатесі';
      
      if (err.message) {
        if (err.message.includes('already exists') || err.message.includes('User already exists') || err.message.includes('Пайдаланушы бар')) {
          errorMessage = 'Бұл электрондық пошта немесе пайдаланушы аты бойынша тіркелгі бар';
        } else if (err.message.includes('Password must be at least')) {
          errorMessage = 'Құпия сөз кемінде 6 таңбадан тұруы керек';
        } else if (err.message.includes('required')) {
          errorMessage = 'Барлық өрістерді толтырыңыз';
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
          {/* Deep space background */}
          <div data-depth="0.05" className="parallax-layer">
            <div className="meteor-deep-space"></div>
          </div>
          
          {/* Stars field - background layer */}
          <div data-depth="0.1" className="parallax-layer">
            <div className="meteor-stars-field">
              <div className="star-layer star-layer-1"></div>
              <div className="star-layer star-layer-2"></div>
              <div className="star-layer star-layer-3"></div>
            </div>
          </div>
          
          {/* Slow meteors - far background */}
          <div data-depth="0.2" className="parallax-layer">
            <div className="meteor-shower meteor-shower-1">
              <div className="meteor meteor-1"></div>
              <div className="meteor meteor-2"></div>
              <div className="meteor meteor-3"></div>
            </div>
          </div>
          
          {/* Medium speed meteors - middle layer */}
          <div data-depth="0.4" className="parallax-layer">
            <div className="meteor-shower meteor-shower-2">
              <div className="meteor meteor-4"></div>
              <div className="meteor meteor-5"></div>
              <div className="meteor meteor-6"></div>
              <div className="meteor meteor-7"></div>
            </div>
          </div>
          
          {/* Fast meteors - foreground */}
          <div data-depth="0.8" className="parallax-layer">
            <div className="meteor-shower meteor-shower-3">
              <div className="meteor meteor-8"></div>
              <div className="meteor meteor-9"></div>
              <div className="meteor meteor-10"></div>
              <div className="meteor meteor-11"></div>
              <div className="meteor meteor-12"></div>
            </div>
          </div>
          
          {/* Bright foreground meteors */}
          <div data-depth="1.0" className="parallax-layer">
            <div className="meteor-shower meteor-shower-4">
              <div className="meteor meteor-13"></div>
              <div className="meteor meteor-14"></div>
              <div className="meteor meteor-15"></div>
            </div>
          </div>
        </div>
      </div>
      
      <div className="landing-auth">
        <div className="auth-card">
          <h2 className="auth-title">Тіркелу</h2>

          <form onSubmit={handleSubmit} className="auth-form">
            <div className="form-group">
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
              <input
                id="email"
                type="email"
                value={formData.email}
                onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                placeholder="email@example.com"
                required
              />
            </div>

            <div className="form-group password-group">
              <div className="password-input-wrapper">
                <input
                  id="password"
                  type={showPassword ? "text" : "password"}
                  value={formData.password}
                  onChange={(e) => setFormData({ ...formData, password: e.target.value })}
                  placeholder="Құпия сөз"
                  required
                  minLength={6}
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

            <div className="form-group password-group">
              <div className="password-input-wrapper">
                <input
                  id="confirmPassword"
                  type={showConfirmPassword ? "text" : "password"}
                  value={formData.confirmPassword}
                  onChange={(e) => setFormData({ ...formData, confirmPassword: e.target.value })}
                  placeholder="Құпия сөзді қайталаңыз"
                  required
                />
                <button
                  type="button"
                  className="password-toggle-btn"
                  onClick={() => setShowConfirmPassword(!showConfirmPassword)}
                  aria-label={showConfirmPassword ? "Парольді жасыру" : "Парольді көрсету"}
                >
                  <FontAwesomeIcon icon={showConfirmPassword ? faEye : faEyeSlash} />
                </button>
              </div>
            </div>

            {error && (
              <div className="form-error">
                {error}
              </div>
            )}

            <Button type="submit" variant="primary" fullWidth disabled={loading}>
              {loading ? 'Тіркелу...' : 'Тіркелу'}
            </Button>
          </form>

          <p className="auth-footer">
            <Link to="/login" className="auth-footer-link-black">Кіру</Link>
          </p>
        </div>
      </div>
    </div>
  );
};

export default Register;
