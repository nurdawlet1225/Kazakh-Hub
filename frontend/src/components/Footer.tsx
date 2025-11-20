import React from 'react';
import { useTranslation } from 'react-i18next';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import { faEnvelope, faInfoCircle, faLink, faBook, faList, faLock, faRocket, faLaptop } from '@fortawesome/free-solid-svg-icons';
import './Footer.css';

const Footer: React.FC = () => {
  const { t } = useTranslation();
  const currentYear = new Date().getFullYear();

  return (
    <footer className="footer">
      <div className="footer-container">
        <div className="footer-content">
          <div className="footer-section">
            <div className="footer-logo-section">
              <h3 className="footer-title">Kazakh Hub</h3>
              <p className="footer-description">
                {t('footer.description')}
              </p>
              <div className="footer-social">
                <a href="https://oyji.org" target="_blank" rel="noopener noreferrer" className="social-link" title="OyJI">
                  <span className="social-icon"><img src="https://oyji.org/favicon.ico" alt="OyJI" style={{ width: '24px', height: '24px', objectFit: 'contain' }} /></span>
                </a>
                <a href="nurdawlettawirbaev01@gmail.com" className="social-link" title="Email">
                  <span className="social-icon"><FontAwesomeIcon icon={faEnvelope} /></span>
                </a>
              </div>
            </div>
          </div>

          <div className="footer-section">
            <h4 className="footer-heading">
              <span className="heading-icon"><FontAwesomeIcon icon={faLink} /></span>
              {t('footer.links')}
            </h4>
            <ul className="footer-links">
              <li>
                <a href="nurdawlettawirbaev01@gmail.com">
                  <span className="link-icon"><FontAwesomeIcon icon={faEnvelope} /></span>
                 nurdawlettawirbaev01@gmail.com
                </a>
              </li>
              <li>
                <a href="https://oyji.org" target="_blank" rel="noopener noreferrer">
                  <span className="link-icon link-icon-svg"><img src="https://oyji.org/favicon.ico" alt="OyJI" style={{ width: '18px', height: '18px', objectFit: 'contain' }} /></span>
                  OyJI
                </a>
              </li>
            </ul>
          </div>

          <div className="footer-section">
            <h4 className="footer-heading">
              <span className="heading-icon"><FontAwesomeIcon icon={faInfoCircle} /></span>
              {t('footer.info')}
            </h4>
            <ul className="footer-links">
              <li>
                <a href="/about">
                  <span className="link-icon"><FontAwesomeIcon icon={faBook} /></span>
                  {t('footer.about')}
                </a>
              </li>
              <li>
                <a href="/terms">
                  <span className="link-icon"><FontAwesomeIcon icon={faList} /></span>
                  {t('footer.terms')}
                </a>
              </li>
              <li>
                <a href="/privacy">
                  <span className="link-icon"><FontAwesomeIcon icon={faLock} /></span>
                  {t('footer.privacy')}
                </a>
              </li>
            </ul>
          </div>
        </div>

        <div className="footer-bottom">
          <div className="footer-bottom-content">
            <p>&copy; {currentYear} Kazakh Hub. {t('footer.copyright')}</p>
            <div className="footer-badges">
              <span className="badge"><FontAwesomeIcon icon={faRocket} /> {t('footer.kazakhstan')}</span>
              <span className="badge"><FontAwesomeIcon icon={faLaptop} /> {t('footer.openSource')}</span>
            </div>
          </div>
        </div>
      </div>
    </footer>
  );
};

export default Footer;

