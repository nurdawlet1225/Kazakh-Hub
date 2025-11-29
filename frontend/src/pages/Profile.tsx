import React, { useState, useEffect, useRef } from 'react';
import { useTranslation } from 'react-i18next';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import { faLaptop, faHeart, faComment, faEye, faFileAlt, faUser, faEnvelope, faIdCard, faImage, faEdit, faCopy, faCheck, faTrash, faTimes } from '@fortawesome/free-solid-svg-icons';
import { User, CodeFile } from '../utils/api';
import { apiService } from '../utils/api';
import { ensureNumericId } from '../utils/idConverter';
import CodeCard from '../components/CodeCard';
import EditProfileModal from '../components/EditProfileModal';
import './Profile.css';

const Profile: React.FC = () => {
  const { t } = useTranslation();
  const [user, setUser] = useState<User | null>(null);
  const [userCodes, setUserCodes] = useState<CodeFile[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [isEditModalOpen, setIsEditModalOpen] = useState(false);
  const [isMenuOpen, setIsMenuOpen] = useState(false);
  const [backgroundImage, setBackgroundImage] = useState<string | null>(null);
  const [backgroundPreview, setBackgroundPreview] = useState<string | null>(null);
  const [isPreviewModalOpen, setIsPreviewModalOpen] = useState(false);
  const menuButtonRef = useRef<HTMLButtonElement>(null);
  const menuDropdownRef = useRef<HTMLDivElement>(null);
  const backgroundInputRef = useRef<HTMLInputElement>(null);
  const [stats, setStats] = useState({
    totalLikes: 0,
    totalComments: 0,
    totalViews: 0,
  });
  const [isIdCopied, setIsIdCopied] = useState(false);

  useEffect(() => {
    loadProfile();
  }, []);

  // Close menu when modal opens
  useEffect(() => {
    if (isEditModalOpen) {
      setIsMenuOpen(false);
    }
  }, [isEditModalOpen]);

  useEffect(() => {
    // Load background image from localStorage
    if (user?.id && !isPreviewModalOpen) {
      const savedBg = localStorage.getItem(`profile-bg-${user.id}`);
      if (savedBg) {
        setBackgroundImage(savedBg);
        setBackgroundPreview(savedBg);
      } else {
        setBackgroundImage(null);
        // Preview модалды терезе ашық болса, preview-ді null-ға орнату
        if (!isPreviewModalOpen) {
          setBackgroundPreview(null);
        }
      }
    }
  }, [user?.id, isPreviewModalOpen]);

  useEffect(() => {
    // Listen for background update events
    const handleBackgroundUpdate = () => {
      if (user?.id) {
        const savedBg = localStorage.getItem(`profile-bg-${user.id}`);
        if (savedBg) {
          setBackgroundImage(savedBg);
        } else {
          setBackgroundImage(null);
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

  const compressImage = (file: File, maxWidth: number = 1920, quality: number = 0.85): Promise<string> => {
    return new Promise((resolve, reject) => {
      const reader = new FileReader();
      reader.onload = (e) => {
        const img = new Image();
        img.onload = () => {
          const canvas = document.createElement('canvas');
          let width = img.width;
          let height = img.height;

          if (width > maxWidth) {
            height = (height * maxWidth) / width;
            width = maxWidth;
          }

          canvas.width = width;
          canvas.height = height;

          const ctx = canvas.getContext('2d');
          if (!ctx) {
            reject(new Error('Canvas context not available'));
            return;
          }

          ctx.drawImage(img, 0, 0, width, height);
          
          try {
            const compressedBase64 = canvas.toDataURL('image/jpeg', quality);
            resolve(compressedBase64);
          } catch (err) {
            reject(new Error('Image compression failed'));
          }
        };
        img.onerror = () => reject(new Error('Image load failed'));
        img.src = e.target?.result as string;
      };
      reader.onerror = () => reject(new Error('File read failed'));
      reader.readAsDataURL(file);
    });
  };

  const handleBackgroundChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    // Validate file type
    if (!file.type.startsWith('image/')) {
      alert('Тек сурет файлдарын таңдаңыз (JPG, PNG, GIF)');
      if (backgroundInputRef.current) {
        backgroundInputRef.current.value = '';
      }
      return;
    }

    // Validate file size (max 10MB before compression)
    if (file.size > 10 * 1024 * 1024) {
      alert('Сурет өлшемі 10MB-тан аспауы керек');
      if (backgroundInputRef.current) {
        backgroundInputRef.current.value = '';
      }
      return;
    }

    // Бірден preview көрсету - FileReader арқылы
    const reader = new FileReader();
    reader.onload = (event) => {
      const previewUrl = event.target?.result as string;
      if (previewUrl) {
        setBackgroundPreview(previewUrl);
        setIsPreviewModalOpen(true);
      }
    };
    reader.onerror = () => {
      console.error('FileReader error');
      alert('Суретті оқу қатесі');
    };
    reader.readAsDataURL(file);

    try {
      // Compress and convert to base64 (larger size for background)
      const compressedBase64 = await compressImage(file, 1920, 0.85);
      
      // Check compressed size (max 3MB base64 for background)
      let finalImage = compressedBase64;
      if (compressedBase64.length > 3 * 1024 * 1024) {
        // Try with lower quality
        finalImage = await compressImage(file, 1600, 0.75);
        console.log('Background image compressed to:', (finalImage.length / 1024).toFixed(2), 'KB');
      } else {
        console.log('Background image compressed to:', (compressedBase64.length / 1024).toFixed(2), 'KB');
      }
      
      // Preview-ді сығылған суретке жаңарту (модалды терезе ашық болса)
      if (isPreviewModalOpen) {
        setBackgroundPreview(finalImage);
      }
      
      // Save background image to localStorage (тек расталғаннан кейін)
      // localStorage.setItem(`profile-bg-${user.id}`, finalImage);
      // setBackgroundImage(finalImage);
      
      // Dispatch custom event to notify Profile component
      // window.dispatchEvent(new CustomEvent('profileBackgroundUpdated'));
    } catch (err) {
      console.error('Error processing background image:', err);
      alert('Суретті өңдеу қатесі');
      setBackgroundPreview(null); // Preview-ді тазалау қате болса
      setIsPreviewModalOpen(false); // Preview модалды терезесін жабу
      if (backgroundInputRef.current) {
        backgroundInputRef.current.value = '';
      }
    }
  };

  const handleConfirmBackground = () => {
    // Preview-ді растау және модалды терезесін жабу
    if (user?.id && backgroundPreview) {
      localStorage.setItem(`profile-bg-${user.id}`, backgroundPreview);
      setBackgroundImage(backgroundPreview);
      
      // Dispatch custom event to notify Profile component
      window.dispatchEvent(new CustomEvent('profileBackgroundUpdated'));
    }
    setIsPreviewModalOpen(false);
  };

  const handleCancelBackground = () => {
    // Preview-ді жою және модалды терезесін жабу
    setBackgroundPreview(null);
    setBackgroundImage(null);
    setIsPreviewModalOpen(false);
    if (user?.id) {
      localStorage.removeItem(`profile-bg-${user.id}`);
    }
    if (backgroundInputRef.current) {
      backgroundInputRef.current.value = '';
    }
  };

  const handleChangeBackgroundClick = () => {
    setIsMenuOpen(false);
    // Use setTimeout to ensure menu closes before opening file dialog
    setTimeout(() => {
      if (backgroundInputRef.current) {
        backgroundInputRef.current.click();
      }
    }, 100);
  };

  const handleRemoveBackground = () => {
    if (user?.id) {
      localStorage.removeItem(`profile-bg-${user.id}`);
      setBackgroundImage(null);
      setBackgroundPreview(null);
      window.dispatchEvent(new CustomEvent('profileBackgroundUpdated'));
    }
  };

  const loadProfile = async () => {
    try {
      setLoading(true);
      
      // Try to get user from localStorage first
      const storedUser = localStorage.getItem('user');
      let userData: User;
      
      if (storedUser) {
        userData = JSON.parse(storedUser);
      } else {
        // Fallback to API
        userData = await apiService.getCurrentUser();
      }
      
      const codesData = await apiService.getCodeFiles();
      setUser(userData);
      // Пайдаланушының кодтарын сүзгілеу
      const filteredCodes = codesData.filter((code) => code.author === userData.username);
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
      <div 
        className="profile-header"
        style={(backgroundPreview || backgroundImage) ? { 
          backgroundImage: `url(${backgroundPreview || backgroundImage})`, 
          backgroundSize: 'cover', 
          backgroundPosition: 'center' 
        } : {}}
      >
        {(backgroundPreview || backgroundImage) && <div className="profile-header-overlay"></div>}
        <input
          ref={backgroundInputRef}
          type="file"
          accept="image/*"
          onChange={handleBackgroundChange}
          style={{ display: 'none' }}
          id="background-upload"
        />
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
              {backgroundImage && (
                <>
                  <div className="profile-menu-divider"></div>
                  <button
                    className="profile-menu-item"
                    onClick={() => {
                      handleRemoveBackground();
                      setIsMenuOpen(false);
                    }}
                  >
                    <FontAwesomeIcon icon={faTrash} />
                    <span>Фон алып тастау</span>
                  </button>
                </>
              )}
            </div>
          )}
        </div>
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
            <span className="contact-item"><FontAwesomeIcon icon={faEnvelope} /> {user.email}</span>
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

      {user && (
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
      )}

      {/* Background Preview Modal */}
      {isPreviewModalOpen && backgroundPreview && (
        <div 
          className="modal-overlay background-preview-overlay-full" 
          onClick={handleCancelBackground}
          style={{
            backgroundImage: `url(${backgroundPreview})`,
            backgroundSize: 'cover',
            backgroundPosition: 'center',
            backgroundRepeat: 'no-repeat'
          }}
        >
          <div className="modal-content background-preview-modal" onClick={(e) => e.stopPropagation()}>
            <div className="modal-header">
              <h2>Фон суретін алдын ала көру</h2>
              <button className="modal-close" onClick={handleCancelBackground}>
                <FontAwesomeIcon icon={faTimes} />
              </button>
            </div>
            <div className="background-preview-content">
              <div 
                className="background-preview-container"
                style={{
                  backgroundImage: `url(${backgroundPreview})`,
                  backgroundSize: 'cover',
                  backgroundPosition: 'center',
                  backgroundRepeat: 'no-repeat'
                }}
              >
                <div className="background-preview-overlay"></div>
                <div className="background-preview-info">
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
                      <span className="contact-item"><FontAwesomeIcon icon={faEnvelope} /> {user.email}</span>
                      <span className="contact-item contact-item-id">
                        <FontAwesomeIcon icon={faIdCard} /> ID: {ensureNumericId(user.id)}
                      </span>
                    </div>
                  </div>
                </div>
              </div>
              <div className="background-preview-actions">
                <button className="btn-cancel" onClick={handleCancelBackground}>
                  Бас тарту
                </button>
                <button className="btn-confirm" onClick={handleConfirmBackground}>
                  Растау
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default Profile;

