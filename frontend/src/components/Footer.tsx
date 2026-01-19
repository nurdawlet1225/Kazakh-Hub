import React from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import { faInfoCircle, faFolderOpen, faBook, faList, faLock, faRocket, faLaptop } from '@fortawesome/free-solid-svg-icons';
import './Footer.css';

const Footer: React.FC = () => {
  const { t } = useTranslation();
  const navigate = useNavigate();
  const currentYear = new Date().getFullYear();

  return (
    <footer className="footer">
      <div className="footer-container">
        <div className="footer-content">
          <div className="footer-section">
            <div className="footer-logo-section">
              <h3 className="footer-title">{t('header.appName')}</h3>
              <p className="footer-description">
                {t('footer.description')}
              </p>
            </div>
            <div className="footer-features">
              <button 
                className="footer-features-title"
                onClick={() => navigate('/features')}
              >
                {t('footer.features')}
              </button>
            </div>
          </div>

          <div className="footer-section">
            <h4 className="footer-heading">
              <span className="heading-icon"><FontAwesomeIcon icon={faFolderOpen} /></span>
              {t('footer.links')}
            </h4>
            <ul className="footer-links">
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
                <Link to="/about">
                  <span className="link-icon"><FontAwesomeIcon icon={faBook} /></span>
                  {t('footer.about')}
                </Link>
              </li>
              <li>
                <Link to="/terms">
                  <span className="link-icon"><FontAwesomeIcon icon={faList} /></span>
                  {t('footer.terms')}
                </Link>
              </li>
              <li>
                <Link to="/privacy">
                  <span className="link-icon"><FontAwesomeIcon icon={faLock} /></span>
                  {t('footer.privacy')}
                </Link>
              </li>
            </ul>
          </div>
        </div>

        <div className="footer-bottom">
          <div className="footer-bottom-content">
            <p>&copy; {currentYear} {t('header.appName')}. {t('footer.copyright')}</p>
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

