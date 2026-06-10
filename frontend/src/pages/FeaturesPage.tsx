import React, { useMemo } from 'react';
import { useTranslation } from 'react-i18next';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import { faCode, faUsers, faGraduationCap, faUserFriends, faComments, faHeart, faUser, faSearch, faArrowLeft, faShieldAlt, faGlobe, faRocket, faMobileAlt, faLock } from '@fortawesome/free-solid-svg-icons';
import { useNavigate } from 'react-router-dom';
import { useSiteConfig } from '../contexts/SiteConfigContext';
import './FeaturesPage.css';

// Icon mapping from string names to FontAwesome icons
const iconMap: { [key: string]: any } = {
  faCode,
  faUsers,
  faGraduationCap,
  faUserFriends,
  faComments,
  faHeart,
  faUser,
  faSearch,
  faShieldAlt,
  faGlobe,
  faRocket,
  faMobileAlt,
  faLock,
};

// Default features when config is not available
const defaultFeatures = [
  { icon: 'faCode', titleKey: 'footer.codeSharing', descriptionKey: 'features.codeSharingDesc' },
  { icon: 'faUsers', titleKey: 'footer.collaboration', descriptionKey: 'features.collaborationDesc' },
  { icon: 'faGraduationCap', titleKey: 'footer.learning', descriptionKey: 'features.learningDesc' },
  { icon: 'faUserFriends', titleKey: 'footer.friendsSystem', descriptionKey: 'features.friendsSystemDesc' },
  { icon: 'faComments', titleKey: 'footer.messaging', descriptionKey: 'features.messagingDesc' },
  { icon: 'faHeart', titleKey: 'footer.commentsLikes', descriptionKey: 'features.commentsLikesDesc' },
  { icon: 'faUser', titleKey: 'footer.userProfiles', descriptionKey: 'features.userProfilesDesc' },
  { icon: 'faSearch', titleKey: 'footer.searchFilter', descriptionKey: 'features.searchFilterDesc' },
];

const FeaturesPage: React.FC = () => {
  const { t } = useTranslation();
  const navigate = useNavigate();
  const { config } = useSiteConfig();

  const features = useMemo(() => {
    const featureList = config?.features || defaultFeatures;
    return featureList.map(f => ({
      icon: iconMap[f.icon] || faCode,
      title: t(f.titleKey),
      description: t(f.descriptionKey),
    }));
  }, [config?.features, t]);

  return (
    <div className="features-page">
      <div className="features-container">
        <button
          className="features-back-button"
          onClick={() => navigate(-1)}
        >
          <FontAwesomeIcon icon={faArrowLeft} />
          <span>{t('common.back')}</span>
        </button>

        <div className="features-header">
          <h1 className="features-title">{t('footer.features')}</h1>
          <p className="features-subtitle">{t('footer.description')}</p>
        </div>

        <div className="features-grid">
          {features.map((feature, index) => (
            <div key={index} className="feature-card">
              <div className="feature-icon-wrapper">
                <FontAwesomeIcon icon={feature.icon} className="feature-icon-large" />
              </div>
              <h3 className="feature-card-title">{feature.title}</h3>
              <p className="feature-card-description">{feature.description}</p>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
};

export default FeaturesPage;