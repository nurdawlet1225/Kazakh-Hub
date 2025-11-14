import React from 'react';
import { Link, useLocation } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import { faHome, faCog, faComment, faSignOutAlt } from '@fortawesome/free-solid-svg-icons';
import './Sidebar.css';

interface SidebarProps {
  isOpen?: boolean;
  onClose?: () => void;
}

const Sidebar: React.FC<SidebarProps> = ({ isOpen = true, onClose }) => {
  const { t } = useTranslation();
  const location = useLocation();

  const menuItems = [
    { path: '/', label: t('sidebar.home'), icon: <FontAwesomeIcon icon={faHome} /> },
    { path: '/settings', label: t('sidebar.settings'), icon: <FontAwesomeIcon icon={faCog} /> },
    { path: '/chat', label: t('sidebar.chat'), icon: <FontAwesomeIcon icon={faComment} /> },
  ];

  const handleLogout = () => {
    // Растау диалогы
    const confirmed = window.confirm('Шығуға сенімдісіз бе?');
    
    if (!confirmed) {
      return; // Егер растамаса, шығудан бас тарту
    }

    // Аккаунт мәліметтерін сақтау үшін логин деректерін алу
    const userStr = localStorage.getItem('user');
    if (userStr) {
      try {
        const user = JSON.parse(userStr);
        // Логин деректерін сақтау (email немесе username)
        if (user.email) {
          localStorage.setItem('savedEmail', user.email);
        }
        if (user.username) {
          localStorage.setItem('savedUsername', user.username);
        }
      } catch (err) {
        console.error('Error parsing user data:', err);
      }
    }

    // User деректерін алып тастау
    localStorage.removeItem('user');
    // In a real app, this would also clear auth tokens
    
    // Redirect to login page
    window.location.href = '/login';
  };

  return (
    <>
      {onClose && (
        <div 
          className={`sidebar-overlay ${isOpen ? 'open' : ''}`}
          onClick={onClose}
        />
      )}
      <aside className={`sidebar ${isOpen ? 'open' : ''}`}>
        <nav className="sidebar-nav">
          {menuItems.map((item) => (
            <Link
              key={item.path}
              to={item.path}
              className={`sidebar-link ${location.pathname === item.path ? 'active' : ''}`}
              onClick={onClose}
            >
              <span className="sidebar-icon">{item.icon}</span>
              <span className="sidebar-label">{item.label}</span>
            </Link>
          ))}
        </nav>

        <div className="sidebar-footer">
          <button
            className="sidebar-link sidebar-logout"
            onClick={handleLogout}
          >
            <span className="sidebar-icon"><FontAwesomeIcon icon={faSignOutAlt} /></span>
            <span className="sidebar-label">{t('sidebar.logout')}</span>
          </button>
        </div>
      </aside>
    </>
  );
};

export default Sidebar;

