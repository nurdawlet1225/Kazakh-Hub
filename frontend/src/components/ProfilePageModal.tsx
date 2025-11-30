import React, { useState, useEffect } from 'react';
import { useTranslation } from 'react-i18next';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import { faLaptop, faHeart, faComment, faEye, faFileAlt, faUser, faEnvelope, faIdCard, faTimes, faCopy, faCheck } from '@fortawesome/free-solid-svg-icons';
import { User, CodeFile } from '../utils/api';
import { apiService } from '../utils/api';
import { ensureNumericId } from '../utils/idConverter';
import CodeCard from './CodeCard';
import EditProfileModal from './EditProfileModal';
import './ProfilePageModal.css';

interface ProfilePageModalProps {
  isOpen: boolean;
  onClose: () => void;
}

const ProfilePageModal: React.FC<ProfilePageModalProps> = ({ isOpen, onClose }) => {
  const { t } = useTranslation();
  const [user, setUser] = useState<User | null>(null);
  const [userCodes, setUserCodes] = useState<CodeFile[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [isEditModalOpen, setIsEditModalOpen] = useState(false);
  const [backgroundImage, setBackgroundImage] = useState<string | null>(null);
  const [stats, setStats] = useState({
    totalLikes: 0,
    totalComments: 0,
    totalViews: 0,
  });
  const [isIdCopied, setIsIdCopied] = useState(false);

  useEffect(() => {
    if (isOpen) {
      loadProfile();
    }
  }, [isOpen]);

  useEffect(() => {
    // Load background image from localStorage
    if (user?.id) {
      const savedBg = localStorage.getItem(`profile-bg-${user.id}`);
      if (savedBg) {
        setBackgroundImage(savedBg);
      } else {
        setBackgroundImage(null);
      }
    }
  }, [user?.id]);

  const copyId = async () => {
    if (user?.id) {
      try {
        const idToCopy = ensureNumericId(user.id);
        await navigator.clipboard.writeText(idToCopy);
        setIsIdCopied(true);
        setTimeout(() => setIsIdCopied(false), 2000);
      } catch (err) {
        console.error('Failed to copy ID:', err);
      }
    }
  };

  const loadProfile = async () => {
    try {
      setLoading(true);
      
      const storedUser = localStorage.getItem('user');
      let userData: User;
      
      if (storedUser) {
        userData = JSON.parse(storedUser);
        // Convert to numeric ID if it contains letters
        if (userData.id && !/^\d+$/.test(userData.id)) {
          userData.id = ensureNumericId(userData.id);
          localStorage.setItem('user', JSON.stringify(userData));
        }
      } else {
        userData = await apiService.getCurrentUser();
        // Convert to numeric ID if it contains letters
        if (userData.id && !/^\d+$/.test(userData.id)) {
          userData.id = ensureNumericId(userData.id);
        }
      }
      
      const codesResponse = await apiService.getCodeFiles(undefined, 1000, 0, false);
      setUser(userData);
      const filteredCodes = codesResponse.codes.filter((code) => code.author === userData.username);
      setUserCodes(filteredCodes);
      
      const totalLikes = filteredCodes.reduce((sum, code) => sum + (code.likes?.length || 0), 0);
      const totalComments = filteredCodes.reduce((sum, code) => {
        const commentCount = code.comments?.length || 0;
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

  if (!isOpen) return null;

  return (
    <>
      <div className="modal-overlay" onClick={onClose}>
        <div className="modal-content profile-page-modal-content" onClick={(e) => e.stopPropagation()}>
          <div className="modal-header">
            <h2>{t('profile.title')}</h2>
            <button className="modal-close" onClick={onClose}>
              <FontAwesomeIcon icon={faTimes} />
            </button>
          </div>

          <div className="profile-page-modal-body">
            {loading ? (
              <div className="loading-spinner">
                <div className="spinner"></div>
                <p>{t('profile.loading')}</p>
              </div>
            ) : error || !user ? (
              <div className="error-state">
                <p className="error-icon">❌</p>
                <p className="error-title">{t('profile.errorTitle')}</p>
                <p className="error-message">{error || t('profile.userNotFound')}</p>
              </div>
            ) : (
              <>
                {/* Profile Header */}
                <div 
                  className="profile-modal-header"
                  style={backgroundImage ? { backgroundImage: `url(${backgroundImage})`, backgroundSize: 'cover', backgroundPosition: 'center' } : {}}
                >
                  {backgroundImage && <div className="profile-header-overlay"></div>}
                  <button 
                    className="profile-menu-button"
                    onClick={() => setIsEditModalOpen(true)}
                    title={t('profile.editProfile')}
                  >
                    <span className="menu-icon">
                      <span className="menu-line"></span>
                      <span className="menu-line"></span>
                      <span className="menu-line"></span>
                    </span>
                  </button>
                  <div className="profile-modal-avatar-wrapper">
                    <div className="profile-modal-avatar">
                      {user.avatar ? (
                        <img src={user.avatar} alt={user.username} />
                      ) : (
                        <div className="avatar-placeholder">
                          {user.username.charAt(0).toUpperCase()}
                        </div>
                      )}
                      <div className="avatar-badge"><FontAwesomeIcon icon={faUser} /></div>
                    </div>
                  </div>
                  <div className="profile-modal-info">
                    <div className="profile-modal-name-section">
                      <h3 className="profile-modal-username">{user.username}</h3>
                    </div>
                    <div className="profile-modal-contact">
                      <span className="contact-item">
                        <FontAwesomeIcon icon={faEnvelope} /> {user.email}
                      </span>
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

                {/* Stats */}
                <div className="profile-modal-stats">
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

                {/* Codes */}
                <div className="profile-modal-codes">
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
                      {userCodes.map((code) => (
                        <CodeCard key={code.id} code={code} />
                      ))}
                    </div>
                  )}
                </div>
              </>
            )}
          </div>
        </div>
      </div>

      {user && (
        <EditProfileModal
          isOpen={isEditModalOpen}
          onClose={() => {
            setIsEditModalOpen(false);
            loadProfile();
          }}
          user={user}
          onUpdate={(updatedUser) => {
            setUser(updatedUser);
            setIsEditModalOpen(false);
            loadProfile();
          }}
        />
      )}
    </>
  );
};

export default ProfilePageModal;



