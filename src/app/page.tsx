'use client';

import { useState, useEffect, useMemo } from 'react';
import SearchBar from '@/components/SearchBar';
import BookCard from '@/components/BookCard';
import LanguageToggle from '@/components/LanguageToggle';
import ThemeToggle from '@/components/ThemeToggle';
import type { Book } from '@/lib/types';

type ViewMode = 'grid' | 'list' | 'compact';
type SortBy = 'title' | 'author' | 'pages';
type SortOrder = 'asc' | 'desc';

const ITEMS_PER_PAGE = 24;

// Logo Icon
function LogoIcon({ className = 'w-8 h-8' }: { className?: string }) {
  return (
    <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 48 48" className={className}>
      <defs>
        <linearGradient id="logoGradient" x1="0%" y1="0%" x2="100%" y2="100%">
          <stop offset="0%" stopColor="#3b82f6" />
          <stop offset="100%" stopColor="#8b5cf6" />
        </linearGradient>
      </defs>
      <circle cx="24" cy="24" r="22" fill="url(#logoGradient)" />
      <path
        d="M14 12h20c1.1 0 2 .9 2 2v20c0 1.1-.9 2-2 2H14c-1.1 0-2-.9-2-2V14c0-1.1.9-2 2-2z"
        fill="none"
        stroke="white"
        strokeWidth="1.5"
      />
      <path d="M17 18h14M17 24h14M17 30h10" stroke="white" strokeWidth="1.5" strokeLinecap="round" />
      <circle cx="36" cy="36" r="8" fill="#10b981" />
      <path d="M33 36l2 2 4-4" stroke="white" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" />
    </svg>
  );
}

// Book Icon for stats
function BookIcon({ className = 'w-5 h-5' }: { className?: string }) {
  return (
    <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor" className={className}>
      <path strokeLinecap="round" strokeLinejoin="round" d="M12 6.042A8.967 8.967 0 006 3.75c-1.052 0-2.062.18-3 .512v14.25A8.987 8.987 0 016 18c2.305 0 4.408.867 6 2.292m0-14.25a8.966 8.966 0 016-2.292c1.052 0 2.062.18 3 .512v14.25A8.987 8.987 0 0018 18a8.967 8.967 0 00-6 2.292m0-14.25v14.25" />
    </svg>
  );
}

// Filter Icon
function FilterIcon({ className = 'w-4 h-4' }: { className?: string }) {
  return (
    <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor" className={className}>
      <path strokeLinecap="round" strokeLinejoin="round" d="M12 3c2.755 0 5.455.232 8.083.678.533.09.917.556.917 1.096v1.044a2.25 2.25 0 01-.659 1.591l-5.432 5.432a2.25 2.25 0 00-.659 1.591v2.927a2.25 2.25 0 01-1.244 2.013L9.75 21v-6.568a2.25 2.25 0 00-.659-1.591L3.659 7.409A2.25 2.25 0 013 5.818V4.774c0-.54.384-1.006.917-1.096A48.32 48.32 0 0112 3z" />
    </svg>
  );
}

// Sort Icon
function SortIcon({ className = 'w-4 h-4' }: { className?: string }) {
  return (
    <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor" className={className}>
      <path strokeLinecap="round" strokeLinejoin="round" d="M3 7.5L7.5 3m0 0L12 7.5M7.5 3v13.5m13.5 0L16.5 21m0 0L12 16.5m4.5 4.5V7.5" />
    </svg>
  );
}

// View mode icons
function GridIcon({ className = 'w-5 h-5' }: { className?: string }) {
  return (
    <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor" className={className}>
      <path strokeLinecap="round" strokeLinejoin="round" d="M3.75 6A2.25 2.25 0 016 3.75h2.25A2.25 2.25 0 0110.5 6v2.25a2.25 2.25 0 01-2.25 2.25H6a2.25 2.25 0 01-2.25-2.25V6zM3.75 15.75A2.25 2.25 0 016 13.5h2.25a2.25 2.25 0 012.25 2.25V18a2.25 2.25 0 01-2.25 2.25H6A2.25 2.25 0 013.75 18v-2.25zM13.5 6a2.25 2.25 0 012.25-2.25H18A2.25 2.25 0 0120.25 6v2.25A2.25 2.25 0 0118 10.5h-2.25a2.25 2.25 0 01-2.25-2.25V6zM13.5 15.75a2.25 2.25 0 012.25-2.25H18a2.25 2.25 0 012.25 2.25V18A2.25 2.25 0 0118 20.25h-2.25A2.25 2.25 0 0113.5 18v-2.25z" />
    </svg>
  );
}

