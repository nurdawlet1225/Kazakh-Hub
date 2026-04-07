import React, { useState, useEffect, useRef, useCallback } from 'react';
import { Link, useNavigate, useLocation } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import { faUpload, faLock, faUser, faComment } from '@fortawesome/free-solid-svg-icons';
import UploadModal from '../modals/UploadModal';
import ProfileModal from '../modals/ProfileModal';
import Button from '../ui/Button';
import LinkButton from '../ui/LinkButton';
import { apiService, User } from '../../utils/api';
import { imageStorage } from '../../utils/imageStorage';
import './Header.css';

const Header: React.FC = () => {
  const { t } = useTranslation();
  const navigate = useNavigate();
  const location = useLocation();
  const [isLoggedIn, setIsLoggedIn] = useState(false);
  const [user, setUser] = useState<User | null>(null);
  const [isUploadModalOpen, setIsUploadModalOpen] = useState(false);
  const [isProfileModalOpen, setIsProfileModalOpen] = useState(false);
  const [incomingRequestCount, setIncomingRequestCount] = useState(0);
  const profileButtonRef = useRef<HTMLButtonElement>(null);

  const loadUser = async () => {
    const storedUser = localStorage.getItem('user');
    if (storedUser) {
      try {
        const userData = JSON.parse(storedUser);
        
        // Load avatar from imageStorage if it exists
        if (userData.id) {
          try {
            const avatarFromStorage = await imageStorage.getImage(`avatar-${userData.id}`);
            if (avatarFromStorage) {
              userData.avatar = avatarFromStorage;
            } else if (userData.avatar === 'stored') {
              // Avatar flag exists but image not found in storage
              userData.avatar = undefined;
            }
          } catch (err) {
            // If avatar not found or error loading, set to undefined
            if (userData.avatar === 'stored') {
              userData.avatar = undefined;
            }
          }
        }
        
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
      // Тыныштықпен қатені елемеу - бұл маңызды емес функционалдық
      // console.error('Failed to load incoming request count:', err);
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

  return (
    <header className="relative border-b border-border py-0.5 sticky top-0 z-[9999] backdrop-blur-[20.5px] backdrop-saturate-[180%] transition-all w-full max-w-full before:absolute before:inset-0 before:bg-bg-primary before:opacity-95 dark:before:opacity-85 before:-z-10">
      <div className="w-full m-0 pr-4 pl-4 flex items-center justify-between gap-4 relative flex-nowrap max-[491.5px]:pr-3 max-[491.5px]:pl-3 min-h-[45px]">
        {/* Сайт атауы */}
        <Link
          to="/"
          className="flex items-center gap-2 sm:gap-3 flex-shrink-0 m-0 p-1 no-underline rounded-[7.7px] hover:translate-x-0.5 transition-transform text-text-primary"
          aria-label={t('header.appName')}
        >
          <img
            src="/logo.png"
            alt=""
            className="w-8 h-6 sm:w-10 sm:h-8"
          />
          <span className="bg-accent-gradient bg-clip-text text-transparent font-extrabold text-xl sm:text-2xl tracking-[-0.32px] truncate">
            {t('header.appName')}
          </span>
        </Link>
        {/* Батырмалар - оң жақта */}
        <div className="flex gap-2 sm:gap-4 items-center flex-shrink-0 flex-nowrap flex-row">
          {/* Upload батырмасы */}
          <Button 
            variant="primary"
            onClick={() => {
              navigate('/');
              setIsUploadModalOpen(true);
            }}
            icon={<FontAwesomeIcon icon={faUpload} />}
            className="h-[32px] sm:h-[36px] text-xs sm:text-sm px-2 sm:px-3 py-0.5 header-btn-upload"
          >
            <span className="max-[360px]:hidden">{t('common.upload')}</span>
          </Button>
          
          {/* Chat батырмасы */}
          {isLoggedIn && (
            <LinkButton 
              to="/chat" 
              variant="secondary" 
              className="relative h-[32px] sm:h-[36px] text-xs sm:text-sm px-2 sm:px-3 py-0.5 min-w-[60px] sm:min-w-[80px] header-btn-chat" 
              title={t('header.chat')}
              icon={
                <>
                  <FontAwesomeIcon icon={faComment} />
                  {incomingRequestCount > 0 && (
                    <span className="absolute -top-[5.1px] -right-[5.1px] bg-error text-white rounded-full w-[12.8px] h-[12.8px] flex items-center justify-center text-[0.7rem] font-semibold border-[1.3px] border-bg-primary shadow-[0_1.3px_2.6px_rgba(0,0,0,0.2)]">
                      {incomingRequestCount > 99 ? '99+' : incomingRequestCount}
                    </span>
                  )}
                </>
              }
            >
              <span className="max-[360px]:hidden">{t('header.chat')}</span>
            </LinkButton>
          )}
          
          {/* Профиль батырмасы - ең оң жақта */}
          {isLoggedIn && (
            <button 
              ref={profileButtonRef}
              onClick={() => setIsProfileModalOpen(!isProfileModalOpen)}
              className="flex items-center justify-center gap-0 p-0 rounded-full no-underline text-text-primary transition-all bg-transparent border-none relative overflow-visible cursor-pointer w-[32px] h-[32px] sm:w-[36px] sm:h-[36px] box-border font-inherit text-inherit dark:bg-gradient-to-br dark:from-[rgba(0,153,204,0.08)] dark:to-[rgba(0,175,202,0.05)] hover:-translate-y-[1.3px] header-btn-profile"
            >
              <div className="w-[30px] h-[30px] sm:w-[34px] sm:h-[34px] rounded-full bg-accent-gradient flex items-center justify-center text-sm font-bold text-white flex-shrink-0 shadow-md drop-shadow-[0_0_12.8px_rgba(0,175,202,0.3)] transition-all overflow-hidden relative border-[1.3px] border-[rgba(0,175,202,0.3)] hover:shadow-lg hover:drop-shadow-[0_0_19.2px_rgba(0,175,202,0.5)] hover:border-primary hover:scale-105">
                {user?.avatar ? (
                  <img 
                    src={user.avatar} 
                    alt={user.username || 'User'} 
                    className="w-full h-full object-cover rounded-full transition-transform hover:scale-110"
                  />
                ) : (
                  <span className="flex items-center justify-center w-full h-full transition-transform hover:scale-110">
                    {user?.username?.[0]?.toUpperCase() || <FontAwesomeIcon icon={faUser} />}
                  </span>
                )}
              </div>
            </button>
          )}
          
          {/* Login батырмасы (егер кіру жасамаған болса) */}
          {!isLoggedIn && (
            <LinkButton 
              to="/login" 
              variant="secondary"
              className="h-[32px] sm:h-[36px] text-xs sm:text-sm px-2 sm:px-3 py-0.5 header-btn-login"
              icon={<FontAwesomeIcon icon={faLock} />}
            >
              <span className="max-[360px]:hidden">{t('common.login')}</span>
            </LinkButton>
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

