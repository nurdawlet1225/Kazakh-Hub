import React, { useState, useEffect, useMemo, useCallback } from 'react';
import { useSearchParams } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import { faBook, faLaptop, faUsers, faStar, faFileAlt, faList } from '@fortawesome/free-solid-svg-icons';
import { CodeFile } from '../utils/api';
import { apiService } from '../utils/api';
import { subscribeToCodes, unsubscribe } from '../utils/realtimeService';
import CodeCard from '../components/CodeCard';
import CodesListModal from '../components/CodesListModal';
import './Home.css';

type SortOption = 'newest' | 'oldest' | 'title' | 'author';
type ViewMode = 'grid' | 'list';

const Home: React.FC = () => {
  const { t } = useTranslation();
  const [searchParams] = useSearchParams();
  const [codes, setCodes] = useState<CodeFile[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [searchQuery, setSearchQuery] = useState(searchParams.get('search') || '');
  const [filterLanguage, setFilterLanguage] = useState<string>('all');
  const [sortBy, setSortBy] = useState<SortOption>('newest');
  const [viewMode, setViewMode] = useState<ViewMode>(() => {
    const saved = localStorage.getItem('homeViewMode');
    return (saved === 'grid' || saved === 'list') ? saved : 'grid';
  });
  const [isCodesModalOpen, setIsCodesModalOpen] = useState(false);

  const loadCodes = useCallback(async () => {
    try {
      setLoading(true);
      const data = await apiService.getCodeFiles();
      setCodes(data);
      setError(null);
    } catch (err) {
      setError(err instanceof Error ? err.message : t('home.error'));
    } finally {
      setLoading(false);
    }
  }, [t]);

  useEffect(() => {
    let apiCodes: CodeFile[] = [];
    let realTimeInitialized = false;
    
    // Алдымен API-дан жүктеу
    const loadInitialCodes = async () => {
      try {
        const codes = await apiService.getCodeFiles();
        apiCodes = codes;
        setCodes(codes);
        setLoading(false);
        console.log('Home: Loaded codes from API:', codes.length, 'folders:', codes.filter(c => c.isFolder === true).length);
      } catch (err) {
        console.error('Failed to load codes from API:', err);
        setLoading(false);
        setError(err instanceof Error ? err.message : t('home.error'));
      }
    };
    
    loadInitialCodes();
    
    // Real-time listener қосу (барлық кодтар үшін)
    // Ескерту: Егер ad blocker болса, real-time жұмыс істемейді, сондықтан API деректерін пайдаланамыз
    const unsubscribeListener = subscribeToCodes(
      null, // folderId = null - барлық кодтар
      (updatedCodes) => {
        realTimeInitialized = true;
        
        // Егер real-time listener 0 код қайтарса, бірақ API-да кодтар бар болса, API-дан пайдалану
        // Бұл Firestore-да деректер синхрондалмаған немесе ad blocker бөгет жасаған кезде болады
        if (updatedCodes.length === 0 && apiCodes.length > 0) {
          // Тыныштықпен API деректерін пайдалану - қосымша хабарлама көрсетпеу
          setCodes(apiCodes);
          return;
        }
        
        // Егер real-time listener кодтар қайтарса, оларды пайдалану
        if (updatedCodes.length > 0) {
          const folderCount = updatedCodes.filter(c => c.isFolder === true).length;
          console.log('Home: Real-time update received. Total codes:', updatedCodes.length, 'Folders:', folderCount);
          setCodes(updatedCodes);
          // API деректерін жаңарту
          apiCodes = updatedCodes;
        }
      },
      (error: any) => {
        // ERR_BLOCKED_BY_CLIENT қатесін (ad blocker) елемеу
        if (error?.code === 'unavailable' || 
            error?.code === 'permission-denied' ||
            error?.message?.includes('BLOCKED_BY_CLIENT') ||
            error?.message?.includes('ERR_BLOCKED_BY_CLIENT') ||
            error?.message?.includes('network') ||
            error?.message?.includes('Failed to fetch')) {
          // Тыныштықпен API деректерін пайдалану
          if (apiCodes.length > 0) {
            setCodes(apiCodes);
          } else {
            loadCodes();
          }
          return;
        }
        console.error('Real-time codes listener error:', error);
        // Егер real-time жұмыс істемесе, API-дан жүктеу
        if (apiCodes.length > 0) {
          setCodes(apiCodes);
        } else {
          loadCodes();
        }
      }
    );
    
    // Егер 5 секунттан кейін real-time listener жұмыс істемесе, API-дан жүктеу
    const fallbackTimeout = setTimeout(() => {
      if (!realTimeInitialized && apiCodes.length > 0) {
        // Тыныштықпен API деректерін пайдалану
        setCodes(apiCodes);
      }
    }, 5000);
    
    return () => {
      clearTimeout(fallbackTimeout);
      unsubscribeListener();
      unsubscribe('codes-all');
    };
  }, [loadCodes]);

  useEffect(() => {
    // Папка жүктелгеннен кейін тізімді жаңарту
    const handleCodesUpdated = () => {
      loadCodes();
    };

    window.addEventListener('codesUpdated', handleCodesUpdated);

    return () => {
      window.removeEventListener('codesUpdated', handleCodesUpdated);
    };
  }, [loadCodes]);

  useEffect(() => {
    // Sync search query with URL params from Header
    const urlSearch = searchParams.get('search') || '';
    setSearchQuery(urlSearch);
  }, [searchParams]);

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
      const matchesSearch = !searchQuery || 
        code.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
        code.content.toLowerCase().includes(searchQuery.toLowerCase()) ||
        code.description?.toLowerCase().includes(searchQuery.toLowerCase());
      
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
          <div className="stat-value">{stats.totalCodes}</div>
        </div>
        <div className="stat-card">
          <div className="stat-header">
            <div className="stat-icon"><FontAwesomeIcon icon={faLaptop} /></div>
            <div className="stat-label">{t('home.programmingLanguages')}</div>
          </div>
          <div className="stat-value">{stats.totalLanguages}</div>
        </div>
        <div className="stat-card">
          <div className="stat-header">
            <div className="stat-icon"><FontAwesomeIcon icon={faUsers} /></div>
            <div className="stat-label">{t('home.authors')}</div>
          </div>
          <div className="stat-value">{stats.totalAuthors}</div>
        </div>
        <div className="stat-card">
          <div className="stat-header">
            <div className="stat-icon"><FontAwesomeIcon icon={faStar} /></div>
            <div className="stat-label">{t('home.lastWeek')}</div>
          </div>
          <div className="stat-value">{stats.recentCodes}</div>
        </div>
      </div>

      {/* Сүзгілер және басқару элементтері */}
      <div className="home-controls">
        <div className="home-controls-header">
          <button 
            className="btn-header-list"
            onClick={() => setIsCodesModalOpen(true)}
          >
            <FontAwesomeIcon icon={faList} /> {t('header.codesList')}
          </button>
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
          <div className="view-toggle">
            <button
              className={`view-btn ${viewMode === 'grid' ? 'active' : ''}`}
              onClick={() => {
                setViewMode('grid');
                localStorage.setItem('homeViewMode', 'grid');
              }}
              title={t('home.gridView')}
              aria-label={t('home.gridView')}
            >
              ⊞
            </button>
            <button
              className={`view-btn ${viewMode === 'list' ? 'active' : ''}`}
              onClick={() => {
                setViewMode('list');
                localStorage.setItem('homeViewMode', 'list');
              }}
              title={t('home.listView')}
              aria-label={t('home.listView')}
            >
              ☰
            </button>
          </div>
        </div>

        {error && (
          <div className="error-message">
            <span>{error}</span>
            <button onClick={loadCodes} className="retry-button">
              {t('home.retry')}
            </button>
          </div>
        )}

        {filteredAndSortedCodes.length === 0 && !loading && (
          <div className="empty-state">
            <p className="empty-icon"><FontAwesomeIcon icon={faFileAlt} /></p>
            <p className="empty-title">{t('home.noCodes')}</p>
            <p className="empty-description">
              {searchQuery || filterLanguage !== 'all'
                ? t('home.searchParams')
                : t('home.firstCode')}
            </p>
          </div>
        )}

        {/* Бірге көрсету */}
        <div className={`codes-container ${viewMode === 'list' ? 'list-view' : 'grid-view'}`}>
          {filteredAndSortedCodes.map((code) => (
            <CodeCard 
              key={code.id} 
              code={code} 
              viewMode={viewMode}
            />
          ))}
        </div>
      </div>
      <CodesListModal 
        isOpen={isCodesModalOpen} 
        onClose={() => setIsCodesModalOpen(false)} 
      />
    </div>
  );
};

export default Home;

