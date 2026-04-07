import React from 'react';
import { useTranslation } from 'react-i18next';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import { faLock, faDatabase, faShieldAlt, faUserShield, faCookie } from '@fortawesome/free-solid-svg-icons';
import './PrivacyPage.css';

const PrivacyPage: React.FC = () => {
  const { t } = useTranslation();

  return (
    <div className="privacy-page">
      <div className="privacy-container">
        <div className="privacy-header">
          <FontAwesomeIcon icon={faLock} className="privacy-icon" />
          <h1>{t('privacy.title')}</h1>
        </div>

        <div className="privacy-content">
          <section className="privacy-section">
            <h2>
              <FontAwesomeIcon icon={faShieldAlt} />
              {t('privacy.introduction.title')}
            </h2>
            <p>{t('privacy.introduction.description')}</p>
          </section>

          <section className="privacy-section">
            <h2>
              <FontAwesomeIcon icon={faDatabase} />
              {t('privacy.dataCollection.title')}
            </h2>
            <p>{t('privacy.dataCollection.description')}</p>
            <ul>
              <li>{t('privacy.dataCollection.item1')}</li>
              <li>{t('privacy.dataCollection.item2')}</li>
              <li>{t('privacy.dataCollection.item3')}</li>
              <li>{t('privacy.dataCollection.item4')}</li>
            </ul>
          </section>

          <section className="privacy-section">
            <h2>
              <FontAwesomeIcon icon={faUserShield} />
              {t('privacy.dataUse.title')}
            </h2>
            <p>{t('privacy.dataUse.description')}</p>
            <ul>
              <li>{t('privacy.dataUse.item1')}</li>
              <li>{t('privacy.dataUse.item2')}</li>
              <li>{t('privacy.dataUse.item3')}</li>
            </ul>
          </section>

          <section className="privacy-section">
            <h2>
              <FontAwesomeIcon icon={faCookie} />
              {t('privacy.cookies.title')}
            </h2>
            <p>{t('privacy.cookies.description')}</p>
          </section>

          <section className="privacy-section">
            <h2>{t('privacy.security.title')}</h2>
            <p>{t('privacy.security.description')}</p>
          </section>

          <section className="privacy-section">
            <h2>{t('privacy.rights.title')}</h2>
            <p>{t('privacy.rights.description')}</p>
            <ul>
              <li>{t('privacy.rights.item1')}</li>
              <li>{t('privacy.rights.item2')}</li>
              <li>{t('privacy.rights.item3')}</li>
            </ul>
          </section>

          <section className="privacy-section">
            <h2>{t('privacy.contact.title')}</h2>
            <p>{t('privacy.contact.description')}</p>
          </section>
        </div>
      </div>
    </div>
  );
};

export default PrivacyPage;
