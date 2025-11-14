import React, { useState, useEffect } from 'react';
import { useTranslation } from 'react-i18next';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import { faLaptop, faHeart, faComment, faEye, faFileAlt, faUser, faEnvelope, faIdCard } from '@fortawesome/free-solid-svg-icons';
import { User, CodeFile } from '../utils/api';
import { apiService } from '../utils/api';
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
  const [stats, setStats] = useState({
    totalLikes: 0,
    totalComments: 0,
    totalViews: 0,
  });

  useEffect(() => {
    loadProfile();
  }, []);

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
      <div className="profile-header">
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
        <div className="profile-avatar-wrapper">
          <div className="profile-avatar">
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
        <div className="profile-info">
          <div className="profile-name-section">
            <h1 className="profile-username">{user.username}</h1>
            <div className="profile-badge">{t('profile.developer')}</div>
          </div>
          <div className="profile-contact">
            <span className="contact-item"><FontAwesomeIcon icon={faEnvelope} /> {user.email}</span>
            <span className="contact-item"><FontAwesomeIcon icon={faIdCard} /> ID: {user.id}</span>
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
    </div>
  );
};

export default Profile;

