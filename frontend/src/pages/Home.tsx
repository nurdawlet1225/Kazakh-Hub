import React, { useState, useEffect, useMemo, useCallback } from 'react';
import { useSearchParams, useNavigate } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import { faBook, faLaptop, faUsers, faStar, faFileAlt, faList, faSearch } from '@fortawesome/free-solid-svg-icons';
import { CodeFile } from '../utils/api';
import { apiService } from '../utils/api';
import { subscribeToCodes, unsubscribe } from '../utils/realtimeService';
import { isFirestoreBlocked } from '../utils/firebase';
import CodeCard from '../components/CodeCard';
import CodesListModal from '../components/CodesListModal';
import './Home.css';

type SortOption = 'newest' | 'oldest' | 'title' | 'author';
type ViewMode = 'grid' | 'list';

const Home: React.FC = () => {
  const { t } = useTranslation();
  const navigate = useNavigate();
  const [searchParams, setSearchParams] = useSearchParams();
  const [codes, setCodes] = useState<CodeFile[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [searchQuery, setSearchQuery] = useState(searchParams.get('search') || '');
  const [totalCodesCount, setTotalCodesCount] = useState(0);
  const [filterLanguage, setFilterLanguage] = useState<string>('all');
  const [sortBy, setSortBy] = useState<SortOption>('newest');
  const [viewMode, setViewMode] = useState<ViewMode>(() => {
    const saved = localStorage.getItem('homeViewMode');
    return (saved === 'grid' || saved === 'list') ? saved : 'grid';
  });
  const [isCodesModalOpen, setIsCodesModalOpen] = useState(false);

  // Жаңа жүктеу стратегиясы: жеңілдетілген және тиімді
  const loadCodes = useCallback(async (limit: number = 50, offset: number = 0, retryCount: number = 0): Promise<{ codes: CodeFile[]; total: number } | null> => {
    const MAX_RETRIES = 2;
    
    try {
      const response = await apiService.getCodeFiles(undefined, limit, offset, false);
      
      setCodes(response.codes);
      setTotalCodesCount(response.total);
      setError(null);
      setLoading(false);
      
      console.log('Home: Loaded codes from API:', response.codes.length, '/', response.total, 'folders:', response.codes.filter(c => c.isFolder === true).length);
      return response;
    } catch (err: any) {
      // Егер желі қатесі болса, қайталау
      if ((err?.message?.includes('timeout') || err?.message?.includes('Failed to fetch') || err?.message?.includes('қосылу')) && retryCount < MAX_RETRIES) {
        console.log(`Retrying loadCodes (attempt ${retryCount + 1}/${MAX_RETRIES})...`);
        await new Promise(resolve => setTimeout(resolve, 1000 * (retryCount + 1))); // Exponential backoff
        return loadCodes(limit, offset, retryCount + 1);
      }
      
      setError(err instanceof Error ? err.message : t('home.error'));
      setLoading(false);
      setCodes([]);
      return null;
    }
  }, [t]);

  useEffect(() => {
    let isMounted = true;
    let unsubscribeListener: (() => void) | null = null;
    let apiCodesLoaded = false;
    
    // Негізгі жүктеу функциясы
    const initializeCodes = async () => {
      setLoading(true);
      
      // API-дан кодтарды жүктеу
      const response = await loadCodes(50, 0);
      
      if (!isMounted) return;
      
      if (response && response.codes.length > 0) {
        apiCodesLoaded = true;
      }
      
      // Real-time listener қосу (тек Firestore блокталмаған болса)
      if (!isFirestoreBlocked()) {
        try {
          unsubscribeListener = subscribeToCodes(
            null,
            (updatedCodes) => {
              if (!isMounted) return;
              
              // Real-time жаңартуларды тек API-дан жүктелген кодтар болған кезде елемеу
              // Бұл пагинацияны сақтайды - API деректерін басым ету
              if (!apiCodesLoaded && updatedCodes.length > 0) {
                // Егер API жүктемесе, real-time деректерді пайдалану
                setCodes(updatedCodes);
              }
              // Егер API деректері жүктелген болса, оларды сақтау (real-time тек жаңартулар үшін)
            },
            (error: any) => {
              // Real-time қателерін тыныштықпен елемеу - API деректері пайдаланылады
              if (!isMounted) return;
            }
          );
        } catch (err) {
          console.warn('Real-time listener failed to initialize, using API only');
        }
      }
    };
    
    initializeCodes();
    
    return () => {
      isMounted = false;
      if (unsubscribeListener) {
        unsubscribeListener();
        unsubscribe('codes-all');
      }
    };
  }, [loadCodes]);

  useEffect(() => {
    // Папка жүктелгеннен кейін тізімді жаңарту
    const handleCodesUpdated = () => {
      loadCodes(50, 0);
    };

    window.addEventListener('codesUpdated', handleCodesUpdated);

    return () => {
      window.removeEventListener('codesUpdated', handleCodesUpdated);
    };
  }, [loadCodes]);

  useEffect(() => {
    // Sync search query with URL params
    const urlSearch = searchParams.get('search') || '';
    setSearchQuery(urlSearch);
    
    // Егер URL-да іздеу сұрауы болса, барлық кодтарды жүктеу
    if (urlSearch && (totalCodesCount === 0 || codes.length < totalCodesCount) && !loading) {
      setLoading(true);
      loadCodes(1000, 0);
    }
  }, [searchParams, totalCodesCount, codes.length, loading, loadCodes]);

  const handleSearchChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const value = e.target.value;
    setSearchQuery(value);
    
    // Update URL params
    if (value) {
      setSearchParams({ search: value });
      // Іздеу сұрауы болғанда, барлық кодтарды жүктеу (іздеу дұрыс жұмыс істеуі үшін)
      // Егер кодтар жүктелмеген болса немесе барлық кодтар жүктелмеген болса
      if (totalCodesCount === 0 || codes.length < totalCodesCount) {
        setLoading(true);
        // Барлық кодтарды жүктеу үшін үлкен лимит пайдалану
        await loadCodes(1000, 0);
      }
    } else {
      setSearchParams({});
      // Іздеу сұрауы жойылғанда, тек 50 кодты қалдыру (егер кодтар көп болса)
      if (codes.length > 50) {
        setLoading(true);
        await loadCodes(50, 0);
      }
    }
  };

  const handleSearchSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    // Search is already handled by handleSearchChange
  };

  const stats = useMemo(() => {
    const totalCodes = codes.length;
    const languages = Array.from(new Set(codes.map((code) => code.language)));
    const authors = Array.from(new Set(codes.map((code) => code.author)));
    const recentCodes = codes.filter((code) => {
      const codeDate = new Date(code.createdAt);
      const weekAgo = new Date();
      weekAgo.setDate(weekAgo.getDate() - 7);
      return codeDate >= weekAgo;
    }).length;

    return {
      totalCodes,
      totalLanguages: languages.length,
      totalAuthors: authors.length,
      recentCodes,
    };
  }, [codes]);

  const filteredAndSortedCodes = useMemo(() => {
    let filtered = codes.filter((code) => {
      // Іздеу сұрауын тексеру (Header-дан келген)
      if (!searchQuery) {
        // Іздеу сұрауы жоқ болса, барлық кодтарды қайтару
        return true;
      }
      
      const searchLower = searchQuery.toLowerCase();
      const matchesSearch = 
        code.title?.toLowerCase().includes(searchLower) ||
        (code.content && code.content.toLowerCase().includes(searchLower)) ||
        code.description?.toLowerCase().includes(searchLower) ||
        code.author?.toLowerCase().includes(searchLower) ||
        code.language?.toLowerCase().includes(searchLower);
      
      // Тіл фильтрін тексеру
      let matchesLanguage = true;
      if (filterLanguage !== 'all') {
        // Папкалар мен файлдар үшін тілді case-insensitive салыстыру
        const codeLang = (code.language || '').toLowerCase().trim();
        const filterLang = filterLanguage.toLowerCase().trim();
        matchesLanguage = codeLang === filterLang;
      }
      
      return matchesSearch && matchesLanguage;
    });

    // Папкалар мен файлдарды ажырату
    const folders = filtered.filter(code => code.isFolder === true);
    const files = filtered.filter(code => !code.isFolder);

    // Папкаларды сұрыптау
    folders.sort((a, b) => {
      switch (sortBy) {
        case 'newest':
          return new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime();
        case 'oldest':
          return new Date(a.createdAt).getTime() - new Date(b.createdAt).getTime();
        case 'title':
          return a.title.localeCompare(b.title);
        case 'author':
          return a.author.localeCompare(b.author);
        default:
          return 0;
      }
    });

    // Файлдарды сұрыптау
    files.sort((a, b) => {
      switch (sortBy) {
        case 'newest':
          return new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime();
        case 'oldest':
          return new Date(a.createdAt).getTime() - new Date(b.createdAt).getTime();
        case 'title':
          return a.title.localeCompare(b.title);
        case 'author':
          return a.author.localeCompare(b.author);
        default:
          return 0;
      }
    });

    // Алдымен папкаларды, содан кейін файлдарды қайтару
    return [...folders, ...files];
  }, [codes, searchQuery, filterLanguage, sortBy]);

  // Барлық кодтардың тілдерін алу (папкалар мен файлдар)
  const languages = Array.from(
    new Set(
      codes
        .filter((code) => code.language && code.language.trim()) // language жоқ кодтарды елемеу
        .map((code) => code.language.trim()) // Бастапқы түрінде сақтау
    )
  ).sort((a, b) => a.toLowerCase().localeCompare(b.toLowerCase())); // Алфавит бойынша сұрыптау (case-insensitive)

  if (loading) {
    return (
      <div className="home-container">
        <div className="loading-spinner">
          <div className="spinner"></div>
          <p>{t('home.loading')}</p>
        </div>
      </div>
    );
  }

  return (
    <div className="home-container">
      <div className="home-header">
        <div className="home-header-content">
          <h1>{t('header.appName')}</h1>
          <p className="home-subtitle">{t('home.subtitle')}</p>
        </div>
      </div>

      {/* Статистика карточкалары */}
      <div className="home-stats">
        <div className="stat-card">
          <div className="stat-header">
            <div className="stat-icon"><FontAwesomeIcon icon={faBook} /></div>
            <div className="stat-label">{t('home.totalCodes')}</div>
          </div>
          <div className="stat-separator"></div>
          <div className="stat-value">{stats.totalCodes}</div>
        </div>
        <div className="stat-card">
          <div className="stat-header">
            <div className="stat-icon"><FontAwesomeIcon icon={faLaptop} /></div>
            <div className="stat-label">{t('home.programmingLanguages')}</div>
          </div>
          <div className="stat-separator"></div>
          <div className="stat-value">{stats.totalLanguages}</div>
        </div>
        <div className="stat-card">
          <div className="stat-header">
            <div className="stat-icon"><FontAwesomeIcon icon={faUsers} /></div>
            <div className="stat-label">{t('home.authors')}</div>
          </div>
          <div className="stat-separator"></div>
          <div className="stat-value">{stats.totalAuthors}</div>
        </div>
        <div className="stat-card">
          <div className="stat-header">
            <div className="stat-icon"><FontAwesomeIcon icon={faStar} /></div>
            <div className="stat-label">{t('home.lastWeek')}</div>
          </div>
          <div className="stat-separator"></div>
          <div className="stat-value">{stats.recentCodes}</div>
        </div>
      </div>

      {/* Сүзгілер және басқару элементтері */}
      <div className="home-controls">
        <div className="home-controls-header">
          <form onSubmit={handleSearchSubmit} className="header-search-form">
            <div className="header-search-box">
              <input
                type="text"
                placeholder={t('common.search')}
                value={searchQuery}
                onChange={handleSearchChange}
                className="header-search-input"
              />
              <span className="header-search-icon"><FontAwesomeIcon icon={faSearch} /></span>
            </div>
          </form>
          <div className="language-filter">
            <label htmlFor="language-filter">{t('home.language')}</label>
            <select
              id="language-filter"
              value={filterLanguage}
              onChange={(e) => setFilterLanguage(e.target.value)}
              className="filter-select"
            >
              <option value="all">{t('home.allLanguages')}</option>
              {languages.map((lang) => (
                <option key={lang} value={lang}>
                  {lang.charAt(0).toUpperCase() + lang.slice(1)}
                </option>
              ))}
            </select>
          </div>
          <div className="sort-filter">
            <label htmlFor="sort-filter">{t('home.sortBy')}:</label>
            <select
              id="sort-filter"
              value={sortBy}
              onChange={(e) => setSortBy(e.target.value as SortOption)}
              className="filter-select"
            >
              <option value="newest">{t('home.newest')}</option>
              <option value="oldest">{t('home.oldest')}</option>
              <option value="title">{t('home.byTitle')}</option>
              <option value="author">{t('home.byAuthor')}</option>
            </select>
          </div>
          <button 
            className="btn-header-list"
            onClick={() => setIsCodesModalOpen(true)}
          >
            <FontAwesomeIcon icon={faList} /> {t('header.codesList')}
          </button>
        </div>

        {error && (
          <div className="error-message">
            <span>{error}</span>
            <button onClick={() => loadCodes(50, 0)} className="retry-button">
              {t('home.retry')}
            </button>
          </div>
        )}

        {loading ? (
          <div className="loading-state">Жүктелуде...</div>
        ) : filteredAndSortedCodes.length === 0 ? (
          <div className="empty-state">
            <p className="empty-icon"><FontAwesomeIcon icon={faFileAlt} /></p>
            <p className="empty-title">{t('home.noCodes')}</p>
            <p className="empty-description">
              {searchQuery || filterLanguage !== 'all'
                ? t('home.searchParams')
                : t('home.firstCode')}
            </p>
          </div>
        ) : (
          <div className={`codes-container ${viewMode === 'list' ? 'list-view' : 'grid-view'}`}>
            {filteredAndSortedCodes.map((code) => (
              <CodeCard 
                key={code.id} 
                code={code} 
                viewMode={viewMode}
              />
            ))}
          </div>
        )}

      </div>
      <CodesListModal 
        isOpen={isCodesModalOpen} 
        onClose={() => setIsCodesModalOpen(false)} 
      />
    </div>
  );
};

export default Home;