function ListIcon({ className = 'w-5 h-5' }: { className?: string }) {
  return (
    <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor" className={className}>
      <path strokeLinecap="round" strokeLinejoin="round" d="M8.25 6.75h12M8.25 12h12m-12 5.25h12M3.75 6.75h.007v.008H3.75V6.75zm.375 0a.375.375 0 11-.75 0 .375.375 0 01.75 0zM3.75 12h.007v.008H3.75V12zm.375 0a.375.375 0 11-.75 0 .375.375 0 01.75 0zm-.375 5.25h.007v.008H3.75v-.008zm.375 0a.375.375 0 11-.75 0 .375.375 0 01.75 0z" />
    </svg>
  );
}

function CompactIcon({ className = 'w-5 h-5' }: { className?: string }) {
  return (
    <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor" className={className}>
      <path strokeLinecap="round" strokeLinejoin="round" d="M3.75 12h16.5m-16.5 3.75h16.5M3.75 19.5h16.5M5.625 4.5h12.75a1.875 1.875 0 010 3.75H5.625a1.875 1.875 0 010-3.75z" />
    </svg>
  );
}

// Maintenance mode flag - set to true during database migration
const MAINTENANCE_MODE = process.env.NEXT_PUBLIC_MAINTENANCE_MODE === 'true';

