import React, { useState, useRef } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import { apiService } from '../utils/api';
import Button from '../components/Button';
import GalaxyBackground from '../components/GalaxyBackground';
import DragonCursorTrail from '../components/DragonCursorTrail';
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
        <GalaxyBackground containerRef={heroRef} />
        <DragonCursorTrail containerRef={heroRef} />
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

            <Button type="submit" variant="primary" fullWidth disabled={loading}>
              {loading ? 'Кіру...' : 'Кіру'}
            </Button>
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
