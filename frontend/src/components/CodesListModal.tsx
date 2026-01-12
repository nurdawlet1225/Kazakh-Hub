import React, { useState, useEffect, useCallback, useMemo } from 'react';
import { useNavigate } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import { 
  faFolder, 
  faGlobe, 
  faMobileAlt, 
  faCog, 
  faDatabase, 
  faCalculator, 
  faFolderOpen, 
  faList, 
  faFileAlt,
  faChevronRight,
  faTimes
} from '@fortawesome/free-solid-svg-icons';
import { CodeFile } from '../utils/api';
import { apiService } from '../utils/api';
import CodeCard from './CodeCard';
import './CodesListModal.css';

interface CodesListModalProps {
  isOpen: boolean;
  onClose: () => void;
}

type CategoryKey = 
  | 'categoryAI' 
  | 'categoryWebsites' 
  | 'categoryMobile' 
  | 'categoryAPI' 
  | 'categoryDatabase' 
  | 'categoryAlgorithms' 
  | 'categoryOther';

interface CategoryData {
  key: CategoryKey;
  codes: CodeFile[];
  icon: JSX.Element;
}

/**
 * Determines the category for a code based on its content
 */
const getCategory = (code: CodeFile): CategoryKey => {
  const searchText = [
    code.title?.toLowerCase() || '',
    code.description?.toLowerCase() || '',
    code.tags?.join(' ').toLowerCase() || '',
    code.language?.toLowerCase() || ''
  ].join(' ');

  // AI Section / ЖИ бөлімі
  if (
    searchText.includes('жи') || 
    searchText.includes('жоба') || 
    searchText.includes('проект') ||
    searchText.includes('ai') || 
    searchText.includes('artificial') || 
    searchText.includes('machine learning') ||
    searchText.includes('ml') || 
    searchText.includes('neural') || 
    searchText.includes('deep learning')
  ) {
    return 'categoryAI';
  }
  
  // Websites / Сайттар
  if (
    searchText.includes('сайт') || 
    searchText.includes('веб') || 
    searchText.includes('web') || 
    searchText.includes('html') || 
    searchText.includes('css') || 
    searchText.includes('react') ||
    searchText.includes('frontend') || 
    searchText.includes('ui') || 
    searchText.includes('ux')
  ) {
    return 'categoryWebsites';
  }
  
  // Mobile Apps / Мобильді қосымшалар
  if (
    searchText.includes('мобиль') || 
    searchText.includes('mobile') || 
    searchText.includes('android') ||
    searchText.includes('ios') || 
    searchText.includes('app')
  ) {
    return 'categoryMobile';
  }
  
  // API and Backend
  if (
    searchText.includes('api') || 
    searchText.includes('backend') || 
    searchText.includes('сервер') ||
    searchText.includes('server') || 
    searchText.includes('node') || 
    searchText.includes('express')
  ) {
    return 'categoryAPI';
  }
  
  // Database / Деректер базасы
  if (
    searchText.includes('база') || 
    searchText.includes('database') || 
    searchText.includes('sql') ||
    searchText.includes('mysql') || 
    searchText.includes('postgresql') || 
    searchText.includes('mongodb')
  ) {
    return 'categoryDatabase';
  }
  
  // Algorithms / Алгоритмдер
  if (
    searchText.includes('алгоритм') || 
    searchText.includes('algorithm') || 
    searchText.includes('структура') ||
    searchText.includes('data structure') || 
    searchText.includes('sort') || 
    searchText.includes('search')
  ) {
    return 'categoryAlgorithms';
  }
  
  // Other / Басқа
  return 'categoryOther';
};

