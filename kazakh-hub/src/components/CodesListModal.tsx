import React, { useState, useEffect, useCallback } from 'react';
import { useNavigate } from 'react-router-dom';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import { faFolder, faGlobe, faMobileAlt, faCog, faDatabase, faCalculator, faFolderOpen, faList, faFileAlt } from '@fortawesome/free-solid-svg-icons';
import { CodeFile } from '../utils/api';
import { apiService } from '../utils/api';
import CodeCard from './CodeCard';
import './CodesListModal.css';

interface CodesListModalProps {
  isOpen: boolean;
  onClose: () => void;
}

// Категорияларды анықтау функциясы
const getCategory = (code: CodeFile): string => {
  const title = code.title?.toLowerCase() || '';
  const description = code.description?.toLowerCase() || '';
  const tags = code.tags?.join(' ').toLowerCase() || '';
  const content = title + ' ' + description + ' ' + tags;

  // ЖИ бөлімі
  if (content.includes('жи') || content.includes('жоба') || content.includes('проект')) {
    return 'ЖИ бөлімі';
  }
  
  // Сайттар
  if (content.includes('сайт') || content.includes('веб') || content.includes('web') || 
      content.includes('html') || content.includes('css') || content.includes('react') ||
      content.includes('frontend') || content.includes('ui') || content.includes('ux')) {
    return 'Сайттар';
  }
  
  // Мобильді қосымшалар
  if (content.includes('мобиль') || content.includes('mobile') || content.includes('android') ||
      content.includes('ios') || content.includes('app')) {
    return 'Мобильді қосымшалар';
  }
  
  // API және Backend
  if (content.includes('api') || content.includes('backend') || content.includes('сервер') ||
      content.includes('server') || content.includes('node') || content.includes('express')) {
    return 'API және Backend';
  }
  
  // Деректер базасы
  if (content.includes('база') || content.includes('database') || content.includes('sql') ||
      content.includes('mysql') || content.includes('postgresql') || content.includes('mongodb')) {
    return 'Деректер базасы';
  }
  
  // Алгоритмдер
  if (content.includes('алгоритм') || content.includes('algorithm') || content.includes('структура') ||
      content.includes('data structure') || content.includes('sort') || content.includes('search')) {
    return 'Алгоритмдер';
  }
  
  // Басқа
  return 'Басқа';
};

