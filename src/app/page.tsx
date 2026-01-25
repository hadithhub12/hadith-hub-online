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

export default function Home() {
  const [books, setBooks] = useState<Book[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [language, setLanguage] = useState<'ar' | 'en'>('ar');
  const [filter, setFilter] = useState<'all' | 'shia' | 'sunni'>('all');
  const [searchQuery, setSearchQuery] = useState('');
  const [viewMode, setViewMode] = useState<ViewMode>('grid');
  const [sortBy, setSortBy] = useState<SortBy>('title');
  const [sortOrder, setSortOrder] = useState<SortOrder>('asc');
  const [currentPage, setCurrentPage] = useState(1);

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
    <div className="min-h-screen bg-gray-50 dark:bg-gray-900">
      {/* Header */}
      <header className="sticky top-0 z-10 bg-white dark:bg-gray-800 border-b border-gray-200 dark:border-gray-700 shadow-sm">
        <div className="max-w-7xl mx-auto px-4 py-4">
          <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4">
            <div>
              <h1 className="text-2xl font-bold text-gray-900 dark:text-white">
                {language === 'ar' ? 'مركز الحديث أونلاين' : 'Hadith Hub Online'}
              </h1>
              <p className="text-sm text-gray-500 dark:text-gray-400">
                {language === 'ar'
                  ? `${books.length} كتاب متاح`
                  : `${books.length} books available`}
              </p>
            </div>
            <div className="flex items-center gap-3">
              <ThemeToggle />
              <LanguageToggle language={language} onChange={handleLanguageChange} />
            </div>
          </div>

          {/* Search */}
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

          {/* Filters and View Toggle */}
          <div className="mt-4 flex flex-wrap items-center justify-between gap-4">
            {/* Sect Filters */}
            <div className="flex items-center gap-2">
              <span className="text-sm text-gray-500 dark:text-gray-400">
                {language === 'ar' ? 'تصفية:' : 'Filter:'}
              </span>
              {(['all', 'shia', 'sunni'] as const).map((f) => (
                <button
                  key={f}
                  onClick={() => setFilter(f)}
                  className={`px-3 py-1 text-sm rounded-full transition-colors ${
                    filter === f
                      ? 'bg-blue-600 text-white'
                      : 'bg-gray-200 dark:bg-gray-700 text-gray-700 dark:text-gray-300 hover:bg-gray-300 dark:hover:bg-gray-600'
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

            {/* View Mode Toggle */}
            <div className="flex items-center gap-1 bg-gray-100 dark:bg-gray-700 rounded-lg p-1">
              {([
                { mode: 'grid' as ViewMode, icon: GridIcon, label: language === 'ar' ? 'شبكة' : 'Grid' },
                { mode: 'list' as ViewMode, icon: ListIcon, label: language === 'ar' ? 'قائمة' : 'List' },
                { mode: 'compact' as ViewMode, icon: CompactIcon, label: language === 'ar' ? 'مضغوط' : 'Compact' },
              ]).map(({ mode, icon: Icon, label }) => (
                <button
                  key={mode}
                  onClick={() => handleViewModeChange(mode)}
                  title={label}
                  className={`p-2 rounded-md transition-colors ${
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

          {/* Quick local filter and sort controls */}
          <div className="mt-3 flex flex-wrap items-center gap-4">
            <input
              type="text"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              placeholder={
                language === 'ar'
                  ? 'تصفية الكتب حسب الاسم أو المؤلف...'
                  : 'Filter books by name or author...'
              }
              className="flex-1 min-w-0 md:flex-none md:w-80 px-3 py-1.5 text-sm border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 dark:bg-gray-700 dark:border-gray-600 dark:text-white"
              dir="auto"
            />

            {/* Sort Controls */}
            <div className="flex items-center gap-2">
              <span className="text-sm text-gray-500 dark:text-gray-400">
                {language === 'ar' ? 'ترتيب:' : 'Sort:'}
              </span>
              {([
                { value: 'title' as SortBy, label: language === 'ar' ? 'العنوان' : 'Title' },
                { value: 'author' as SortBy, label: language === 'ar' ? 'المؤلف' : 'Author' },
                { value: 'pages' as SortBy, label: language === 'ar' ? 'الصفحات' : 'Pages' },
              ]).map(({ value, label }) => (
                <button
                  key={value}
                  onClick={() => handleSortChange(value)}
                  className={`px-2.5 py-1 text-sm rounded-md transition-colors flex items-center gap-1 ${
                    sortBy === value
                      ? 'bg-blue-600 text-white'
                      : 'bg-gray-200 dark:bg-gray-700 text-gray-700 dark:text-gray-300 hover:bg-gray-300 dark:hover:bg-gray-600'
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
      </header>

      {/* Main Content */}
      <main className="max-w-7xl mx-auto px-4 py-6">
        {loading ? (
          <div className="flex items-center justify-center py-20">
            <div className="animate-spin rounded-full h-12 w-12 border-4 border-blue-500 border-t-transparent"></div>
          </div>
        ) : error ? (
          <div className="text-center py-20">
            <p className="text-red-500 dark:text-red-400">{error}</p>
            <button
              onClick={() => window.location.reload()}
              className="mt-4 px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700"
            >
              Retry
            </button>
          </div>
        ) : filteredAndSortedBooks.length === 0 ? (
          <div className="text-center py-20 text-gray-500 dark:text-gray-400">
            {language === 'ar' ? 'لا توجد كتب مطابقة' : 'No matching books found'}
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
      <footer className="border-t border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-800 py-6 mt-8">
        <div className="max-w-7xl mx-auto px-4 text-center text-sm text-gray-500 dark:text-gray-400">
          <p>
            {language === 'ar'
              ? 'مركز الحديث أونلاين - جميع الحقوق محفوظة'
              : 'Hadith Hub Online - All rights reserved'}
          </p>
        </div>
      </footer>
    </div>
  );
}
