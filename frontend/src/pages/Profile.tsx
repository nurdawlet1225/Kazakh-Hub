import React, { useState, useEffect, useRef } from 'react';
import { useTranslation } from 'react-i18next';
import { useParams, useNavigate } from 'react-router-dom';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import { faLaptop, faHeart, faComment, faEye, faFileAlt, faIdCard, faImage, faEdit, faCopy, faCheck, faArrowLeft, faUser } from '@fortawesome/free-solid-svg-icons';
import { User, CodeFile } from '../utils/api';
import { apiService } from '../utils/api';
import { ensureNumericId } from '../utils/idConverter';
import { imageStorage } from '../utils/imageStorage';
import CodeCard from '../components/CodeCard';
import EditProfileModal from '../components/EditProfileModal';
import ChangeBackgroundModal from '../components/ChangeBackgroundModal';
import './Profile.css';

const Profile: React.FC = () => {
  const { t } = useTranslation();
  const { username: urlUsername } = useParams<{ username?: string }>();
  const navigate = useNavigate();
  const [user, setUser] = useState<User | null>(null);
  const [userCodes, setUserCodes] = useState<CodeFile[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [isEditModalOpen, setIsEditModalOpen] = useState(false);
  const [isChangeBackgroundModalOpen, setIsChangeBackgroundModalOpen] = useState(false);
  const [isMenuOpen, setIsMenuOpen] = useState(false);
  const [backgroundImage, setBackgroundImage] = useState<string | null>(null);
  const [backgroundPosition, setBackgroundPosition] = useState({ x: 50, y: 50 });
  const [backgroundZoom, setBackgroundZoom] = useState(100);
  const menuButtonRef = useRef<HTMLButtonElement>(null);
  const menuDropdownRef = useRef<HTMLDivElement>(null);
  const [stats, setStats] = useState({
    totalLikes: 0,
    totalComments: 0,
    totalViews: 0,
  });
  const [isIdCopied, setIsIdCopied] = useState(false);
  const [currentUser, setCurrentUser] = useState<User | null>(null);

  useEffect(() => {
    loadProfile();
    // Load current user from localStorage
    const loadCurrentUser = async () => {
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
                userData.avatar = undefined;
              }
            } catch (err) {
              if (userData.avatar === 'stored') {
                userData.avatar = undefined;
              }
            }
          }
          setCurrentUser(userData);
        } catch (err) {
          console.error('Failed to parse stored user:', err);
        }
      }
    };
    loadCurrentUser();
  }, [urlUsername]);

  // Close menu when modal opens
  useEffect(() => {
    if (isEditModalOpen) {
      setIsMenuOpen(false);
    }
  }, [isEditModalOpen]);

  // Prevent body scroll when modal is open
  useEffect(() => {
    if (isEditModalOpen || isChangeBackgroundModalOpen) {
      // Save current scroll position
      const scrollY = window.scrollY;
      // Disable scroll
      document.body.style.position = 'fixed';
      document.body.style.top = `-${scrollY}px`;
      document.body.style.width = '100%';
      document.body.style.overflow = 'hidden';
      
      return () => {
        // Restore scroll when modal closes
        document.body.style.position = '';
        document.body.style.top = '';
        document.body.style.width = '';
        document.body.style.overflow = '';
        window.scrollTo(0, scrollY);
      };
    }
  }, [isEditModalOpen, isChangeBackgroundModalOpen]);

  useEffect(() => {
    // Load background image and position from storage
    if (user?.id) {
      const loadBackground = async () => {
        try {
          const savedBg = await imageStorage.getImage(`profile-bg-${user.id}`);
          if (savedBg) {
            setBackgroundImage(savedBg);
          } else {
            setBackgroundImage(null);
          }
          
          // Load saved position
          const savedPosition = localStorage.getItem(`profile-bg-position-${user.id}`);
          if (savedPosition) {
            try {
              const position = JSON.parse(savedPosition);
              setBackgroundPosition(position);
            } catch (e) {
              setBackgroundPosition({ x: 50, y: 50 });
            }
          } else {
            setBackgroundPosition({ x: 50, y: 50 });
          }
          
          // Load saved zoom
          const savedZoom = localStorage.getItem(`profile-bg-zoom-${user.id}`);
          if (savedZoom) {
            try {
              const zoom = parseFloat(savedZoom);
              setBackgroundZoom(Math.max(50, Math.min(200, zoom)));
            } catch (e) {
              setBackgroundZoom(100);
            }
          } else {
            setBackgroundZoom(100);
          }
        } catch (err) {
          console.error('Failed to load background image:', err);
          setBackgroundImage(null);
          setBackgroundPosition({ x: 50, y: 50 });
          setBackgroundZoom(100);
        }
      };
      loadBackground();
    }
  }, [user?.id]);

  useEffect(() => {
    // Listen for background update events
    const handleBackgroundUpdate = async () => {
      if (user?.id) {
        try {
          const savedBg = await imageStorage.getImage(`profile-bg-${user.id}`);
          if (savedBg) {
            setBackgroundImage(savedBg);
          } else {
            setBackgroundImage(null);
          }
          
          // Load saved position
          const savedPosition = localStorage.getItem(`profile-bg-position-${user.id}`);
          if (savedPosition) {
            try {
              const position = JSON.parse(savedPosition);
              setBackgroundPosition(position);
            } catch (e) {
              setBackgroundPosition({ x: 50, y: 50 });
            }
          } else {
            setBackgroundPosition({ x: 50, y: 50 });
          }
          
          // Load saved zoom
          const savedZoom = localStorage.getItem(`profile-bg-zoom-${user.id}`);
          if (savedZoom) {
            try {
              const zoom = parseFloat(savedZoom);
              setBackgroundZoom(Math.max(50, Math.min(200, zoom)));
            } catch (e) {
              setBackgroundZoom(100);
            }
          } else {
            setBackgroundZoom(100);
          }
        } catch (err) {
          console.error('Failed to load background image:', err);
          setBackgroundImage(null);
          setBackgroundPosition({ x: 50, y: 50 });
          setBackgroundZoom(100);
        }
      }
    };

    window.addEventListener('profileBackgroundUpdated', handleBackgroundUpdate);
    return () => {
      window.removeEventListener('profileBackgroundUpdated', handleBackgroundUpdate);
    };
  }, [user?.id]);

  useEffect(() => {
    // Handle click outside to close menu
    const handleClickOutside = (event: MouseEvent) => {
      if (
        menuDropdownRef.current &&
        !menuDropdownRef.current.contains(event.target as Node) &&
        menuButtonRef.current &&
        !menuButtonRef.current.contains(event.target as Node)
      ) {
        setIsMenuOpen(false);
      }
    };

    if (isMenuOpen) {
      document.addEventListener('mousedown', handleClickOutside);
    }

    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
    };
  }, [isMenuOpen]);

  const copyId = async () => {
    if (user?.id) {
      try {
        const numericId = ensureNumericId(user.id);
        await navigator.clipboard.writeText(numericId);
        setIsIdCopied(true);
        setTimeout(() => setIsIdCopied(false), 2000);
      } catch (err) {
        console.error('Failed to copy ID:', err);
      }
    }
  };

  const handleChangeBackgroundClick = () => {
    setIsMenuOpen(false);
    setIsChangeBackgroundModalOpen(true);
  };

  const loadProfile = async () => {
    try {
      setLoading(true);
      
      let userData: User;
      
      // If username is provided in URL, load that user's profile
      if (urlUsername) {
        try {
          userData = await apiService.getUserByUsername(urlUsername);
        } catch (err: any) {
          console.error('Failed to load user by username:', err);
          setError('Пайдаланушы табылмады');
          setLoading(false);
          return;
        }
      } else {
        // Try to get user from localStorage first
        const storedUser = localStorage.getItem('user');
        
        if (storedUser) {
          userData = JSON.parse(storedUser);
          // Always verify user exists in backend using stored email and id
          // Never call getCurrentUser() without parameters to avoid getting wrong user
          try {
            const verifiedUser = await apiService.getCurrentUser(userData.email, userData.id);
            userData = verifiedUser;
          } catch (err: any) {
            // If user not found in backend, clear localStorage and redirect to login
            console.error('Failed to verify user:', err);
            localStorage.removeItem('user');
            window.location.href = '/login';
            return;
          }
        } else {
          // No stored user - redirect to login instead of trying to get random user
          window.location.href = '/login';
          return;
        }
      }
      
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
          // If avatar not found or error loading, keep original avatar or set to undefined
          if (userData.avatar === 'stored') {
            userData.avatar = undefined;
          }
        }
      }
      
      const codesResponse = await apiService.getCodeFiles(undefined, 1000, 0, false);
      setUser(userData);
      // Пайдаланушының кодтарын сүзгілеу
      const filteredCodes = codesResponse.codes.filter((code) => code.author === userData.username);
      setUserCodes(filteredCodes);
      
      // Статистикаларды есептеу
      const totalLikes = filteredCodes.reduce((sum, code) => sum + (code.likes?.length || 0), 0);
      const totalComments = filteredCodes.reduce((sum, code) => {
        const commentCount = code.comments?.length || 0;
        // Пікірлердің жауаптарын да есептеу
        const replyCount = code.comments?.reduce((replySum, comment) => {
          return replySum + (comment.replies?.length || 0);
        }, 0) || 0;
        return sum + commentCount + replyCount;
      }, 0);
      const totalViews = filteredCodes.reduce((sum, code) => sum + (code.views || 0), 0);
      
      setStats({
        totalLikes,
        totalComments,
        totalViews,
      });
      
      setError(null);
    } catch (err) {
      setError(err instanceof Error ? err.message : t('profile.errorTitle'));
    } finally {
      setLoading(false);
    }
  };


  if (loading) {
    return (
      <div className="profile-container">
        <div className="loading-spinner">
          <div className="spinner"></div>
          <p>{t('profile.loading')}</p>
        </div>
      </div>
    );
  }

  if (error || !user) {
    return (
      <div className="profile-container">
        <div className="error-state">
          <p className="error-icon">❌</p>
          <p className="error-title">{t('profile.errorTitle')}</p>
          <p className="error-message">{error || t('profile.userNotFound')}</p>
        </div>
      </div>
    );
  }

  return (
    <div className="profile-container">
      {/* Артқа қайту батырмасы - тек басқа адамның профилінде */}
      {currentUser && user && currentUser.username !== user.username && (
        <button
          className="profile-back-button"
          onClick={() => navigate(-1)}
          title="Артқа қайту"
        >
          <FontAwesomeIcon icon={faArrowLeft} />
        </button>
      )}
      <div 
        className="profile-header"
        style={backgroundImage ? { 
          backgroundImage: `url(${backgroundImage})`, 
          backgroundSize: `${backgroundZoom}%`, 
          backgroundPosition: `${backgroundPosition.x}% ${backgroundPosition.y}%` 
        } : {}}
      >
        {backgroundImage && <div className="profile-header-overlay"></div>}
        {currentUser && user && currentUser.username === user.username && (
        <div className="profile-menu-wrapper">
          <button 
            ref={menuButtonRef}
            className="profile-menu-button"
            onClick={() => setIsMenuOpen(!isMenuOpen)}
            title={t('profile.editProfile')}
          >
            <span className="menu-icon">
              <span className="menu-line"></span>
              <span className="menu-line"></span>
              <span className="menu-line"></span>
            </span>
          </button>
          {isMenuOpen && !isEditModalOpen && (
            <div ref={menuDropdownRef} className="profile-menu-dropdown">
              <button
                className="profile-menu-item"
                onClick={() => {
                  setIsEditModalOpen(true);
                  setIsMenuOpen(false);
                }}
              >
                <FontAwesomeIcon icon={faEdit} />
                <span>{t('profile.editProfile')}</span>
              </button>
              <button
                className="profile-menu-item"
                onClick={handleChangeBackgroundClick}
              >
                <FontAwesomeIcon icon={faImage} />
                <span>Фон өзгерту</span>
              </button>
            </div>
          )}
        </div>
        )}
        <div className="profile-avatar-wrapper">
          <div className="profile-avatar">
            {user.avatar ? (
              <img src={user.avatar} alt={user.username} />
            ) : (
              <div className="avatar-placeholder">
                {user.username.charAt(0).toUpperCase()}
              </div>
            )}
          </div>
        </div>
        <div className="profile-info">
          <div className="profile-name-section">
            <h1 className="profile-username">{user.username}</h1>
          </div>
          <div className="profile-contact">
            <span className="contact-item contact-item-id">
              <FontAwesomeIcon icon={faIdCard} /> ID: {ensureNumericId(user.id)}
              <button 
                className="copy-id-btn" 
                onClick={copyId}
                title={isIdCopied ? 'Көшірілді' : 'ID көшіру'}
              >
                <FontAwesomeIcon icon={isIdCopied ? faCheck : faCopy} />
              </button>
            </span>
            {user.bio && user.bio.trim() && (
              <span className="contact-item contact-item-bio">
                <FontAwesomeIcon icon={faUser} />
                <span className="bio-text">{user.bio}</span>
              </span>
            )}
          </div>
        </div>
      </div>

      <div className="profile-stats">
        <div className="stat-card stat-primary">
          <div className="stat-icon"><FontAwesomeIcon icon={faLaptop} /></div>
          <div className="stat-content">
            <div className="stat-value">{userCodes.length}</div>
            <div className="stat-label">{t('profile.codeFiles')}</div>
          </div>
        </div>
        <div className="stat-card stat-accent">
          <div className="stat-icon"><FontAwesomeIcon icon={faHeart} /></div>
          <div className="stat-content">
            <div className="stat-value">{stats.totalLikes}</div>
            <div className="stat-label">{t('profile.likes')}</div>
          </div>
        </div>
        <div className="stat-card stat-secondary">
          <div className="stat-icon"><FontAwesomeIcon icon={faComment} /></div>
          <div className="stat-content">
            <div className="stat-value">{stats.totalComments}</div>
            <div className="stat-label">{t('profile.comments')}</div>
          </div>
        </div>
        <div className="stat-card stat-info">
          <div className="stat-icon"><FontAwesomeIcon icon={faEye} /></div>
          <div className="stat-content">
            <div className="stat-value">{stats.totalViews}</div>
            <div className="stat-label">{t('profile.views')}</div>
          </div>
        </div>
      </div>

      <div className="profile-codes">
        <div className="section-header">
          <h2 className="section-title">
            <span className="section-icon"><FontAwesomeIcon icon={faLaptop} /></span>
            {t('profile.myCodeFiles')}
          </h2>
        </div>
        {userCodes.length === 0 ? (
          <div className="empty-state">
            <div className="empty-icon-wrapper">
              <p className="empty-icon"><FontAwesomeIcon icon={faFileAlt} /></p>
            </div>
            <p className="empty-title">{t('profile.noCodeFiles')}</p>
            <p className="empty-description">
              {t('profile.noCodeFilesDescription')}
            </p>
          </div>
        ) : (
          <div className="codes-grid">
            {userCodes.length > 0 ? (
              userCodes.map((code) => (
                <CodeCard key={code.id} code={code} />
              ))
            ) : (
              <div className="empty-state">
                <div className="empty-icon-wrapper">
                  <p className="empty-icon"><FontAwesomeIcon icon={faFileAlt} /></p>
                </div>
                <p className="empty-title">{t('profile.noCodeFiles')}</p>
                <p className="empty-description">
                  {t('profile.noCodeFilesDescription')}
                </p>
              </div>
            )}
          </div>
        )}
      </div>

      {user && currentUser && currentUser.username === user.username && (
        <>
          <EditProfileModal
            isOpen={isEditModalOpen}
            onClose={() => {
              setIsEditModalOpen(false);
              // Reload profile to ensure we have latest data
              loadProfile();
            }}
            user={user}
            onUpdate={(updatedUser) => {
              setUser(updatedUser);
              setIsEditModalOpen(false);
              // Reload profile to ensure consistency
              loadProfile();
            }}
          />
          <ChangeBackgroundModal
            isOpen={isChangeBackgroundModalOpen}
            onClose={() => {
              setIsChangeBackgroundModalOpen(false);
            }}
            user={user}
            onUpdate={async () => {
              // Reload background image and position after update
              if (user?.id) {
                try {
                  const savedBg = await imageStorage.getImage(`profile-bg-${user.id}`);
                  setBackgroundImage(savedBg || null);
                  
                  // Load saved position
                  const savedPosition = localStorage.getItem(`profile-bg-position-${user.id}`);
                  if (savedPosition) {
                    try {
                      const position = JSON.parse(savedPosition);
                      setBackgroundPosition(position);
                    } catch (e) {
                      setBackgroundPosition({ x: 50, y: 50 });
                    }
                  } else {
                    setBackgroundPosition({ x: 50, y: 50 });
                  }
                } catch (err) {
                  console.error('Failed to load background image:', err);
                  setBackgroundImage(null);
                  setBackgroundPosition({ x: 50, y: 50 });
                }
              }
              setIsChangeBackgroundModalOpen(false);
            }}
          />
        </>
      )}

    </div>
  );
};

export default Profile;

