import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import { apiService } from '../utils/api';
import './Auth.css';

const ForgotPassword: React.FC = () => {
  const { t } = useTranslation();
  const navigate = useNavigate();
  const [email, setEmail] = useState('');
  const [loading, setLoading] = useState(false);
  const [sent, setSent] = useState(false);
  const [error, setError] = useState('');

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!email.trim()) return;
    setLoading(true);
    setError('');

    try {
      await apiService.forgotPassword(email.trim());
      setSent(true);
    } catch (err: any) {
      setError(err?.message || t('auth.resetPasswordExpired'));
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="auth-page">
      <div className="auth-container">
        <h1 className="auth-title">{t('auth.forgotPassword')}</h1>
        {sent ? (
          <div className="auth-success">
            <p>{t('auth.resetPasswordSent')}</p>
            <button className="auth-link-btn" onClick={() => navigate('/login')}>
              {t('common.back')}
            </button>
          </div>
        ) : (
          <form onSubmit={handleSubmit}>
            <div className="auth-field">
              <label>{t('register.email')}</label>
              <input
                type="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                placeholder="email@example.com"
                required
              />
            </div>
            {error && <p className="auth-error">{error}</p>}
            <button type="submit" className="auth-submit-btn" disabled={loading}>
              {loading ? '...' : t('auth.forgotPassword')}
            </button>
            <button type="button" className="auth-link-btn" onClick={() => navigate('/login')}>
              {t('login.title')}
            </button>
          </form>
        )}
      </div>
    </div>
  );
};

export default ForgotPassword;