import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import { User } from '../utils/api';
import { apiService } from '../utils/api';
import './Settings.css';

const Settings: React.FC = () => {
  const { i18n, t } = useTranslation();
  const navigate = useNavigate();
  const [settings, setSettings] = useState({
    language: i18n.language || 'kk',
    theme: 'auto',
    notifications: true,
    emailNotifications: true,
  });
  const [user, setUser] = useState<User | null>(null);

  useEffect(() => {
    // Load saved language from localStorage
    const savedLanguage = localStorage.getItem('i18nextLng') || i18n.language || 'kk';
    setSettings(prev => ({ ...prev, language: savedLanguage }));
    
    // Load user data
    const loadUser = async () => {
      try {
        const storedUser = localStorage.getItem('user');
        if (storedUser) {
          setUser(JSON.parse(storedUser));
        } else {
          const userData = await apiService.getCurrentUser();
          setUser(userData);
        }
      } catch (err) {
        console.error('Error loading user:', err);
      }
    };
    loadUser();
  }, [i18n.language]);

  const handleChange = (key: string, value: any) => {
    if (key === 'language') {
      // Change language immediately
      i18n.changeLanguage(value);
      localStorage.setItem('i18nextLng', value);
    }
    setSettings(prev => ({ ...prev, [key]: value }));
  };

  const handleSave = () => {
    // Save language to localStorage (already saved in handleChange)
    localStorage.setItem('i18nextLng', settings.language);
    // TODO: Save other settings to backend
    console.log('Settings saved:', settings);
    alert(t('common.success') || 'Параметрлер сақталды!');
  };


  return (
    <div className="settings-container">
      <h1 className="settings-title">{t('common.settings') || 'Параметрлер'}</h1>

      <div className="settings-section">
        <h2 className="section-title">{t('settings.general') || 'Жалпы'}</h2>
        
        <div className="setting-item">
          <label className="setting-label">{t('settings.language') || 'Тіл'}</label>
          <select
            className="setting-input"
            value={settings.language}
            onChange={(e) => handleChange('language', e.target.value)}
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
            value={settings.theme}
            onChange={(e) => handleChange('theme', e.target.value)}
          >
            <option value="auto">{t('settings.themeAuto') || 'Автоматты'}</option>
            <option value="light">{t('settings.themeLight') || 'Ашық'}</option>
            <option value="dark">{t('settings.themeDark') || 'Қараңғы'}</option>
          </select>
        </div>
      </div>

      <div className="settings-section">
        <h2 className="section-title">{t('settings.notifications') || 'Хабарландырулар'}</h2>
        
        <div className="setting-item">
          <label className="setting-toggle">
            <input
              type="checkbox"
              checked={settings.notifications}
              onChange={(e) => handleChange('notifications', e.target.checked)}
            />
            <span>{t('settings.enableNotifications') || 'Хабарландыруларды қосу'}</span>
          </label>
        </div>

        <div className="setting-item">
          <label className="setting-toggle">
            <input
              type="checkbox"
              checked={settings.emailNotifications}
              onChange={(e) => handleChange('emailNotifications', e.target.checked)}
            />
            <span>{t('settings.emailNotifications') || 'Электрондық пошта хабарландырулары'}</span>
          </label>
        </div>
      </div>

      <div className="settings-actions">
        <button className="btn-primary" onClick={handleSave}>
          {t('common.save') || 'Сақтау'}
        </button>
        <button className="btn-secondary" onClick={() => {
          const defaultLanguage = 'kk';
          i18n.changeLanguage(defaultLanguage);
          localStorage.setItem('i18nextLng', defaultLanguage);
          setSettings({
            language: defaultLanguage,
            theme: 'auto',
            notifications: true,
            emailNotifications: true,
          });
        }}>
          {t('common.cancel') || 'Болдырмау'}
        </button>
      </div>
    </div>
  );
};

export default Settings;

