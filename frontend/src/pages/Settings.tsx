import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import { useAuth } from '../contexts/AuthContext';
import { useTheme } from '../contexts/ThemeContext';
import { apiService } from '../utils/api';
import Button from '../components/ui/Button';
import './Settings.css';

type SettingsTab = 'general' | 'account' | 'danger';

const Settings: React.FC = () => {
  const { i18n, t } = useTranslation();
  const navigate = useNavigate();
  const { user, logout, isAuthenticated, isLoading } = useAuth();
  const { preference, setThemePreference } = useTheme();

  const [activeTab, setActiveTab] = useState<SettingsTab>('general');
  const [language, setLanguage] = useState(i18n.language || 'kk');
  const [notifications, setNotifications] = useState(true);
  const [emailNotifications, setEmailNotifications] = useState(true);

  // Password change
  const [currentPassword, setCurrentPassword] = useState('');
  const [newPassword, setNewPassword] = useState('');
  const [confirmNewPassword, setConfirmNewPassword] = useState('');
  const [passwordError, setPasswordError] = useState('');
  const [passwordSuccess, setPasswordSuccess] = useState('');
  const [passwordLoading, setPasswordLoading] = useState(false);

  // 2FA
  const [totpEnabled, setTotpEnabled] = useState(false);
  const [show2FASetup, setShow2FASetup] = useState(false);
  const [twoFASecret, setTwoFASecret] = useState('');
  const [twoFAUri, setTwoFAUri] = useState('');
  const [twoFACode, setTwoFACode] = useState('');
  const [twoFARecoveryCodes, setTwoFARecoveryCodes] = useState<string[]>([]);
  const [twoFAError, setTwoFAError] = useState('');
  const [twoFADisablePassword, setTwoFADisablePassword] = useState('');
  const [show2FADisable, setShow2FADisable] = useState(false);

  // Delete account
  const [deleteConfirmStep, setDeleteConfirmStep] = useState(0);
  const [deleteLoading, setDeleteLoading] = useState(false);

  useEffect(() => {
    if (!isAuthenticated && !isLoading) {
      navigate('/login');
    }
  }, [isAuthenticated, isLoading, navigate]);

  useEffect(() => {
    const savedLanguage = localStorage.getItem('i18nextLng') || i18n.language || 'kk';
    setLanguage(savedLanguage);
  }, [i18n.language]);

  useEffect(() => {
    if (user?.totp_enabled !== undefined) {
      setTotpEnabled(user.totp_enabled);
    }
  }, [user]);

  const handleLanguageChange = (value: string) => {
    i18n.changeLanguage(value);
    localStorage.setItem('i18nextLng', value);
    setLanguage(value);
  };

  const handleChangePassword = async () => {
    setPasswordError('');
    setPasswordSuccess('');
    if (!currentPassword) {
      setPasswordError(t('settings.currentPassword') + ' is required');
      return;
    }
    if (newPassword.length < 6) {
      setPasswordError(t('register.passwordMinLength'));
      return;
    }
    if (newPassword !== confirmNewPassword) {
      setPasswordError(t('register.passwordMismatch'));
      return;
    }
    setPasswordLoading(true);
    try {
      await apiService.changePassword(currentPassword, newPassword);
      setPasswordSuccess(t('common.success'));
      setCurrentPassword('');
      setNewPassword('');
      setConfirmNewPassword('');
    } catch (err: any) {
      setPasswordError(err?.message || 'Error');
    } finally {
      setPasswordLoading(false);
    }
  };

  const handle2FASetup = async () => {
    try {
      const res = await apiService.setup2FA();
      setTwoFASecret(res.secret);
      setTwoFAUri(res.uri);
      setShow2FASetup(true);
      setTwoFACode('');
      setTwoFAError('');
    } catch (err: any) {
      setTwoFAError(err?.message || 'Error');
    }
  };

  const handle2FAVerifySetup = async () => {
    try {
      const res = await apiService.verify2FASetup(twoFACode);
      setTotpEnabled(true);
      setTwoFARecoveryCodes(res.recovery_codes);
      setShow2FASetup(false);
      setTwoFACode('');
      if (user) {
        const updatedUser = { ...user, totp_enabled: true };
        localStorage.setItem('user', JSON.stringify(updatedUser));
      }
    } catch (err: any) {
      setTwoFAError(err?.message || t('auth.2fa.wrongCode'));
    }
  };

  const handle2FADisable = async () => {
    try {
      await apiService.disable2FA(twoFADisablePassword);
      setTotpEnabled(false);
      setShow2FADisable(false);
      setTwoFADisablePassword('');
      if (user) {
        const updatedUser = { ...user, totp_enabled: false };
        localStorage.setItem('user', JSON.stringify(updatedUser));
      }
    } catch (err: any) {
      setTwoFAError(err?.message || 'Error');
    }
  };

  const handleDeleteAccount = async () => {
    if (deleteConfirmStep < 2) {
      setDeleteConfirmStep(prev => prev + 1);
      return;
    }
    setDeleteLoading(true);
    try {
      await apiService.deleteAccount();
      await logout();
      navigate('/login');
    } catch (err: any) {
      alert(t('settings.deleteAccountError'));
    } finally {
      setDeleteLoading(false);
      setDeleteConfirmStep(0);
    }
  };

  if (!isAuthenticated) return null;

  const tabs: { key: SettingsTab; label: string }[] = [
    { key: 'general', label: t('settings.general') || 'Жалпы' },
    { key: 'account', label: t('settings.account') || 'Аккаунт' },
    { key: 'danger', label: t('settings.dangerZone') || 'Қауіпті аймақ' },
  ];

  return (
    <div className="settings-container">
      <h1 className="settings-title">{t('common.settings') || 'Баптаулар'}</h1>

      <div className="settings-tabs">
        {tabs.map(tab => (
          <button
            key={tab.key}
            className={`settings-tab ${activeTab === tab.key ? 'active' : ''}`}
            onClick={() => setActiveTab(tab.key)}
          >
            {tab.label}
          </button>
        ))}
      </div>

      <div className="settings-content">
        {/* General Tab */}
        {activeTab === 'general' && (
          <>
            <div className="settings-section">
              <h2 className="section-title">{t('settings.general') || 'Жалпы'}</h2>
              <div className="setting-item">
                <label className="setting-label">{t('settings.language') || 'Тіл'}</label>
                <select
                  className="setting-input"
                  value={language}
                  onChange={(e) => handleLanguageChange(e.target.value)}
                >
                  <option value="kk">{t('settings.languageKazakh')}</option>
                  <option value="ru">{t('settings.languageRussian')}</option>
                  <option value="en">{t('settings.languageEnglish')}</option>
                </select>
              </div>
              <div className="setting-item">
                <label className="setting-label">{t('settings.theme') || 'Тақырып'}</label>
                <select
                  className="setting-input"
                  value={preference}
                  onChange={(e) => setThemePreference(e.target.value as 'auto' | 'light' | 'dark')}
                >
                  <option value="auto">{t('settings.themeAuto') || 'Автоматты'}</option>
                  <option value="light">{t('settings.themeLight') || 'Күн'}</option>
                  <option value="dark">{t('settings.themeDark') || 'Түн'}</option>
                </select>
              </div>
            </div>

            <div className="settings-section">
              <h2 className="section-title">{t('settings.notifications') || 'Хабарландырулар'}</h2>
              <div className="setting-item">
                <label className="setting-toggle">
                  <input
                    type="checkbox"
                    checked={notifications}
                    onChange={(e) => setNotifications(e.target.checked)}
                  />
                  <span>{t('settings.enableNotifications') || 'Хабарландыруларды қосу'}</span>
                </label>
              </div>
              <div className="setting-item">
                <label className="setting-toggle">
                  <input
                    type="checkbox"
                    checked={emailNotifications}
                    onChange={(e) => setEmailNotifications(e.target.checked)}
                  />
                  <span>{t('settings.emailNotifications') || 'Электрондық пошта хабарландырулары'}</span>
                </label>
              </div>
            </div>
          </>
        )}

        {/* Account Tab */}
        {activeTab === 'account' && (
          <>
            <div className="settings-section">
              <h2 className="section-title">{t('settings.changePassword') || 'Құпия сөзді өзгерту'}</h2>
              <div className="setting-item">
                <label className="setting-label">{t('settings.currentPassword') || 'Ағымдағы құпия сөз'}</label>
                <input
                  type="password"
                  className="setting-input"
                  value={currentPassword}
                  onChange={(e) => setCurrentPassword(e.target.value)}
                />
              </div>
              <div className="setting-item">
                <label className="setting-label">{t('settings.newPassword') || 'Жаңа құпия сөз'}</label>
                <input
                  type="password"
                  className="setting-input"
                  value={newPassword}
                  onChange={(e) => setNewPassword(e.target.value)}
                  minLength={6}
                />
              </div>
              <div className="setting-item">
                <label className="setting-label">{t('settings.confirmNewPassword') || 'Жаңа құпия сөзді растау'}</label>
                <input
                  type="password"
                  className="setting-input"
                  value={confirmNewPassword}
                  onChange={(e) => setConfirmNewPassword(e.target.value)}
                  minLength={6}
                />
              </div>
              {passwordError && <p className="settings-error">{passwordError}</p>}
              {passwordSuccess && <p className="settings-success">{passwordSuccess}</p>}
              <div className="settings-actions">
                <Button variant="primary" onClick={handleChangePassword} disabled={passwordLoading}>
                  {passwordLoading ? '...' : t('common.save') || 'Сақтау'}
                </Button>
              </div>
            </div>

            <div className="settings-section">
              <h2 className="section-title">{t('settings.twoFactorAuth') || 'Екі факторлы аутентификация'}</h2>
              {twoFARecoveryCodes.length > 0 && (
                <div className="twofa-recovery-codes">
                  <p className="settings-success">{t('auth.2fa.recoveryCodes')}:</p>
                  <div className="recovery-codes-grid">
                    {twoFARecoveryCodes.map((code, i) => (
                      <span key={i} className="recovery-code">{code}</span>
                    ))}
                  </div>
                  <p className="settings-warning">{t('auth.2fa.recoveryCodesWarning')}</p>
                </div>
              )}
              {totpEnabled ? (
                <div className="twofa-status">
                  <p className="settings-success">{t('auth.2fa.enabled') || '2FA қосылған'}</p>
                  {show2FADisable ? (
                    <div className="twofa-disable-form">
                      <input
                        type="password"
                        className="setting-input"
                        placeholder={t('settings.currentPassword') || 'Ағымдағы құпия сөз'}
                        value={twoFADisablePassword}
                        onChange={(e) => setTwoFADisablePassword(e.target.value)}
                      />
                      <Button variant="primary" onClick={handle2FADisable}>
                        {t('auth.2fa.disableTitle') || '2FA өшіру'}
                      </Button>
                    </div>
                  ) : (
                    <Button variant="secondary" onClick={() => setShow2FADisable(true)}>
                      {t('settings.disable2FA') || '2FA өшіру'}
                    </Button>
                  )}
                </div>
              ) : show2FASetup ? (
                <div className="twofa-setup">
                  <p>{t('auth.2fa.scanQR') || 'QR кодты сканерлеңіз'}</p>
                  <div className="twofa-qr-container">
                    {twoFAUri && (
                      <a href={twoFAUri} target="_blank" rel="noopener noreferrer" className="twofa-qr-link">
                        {t('auth.2fa.scanQR')}
                      </a>
                    )}
                    <p className="twofa-secret">Secret: {twoFASecret}</p>
                  </div>
                  <div className="twofa-verify">
                    <input
                      type="text"
                      className="setting-input twofa-code-input"
                      placeholder="000000"
                      maxLength={6}
                      value={twoFACode}
                      onChange={(e) => setTwoFACode(e.target.value.replace(/\D/g, '').slice(0, 6))}
                    />
                    <Button
                      variant="primary"
                      onClick={handle2FAVerifySetup}
                      disabled={twoFACode.length !== 6}
                    >
                      {t('auth.2fa.enterCode') || 'Код енгізіңіз'}
                    </Button>
                  </div>
                  {twoFAError && <p className="settings-error">{twoFAError}</p>}
                </div>
              ) : (
                <Button variant="primary" onClick={handle2FASetup}>
                  {t('settings.enable2FA') || '2FA қосу'}
                </Button>
              )}
            </div>

            <div className="settings-section">
              <h2 className="section-title">{t('settings.activeSession') || 'Белсі сессия'}</h2>
              <p className="setting-info">{t('settings.singleSessionNote') || 'Бір аккаунтпен бір мезгілде бір ғана сессия жұмыс істей алады. Басқа құрылғыдан кіргенде бұл сессия жабылады.'}</p>
            </div>
          </>
        )}

        {/* Danger Zone Tab */}
        {activeTab === 'danger' && (
          <>
            <div className="settings-danger-zone">
              <div className="danger-zone-header">
                <div className="danger-zone-icon">!</div>
                <h2 className="danger-zone-title">{t('settings.dangerZone') || 'Қауіпті аймақ'}</h2>
              </div>
              <p className="danger-zone-description">
                {t('settings.dangerZoneDescription') || 'Аккаунтты жою - бұл қайтару мүмкін емес әрекет. Барлық деректеріңіз мәңгілікке жойылады.'}
              </p>
              <div className="danger-zone-warning">
                <div className="warning-item">
                  <span className="warning-icon">&times;</span>
                  <span>{t('settings.deleteAccountWarning1') || 'Барлық код файлдарыңыз жойылады'}</span>
                </div>
                <div className="warning-item">
                  <span className="warning-icon">&times;</span>
                  <span>{t('settings.deleteAccountWarning2') || 'Барлық пікірлеріңіз жойылады'}</span>
                </div>
                <div className="warning-item">
                  <span className="warning-icon">&times;</span>
                  <span>{t('settings.deleteAccountWarning3') || 'Барлық достар деректері жойылады'}</span>
                </div>
                <div className="warning-item">
                  <span className="warning-icon">&times;</span>
                  <span>{t('settings.deleteAccountWarning4') || 'Барлық хабарламалар жойылады'}</span>
                </div>
              </div>
              <button
                className="btn-delete-account"
                onClick={handleDeleteAccount}
                disabled={deleteLoading}
              >
                {deleteLoading
                  ? (t('settings.deletingAccount') || 'Жойылуда...')
                  : deleteConfirmStep === 0
                    ? (t('settings.deleteAccountButton') || 'Аккаунтты толықтай жою')
                    : deleteConfirmStep === 1
                      ? (t('settings.deleteAccountConfirm') || 'Аккаунтты жоюға сенімдісіз бе?')
                      : (t('settings.deleteAccountDoubleConfirm') || 'ШЫНЫМЕН ДЕ жоюға дайынсыз ба?')
                }
              </button>
            </div>

            <div className="settings-section" style={{ marginTop: '1.5rem' }}>
              <h2 className="section-title">{t('settings.logout') || 'Шығу'}</h2>
              <p className="setting-info">{t('settings.logoutDescription') || 'Аккаунттан шығу'}</p>
              <div className="settings-actions">
                <Button
                  variant="secondary"
                  onClick={async () => {
                    if (window.confirm(t('settings.logoutConfirm') || 'Шығуға сенімдісіз бе?')) {
                      await logout();
                      navigate('/login');
                    }
                  }}
                >
                  {t('settings.logout') || 'Шығу'}
                </Button>
              </div>
            </div>
          </>
        )}
      </div>
    </div>
  );
};

export default Settings;