const CodesListModal: React.FC<CodesListModalProps> = ({ isOpen, onClose }) => {
  const navigate = useNavigate();
  const [codes, setCodes] = useState<CodeFile[]>([]);
  const [loading, setLoading] = useState(true);
  const [expandedCategories, setExpandedCategories] = useState<Set<string>>(new Set());
  const [groupedCodes, setGroupedCodes] = useState<Record<string, CodeFile[]>>({});

  const loadCodes = useCallback(async () => {
    try {
      setLoading(true);
      const data = await apiService.getCodeFiles();
      setCodes(data);
    } catch (err) {
      console.error('Failed to load codes:', err);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    if (isOpen) {
      loadCodes();
    }
  }, [isOpen, loadCodes]);

  useEffect(() => {
    // Папка жүктелгеннен кейін тізімді жаңарту
    const handleCodesUpdated = () => {
      if (isOpen) {
        loadCodes();
      }
    };

    window.addEventListener('codesUpdated', handleCodesUpdated);

    return () => {
      window.removeEventListener('codesUpdated', handleCodesUpdated);
    };
  }, [isOpen, loadCodes]);

  useEffect(() => {
    if (codes.length > 0) {
      const grouped: Record<string, CodeFile[]> = {};
      codes.forEach((code) => {
        const category = getCategory(code);
        if (!grouped[category]) {
          grouped[category] = [];
        }
        grouped[category].push(code);
      });
      setGroupedCodes(grouped);
    }
  }, [codes]);

  const categories = Array.from(new Set(codes.map((code) => getCategory(code)))).sort();

  const toggleCategory = (category: string) => {
    setExpandedCategories((prev) => {
      const newSet = new Set(prev);
      if (newSet.has(category)) {
        newSet.delete(category);
      } else {
        newSet.add(category);
      }
      return newSet;
    });
  };

  const categoryIcons: Record<string, JSX.Element> = {
    'ЖИ бөлімі': <FontAwesomeIcon icon={faFolder} />,
    'Сайттар': <FontAwesomeIcon icon={faGlobe} />,
    'Мобильді қосымшалар': <FontAwesomeIcon icon={faMobileAlt} />,
    'API және Backend': <FontAwesomeIcon icon={faCog} />,
    'Деректер базасы': <FontAwesomeIcon icon={faDatabase} />,
    'Алгоритмдер': <FontAwesomeIcon icon={faCalculator} />,
    'Басқа': <FontAwesomeIcon icon={faFolderOpen} />,
  };

  if (!isOpen) return null;

  return (
    <div className="codes-modal-overlay" onClick={onClose}>
      <div className="codes-modal-content" onClick={(e) => e.stopPropagation()}>
        <div className="codes-modal-header">
          <div className="codes-modal-header-content">
            <div className="codes-modal-title-section">
              <span className="codes-modal-icon"><FontAwesomeIcon icon={faList} /></span>
              <div>
                <h2>Кодтар тізімі</h2>
                <p className="codes-modal-subtitle">
                  {loading ? 'Жүктелуде...' : `${codes.length} ${codes.length === 1 ? 'код' : 'код'} табылды`}
                </p>
              </div>
            </div>
            <button className="codes-modal-close" onClick={onClose} title="Жабу">
              <span>×</span>
            </button>
          </div>
        </div>

        {loading ? (
          <div className="codes-modal-loading">
            <div className="spinner"></div>
            <p>Жүктелуде...</p>
          </div>
        ) : categories.length === 0 ? (
          <div className="codes-modal-empty">
            <div className="empty-icon-wrapper">
              <p className="empty-icon"><FontAwesomeIcon icon={faFileAlt} /></p>
            </div>
            <p className="empty-title">Кодтар табылмады</p>
            <p className="empty-description">
              Әзірге кодтар жоқ. Алғашқы кодтыңызды жүктеңіз!
            </p>
          </div>
        ) : (
          <div className="codes-modal-folders">
            {categories.map((category) => {
              const categoryCodes = groupedCodes[category] || [];
              const isExpanded = expandedCategories.has(category);
              const icon = categoryIcons[category] || <FontAwesomeIcon icon={faFolderOpen} />;

              return (
                <div key={category} className="codes-folder">
                  <div 
                    className="codes-folder-header"
                    onClick={() => toggleCategory(category)}
                  >
                    <div className="codes-folder-icon-wrapper">
                      <span className="codes-folder-icon">{icon}</span>
                      <span className={`codes-folder-arrow ${isExpanded ? 'expanded' : ''}`}>▶</span>
                    </div>
                    <div className="codes-folder-info">
                      <h3 className="codes-folder-name">{category}</h3>
                      <span className="codes-folder-count">
                        {categoryCodes.length} {categoryCodes.length === 1 ? 'код' : 'код'}
                      </span>
                    </div>
                  </div>
                  {isExpanded && (
                    <div className="codes-folder-content">
                      {categoryCodes.length === 0 ? (
                        <div className="codes-folder-empty">
                          <p>Бұл категорияда кодтар жоқ</p>
                        </div>
                      ) : (
                        <div className="codes-folder-codes">
                          {categoryCodes.map((code) => (
                            <div 
                              key={code.id}
                              className="codes-folder-code-item"
                              onClick={(e) => {
                                e.stopPropagation();
                                onClose();
                                setTimeout(() => {
                                  navigate(`/view/${code.id}`);
                                }, 100);
                              }}
                            >
                              <CodeCard code={code} />
                            </div>
                          ))}
                        </div>
                      )}
                    </div>
                  )}
                </div>
              );
            })}
          </div>
        )}
      </div>
    </div>
  );
};

export default CodesListModal;

