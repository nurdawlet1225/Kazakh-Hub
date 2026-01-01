import React, { useState } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import { apiService } from '../utils/api';
import Button from '../components/Button';
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
              <div className="form-error">
                {error}
              </div>
            )}

            <Button type="submit" variant="primary" fullWidth disabled={loading}>
              {loading ? 'Тіркелу...' : 'Тіркелу'}
            </Button>
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
