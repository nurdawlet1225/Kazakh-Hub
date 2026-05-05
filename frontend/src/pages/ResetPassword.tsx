import React, { useState } from 'react';
import { useNavigate, useSearchParams } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import { apiService } from '../utils/api';
import './Auth.css';

const ResetPassword: React.FC = () => {
  const { t } = useTranslation();
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const token = searchParams.get('token') || '';
  const [newPassword, setNewPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (newPassword.length < 6) {
      setError(t('register.passwordMinLength'));
      return;
    }
    if (newPassword !== confirmPassword) {
      setError(t('register.passwordMismatch'));
      return;
    }
    setLoading(true);
    setError('');

    try {
      await apiService.resetPassword(token, newPassword);
      setSuccess(true);
    } catch (err: any) {
      setError(err?.message || t('auth.resetPasswordExpired'));
    } finally {
      setLoading(false);
    }
  };

  if (success) {
    return (
      <div className="auth-page">
        <div className="auth-container">
          <h1 className="auth-title">{t('auth.resetPassword')}</h1>
          <p className="auth-success">{t('auth.resetPasswordSuccess')}</p>
          <button className="auth-link-btn" onClick={() => navigate('/login')}>
            {t('login.title')}
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="auth-page">
      <div className="auth-container">
        <h1 className="auth-title">{t('auth.resetPassword')}</h1>
        <form onSubmit={handleSubmit}>
          <div className="auth-field">
            <label>{t('settings.newPassword')}</label>
            <input
              type="password"
              value={newPassword}
              onChange={(e) => setNewPassword(e.target.value)}
              minLength={6}
              required
            />
          </div>
          <div className="auth-field">
            <label>{t('settings.confirmNewPassword')}</label>
            <input
              type="password"
              value={confirmPassword}
              onChange={(e) => setConfirmPassword(e.target.value)}
              minLength={6}
              required
            />
          </div>
          {error && <p className="auth-error">{error}</p>}
          <button type="submit" className="auth-submit-btn" disabled={loading}>
            {loading ? '...' : t('auth.resetPassword')}
          </button>
        </form>
      </div>
    </div>
  );
};

export default ResetPassword;