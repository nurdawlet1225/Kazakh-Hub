import React from 'react';
import { useTranslation } from 'react-i18next';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import { faCode, faUsers, faGraduationCap, faUserFriends, faComments, faHeart, faUser, faSearch, faArrowLeft } from '@fortawesome/free-solid-svg-icons';
import { useNavigate } from 'react-router-dom';
import './FeaturesPage.css';

const FeaturesPage: React.FC = () => {
  const { t } = useTranslation();
  const navigate = useNavigate();

  const features = [
    {
      icon: faCode,
      title: t('footer.codeSharing'),
      description: t('features.codeSharingDesc', 'Код файлдарыңызды оңай бөлісіп, басқа дамытушылармен бөлісіңіз')
    },
    {
      icon: faUsers,
      title: t('footer.collaboration'),
      description: t('features.collaborationDesc', 'Басқа дамытушылармен бірге жұмыс істеп, жобаларды бірге дамытыңыз')
    },
    {
      icon: faGraduationCap,
      title: t('footer.learning'),
      description: t('features.learningDesc', 'Басқалардың кодтарынан үйреніп, дағдыларыңызды дамытыңыз')
    },
    {
      icon: faUserFriends,
      title: t('footer.friendsSystem'),
      description: t('features.friendsSystemDesc', 'Достар қосып, олармен байланысыңызды сақтаңыз')
    },
    {
      icon: faComments,
      title: t('footer.messaging'),
      description: t('features.messagingDesc', 'Достармен хабарламалар алмасып, байланысыңызды сақтаңыз')
    },
    {
      icon: faHeart,
      title: t('footer.commentsLikes'),
      description: t('features.commentsLikesDesc', 'Кодтарға пікір қалдырып, лайк қойыңыз')
    },
    {
      icon: faUser,
      title: t('footer.userProfiles'),
      description: t('features.userProfilesDesc', 'Профильіңізді баптап, статистикаларыңызды қараңыз')
    },
    {
      icon: faSearch,
      title: t('footer.searchFilter'),
      description: t('features.searchFilterDesc', 'Кодтарды тіл, тег немесе атау бойынша іздеп, сүзгілеңіз')
    }
  ];

  return (
    <div className="features-page">
      <div className="features-container">
        <button 
          className="features-back-button"
          onClick={() => navigate(-1)}
        >
          <FontAwesomeIcon icon={faArrowLeft} />
          <span>{t('common.back', 'Артқа')}</span>
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