const CodesListModal: React.FC<CodesListModalProps> = ({ isOpen, onClose }) => {
  const navigate = useNavigate();
  const { t } = useTranslation();
  
  const [codes, setCodes] = useState<CodeFile[]>([]);
  const [loading, setLoading] = useState(true);
  const [expandedCategories, setExpandedCategories] = useState<Set<CategoryKey>>(new Set());
  const [hiddenCategories, setHiddenCategories] = useState<Set<CategoryKey>>(new Set());

  // Category icons mapping
  const categoryIcons: Record<CategoryKey, JSX.Element> = useMemo(() => ({
    categoryAI: <FontAwesomeIcon icon={faFolder} />,
    categoryWebsites: <FontAwesomeIcon icon={faGlobe} />,
    categoryMobile: <FontAwesomeIcon icon={faMobileAlt} />,
    categoryAPI: <FontAwesomeIcon icon={faCog} />,
    categoryDatabase: <FontAwesomeIcon icon={faDatabase} />,
    categoryAlgorithms: <FontAwesomeIcon icon={faCalculator} />,
    categoryOther: <FontAwesomeIcon icon={faFolderOpen} />,
  }), []);

  // Load codes from API
  const loadCodes = useCallback(async () => {
    try {
      setLoading(true);
      const response = await apiService.getCodeFiles(undefined, 1000, 0, false);
      setCodes(response.codes);
    } catch (err) {
      console.error('Failed to load codes:', err);
      setCodes([]);
    } finally {
      setLoading(false);
    }
  }, []);

  // Load codes when modal opens
  useEffect(() => {
    if (isOpen) {
      loadCodes();
    }
  }, [isOpen, loadCodes]);

  // Listen for codes updated events
  useEffect(() => {
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

  // Group codes by category
  const groupedCategories = useMemo(() => {
    const grouped: Record<CategoryKey, CodeFile[]> = {
      categoryAI: [],
      categoryWebsites: [],
      categoryMobile: [],
      categoryAPI: [],
      categoryDatabase: [],
      categoryAlgorithms: [],
      categoryOther: [],
    };

    codes.forEach((code) => {
      const category = getCategory(code);
      grouped[category].push(code);
    });

    // Convert to array and filter out empty categories
    return Object.entries(grouped)
      .filter(([_, codes]) => codes.length > 0)
      .map(([key, codes]) => ({
        key: key as CategoryKey,
        codes,
        icon: categoryIcons[key as CategoryKey],
      }))
      .sort((a, b) => {
        // Sort by code count (descending), then by category name
        if (b.codes.length !== a.codes.length) {
          return b.codes.length - a.codes.length;
        }
        return a.key.localeCompare(b.key);
      });
  }, [codes, categoryIcons]);

  // Toggle category expansion (accordion behavior - only one open at a time)
  const toggleCategory = useCallback((category: CategoryKey) => {
    setExpandedCategories((prev) => {
      const newSet = new Set(prev);
      if (newSet.has(category)) {
        // If clicking on an already expanded category, close it
        newSet.delete(category);
      } else {
        // If opening a new category, close all others first (accordion behavior)
        newSet.clear();
        newSet.add(category);
      }
      return newSet;
    });
  }, []);

  // Toggle category visibility
  const toggleCategoryVisibility = useCallback((category: CategoryKey) => {
    setHiddenCategories((prev) => {
      const newSet = new Set(prev);
      if (newSet.has(category)) {
        newSet.delete(category);
      } else {
        newSet.add(category);
      }
      return newSet;
    });
  }, []);

  // Show all hidden categories
  const showAllCategories = useCallback(() => {
    setHiddenCategories(new Set());
  }, []);

  // Handle code click
  const handleCodeClick = useCallback((codeId: string) => {
    onClose();
    setTimeout(() => {
      navigate(`/view/${codeId}`);
    }, 100);
  }, [navigate, onClose]);

  // Handle overlay click
  const handleOverlayClick = useCallback((e: React.MouseEvent<HTMLDivElement>) => {
    if (e.target === e.currentTarget) {
      onClose();
    }
  }, [onClose]);

  // Calculate visible categories count
  const visibleCategoriesCount = groupedCategories.filter(
    (cat) => !hiddenCategories.has(cat.key)
  ).length;
  const hiddenCategoriesCount = groupedCategories.length - visibleCategoriesCount;

  if (!isOpen) return null;

  return (
    <div className="codes-modal-overlay" onClick={handleOverlayClick}>
      <div className="codes-modal-content" onClick={(e) => e.stopPropagation()}>
        {/* Header */}
        <div className="codes-modal-header">
          <div className="codes-modal-header-content">
            <div className="codes-modal-title-section">
              <span className="codes-modal-icon">
                <FontAwesomeIcon icon={faList} />
              </span>
              <div>
                <h2>{t('settings.codesList')}</h2>
                <p className="codes-modal-subtitle">
                  {loading 
                    ? t('common.loading') 
                    : `${codes.length} ${codes.length === 1 ? t('settings.codesFound') : t('settings.codesFoundPlural')}`
                  }
                </p>
              </div>
            </div>
            <button 
              className="codes-modal-close" 
              onClick={onClose} 
              title={t('common.close')}
              aria-label={t('common.close')}
            >
              <FontAwesomeIcon icon={faTimes} />
            </button>
          </div>
        </div>

        {/* Content */}
        {loading ? (
          <div className="codes-modal-loading">
            <div className="spinner"></div>
            <p>{t('common.loading')}</p>
          </div>
        ) : groupedCategories.length === 0 ? (
          <div className="codes-modal-empty">
            <div className="empty-icon-wrapper">
              <p className="empty-icon">
                <FontAwesomeIcon icon={faFileAlt} />
              </p>
            </div>
            <p className="empty-title">{t('home.noCodes')}</p>
            <p className="empty-description">
              {t('settings.noCodesYet')}
            </p>
          </div>
        ) : (
          <div className="codes-modal-folders">
            {/* Show all sections button */}
            {hiddenCategoriesCount > 0 && (
              <div className="codes-modal-restore-sections">
                <button
                  className="codes-restore-button"
                  onClick={showAllCategories}
                >
                  {t('settings.showAllSections')} ({hiddenCategoriesCount})
                </button>
              </div>
            )}

            {/* Categories */}
            {groupedCategories.map((category) => {
              const isExpanded = expandedCategories.has(category.key);
              const isHidden = hiddenCategories.has(category.key);

              if (isHidden) return null;

              return (
                <div key={category.key} className="codes-folder">
                  {/* Category Header */}
                  <div 
                    className="codes-folder-header"
                    onClick={() => toggleCategory(category.key)}
                    role="button"
                    tabIndex={0}
                    onKeyDown={(e) => {
                      if (e.key === 'Enter' || e.key === ' ') {
                        e.preventDefault();
                        toggleCategory(category.key);
                      }
                    }}
                    aria-expanded={isExpanded}
                  >
                    <div className="codes-folder-icon-wrapper">
                      <span className="codes-folder-icon">{category.icon}</span>
                      <span 
                        className={`codes-folder-arrow ${isExpanded ? 'expanded' : ''}`}
                        aria-hidden="true"
                      >
                        <FontAwesomeIcon icon={faChevronRight} />
                      </span>
                    </div>
                    <div className="codes-folder-info">
                      <h3 className="codes-folder-name">
                        {t(`settings.${category.key}`)}
                      </h3>
                      <span className="codes-folder-count">
                        {category.codes.length} {category.codes.length === 1 ? t('settings.codesFound') : t('settings.codesFoundPlural')}
                      </span>
                    </div>
                    <button
                      className="codes-folder-visibility-toggle"
                      onClick={(e) => {
                        e.stopPropagation();
                        toggleCategoryVisibility(category.key);
                      }}
                      title={t('settings.hideSection')}
                      aria-label={t('settings.hideSection')}
                    >
                      <FontAwesomeIcon icon={faTimes} />
                    </button>
                  </div>

                  {/* Category Content */}
                  {isExpanded && (
                    <div className="codes-folder-content">
                      {category.codes.length === 0 ? (
                        <div className="codes-folder-empty">
                          <p>{t('settings.noCodesInCategory')}</p>
                        </div>
                      ) : (
                        <div className="codes-folder-codes">
                          {category.codes.map((code) => (
                            <div 
                              key={code.id}
                              className="codes-folder-code-item"
                              onClick={(e) => {
                                e.stopPropagation();
                                handleCodeClick(code.id);
                              }}
                              role="button"
                              tabIndex={0}
                              onKeyDown={(e) => {
                                if (e.key === 'Enter' || e.key === ' ') {
                                  e.preventDefault();
                                  handleCodeClick(code.id);
                                }
                              }}
                            >
                              <CodeCard code={code} viewMode="list" />
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
