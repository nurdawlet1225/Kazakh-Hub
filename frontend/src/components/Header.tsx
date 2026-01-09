import React, { useState, useEffect, useRef, useCallback } from 'react';
import { Link, useNavigate, useLocation } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import { faUpload, faLock, faUser, faComment } from '@fortawesome/free-solid-svg-icons';
import UploadModal from './UploadModal';
import ProfileModal from './ProfileModal';
import Button from './Button';
import LinkButton from './LinkButton';
import { apiService, User } from '../utils/api';

// Логотипті импорттау - бірнеше нұсқаны тексеру
const getLogoPath = () => {
  // Логотип файлы public/logo (кеңейтімі жоқ)
  // Бірнеше нұсқаны тексеру
  return '/logo'; // әдепкі: logo файлы
};

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
      <div className="w-full m-0 pr-4 pl-0 flex items-center justify-between gap-8 relative flex-wrap max-[491.5px]:pr-4 min-h-[45px]">
        <Link 
          to="/" 
          className="flex items-center gap-3 no-underline text-text-primary text-2xl font-bold transition-all p-1 rounded-[7.7px] relative flex-shrink-0 m-0 hover:translate-x-1 group h-[24px]"
        >
          <div className="absolute inset-0 rounded-[7.7px] bg-gradient-to-br from-[rgba(251,191,36,0.1)] to-[rgba(245,158,11,0.05)] opacity-0 transition-opacity group-hover:opacity-100"></div>
          <img 
            src={getLogoPath()}
            alt="Kazakh Hub" 
            className="w-10 h-8 object-cover rounded-full transition-all shadow-md drop-shadow-[0_2.6px_3.8px_rgba(251,191,36,0.15)] bg-[rgba(251,191,36,0.15)] p-0.5 box-border hover:scale-110 hover:rotate-[5deg] hover:shadow-[var(--shadow-glow)]"
            onError={(e) => {
              // Егер логотип табылмаса, басқа нұсқаны пайдалану
              const target = e.target as HTMLImageElement;
              const currentSrc = target.src;
              
              // Бірнеше нұсқаны тексеру
              if (currentSrc.includes('/logo')) {
                // PNG нұсқасын тексеру
                target.src = '/logo.png';
              } else if (currentSrc.includes('logo.png')) {
                // SVG нұсқасын тексеру
                target.src = '/logo.svg';
              } else {
                // Егер ешқайсысы табылмаса, суретті жасыру
                target.style.display = 'none';
              }
            }}
          />
          <span className="bg-accent-gradient bg-clip-text text-transparent font-extrabold tracking-[-0.32px] relative z-10">
            {t('header.appName')}
          </span>
        </Link>
        
        <nav className="flex gap-4 flex-1 justify-center items-center m-0 mx-auto max-[491.5px]:order-3 max-[491.5px]:w-full max-[491.5px]:flex-col max-[491.5px]:gap-3 max-[491.5px]:pt-4 max-[491.5px]:border-t max-[491.5px]:border-[0.64px] max-[491.5px]:border-border">
        </nav>

        <div className="flex gap-4 items-center flex-shrink-0 ml-auto flex-nowrap flex-row max-[491.5px]:flex-wrap max-[491.5px]:gap-2">
          <Button 
            variant="primary"
            onClick={() => {
              navigate('/');
              setIsUploadModalOpen(true);
            }}
            icon={<FontAwesomeIcon icon={faUpload} />}
            className="h-[32px] text-sm px-2 py-0.5"
          >
            {t('common.upload')}
          </Button>
          {isLoggedIn && (
            <LinkButton 
              to="/chat" 
              variant="secondary" 
              className="relative h-[32px] text-sm px-2 py-0.5 min-w-[80px]" 
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
              {t('header.chat')}
            </LinkButton>
          )}
          {isLoggedIn && (
            <button 
              ref={profileButtonRef}
              onClick={() => setIsProfileModalOpen(!isProfileModalOpen)}
              className="flex items-center justify-center gap-0 p-0 rounded-full no-underline text-text-primary transition-all bg-transparent border-none relative overflow-visible cursor-pointer w-[32px] h-[32px] box-border font-inherit text-inherit dark:bg-gradient-to-br dark:from-[rgba(0,153,204,0.08)] dark:to-[rgba(0,175,202,0.05)] hover:-translate-y-[1.3px] max-[491.5px]:order-[-1] max-[491.5px]:w-[32px] max-[491.5px]:h-[32px]"
            >
              <div className="w-[30px] h-[30px] rounded-full bg-accent-gradient flex items-center justify-center text-sm font-bold text-white flex-shrink-0 shadow-md drop-shadow-[0_0_12.8px_rgba(0,175,202,0.3)] transition-all overflow-hidden relative border-[1.3px] border-[rgba(0,175,202,0.3)] hover:shadow-lg hover:drop-shadow-[0_0_19.2px_rgba(0,175,202,0.5)] hover:border-primary hover:scale-105 max-[491.5px]:w-[30px] max-[491.5px]:h-[30px] max-[491.5px]:text-base max-[491.5px]:border-[1.3px]">
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
          {!isLoggedIn && (
            <div className="flex justify-center flex-1">
              <LinkButton 
                to="/login" 
                variant="secondary"
                className="h-[32px] text-sm px-2 py-0.5"
                icon={<FontAwesomeIcon icon={faLock} />}
              >
                {t('common.login')}
              </LinkButton>
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

