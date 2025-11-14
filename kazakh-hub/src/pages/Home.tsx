import React, { useState, useEffect, useMemo, useCallback } from 'react';
import { useSearchParams } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import { faBook, faLaptop, faUsers, faStar, faSearch, faFileAlt } from '@fortawesome/free-solid-svg-icons';
import { CodeFile } from '../utils/api';
import { apiService } from '../utils/api';
import CodeCard from '../components/CodeCard';
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
    loadCodes();
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
    // Іздеу сұрауын URL параметрлерімен синхрондау
    const urlSearch = searchParams.get('search') || '';
    setSearchQuery(urlSearch);
  }, [searchParams, setSearchQuery]);

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
      const matchesSearch =
        code.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
        code.content.toLowerCase().includes(searchQuery.toLowerCase()) ||
        code.description?.toLowerCase().includes(searchQuery.toLowerCase());
      
      const matchesLanguage = filterLanguage === 'all' || code.language === filterLanguage;
      
      return matchesSearch && matchesLanguage;
    });

    // Папкалар мен файлдарды ажырату
    const folders = filtered.filter(code => code.isFolder);
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

  const languages = Array.from(new Set(codes.map((code) => code.language)));



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
          <h1>Kazakh Hub</h1>
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
        <div className="home-filters">
          <div className="search-box">
            <span className="search-icon"><FontAwesomeIcon icon={faSearch} /></span>
            <input
              type="text"
              placeholder={t('home.search')}
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="search-input"
            />
          </div>
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
  );
};

export default Home;

