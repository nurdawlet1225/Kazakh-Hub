import React, { useState, useEffect, useMemo, useCallback } from 'react';
import { useSearchParams, useNavigate } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import { faBook, faLaptop, faUsers, faStar, faFileAlt, faList, faSearch, faTh, faThList } from '@fortawesome/free-solid-svg-icons';
import { CodeFile } from '../utils/api';
import { apiService } from '../utils/api';
import { subscribeToCodes, unsubscribe } from '../utils/realtimeService';
import { isFirestoreBlocked } from '../utils/firebase';
import CodeCard from '../components/CodeCard';
import CodesListModal from '../components/CodesListModal';

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
      <div className="w-full max-w-full m-0 p-6 animate-fade-in">
        <div className="flex flex-col items-center justify-center min-h-[320px] gap-8 p-16">
          <div className="w-10 h-10 border-4 border-border rounded-full border-t-primary border-r-primary animate-spin relative">
            <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-5 h-5 border-2 border-transparent border-t-accent rounded-full animate-spin-reverse"></div>
          </div>
          <p className="text-text-secondary text-lg font-medium animate-pulse">{t('home.loading')}</p>
        </div>
      </div>
    );
  }

  return (
    <div className="w-full max-w-full m-0 p-6 animate-fade-in box-border">
      <div className="flex gap-8 max-w-[1400px] mx-auto items-start lg:flex-row flex-col">
        {/* Сол жақ меню */}
        <aside className="w-[280px] flex-shrink-0 p-6 sticky top-5 max-h-[calc(100vh-40px)] overflow-y-auto overflow-x-hidden lg:w-[280px] w-full lg:relative lg:top-0 lg:max-h-none">
          <div className="mb-6 pb-4 border-b-[1.5px] border-border">
            <h2 className="text-2xl m-0 bg-accent-gradient bg-clip-text text-transparent font-black tracking-[-0.32px]">
              {t('header.appName')}
            </h2>
          </div>
          
          <div className="flex flex-col gap-8">
            {/* Статистика */}
            <div className="flex flex-col gap-4">
              <div className="flex items-center gap-4 p-4 bg-bg-primary rounded-xl border border-border transition-all hover:translate-x-1 hover:border-primary hover:shadow-[0_2px_8px_rgba(0,175,202,0.2)]">
                <div className="text-2xl text-primary flex-shrink-0">
                  <FontAwesomeIcon icon={faBook} />
                </div>
                <div className="flex-1 flex flex-col gap-1">
                  <div className="text-sm text-text-secondary font-medium uppercase tracking-wider">
                    {t('home.totalCodes')}
                  </div>
                  <div className="text-2xl font-extrabold bg-accent-gradient bg-clip-text text-transparent">
                    {stats.totalCodes}
                  </div>
                </div>
              </div>
              <div className="flex items-center gap-4 p-4 bg-bg-primary rounded-xl border border-border transition-all hover:translate-x-1 hover:border-primary hover:shadow-[0_2px_8px_rgba(0,175,202,0.2)]">
                <div className="text-2xl text-primary flex-shrink-0">
                  <FontAwesomeIcon icon={faLaptop} />
                </div>
                <div className="flex-1 flex flex-col gap-1">
                  <div className="text-sm text-text-secondary font-medium uppercase tracking-wider">
                    {t('home.programmingLanguages')}
                  </div>
                  <div className="text-2xl font-extrabold bg-accent-gradient bg-clip-text text-transparent">
                    {stats.totalLanguages}
                  </div>
                </div>
              </div>
              <div className="flex items-center gap-4 p-4 bg-bg-primary rounded-xl border border-border transition-all hover:translate-x-1 hover:border-primary hover:shadow-[0_2px_8px_rgba(0,175,202,0.2)]">
                <div className="text-2xl text-primary flex-shrink-0">
                  <FontAwesomeIcon icon={faUsers} />
                </div>
                <div className="flex-1 flex flex-col gap-1">
                  <div className="text-sm text-text-secondary font-medium uppercase tracking-wider">
                    {t('home.authors')}
                  </div>
                  <div className="text-2xl font-extrabold bg-accent-gradient bg-clip-text text-transparent">
                    {stats.totalAuthors}
                  </div>
                </div>
              </div>
              <div className="flex items-center gap-4 p-4 bg-bg-primary rounded-xl border border-border transition-all hover:translate-x-1 hover:border-primary hover:shadow-[0_2px_8px_rgba(0,175,202,0.2)]">
                <div className="text-2xl text-primary flex-shrink-0">
                  <FontAwesomeIcon icon={faStar} />
                </div>
                <div className="flex-1 flex flex-col gap-1">
                  <div className="text-sm text-text-secondary font-medium uppercase tracking-wider">
                    {t('home.lastWeek')}
                  </div>
                  <div className="text-2xl font-extrabold bg-accent-gradient bg-clip-text text-transparent">
                    {stats.recentCodes}
                  </div>
                </div>
              </div>
            </div>

            {/* Тіл фильтрі */}
            <div className="flex flex-col">
              <h3 className="text-base font-bold text-text-primary m-0 mb-4 uppercase tracking-wider">
                {t('home.language')}
              </h3>
              <div className="flex flex-col gap-2">
                <button
                  className={`px-4 py-3 bg-bg-primary border-[1.5px] border-border rounded-[10px] text-text-primary font-semibold text-sm cursor-pointer transition-all text-left hover:bg-bg-hover hover:border-primary hover:translate-x-1 ${
                    filterLanguage === 'all' 
                      ? 'bg-gradient-to-br from-[rgba(0,175,202,0.15)] to-[rgba(0,153,204,0.1)] border-primary text-primary shadow-[0_2px_8px_rgba(0,175,202,0.2)]' 
                      : ''
                  }`}
                  onClick={() => setFilterLanguage('all')}
                >
                  {t('home.allLanguages')}
                </button>
                {languages.map((lang) => (
                  <button
                    key={lang}
                    className={`px-4 py-3 bg-bg-primary border-[1.5px] border-border rounded-[10px] text-text-primary font-semibold text-sm cursor-pointer transition-all text-left hover:bg-bg-hover hover:border-primary hover:translate-x-1 ${
                      filterLanguage === lang 
                        ? 'bg-gradient-to-br from-[rgba(0,175,202,0.15)] to-[rgba(0,153,204,0.1)] border-primary text-primary shadow-[0_2px_8px_rgba(0,175,202,0.2)]' 
                        : ''
                    }`}
                    onClick={() => setFilterLanguage(lang)}
                  >
                    {lang.charAt(0).toUpperCase() + lang.slice(1)}
                  </button>
                ))}
              </div>
            </div>

            {/* Сұрыптау */}
            <div className="flex flex-col">
              <h3 className="text-base font-bold text-text-primary m-0 mb-4 uppercase tracking-wider">
                {t('home.sortBy')}
              </h3>
              <div className="flex flex-col gap-2">
                <button
                  className={`px-4 py-3 bg-bg-primary border-[1.5px] border-border rounded-[10px] text-text-primary font-semibold text-sm cursor-pointer transition-all text-left hover:bg-bg-hover hover:border-primary hover:translate-x-1 ${
                    sortBy === 'newest' 
                      ? 'bg-gradient-to-br from-[rgba(0,175,202,0.15)] to-[rgba(0,153,204,0.1)] border-primary text-primary shadow-[0_2px_8px_rgba(0,175,202,0.2)]' 
                      : ''
                  }`}
                  onClick={() => setSortBy('newest')}
                >
                  {t('home.newest')}
                </button>
                <button
                  className={`px-4 py-3 bg-bg-primary border-[1.5px] border-border rounded-[10px] text-text-primary font-semibold text-sm cursor-pointer transition-all text-left hover:bg-bg-hover hover:border-primary hover:translate-x-1 ${
                    sortBy === 'oldest' 
                      ? 'bg-gradient-to-br from-[rgba(0,175,202,0.15)] to-[rgba(0,153,204,0.1)] border-primary text-primary shadow-[0_2px_8px_rgba(0,175,202,0.2)]' 
                      : ''
                  }`}
                  onClick={() => setSortBy('oldest')}
                >
                  {t('home.oldest')}
                </button>
                <button
                  className={`px-4 py-3 bg-bg-primary border-[1.5px] border-border rounded-[10px] text-text-primary font-semibold text-sm cursor-pointer transition-all text-left hover:bg-bg-hover hover:border-primary hover:translate-x-1 ${
                    sortBy === 'title' 
                      ? 'bg-gradient-to-br from-[rgba(0,175,202,0.15)] to-[rgba(0,153,204,0.1)] border-primary text-primary shadow-[0_2px_8px_rgba(0,175,202,0.2)]' 
                      : ''
                  }`}
                  onClick={() => setSortBy('title')}
                >
                  {t('home.byTitle')}
                </button>
                <button
                  className={`px-4 py-3 bg-bg-primary border-[1.5px] border-border rounded-[10px] text-text-primary font-semibold text-sm cursor-pointer transition-all text-left hover:bg-bg-hover hover:border-primary hover:translate-x-1 ${
                    sortBy === 'author' 
                      ? 'bg-gradient-to-br from-[rgba(0,175,202,0.15)] to-[rgba(0,153,204,0.1)] border-primary text-primary shadow-[0_2px_8px_rgba(0,175,202,0.2)]' 
                      : ''
                  }`}
                  onClick={() => setSortBy('author')}
                >
                  {t('home.byAuthor')}
                </button>
              </div>
            </div>
          </div>
        </aside>

        {/* Оң жақ контент */}
        <main className="flex-1 min-w-0 flex flex-col gap-8 max-h-[calc(100vh-40px)] overflow-y-auto overflow-x-hidden lg:max-h-none">

          {/* Іздеу және басқару элементтері */}
          <div className="flex flex-col gap-6 mb-8 p-8 overflow-visible w-full max-w-none box-border">
            <div className="flex items-center gap-4 flex-wrap flex-shrink-0 pt-4 pb-2 w-full flex-row relative justify-between">
              <form onSubmit={handleSearchSubmit} className="flex-1 min-w-[160px] relative">
                <div className="relative">
                  <input
                    type="text"
                    placeholder={t('common.search')}
                    value={searchQuery}
                    onChange={handleSearchChange}
                    className="w-full px-4 py-3.5 pl-11 border border-border rounded-lg bg-bg-primary text-text-primary text-base transition-all font-medium focus:outline-none focus:border-primary"
                  />
                  <span className="absolute left-4 top-1/2 -translate-y-1/2 text-xl pointer-events-none z-10 text-text-secondary transition-all">
                    <FontAwesomeIcon icon={faSearch} />
                  </span>
                </div>
              </form>
              <div className="flex items-center gap-4 flex-shrink-0">
                <div className="flex gap-2 bg-bg-primary p-2 rounded-[10.2px] border-[1.3px] border-border transition-all flex-shrink-0">
                  <button
                    className={`p-2 rounded-[5.1px] cursor-pointer text-xl text-text-primary transition-all flex items-center justify-center min-w-[25.6px] min-h-[25.6px] ${
                      viewMode === 'grid' 
                        ? 'bg-primary text-bg-primary' 
                        : 'bg-bg-secondary hover:bg-bg-primary hover:text-primary'
                    }`}
                    onClick={() => {
                      setViewMode('grid');
                      localStorage.setItem('homeViewMode', 'grid');
                    }}
                    title={t('home.gridView')}
                  >
                    <FontAwesomeIcon icon={faTh} />
                  </button>
                  <button
                    className={`p-2 rounded-[5.1px] cursor-pointer text-xl text-text-primary transition-all flex items-center justify-center min-w-[25.6px] min-h-[25.6px] ${
                      viewMode === 'list' 
                        ? 'bg-primary text-bg-primary' 
                        : 'bg-bg-secondary hover:bg-bg-primary hover:text-primary'
                    }`}
                    onClick={() => {
                      setViewMode('list');
                      localStorage.setItem('homeViewMode', 'list');
                    }}
                    title={t('home.listView')}
                  >
                    <FontAwesomeIcon icon={faThList} />
                  </button>
                </div>
                <button 
                  className="px-6 py-3.5 rounded-[10.2px] bg-bg-primary border-[1.3px] border-border text-text-primary font-semibold text-base whitespace-nowrap flex items-center gap-2 flex-shrink-0 min-h-[44px] h-auto hover:bg-bg-secondary hover:border-primary hover:-translate-y-[1.3px] hover:shadow-md transition-all"
                  onClick={() => setIsCodesModalOpen(true)}
                >
                  <FontAwesomeIcon icon={faList} /> {t('header.codesList')}
                </button>
              </div>
            </div>

            {error && (
              <div className="bg-gradient-to-br from-[rgba(255,107,107,0.15)] to-[rgba(251,191,36,0.1)] text-error p-6 rounded-[10.2px] mb-8 flex justify-between items-center border-[1.3px] border-[rgba(255,107,107,0.3)] shadow-[0_2.6px_10.2px_rgba(255,107,107,0.15)] animate-shake">
                <span>{error}</span>
                <button 
                  onClick={() => loadCodes(50, 0)} 
                  className="bg-gradient-to-br from-error to-[#dc2626] text-white px-6 py-3 rounded-[7.7px] cursor-pointer font-semibold transition-all shadow-[0_2.6px_7.7px_rgba(255,107,107,0.3)] text-sm hover:bg-gradient-to-br hover:from-[#dc2626] hover:to-[#b91c1c] hover:-translate-y-[1.3px] hover:shadow-[0_3.8px_12.8px_rgba(255,107,107,0.4)] focus-visible:outline focus-visible:outline-[1.3px] focus-visible:outline-error focus-visible:outline-offset-[1.3px] focus-visible:bg-gradient-to-br focus-visible:from-[#dc2626] focus-visible:to-[#b91c1c] active:translate-y-0"
                >
                  {t('home.retry')}
                </button>
              </div>
            )}

            {loading ? (
              <div className="text-center">Жүктелуде...</div>
            ) : filteredAndSortedCodes.length === 0 ? (
              <div className="text-center py-20 px-8 text-text-secondary bg-gradient-to-br from-[rgba(0,153,204,0.08)] via-[rgba(251,191,36,0.06)] to-[rgba(245,158,11,0.06)] rounded-[15.4px] border-[1.3px] border-dashed border-[rgba(0,153,204,0.3)] my-8 animate-fade-in shadow-[0_2.6px_10.2px_rgba(0,153,204,0.08)]">
                <p className="text-5xl m-0 mb-6 inline-block animate-bounce drop-shadow-[0_2.6px_5.1px_rgba(0,0,0,0.1)]">
                  <FontAwesomeIcon icon={faFileAlt} />
                </p>
                <p className="text-2xl font-bold bg-accent-gradient bg-clip-text text-transparent m-0 mb-4 tracking-[-0.32px]">
                  {t('home.noCodes')}
                </p>
                <p className="text-lg m-0 opacity-80 leading-relaxed max-w-[320px] mx-auto">
                  {searchQuery || filterLanguage !== 'all'
                    ? t('home.searchParams')
                    : t('home.firstCode')}
                </p>
              </div>
            ) : (
              <div className="animate-fade-in flex flex-col gap-7 w-full max-w-full overflow-x-hidden overflow-y-auto box-border h-full pr-3 pb-4">
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
        </main>
      </div>
      <CodesListModal 
        isOpen={isCodesModalOpen} 
        onClose={() => setIsCodesModalOpen(false)} 
      />
    </div>
  );
};

export default Home;