export default function Home() {
  const [books, setBooks] = useState<Book[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [language, setLanguage] = useState<'ar' | 'en'>('ar');
  const [filter, setFilter] = useState<'all' | 'shia' | 'sunni'>('all');
  const [searchQuery, setSearchQuery] = useState('');
  const [viewMode, setViewMode] = useState<ViewMode>('compact');
  const [sortBy, setSortBy] = useState<SortBy>('title');
  const [sortOrder, setSortOrder] = useState<SortOrder>('asc');
  const [currentPage, setCurrentPage] = useState(1);

  // Show maintenance page if enabled
  if (MAINTENANCE_MODE) {
    return (
      <div className="min-h-screen bg-gradient-to-b from-gray-50 to-gray-100 dark:from-gray-900 dark:to-gray-950 flex items-center justify-center p-4">
        <div className="max-w-md w-full text-center">
          <div className="inline-flex items-center justify-center w-20 h-20 rounded-full bg-amber-100 dark:bg-amber-900/30 mb-6">
            <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor" className="w-10 h-10 text-amber-600 dark:text-amber-400">
              <path strokeLinecap="round" strokeLinejoin="round" d="M11.42 15.17L17.25 21A2.652 2.652 0 0021 17.25l-5.877-5.877M11.42 15.17l2.496-3.03c.317-.384.74-.626 1.208-.766M11.42 15.17l-4.655 5.653a2.548 2.548 0 11-3.586-3.586l6.837-5.63m5.108-.233c.55-.164 1.163-.188 1.743-.14a4.5 4.5 0 004.486-6.336l-3.276 3.277a3.004 3.004 0 01-2.25-2.25l3.276-3.276a4.5 4.5 0 00-6.336 4.486c.091 1.076-.071 2.264-.904 2.95l-.102.085m-1.745 1.437L5.909 7.5H4.5L2.25 3.75l1.5-1.5L7.5 4.5v1.409l4.26 4.26m-1.745 1.437l1.745-1.437m6.615 8.206L15.75 15.75M4.867 19.125h.008v.008h-.008v-.008z" />
            </svg>
          </div>
          <h1 className="text-2xl md:text-3xl font-bold text-gray-900 dark:text-white mb-4">
            صيانة الموقع
          </h1>
          <h2 className="text-xl md:text-2xl font-semibold text-gray-700 dark:text-gray-300 mb-6">
            Site Maintenance
          </h2>
          <p className="text-gray-600 dark:text-gray-400 mb-4 leading-relaxed">
            نقوم حالياً بتحديث قاعدة البيانات لتحسين الأداء وإضافة ميزات جديدة.
          </p>
          <p className="text-gray-600 dark:text-gray-400 mb-8 leading-relaxed">
            We are currently upgrading our database to improve performance and add new features.
          </p>
          <div className="inline-flex items-center gap-2 px-4 py-2 bg-amber-50 dark:bg-amber-900/20 border border-amber-200 dark:border-amber-800 rounded-lg text-amber-700 dark:text-amber-400 text-sm">
            <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor" className="w-5 h-5 animate-spin">
              <path strokeLinecap="round" strokeLinejoin="round" d="M16.023 9.348h4.992v-.001M2.985 19.644v-4.992m0 0h4.992m-4.993 0l3.181 3.183a8.25 8.25 0 0013.803-3.7M4.031 9.865a8.25 8.25 0 0113.803-3.7l3.181 3.182m0-4.991v4.99" />
            </svg>
            <span>سنعود قريباً • Coming back soon</span>
          </div>
        </div>
      </div>
    );
  }

  useEffect(() => {
    async function fetchBooks() {
      try {
        const res = await fetch('/api/books');
        if (!res.ok) throw new Error('Failed to fetch books');
        const data = await res.json();
        setBooks(data.books);
      } catch (e) {
        setError(e instanceof Error ? e.message : 'Failed to load books');
      } finally {
        setLoading(false);
      }
    }
    fetchBooks();
  }, []);

  // Filter, search, and sort books
  const filteredAndSortedBooks = useMemo(() => {
    // First filter
    let result = books.filter((book) => {
      // Sect filter
      if (filter !== 'all' && book.sect !== filter) return false;

      // Local search filter (for quick filtering before going to search page)
      if (searchQuery) {
        const query = searchQuery.toLowerCase();
        return (
          book.title_ar.toLowerCase().includes(query) ||
          (book.title_en && book.title_en.toLowerCase().includes(query)) ||
          (book.author_ar && book.author_ar.toLowerCase().includes(query)) ||
          (book.author_en && book.author_en.toLowerCase().includes(query))
        );
      }

      return true;
    });

    // Then sort
    result.sort((a, b) => {
      let comparison = 0;

      if (sortBy === 'title') {
        const titleA = language === 'en' && a.title_en ? a.title_en : a.title_ar;
        const titleB = language === 'en' && b.title_en ? b.title_en : b.title_ar;
        comparison = titleA.localeCompare(titleB, language === 'ar' ? 'ar' : 'en');
      } else if (sortBy === 'author') {
        const authorA = (language === 'en' && a.author_en ? a.author_en : a.author_ar) || '';
        const authorB = (language === 'en' && b.author_en ? b.author_en : b.author_ar) || '';
        comparison = authorA.localeCompare(authorB, language === 'ar' ? 'ar' : 'en');
      } else if (sortBy === 'pages') {
        comparison = (a.total_pages || 0) - (b.total_pages || 0);
      }

      return sortOrder === 'asc' ? comparison : -comparison;
    });

    return result;
  }, [books, filter, searchQuery, sortBy, sortOrder, language]);

  // Reset to page 1 when filters change
  useEffect(() => {
    setCurrentPage(1);
  }, [filter, searchQuery, sortBy, sortOrder]);

  // Pagination
  const totalPages = Math.ceil(filteredAndSortedBooks.length / ITEMS_PER_PAGE);
  const paginatedBooks = filteredAndSortedBooks.slice(
    (currentPage - 1) * ITEMS_PER_PAGE,
    currentPage * ITEMS_PER_PAGE
  );

  // Load saved preferences
  useEffect(() => {
    const savedLang = localStorage.getItem('hadith-lang');
    if (savedLang === 'en' || savedLang === 'ar') {
      setLanguage(savedLang);
    }
    const savedView = localStorage.getItem('hadith-view');
    if (savedView === 'grid' || savedView === 'list' || savedView === 'compact') {
      setViewMode(savedView);
    }
  }, []);

  const handleLanguageChange = (lang: 'ar' | 'en') => {
    setLanguage(lang);
    localStorage.setItem('hadith-lang', lang);
  };

  const handleViewModeChange = (mode: ViewMode) => {
    setViewMode(mode);
    localStorage.setItem('hadith-view', mode);
  };

  const handleSortChange = (newSortBy: SortBy) => {
    if (sortBy === newSortBy) {
      setSortOrder(sortOrder === 'asc' ? 'desc' : 'asc');
    } else {
      setSortBy(newSortBy);
      setSortOrder('asc');
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-b from-gray-50 to-gray-100 dark:from-gray-900 dark:to-gray-950">
      {/* Header */}
      <header className="sticky top-0 z-10 bg-white/80 dark:bg-gray-800/80 backdrop-blur-lg border-b border-gray-200/50 dark:border-gray-700/50 shadow-sm">
        <div className="max-w-7xl mx-auto px-4 py-4">
          {/* Top Bar with Logo and Controls */}
          <div className="flex items-center justify-between gap-4">
            <div className="flex items-center gap-3">
              <LogoIcon className="w-10 h-10" />
              <div>
                <h1 className="text-xl md:text-2xl font-bold bg-gradient-to-r from-blue-600 to-purple-600 dark:from-blue-400 dark:to-purple-400 bg-clip-text text-transparent">
                  {language === 'ar' ? 'مَرْكَزُ دِرَاسَاتِ الحَدِيث' : 'Hadith Hub Online'}
                </h1>
                <p className="text-xs md:text-sm text-gray-500 dark:text-gray-400 flex items-center gap-1.5">
                  <BookIcon className="w-3.5 h-3.5" />
                  {language === 'ar'
                    ? `${books.length.toLocaleString()} كتب`
                    : `${books.length.toLocaleString()} books`}
                </p>
              </div>
            </div>
            <div className="flex items-center gap-2">
              <ThemeToggle />
              <LanguageToggle language={language} onChange={handleLanguageChange} />
            </div>
          </div>

          {/* Search Bar */}
          <div className="mt-4">
            <SearchBar
              placeholder={
                language === 'ar'
                  ? 'ابحث في الحديث... (عربي أو إنجليزي)'
                  : 'Search hadith... (Arabic or English)'
              }
              language={language}
            />
          </div>

          {/* Filters and Controls Row */}
          <div className="mt-4 flex flex-wrap items-center justify-between gap-3">
            {/* Sect Filters */}
            <div className="flex items-center gap-2">
              <span className="text-sm text-gray-500 dark:text-gray-400 flex items-center gap-1">
                <FilterIcon className="w-4 h-4" />
                {language === 'ar' ? 'تصفية:' : 'Filter:'}
              </span>
              <div className="flex items-center bg-gray-100 dark:bg-gray-700/50 rounded-full p-0.5">
                {(['all', 'shia', 'sunni'] as const).map((f) => (
                  <button
                    key={f}
                    onClick={() => setFilter(f)}
                    className={`px-3 py-1.5 text-sm font-medium rounded-full transition-all duration-200 ${
                      filter === f
                        ? 'bg-white dark:bg-gray-600 text-blue-600 dark:text-blue-400 shadow-sm'
                        : 'text-gray-600 dark:text-gray-400 hover:text-gray-900 dark:hover:text-gray-200'
                    }`}
                  >
                    {f === 'all'
                      ? language === 'ar'
                        ? 'الكل'
                        : 'All'
                      : f === 'shia'
                      ? language === 'ar'
                        ? 'الشيعة'
                        : 'Shia'
                      : language === 'ar'
                      ? 'السنة'
                      : 'Sunni'}
                  </button>
                ))}
              </div>
            </div>

            {/* View Mode Toggle */}
            <div className="flex items-center gap-1 bg-gray-100 dark:bg-gray-700/50 rounded-lg p-1">
              {([
                { mode: 'grid' as ViewMode, icon: GridIcon, label: language === 'ar' ? 'شبكة' : 'Grid' },
                { mode: 'list' as ViewMode, icon: ListIcon, label: language === 'ar' ? 'قائمة' : 'List' },
                { mode: 'compact' as ViewMode, icon: CompactIcon, label: language === 'ar' ? 'مضغوط' : 'Compact' },
              ]).map(({ mode, icon: Icon, label }) => (
                <button
                  key={mode}
                  onClick={() => handleViewModeChange(mode)}
                  title={label}
                  className={`p-2 rounded-md transition-all duration-200 ${
                    viewMode === mode
                      ? 'bg-white dark:bg-gray-600 text-blue-600 dark:text-blue-400 shadow-sm'
                      : 'text-gray-500 dark:text-gray-400 hover:text-gray-700 dark:hover:text-gray-300'
                  }`}
                >
                  <Icon className="w-5 h-5" />
                </button>
              ))}
            </div>
          </div>

          {/* Quick Filter and Sort Row */}
          <div className="mt-3 flex flex-wrap items-center gap-3">
            {/* Quick Filter Input */}
            <div className="relative flex-1 min-w-0 md:flex-none md:w-80">
              <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor" className="w-4 h-4 absolute left-3 top-1/2 -translate-y-1/2 text-gray-400">
                <path strokeLinecap="round" strokeLinejoin="round" d="M21 21l-5.197-5.197m0 0A7.5 7.5 0 105.196 5.196a7.5 7.5 0 0010.607 10.607z" />
              </svg>
              <input
                type="text"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                placeholder={
                  language === 'ar'
                    ? 'تصفية الكتب حسب الاسم أو المؤلف...'
                    : 'Filter books by name or author...'
                }
                className="w-full pl-9 pr-3 py-2 text-sm bg-gray-50 dark:bg-gray-700/50 border border-gray-200 dark:border-gray-600 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500/50 focus:border-blue-500 dark:text-white transition-all"
                dir="auto"
              />
            </div>

            {/* Sort Controls */}
            <div className="flex items-center gap-2">
              <span className="text-sm text-gray-500 dark:text-gray-400 flex items-center gap-1">
                <SortIcon className="w-4 h-4" />
                {language === 'ar' ? 'ترتيب:' : 'Sort:'}
              </span>
              <div className="flex items-center bg-gray-100 dark:bg-gray-700/50 rounded-lg p-0.5">
                {([
                  { value: 'title' as SortBy, label: language === 'ar' ? 'العنوان' : 'Title' },
                  { value: 'author' as SortBy, label: language === 'ar' ? 'المؤلف' : 'Author' },
                  { value: 'pages' as SortBy, label: language === 'ar' ? 'الصفحات' : 'Pages' },
                ]).map(({ value, label }) => (
                  <button
                    key={value}
                    onClick={() => handleSortChange(value)}
                    className={`px-3 py-1.5 text-sm font-medium rounded-md transition-all duration-200 flex items-center gap-1 ${
                      sortBy === value
                        ? 'bg-white dark:bg-gray-600 text-blue-600 dark:text-blue-400 shadow-sm'
                        : 'text-gray-600 dark:text-gray-400 hover:text-gray-900 dark:hover:text-gray-200'
                    }`}
                  >
                    {label}
                    {sortBy === value && (
                      <svg
                        xmlns="http://www.w3.org/2000/svg"
                        fill="none"
                        viewBox="0 0 24 24"
                        strokeWidth={2}
                        stroke="currentColor"
                        className={`w-3.5 h-3.5 transition-transform ${sortOrder === 'desc' ? 'rotate-180' : ''}`}
                      >
                        <path strokeLinecap="round" strokeLinejoin="round" d="M4.5 15.75l7.5-7.5 7.5 7.5" />
                      </svg>
                    )}
                  </button>
                ))}
              </div>
            </div>
          </div>
        </div>
      </header>

      {/* Main Content */}
      <main className="max-w-7xl mx-auto px-4 py-6">
        {loading ? (
          <div className="flex flex-col items-center justify-center py-20 gap-4">
            <div className="relative">
              <div className="w-16 h-16 border-4 border-blue-200 dark:border-blue-900 rounded-full"></div>
              <div className="absolute top-0 w-16 h-16 border-4 border-blue-500 border-t-transparent rounded-full animate-spin"></div>
            </div>
            <p className="text-gray-500 dark:text-gray-400 animate-pulse">
              {language === 'ar' ? 'جاري تحميل الكتب...' : 'Loading books...'}
            </p>
          </div>
        ) : error ? (
          <div className="text-center py-20">
            <div className="inline-flex items-center justify-center w-16 h-16 rounded-full bg-red-100 dark:bg-red-900/30 mb-4">
              <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor" className="w-8 h-8 text-red-500">
                <path strokeLinecap="round" strokeLinejoin="round" d="M12 9v3.75m9-.75a9 9 0 11-18 0 9 9 0 0118 0zm-9 3.75h.008v.008H12v-.008z" />
              </svg>
            </div>
            <p className="text-red-500 dark:text-red-400 font-medium">{error}</p>
            <button
              onClick={() => window.location.reload()}
              className="mt-4 px-5 py-2.5 bg-gradient-to-r from-blue-600 to-purple-600 hover:from-blue-700 hover:to-purple-700 text-white font-medium rounded-lg shadow-lg shadow-blue-500/25 transition-all"
            >
              {language === 'ar' ? 'إعادة المحاولة' : 'Retry'}
            </button>
          </div>
        ) : filteredAndSortedBooks.length === 0 ? (
          <div className="text-center py-20">
            <div className="inline-flex items-center justify-center w-16 h-16 rounded-full bg-gray-100 dark:bg-gray-800 mb-4">
              <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor" className="w-8 h-8 text-gray-400">
                <path strokeLinecap="round" strokeLinejoin="round" d="M12 6.042A8.967 8.967 0 006 3.75c-1.052 0-2.062.18-3 .512v14.25A8.987 8.987 0 016 18c2.305 0 4.408.867 6 2.292m0-14.25a8.966 8.966 0 016-2.292c1.052 0 2.062.18 3 .512v14.25A8.987 8.987 0 0018 18a8.967 8.967 0 00-6 2.292m0-14.25v14.25" />
              </svg>
            </div>
            <p className="text-gray-500 dark:text-gray-400 font-medium">
              {language === 'ar' ? 'لا توجد كتب مطابقة' : 'No matching books found'}
            </p>
            <p className="text-sm text-gray-400 dark:text-gray-500 mt-1">
              {language === 'ar' ? 'جرب تغيير معايير البحث' : 'Try adjusting your search criteria'}
            </p>
          </div>
        ) : (
          <>
            <div className="mb-4 flex flex-wrap items-center justify-between gap-2">
              <p className="text-sm text-gray-500 dark:text-gray-400">
                {language === 'ar'
                  ? `عرض ${(currentPage - 1) * ITEMS_PER_PAGE + 1}-${Math.min(currentPage * ITEMS_PER_PAGE, filteredAndSortedBooks.length)} من ${filteredAndSortedBooks.length} كتاب`
                  : `Showing ${(currentPage - 1) * ITEMS_PER_PAGE + 1}-${Math.min(currentPage * ITEMS_PER_PAGE, filteredAndSortedBooks.length)} of ${filteredAndSortedBooks.length} books`}
              </p>

              {/* Page size info */}
              {totalPages > 1 && (
                <p className="text-sm text-gray-500 dark:text-gray-400">
                  {language === 'ar' ? `صفحة ${currentPage} من ${totalPages}` : `Page ${currentPage} of ${totalPages}`}
                </p>
              )}
            </div>

            {/* Grid View */}
            {viewMode === 'grid' && (
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
                {paginatedBooks.map((book) => (
                  <BookCard key={book.id} book={book} language={language} viewMode="grid" />
                ))}
              </div>
            )}

            {/* List View */}
            {viewMode === 'list' && (
              <div className="space-y-3">
                {paginatedBooks.map((book) => (
                  <BookCard key={book.id} book={book} language={language} viewMode="list" />
                ))}
              </div>
            )}

            {/* Compact View */}
            {viewMode === 'compact' && (
              <div className="bg-white dark:bg-gray-800 rounded-lg border border-gray-200 dark:border-gray-700 divide-y divide-gray-100 dark:divide-gray-700">
                {paginatedBooks.map((book) => (
                  <BookCard key={book.id} book={book} language={language} viewMode="compact" />
                ))}
              </div>
            )}

            {/* Pagination Controls */}
            {totalPages > 1 && (
              <div className="mt-8 flex flex-wrap items-center justify-center gap-2">
                <button
                  onClick={() => setCurrentPage(1)}
                  disabled={currentPage === 1}
                  className="px-3 py-2 text-sm bg-white dark:bg-gray-800 border border-gray-300 dark:border-gray-600 rounded-md disabled:opacity-50 disabled:cursor-not-allowed hover:bg-gray-50 dark:hover:bg-gray-700"
                >
                  {language === 'ar' ? 'الأولى' : 'First'}
                </button>
                <button
                  onClick={() => setCurrentPage(Math.max(1, currentPage - 1))}
                  disabled={currentPage === 1}
                  className="px-3 py-2 text-sm bg-white dark:bg-gray-800 border border-gray-300 dark:border-gray-600 rounded-md disabled:opacity-50 disabled:cursor-not-allowed hover:bg-gray-50 dark:hover:bg-gray-700"
                >
                  <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={2} stroke="currentColor" className="w-4 h-4">
                    <path strokeLinecap="round" strokeLinejoin="round" d="M15.75 19.5L8.25 12l7.5-7.5" />
                  </svg>
                </button>

                {/* Page numbers */}
                <div className="flex items-center gap-1">
                  {Array.from({ length: Math.min(5, totalPages) }, (_, i) => {
                    let pageNum: number;
                    if (totalPages <= 5) {
                      pageNum = i + 1;
                    } else if (currentPage <= 3) {
                      pageNum = i + 1;
                    } else if (currentPage >= totalPages - 2) {
                      pageNum = totalPages - 4 + i;
                    } else {
                      pageNum = currentPage - 2 + i;
                    }
                    return (
                      <button
                        key={pageNum}
                        onClick={() => setCurrentPage(pageNum)}
                        className={`w-10 h-10 text-sm rounded-md ${
                          currentPage === pageNum
                            ? 'bg-blue-600 text-white'
                            : 'bg-white dark:bg-gray-800 border border-gray-300 dark:border-gray-600 hover:bg-gray-50 dark:hover:bg-gray-700'
                        }`}
                      >
                        {pageNum}
                      </button>
                    );
                  })}
                </div>

                <button
                  onClick={() => setCurrentPage(Math.min(totalPages, currentPage + 1))}
                  disabled={currentPage === totalPages}
                  className="px-3 py-2 text-sm bg-white dark:bg-gray-800 border border-gray-300 dark:border-gray-600 rounded-md disabled:opacity-50 disabled:cursor-not-allowed hover:bg-gray-50 dark:hover:bg-gray-700"
                >
                  <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={2} stroke="currentColor" className="w-4 h-4">
                    <path strokeLinecap="round" strokeLinejoin="round" d="M8.25 4.5l7.5 7.5-7.5 7.5" />
                  </svg>
                </button>
                <button
                  onClick={() => setCurrentPage(totalPages)}
                  disabled={currentPage === totalPages}
                  className="px-3 py-2 text-sm bg-white dark:bg-gray-800 border border-gray-300 dark:border-gray-600 rounded-md disabled:opacity-50 disabled:cursor-not-allowed hover:bg-gray-50 dark:hover:bg-gray-700"
                >
                  {language === 'ar' ? 'الأخيرة' : 'Last'}
                </button>
              </div>
            )}
          </>
        )}
      </main>

      {/* Footer */}
      <footer className="border-t border-gray-200/50 dark:border-gray-700/50 bg-white/50 dark:bg-gray-800/50 backdrop-blur-sm py-8 mt-8">
        <div className="max-w-7xl mx-auto px-4">
          <div className="flex flex-col md:flex-row items-center justify-between gap-4">
            <div className="flex items-center gap-2">
              <LogoIcon className="w-6 h-6" />
              <span className="font-semibold bg-gradient-to-r from-blue-600 to-purple-600 dark:from-blue-400 dark:to-purple-400 bg-clip-text text-transparent">
                {language === 'ar' ? 'مَرْكَزُ دِرَاسَاتِ الحَدِيث' : 'Hadith Hub Online'}
              </span>
            </div>
            <div className="flex items-center gap-4">
              <a
                href="/help"
                className="text-sm text-gray-500 dark:text-gray-400 hover:text-blue-600 dark:hover:text-blue-400 transition-colors"
              >
                {language === 'ar' ? 'المساعدة' : 'Help'}
              </a>
              <span className="text-gray-300 dark:text-gray-600">|</span>
              <p className="text-sm text-gray-500 dark:text-gray-400">
                {language === 'ar'
                  ? 'جميع الحقوق محفوظة'
                  : 'All rights reserved'}
              </p>
            </div>
          </div>
        </div>
      </footer>
    </div>
  );
}
