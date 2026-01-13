import React from 'react';
import { useTranslation } from 'react-i18next';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import { faList, faGavel, faShieldAlt, faBan } from '@fortawesome/free-solid-svg-icons';
import './TermsPage.css';

const TermsPage: React.FC = () => {
  const { t } = useTranslation();

  return (
    <div className="terms-page">
      <div className="terms-container">
        <div className="terms-header">
          <FontAwesomeIcon icon={faList} className="terms-icon" />
          <h1>{t('terms.title')}</h1>
          <p className="terms-subtitle">{t('terms.lastUpdated')}</p>
        </div>

        <div className="terms-content">
          <section className="terms-section">
            <h2>
              <FontAwesomeIcon icon={faGavel} />
              {t('terms.acceptance.title')}
            </h2>
            <p>{t('terms.acceptance.description')}</p>
          </section>

          <section className="terms-section">
            <h2>
              <FontAwesomeIcon icon={faShieldAlt} />
              {t('terms.use.title')}
            </h2>
            <p>{t('terms.use.description')}</p>
            <ul>
              <li>{t('terms.use.rule1')}</li>
              <li>{t('terms.use.rule2')}</li>
              <li>{t('terms.use.rule3')}</li>
              <li>{t('terms.use.rule4')}</li>
            </ul>
          </section>

          <section className="terms-section">
            <h2>
              <FontAwesomeIcon icon={faBan} />
              {t('terms.prohibited.title')}
            </h2>
            <p>{t('terms.prohibited.description')}</p>
            <ul>
              <li>{t('terms.prohibited.rule1')}</li>
              <li>{t('terms.prohibited.rule2')}</li>
              <li>{t('terms.prohibited.rule3')}</li>
              <li>{t('terms.prohibited.rule4')}</li>
            </ul>
          </section>

          <section className="terms-section">
            <h2>{t('terms.intellectual.title')}</h2>
            <p>{t('terms.intellectual.description')}</p>
          </section>

          <section className="terms-section">
            <h2>{t('terms.liability.title')}</h2>
            <p>{t('terms.liability.description')}</p>
          </section>

          <section className="terms-section">
            <h2>{t('terms.changes.title')}</h2>
            <p>{t('terms.changes.description')}</p>
          </section>
        </div>
      </div>
    </div>
  );
};

export default TermsPage;
