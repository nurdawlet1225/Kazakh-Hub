import React, { useState, useEffect, useRef, useCallback } from 'react';
import { Link, useNavigate, useSearchParams, useLocation } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import { faSearch, faUpload, faLock, faUser, faComment } from '@fortawesome/free-solid-svg-icons';
import UploadModal from './UploadModal';
import ProfileModal from './ProfileModal';
import { apiService } from '../utils/api';
import './Header.css';

// Логотипті импорттау - бірнеше нұсқаны тексеру
const getLogoPath = () => {
  // Бірінші нұсқа: logo.png
  try {
    return '/logo.png';
  } catch {
    // Екінші нұсқа: бастапқы атау
    return encodeURI('/Image 9 нояб. 2025 г., 19_46_29.png');
  }
};

const Header: React.FC = () => {
  const { t } = useTranslation();
  const navigate = useNavigate();
  const location = useLocation();
  const [searchParams, setSearchParams] = useSearchParams();
  const [isLoggedIn, setIsLoggedIn] = useState(false);
  const [user, setUser] = useState<{ username: string; email: string; avatar?: string } | null>(null);
  const [searchQuery, setSearchQuery] = useState(searchParams.get('search') || '');
  const [isUploadModalOpen, setIsUploadModalOpen] = useState(false);
  const [isProfileModalOpen, setIsProfileModalOpen] = useState(false);
  const [incomingRequestCount, setIncomingRequestCount] = useState(0);
  const profileButtonRef = useRef<HTMLButtonElement>(null);

  const loadUser = () => {
    const storedUser = localStorage.getItem('user');
    if (storedUser) {
      try {
        const userData = JSON.parse(storedUser);
        setIsLoggedIn(true);
        setUser(userData);
      } catch (err) {
        setIsLoggedIn(false);
        setUser(null);
      }
    } else {
      setIsLoggedIn(false);
      setUser(null);
    }
  };

  useEffect(() => {
    // Check if user is logged in
    loadUser();
  }, [location]);

  const loadIncomingRequestCount = useCallback(async () => {
    if (!user?.id) return;
    try {
      const { incomingRequestCount } = await apiService.getIncomingFriendRequestCount(user.id);
      setIncomingRequestCount(incomingRequestCount);
    } catch (err) {
      console.error('Failed to load incoming request count:', err);
    }
  }, [user?.id]);

  useEffect(() => {
    // Load incoming friend request count
    if (isLoggedIn && user?.id) {
      loadIncomingRequestCount();
      
      // Use Page Visibility API to pause polling when tab is hidden
      let interval: NodeJS.Timeout | null = null;
      
      const startPolling = () => {
        if (document.visibilityState === 'visible') {
          interval = setInterval(loadIncomingRequestCount, 10000); // Update every 10 seconds
        }
      };
      
      const stopPolling = () => {
        if (interval) {
          clearInterval(interval);
          interval = null;
        }
      };
      
      const handleVisibilityChange = () => {
        if (document.visibilityState === 'visible') {
          // Reload immediately when tab becomes visible
          loadIncomingRequestCount();
          startPolling();
        } else {
          stopPolling();
        }
      };
      
      // Start polling if tab is visible
      if (document.visibilityState === 'visible') {
        startPolling();
      }
      
      // Listen for visibility changes
      document.addEventListener('visibilitychange', handleVisibilityChange);
      
      return () => {
        stopPolling();
        document.removeEventListener('visibilitychange', handleVisibilityChange);
      };
    }
  }, [isLoggedIn, user?.id, loadIncomingRequestCount]);

  useEffect(() => {
    // Listen for storage changes (when user profile is updated in another tab/component)
    const handleStorageChange = (e: StorageEvent) => {
      if (e.key === 'user') {
        loadUser();
      }
    };

    // Listen for custom event when profile is updated in the same tab
    const handleProfileUpdate = () => {
      loadUser();
    };

    window.addEventListener('storage', handleStorageChange);
    window.addEventListener('userProfileUpdated', handleProfileUpdate);

    return () => {
      window.removeEventListener('storage', handleStorageChange);
      window.removeEventListener('userProfileUpdated', handleProfileUpdate);
    };
  }, []);

  useEffect(() => {
    // Sync search query with URL params
    const urlSearch = searchParams.get('search') || '';
    setSearchQuery(urlSearch);
  }, [searchParams]);

  const handleSearchChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const value = e.target.value;
    setSearchQuery(value);
    
    // Update URL params
    if (value) {
      setSearchParams({ search: value });
    } else {
      setSearchParams({});
    }
    
    // Navigate to home if not already there
    if (location.pathname !== '/') {
      navigate(`/?search=${encodeURIComponent(value)}`);
    }
  };

  const handleSearchSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (location.pathname !== '/') {
      navigate(`/?search=${encodeURIComponent(searchQuery)}`);
    }
  };


  return (
    <header className="header">
      <div className="header-container">
        <Link to="/" className="header-logo">
          <img 
            src={getLogoPath()}
            alt="Kazakh Hub" 
            className="logo-img"
            onError={(e) => {
              // Егер бірінші сурет табылмаса, басқа нұсқаны пайдалану
              const target = e.target as HTMLImageElement;
              if (target.src.includes('logo.png')) {
                target.src = encodeURI('/ChatGPT Image 9 нояб. 2025 г., 19_46_29.png');
              } else {
                target.style.display = 'none';
              }
            }}
          />
          <span className="logo-text">{t('header.appName')}</span>
        </Link>
        
        <nav className="header-nav">
          <form onSubmit={handleSearchSubmit} className="header-search-form">
            <div className="header-search-box">
              <input
                type="text"
                placeholder={t('common.search')}
                value={searchQuery}
                onChange={handleSearchChange}
                className="header-search-input"
              />
              <span className="header-search-icon"><FontAwesomeIcon icon={faSearch} /></span>
            </div>
          </form>
        </nav>

        <div className="header-actions">
          <button 
            className="btn-primary"
            onClick={() => {
              navigate('/');
              setIsUploadModalOpen(true);
            }}
          >
            <span className="btn-icon"><FontAwesomeIcon icon={faUpload} /></span>
            <span className="btn-text">{t('common.upload')}</span>
          </button>
          {isLoggedIn && (
            <Link to="/chat" className="btn-secondary header-chat-btn" title={t('header.chat')}>
              <span className="btn-icon">
                <FontAwesomeIcon icon={faComment} />
                {incomingRequestCount > 0 && (
                  <span className="header-badge">{incomingRequestCount > 99 ? '99+' : incomingRequestCount}</span>
                )}
              </span>
              <span className="btn-text">{t('header.chat')}</span>
            </Link>
          )}
          {isLoggedIn && (
            <button 
              ref={profileButtonRef}
              onClick={() => setIsProfileModalOpen(!isProfileModalOpen)}
              className="header-user"
            >
              <div className="user-avatar">
                {user?.avatar ? (
                  <img src={user.avatar} alt={user.username || 'User'} />
                ) : (
                  <span>{user?.username?.[0]?.toUpperCase() || <FontAwesomeIcon icon={faUser} />}</span>
                )}
              </div>
            </button>
          )}
          {!isLoggedIn && (
            <div className="login-btn-wrapper">
              <Link to="/login" className="btn-secondary">
                <span className="btn-icon"><FontAwesomeIcon icon={faLock} /></span>
                <span className="btn-text">{t('common.login')}</span>
              </Link>
            </div>
          )}
        </div>
      </div>
      <UploadModal
        isOpen={isUploadModalOpen}
        onClose={() => setIsUploadModalOpen(false)}
        onSuccess={() => {
          setIsUploadModalOpen(false);
        }}
      />
      <ProfileModal
        isOpen={isProfileModalOpen}
        onClose={() => setIsProfileModalOpen(false)}
        buttonRef={profileButtonRef}
      />
    </header>
  );
};

export default Header;

