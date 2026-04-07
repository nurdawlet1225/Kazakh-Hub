import React, { useState, useEffect } from 'react';
import { useTranslation } from 'react-i18next';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import { faEnvelope, faPhone, faMapMarkerAlt, faPaperPlane, faCheckCircle } from '@fortawesome/free-solid-svg-icons';
import { apiService, SiteConfig } from '../utils/api';
import './ContactPage.css';

const ContactPage: React.FC = () => {
  const { t, i18n } = useTranslation();
  const [config, setConfig] = useState<SiteConfig | null>(null);
  const [formData, setFormData] = useState({
    name: '',
    email: '',
    subject: '',
    message: ''
  });
  const [isSubmitted, setIsSubmitted] = useState(false);

  useEffect(() => {
    apiService.getConfig().then(setConfig);
  }, []);

  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => {
    const { name, value } = e.target;
    setFormData(prev => ({
      ...prev,
      [name]: value
    }));
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    // Here you would typically send the form data to your backend
    console.log('Form submitted:', formData);
    setIsSubmitted(true);
    setTimeout(() => {
      setIsSubmitted(false);
      setFormData({ name: '', email: '', subject: '', message: '' });
    }, 3000);
  };

  return (
    <div className="contact-page">
      <div className="contact-container">
        <div className="contact-header">
          <FontAwesomeIcon icon={faEnvelope} className="contact-icon" />
          <h1>{t('contact.title')}</h1>
          <p className="contact-subtitle">{t('contact.subtitle')}</p>
        </div>

        <div className="contact-content">
          <div className="contact-info-section">
            <section className="contact-info">
              <h2>{t('contact.getInTouch')}</h2>
              <p>{t('contact.description')}</p>
              
              <div className="contact-methods">
                <div className="contact-method">
                  <div className="method-icon">
                    <FontAwesomeIcon icon={faEnvelope} />
                  </div>
                  <div className="method-content">
                    <h3>{t('contact.email')}</h3>
                    <p>{config?.contact?.email ?? ''}</p>
                  </div>
                </div>
                
                <div className="contact-method">
                  <div className="method-icon">
                    <FontAwesomeIcon icon={faPhone} />
                  </div>
                  <div className="method-content">
                    <h3>{t('contact.phone')}</h3>
                    <p>{config?.contact?.phone ?? ''}</p>
                  </div>
                </div>
                
                <div className="contact-method">
                  <div className="method-icon">
                    <FontAwesomeIcon icon={faMapMarkerAlt} />
                  </div>
                  <div className="method-content">
                    <h3>{t('contact.address')}</h3>
                    <p>{config?.contact?.address || (i18n.language === 'en' ? config?.contact?.addressEn : '') || t('contact.addressValue')}</p>
                  </div>
                </div>
              </div>
            </section>
          </div>

          <div className="contact-form-section">
            <section className="contact-form-container">
              <h2>{t('contact.sendMessage')}</h2>
              
              {isSubmitted ? (
                <div className="form-success">
                  <FontAwesomeIcon icon={faCheckCircle} />
                  <p>{t('contact.successMessage')}</p>
                </div>
              ) : (
                <form className="contact-form" onSubmit={handleSubmit}>
                  <div className="form-group">
                    <label htmlFor="name">{t('contact.form.name')}</label>
                    <input
                      type="text"
                      id="name"
                      name="name"
                      value={formData.name}
                      onChange={handleChange}
                      required
                      placeholder={t('contact.form.namePlaceholder')}
                    />
                  </div>
                  
                  <div className="form-group">
                    <label htmlFor="email">{t('contact.form.email')}</label>
                    <input
                      type="email"
                      id="email"
                      name="email"
                      value={formData.email}
                      onChange={handleChange}
                      required
                      placeholder={t('contact.form.emailPlaceholder')}
                    />
                  </div>
                  
                  <div className="form-group">
                    <label htmlFor="subject">{t('contact.form.subject')}</label>
                    <input
                      type="text"
                      id="subject"
                      name="subject"
                      value={formData.subject}
                      onChange={handleChange}
                      required
                      placeholder={t('contact.form.subjectPlaceholder')}
                    />
                  </div>
                  
                  <div className="form-group">
                    <label htmlFor="message">{t('contact.form.message')}</label>
                    <textarea
                      id="message"
                      name="message"
                      value={formData.message}
                      onChange={handleChange}
                      required
                      rows={6}
                      placeholder={t('contact.form.messagePlaceholder')}
                    />
                  </div>
                  
                  <button type="submit" className="submit-button">
                    <FontAwesomeIcon icon={faPaperPlane} />
                    <span>{t('contact.form.submit')}</span>
                  </button>
                </form>
              )}
            </section>
          </div>
        </div>
      </div>
    </div>
  );
};

export default ContactPage;
