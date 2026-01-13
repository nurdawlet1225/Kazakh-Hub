import React from 'react';
import { useTranslation } from 'react-i18next';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import { faInfoCircle, faRocket, faUsers, faCode, faHeart } from '@fortawesome/free-solid-svg-icons';
import './AboutPage.css';

const AboutPage: React.FC = () => {
  const { t } = useTranslation();

  return (
    <div className="about-page">
      <div className="about-container">
        <div className="about-header">
          <FontAwesomeIcon icon={faInfoCircle} className="about-icon" />
          <h1>{t('about.title')}</h1>
          <p className="about-subtitle">{t('about.subtitle')}</p>
        </div>

        <div className="about-content">
          <section className="about-section">
            <h2>{t('about.whatIs.title')}</h2>
            <p>{t('about.whatIs.description')}</p>
          </section>

          <section className="about-section">
            <h2>{t('about.mission.title')}</h2>
            <p>{t('about.mission.description')}</p>
          </section>

          <section className="about-section">
            <h2>{t('about.features.title')}</h2>
            <ul className="features-list">
              <li>
                <FontAwesomeIcon icon={faCode} />
                <span>{t('about.features.codeSharing')}</span>
              </li>
              <li>
                <FontAwesomeIcon icon={faUsers} />
                <span>{t('about.features.collaboration')}</span>
              </li>
              <li>
                <FontAwesomeIcon icon={faRocket} />
                <span>{t('about.features.learning')}</span>
              </li>
              <li>
                <FontAwesomeIcon icon={faHeart} />
                <span>{t('about.features.community')}</span>
              </li>
            </ul>
          </section>

          <section className="about-section">
            <h2>{t('about.contact.title')}</h2>
            <p>{t('about.contact.description')}</p>
          </section>
        </div>
      </div>
    </div>
  );
};

export default AboutPage;
