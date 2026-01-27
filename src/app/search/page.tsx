'use client';

import { useState, useEffect, useMemo, Suspense } from 'react';
import { useSearchParams, useRouter } from 'next/navigation';
import Link from 'next/link';
import ShareButton from '@/components/ShareButton';
import ThemeToggle from '@/components/ThemeToggle';
import type { SearchResult } from '@/lib/types';

type SearchMode = 'word' | 'root' | 'exact';

const RESULTS_PER_PAGE = 50;

// Logo Icon
function LogoIcon({ className = 'w-8 h-8' }: { className?: string }) {
  return (
    <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 48 48" className={className}>
      <defs>
        <linearGradient id="searchLogoGradient" x1="0%" y1="0%" x2="100%" y2="100%">
          <stop offset="0%" stopColor="#3b82f6" />
          <stop offset="100%" stopColor="#8b5cf6" />
        </linearGradient>
      </defs>
      <circle cx="24" cy="24" r="22" fill="url(#searchLogoGradient)" />
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

// Search Icon for search modes
function SearchModeIcon({ mode }: { mode: SearchMode }) {
  if (mode === 'exact') {
    return (
      <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor" className="w-4 h-4">
        <path strokeLinecap="round" strokeLinejoin="round" d="M7.5 8.25h9m-9 3H12m-9.75 1.51c0 1.6 1.123 2.994 2.707 3.227 1.129.166 2.27.293 3.423.379.35.026.67.21.865.501L12 21l2.755-4.133a1.14 1.14 0 01.865-.501 48.172 48.172 0 003.423-.379c1.584-.233 2.707-1.626 2.707-3.228V6.741c0-1.602-1.123-2.995-2.707-3.228A48.394 48.394 0 0012 3c-2.392 0-4.744.175-7.043.513C3.373 3.746 2.25 5.14 2.25 6.741v6.018z" />
      </svg>
    );
  }
  if (mode === 'word') {
    return (
      <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor" className="w-4 h-4">
        <path strokeLinecap="round" strokeLinejoin="round" d="M3.75 6.75h16.5M3.75 12H12m-8.25 5.25h16.5" />
      </svg>
    );
  }
  return (
    <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor" className="w-4 h-4">
      <path strokeLinecap="round" strokeLinejoin="round" d="M9.75 3.104v5.714a2.25 2.25 0 01-.659 1.591L5 14.5M9.75 3.104c-.251.023-.501.05-.75.082m.75-.082a24.301 24.301 0 014.5 0m0 0v5.714c0 .597.237 1.17.659 1.591L19.8 15.3M14.25 3.104c.251.023.501.05.75.082M19.8 15.3l-1.57.393A9.065 9.065 0 0112 15a9.065 9.065 0 00-6.23.693L5 15.5m14.8-.2l-.8.2m-13 1.5v1.125c0 .621.504 1.125 1.125 1.125h.375m12-4.125l-.5.125m0 0l.5 1.875m-.5-1.875l-1 .25M5 18.625v1.125c0 .621.504 1.125 1.125 1.125H12" />
    </svg>
  );
}

function ChevronIcon({ expanded, className = 'w-5 h-5' }: { expanded: boolean; className?: string }) {
  return (
    <svg
      xmlns="http://www.w3.org/2000/svg"
      fill="none"
      viewBox="0 0 24 24"
      strokeWidth={2}
      stroke="currentColor"
      className={`${className} transition-transform duration-200 ${expanded ? 'rotate-180' : ''}`}
    >
      <path strokeLinecap="round" strokeLinejoin="round" d="M19.5 8.25l-7.5 7.5-7.5-7.5" />
    </svg>
  );
}

interface GroupedResult {
  bookId: string;
  bookTitleAr: string;
  bookTitleEn: string;
  volumes: {
    volume: number;
    pages: {
      page: number;
      results: SearchResult[];
    }[];
  }[];
  totalResults: number;
}

function groupResultsByBookVolumePage(results: SearchResult[]): GroupedResult[] {
  const bookMap = new Map<string, GroupedResult>();

  for (const result of results) {
    if (!bookMap.has(result.bookId)) {
      bookMap.set(result.bookId, {
        bookId: result.bookId,
        bookTitleAr: result.bookTitleAr,
        bookTitleEn: result.bookTitleEn,
        volumes: [],
        totalResults: 0,
      });
    }

    const book = bookMap.get(result.bookId)!;
    book.totalResults++;

    let volume = book.volumes.find(v => v.volume === result.volume);
    if (!volume) {
      volume = { volume: result.volume, pages: [] };
      book.volumes.push(volume);
    }

    let page = volume.pages.find(p => p.page === result.page);
    if (!page) {
      page = { page: result.page, results: [] };
      volume.pages.push(page);
    }

    page.results.push(result);
  }

  // Sort volumes and pages
  for (const book of bookMap.values()) {
    book.volumes.sort((a, b) => a.volume - b.volume);
    for (const volume of book.volumes) {
      volume.pages.sort((a, b) => a.page - b.page);
    }
  }

  return Array.from(bookMap.values());
}

function SearchHeader({
  language,
  searchMode,
  onModeChange,
  query,
  onSearch
}: {
  language: 'ar' | 'en';
  searchMode: SearchMode;
  onModeChange: (mode: SearchMode) => void;
  query: string;
  onSearch: (query: string) => void;
}) {
  const [inputValue, setInputValue] = useState(query);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (inputValue.trim()) {
      onSearch(inputValue.trim());
    }
  };

  return (
    <header className="sticky top-0 z-10 bg-white/80 dark:bg-gray-800/80 backdrop-blur-lg border-b border-gray-200/50 dark:border-gray-700/50 shadow-sm">
      <div className="max-w-5xl mx-auto px-4 py-4">
        {/* Top Bar */}
        <div className="flex items-center justify-between mb-4">
          <Link
            href="/"
            className="inline-flex items-center gap-2 px-3 py-1.5 text-sm font-medium text-gray-600 dark:text-gray-400 hover:text-blue-600 dark:hover:text-blue-400 bg-gray-100 dark:bg-gray-700/50 hover:bg-blue-50 dark:hover:bg-blue-900/30 rounded-lg transition-all"
          >
            <svg
              xmlns="http://www.w3.org/2000/svg"
              fill="none"
              viewBox="0 0 24 24"
              strokeWidth={2}
              stroke="currentColor"
              className="w-4 h-4"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                d="M10.5 19.5L3 12m0 0l7.5-7.5M3 12h18"
              />
            </svg>
            {language === 'ar' ? 'العودة للرئيسية' : 'Back to library'}
          </Link>
          <div className="flex items-center gap-2">
            <LogoIcon className="w-7 h-7" />
            <ThemeToggle />
          </div>
        </div>

        {/* Title */}
        <h1 className="text-2xl font-bold bg-gradient-to-r from-blue-600 to-purple-600 dark:from-blue-400 dark:to-purple-400 bg-clip-text text-transparent mb-4 flex items-center gap-2">
          <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor" className="w-7 h-7 text-blue-600 dark:text-blue-400">
            <path strokeLinecap="round" strokeLinejoin="round" d="M21 21l-5.197-5.197m0 0A7.5 7.5 0 105.196 5.196a7.5 7.5 0 0010.607 10.607z" />
          </svg>
          {language === 'ar' ? 'البحث المتقدم' : 'Advanced Search'}
        </h1>

        {/* Search Input */}
        <form onSubmit={handleSubmit} className="relative">
          <div className="absolute left-4 top-1/2 -translate-y-1/2 text-gray-400">
            <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={2} stroke="currentColor" className="w-5 h-5">
              <path strokeLinecap="round" strokeLinejoin="round" d="M21 21l-5.197-5.197m0 0A7.5 7.5 0 105.196 5.196a7.5 7.5 0 0010.607 10.607z" />
            </svg>
          </div>
          <input
            type="text"
            value={inputValue}
            onChange={(e) => setInputValue(e.target.value)}
            placeholder={
              language === 'ar'
                ? 'ابحث في الحديث... (عربي أو إنجليزي)'
                : 'Search hadith... (Arabic or English)'
            }
            className="w-full pl-12 pr-14 py-3.5 text-lg bg-gray-50 dark:bg-gray-700/50 border border-gray-200 dark:border-gray-600 rounded-xl focus:outline-none focus:ring-2 focus:ring-blue-500/50 focus:border-blue-500 dark:text-white transition-all"
            dir="auto"
          />
          <button
            type="submit"
            className="absolute right-2 top-1/2 -translate-y-1/2 p-2.5 bg-gradient-to-r from-blue-600 to-purple-600 hover:from-blue-700 hover:to-purple-700 text-white rounded-lg shadow-lg shadow-blue-500/25 transition-all"
          >
            <svg
              xmlns="http://www.w3.org/2000/svg"
              fill="none"
              viewBox="0 0 24 24"
              strokeWidth={2}
              stroke="currentColor"
              className="w-5 h-5"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                d="M13.5 4.5L21 12m0 0l-7.5 7.5M21 12H3"
              />
            </svg>
          </button>
        </form>

        {/* Search Mode Options */}
        <div className="mt-4 flex flex-wrap items-center gap-3">
          <span className="text-sm font-medium text-gray-500 dark:text-gray-400 flex items-center gap-1.5">
            <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor" className="w-4 h-4">
              <path strokeLinecap="round" strokeLinejoin="round" d="M10.5 6h9.75M10.5 6a1.5 1.5 0 11-3 0m3 0a1.5 1.5 0 10-3 0M3.75 6H7.5m3 12h9.75m-9.75 0a1.5 1.5 0 01-3 0m3 0a1.5 1.5 0 00-3 0m-3.75 0H7.5m9-6h3.75m-3.75 0a1.5 1.5 0 01-3 0m3 0a1.5 1.5 0 00-3 0m-9.75 0h9.75" />
            </svg>
            {language === 'ar' ? 'نوع البحث:' : 'Search type:'}
          </span>
          <div className="flex items-center bg-gray-100 dark:bg-gray-700/50 rounded-lg p-1">
            {([
              { mode: 'exact' as SearchMode, labelAr: 'عبارة', labelEn: 'Exact', descAr: 'البحث عن العبارة بالضبط', descEn: 'Match exact phrase' },
              { mode: 'word' as SearchMode, labelAr: 'كلمة', labelEn: 'Word', descAr: 'البحث عن الكلمة', descEn: 'Match any word' },
              { mode: 'root' as SearchMode, labelAr: 'جذر', labelEn: 'Root', descAr: 'البحث عن الجذر', descEn: 'Match word roots' },
            ]).map(({ mode, labelAr, labelEn, descAr, descEn }) => (
              <button
                key={mode}
                onClick={() => onModeChange(mode)}
                title={language === 'ar' ? descAr : descEn}
                className={`px-4 py-2 text-sm font-medium rounded-md transition-all duration-200 flex items-center gap-1.5 ${
                  searchMode === mode
                    ? 'bg-white dark:bg-gray-600 text-blue-600 dark:text-blue-400 shadow-sm'
                    : 'text-gray-600 dark:text-gray-400 hover:text-gray-900 dark:hover:text-gray-200'
                }`}
              >
                <SearchModeIcon mode={mode} />
                {language === 'ar' ? labelAr : labelEn}
              </button>
            ))}
          </div>
        </div>
      </div>
    </header>
  );
}

function SearchResultsContent({ query, searchMode, language }: { query: string; searchMode: SearchMode; language: 'ar' | 'en' }) {
  const [results, setResults] = useState<SearchResult[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [total, setTotal] = useState(0);
  const [searchTerms, setSearchTerms] = useState<string[]>([]);
  const [wasTransliterated, setWasTransliterated] = useState(false);
  const [currentPage, setCurrentPage] = useState(1);
  const [expandedBooks, setExpandedBooks] = useState<Set<string>>(new Set());
  const [expandedVolumes, setExpandedVolumes] = useState<Set<string>>(new Set());

  useEffect(() => {
    if (!query) {
      setResults([]);
      setTotal(0);
      return;
    }

    async function performSearch() {
      setLoading(true);
      setError(null);
      setCurrentPage(1);
      try {
        const res = await fetch(
          `/api/search?q=${encodeURIComponent(query)}&lang=${language}&mode=${searchMode}&limit=500`
        );
        if (!res.ok) throw new Error('Search failed');
        const data = await res.json();
        setResults(data.results || []);
        setTotal(data.total);
        setSearchTerms(data.searchTerms || []);
        setWasTransliterated(data.transliterated || false);

        if (data.results.length > 0) {
          const firstBookId = data.results[0].bookId;
          setExpandedBooks(new Set([firstBookId]));
        }
      } catch (e) {
        console.error('[SearchResultsContent] Error:', e);
        setError(e instanceof Error ? e.message : 'Search failed');
      } finally {
        setLoading(false);
      }
    }

    performSearch();
  }, [query, language, searchMode]);

  const groupedResults = useMemo(() => groupResultsByBookVolumePage(results), [results]);
  const totalPages = Math.ceil(groupedResults.length / RESULTS_PER_PAGE);
  const paginatedBooks = groupedResults.slice(
    (currentPage - 1) * RESULTS_PER_PAGE,
    currentPage * RESULTS_PER_PAGE
  );

  const toggleBook = (bookId: string) => {
    setExpandedBooks(prev => {
      const next = new Set(prev);
      if (next.has(bookId)) next.delete(bookId);
      else next.add(bookId);
      return next;
    });
  };

  const toggleVolume = (bookId: string, volume: number) => {
    const key = `${bookId}-${volume}`;
    setExpandedVolumes(prev => {
      const next = new Set(prev);
      if (next.has(key)) next.delete(key);
      else next.add(key);
      return next;
    });
  };

  const expandAll = () => {
    setExpandedBooks(new Set(groupedResults.map(g => g.bookId)));
    const allVolumes = new Set<string>();
    for (const book of groupedResults) {
      for (const vol of book.volumes) {
        allVolumes.add(`${book.bookId}-${vol.volume}`);
      }
    }
    setExpandedVolumes(allVolumes);
  };

  const collapseAll = () => {
    setExpandedBooks(new Set());
    setExpandedVolumes(new Set());
  };

  if (loading) {
    return (
      <div className="flex flex-col items-center justify-center py-20 gap-4">
        <div className="relative">
          <div className="w-16 h-16 border-4 border-blue-200 dark:border-blue-900 rounded-full"></div>
          <div className="absolute top-0 w-16 h-16 border-4 border-blue-500 border-t-transparent rounded-full animate-spin"></div>
        </div>
        <p className="text-gray-500 dark:text-gray-400 animate-pulse">
          {language === 'ar' ? 'جاري البحث...' : 'Searching...'}
        </p>
      </div>
    );
  }

  if (error) {
    return (
      <div className="text-center py-20">
        <div className="inline-flex items-center justify-center w-16 h-16 rounded-full bg-red-100 dark:bg-red-900/30 mb-4">
          <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor" className="w-8 h-8 text-red-500">
            <path strokeLinecap="round" strokeLinejoin="round" d="M12 9v3.75m9-.75a9 9 0 11-18 0 9 9 0 0118 0zm-9 3.75h.008v.008H12v-.008z" />
          </svg>
        </div>
        <p className="text-red-500 dark:text-red-400 font-medium">{error}</p>
      </div>
    );
  }

  if (!query) {
    return (
      <div className="text-center py-16">
        <div className="inline-flex items-center justify-center w-20 h-20 rounded-full bg-gradient-to-br from-blue-100 to-purple-100 dark:from-blue-900/30 dark:to-purple-900/30 mb-6">
          <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor" className="w-10 h-10 text-blue-600 dark:text-blue-400">
            <path strokeLinecap="round" strokeLinejoin="round" d="M21 21l-5.197-5.197m0 0A7.5 7.5 0 105.196 5.196a7.5 7.5 0 0010.607 10.607z" />
          </svg>
        </div>
        <p className="text-xl font-semibold text-gray-700 dark:text-gray-300">
          {language === 'ar'
            ? 'أدخل كلمة للبحث في مركز الحديث'
            : 'Enter a term to search Hadith Hub'}
        </p>
        <p className="mt-2 text-gray-500 dark:text-gray-400">
          {language === 'ar'
            ? 'يمكنك البحث بالعربية أو الإنجليزية'
            : 'You can search in Arabic or English (transliteration)'}
        </p>
        <div className="mt-8 p-6 bg-white dark:bg-gray-800 rounded-xl border border-gray-200 dark:border-gray-700 max-w-lg mx-auto text-left shadow-lg shadow-gray-500/5">
          <h3 className="font-semibold text-gray-900 dark:text-white mb-4 flex items-center gap-2">
            <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor" className="w-5 h-5 text-blue-600 dark:text-blue-400">
              <path strokeLinecap="round" strokeLinejoin="round" d="M9.879 7.519c1.171-1.025 3.071-1.025 4.242 0 1.172 1.025 1.172 2.687 0 3.712-.203.179-.43.326-.67.442-.745.361-1.45.999-1.45 1.827v.75M21 12a9 9 0 11-18 0 9 9 0 0118 0zm-9 5.25h.008v.008H12v-.008z" />
            </svg>
            {language === 'ar' ? 'أنواع البحث:' : 'Search Types:'}
          </h3>
          <ul className="space-y-3">
            <li className="flex items-start gap-3 p-3 bg-gray-50 dark:bg-gray-700/50 rounded-lg">
              <SearchModeIcon mode="exact" />
              <div>
                <strong className="text-gray-900 dark:text-white">{language === 'ar' ? 'عبارة:' : 'Exact:'}</strong>{' '}
                <span className="text-gray-600 dark:text-gray-400">
                  {language === 'ar' ? 'يبحث عن العبارة بالضبط كما هي' : 'Matches the exact phrase as entered'}
                </span>
              </div>
            </li>
            <li className="flex items-start gap-3 p-3 bg-gray-50 dark:bg-gray-700/50 rounded-lg">
              <SearchModeIcon mode="word" />
              <div>
                <strong className="text-gray-900 dark:text-white">{language === 'ar' ? 'كلمة:' : 'Word:'}</strong>{' '}
                <span className="text-gray-600 dark:text-gray-400">
                  {language === 'ar' ? 'يبحث عن أي كلمة من الكلمات المدخلة' : 'Matches any of the entered words'}
                </span>
              </div>
            </li>
            <li className="flex items-start gap-3 p-3 bg-gray-50 dark:bg-gray-700/50 rounded-lg">
              <SearchModeIcon mode="root" />
              <div>
                <strong className="text-gray-900 dark:text-white">{language === 'ar' ? 'جذر:' : 'Root:'}</strong>{' '}
                <span className="text-gray-600 dark:text-gray-400">
                  {language === 'ar' ? 'يبحث عن الكلمات المشتقة من نفس الجذر' : 'Matches words derived from the same root'}
                </span>
              </div>
            </li>
          </ul>
        </div>
      </div>
    );
  }

  if (results.length === 0) {
    return (
      <div className="text-center py-20">
        <div className="inline-flex items-center justify-center w-16 h-16 rounded-full bg-gray-100 dark:bg-gray-800 mb-4">
          <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor" className="w-8 h-8 text-gray-400">
            <path strokeLinecap="round" strokeLinejoin="round" d="M21 21l-5.197-5.197m0 0A7.5 7.5 0 105.196 5.196a7.5 7.5 0 0010.607 10.607z" />
          </svg>
        </div>
        <p className="text-gray-700 dark:text-gray-300 font-medium">
          {language === 'ar'
            ? `لم يتم العثور على نتائج لـ "${query}"`
            : `No results found for "${query}"`}
        </p>
        <p className="mt-2 text-sm text-gray-500 dark:text-gray-400">
          {language === 'ar'
            ? 'جرب كلمات أخرى أو نوع بحث مختلف'
            : 'Try different keywords or search type'}
        </p>
      </div>
    );
  }

  return (
    <>
      {/* Results summary */}
      <div className="mb-6 flex flex-wrap items-center justify-between gap-4 p-4 bg-white dark:bg-gray-800 rounded-xl border border-gray-200 dark:border-gray-700">
        <div className="text-sm">
          {wasTransliterated && searchTerms.length > 0 && (
            <p className="mb-1 text-gray-600 dark:text-gray-400">
              {language === 'ar' ? 'تم البحث عن:' : 'Searched for:'}{' '}
              <span className="arabic-text font-semibold text-blue-600 dark:text-blue-400" dir="rtl">
                {searchTerms.join(' ، ')}
              </span>
            </p>
          )}
          <p className="font-medium text-gray-900 dark:text-white flex items-center gap-2">
            <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor" className="w-5 h-5 text-emerald-500">
              <path strokeLinecap="round" strokeLinejoin="round" d="M9 12.75L11.25 15 15 9.75M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
            </svg>
            {language === 'ar'
              ? `${total.toLocaleString()} نتيجة في ${groupedResults.length} كتاب`
              : `${total.toLocaleString()} results in ${groupedResults.length} books`}
          </p>
        </div>
        <div className="flex items-center gap-1 bg-gray-100 dark:bg-gray-700/50 rounded-lg p-1">
          <button
            onClick={expandAll}
            className="px-3 py-1.5 text-sm font-medium text-gray-600 dark:text-gray-400 hover:text-blue-600 dark:hover:text-blue-400 transition-colors rounded-md hover:bg-white dark:hover:bg-gray-600 flex items-center gap-1"
          >
            <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor" className="w-4 h-4">
              <path strokeLinecap="round" strokeLinejoin="round" d="M3.75 3.75v4.5m0-4.5h4.5m-4.5 0L9 9M3.75 20.25v-4.5m0 4.5h4.5m-4.5 0L9 15M20.25 3.75h-4.5m4.5 0v4.5m0-4.5L15 9m5.25 11.25h-4.5m4.5 0v-4.5m0 4.5L15 15" />
            </svg>
            {language === 'ar' ? 'توسيع' : 'Expand'}
          </button>
          <button
            onClick={collapseAll}
            className="px-3 py-1.5 text-sm font-medium text-gray-600 dark:text-gray-400 hover:text-blue-600 dark:hover:text-blue-400 transition-colors rounded-md hover:bg-white dark:hover:bg-gray-600 flex items-center gap-1"
          >
            <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor" className="w-4 h-4">
              <path strokeLinecap="round" strokeLinejoin="round" d="M9 9V4.5M9 9H4.5M9 9L3.75 3.75M9 15v4.5M9 15H4.5M9 15l-5.25 5.25M15 9h4.5M15 9V4.5M15 9l5.25-5.25M15 15h4.5M15 15v4.5m0-4.5l5.25 5.25" />
            </svg>
            {language === 'ar' ? 'طي' : 'Collapse'}
          </button>
        </div>
      </div>

      {/* Results list */}
      <div className="space-y-4">
        {paginatedBooks.map((book) => (
          <div
            key={book.bookId}
            className="bg-white dark:bg-gray-800 rounded-xl border border-gray-200 dark:border-gray-700 overflow-hidden shadow-sm hover:shadow-md transition-shadow"
          >
            <button
              onClick={() => toggleBook(book.bookId)}
              className="w-full flex items-center justify-between px-5 py-4 bg-gradient-to-r from-blue-50/50 to-transparent dark:from-blue-900/10 dark:to-transparent hover:from-blue-100/50 dark:hover:from-blue-900/20 transition-all"
            >
              <div className="flex items-center gap-3">
                <div className={`w-10 h-10 rounded-lg bg-gradient-to-br from-blue-500 to-purple-600 flex items-center justify-center transition-transform ${expandedBooks.has(book.bookId) ? 'scale-95' : ''}`}>
                  <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="white" className="w-5 h-5">
                    <path strokeLinecap="round" strokeLinejoin="round" d="M12 6.042A8.967 8.967 0 006 3.75c-1.052 0-2.062.18-3 .512v14.25A8.987 8.987 0 016 18c2.305 0 4.408.867 6 2.292m0-14.25a8.966 8.966 0 016-2.292c1.052 0 2.062.18 3 .512v14.25A8.987 8.987 0 0018 18a8.967 8.967 0 00-6 2.292m0-14.25v14.25" />
                  </svg>
                </div>
                <div className="text-left">
                  <Link
                    href={`/book/${book.bookId}`}
                    onClick={(e) => e.stopPropagation()}
                    className="text-lg font-semibold text-gray-900 dark:text-white hover:text-blue-600 dark:hover:text-blue-400 transition-colors"
                  >
                    <span
                      className={language === 'ar' ? 'arabic-text' : ''}
                      dir={language === 'ar' ? 'rtl' : 'ltr'}
                    >
                      {language === 'en' && book.bookTitleEn ? book.bookTitleEn : book.bookTitleAr}
                    </span>
                  </Link>
                </div>
              </div>
              <div className="flex items-center gap-3">
                <span className="px-3 py-1.5 text-sm font-semibold bg-gradient-to-r from-blue-600 to-purple-600 text-white rounded-full shadow-lg shadow-blue-500/20">
                  {book.totalResults.toLocaleString()} {language === 'ar' ? 'نتيجة' : 'results'}
                </span>
                <ChevronIcon expanded={expandedBooks.has(book.bookId)} className="w-5 h-5 text-gray-400" />
              </div>
            </button>

            {expandedBooks.has(book.bookId) && (
              <div className="border-t border-gray-200 dark:border-gray-700">
                {book.volumes.map((vol) => (
                  <div key={vol.volume} className="border-b border-gray-100 dark:border-gray-700/50 last:border-b-0">
                    <button
                      onClick={() => toggleVolume(book.bookId, vol.volume)}
                      className="w-full flex items-center justify-between px-5 py-3 pl-12 bg-gray-50/50 dark:bg-gray-700/30 hover:bg-gray-100/50 dark:hover:bg-gray-700/50 transition-colors"
                    >
                      <div className="flex items-center gap-2">
                        <ChevronIcon expanded={expandedVolumes.has(`${book.bookId}-${vol.volume}`)} className="w-4 h-4 text-gray-400" />
                        <span className="font-medium text-gray-700 dark:text-gray-300 flex items-center gap-2">
                          <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor" className="w-4 h-4 text-blue-500">
                            <path strokeLinecap="round" strokeLinejoin="round" d="M6 6.878V6a2.25 2.25 0 012.25-2.25h7.5A2.25 2.25 0 0118 6v.878m-12 0c.235-.083.487-.128.75-.128h10.5c.263 0 .515.045.75.128m-12 0A2.25 2.25 0 004.5 9v.878m13.5-3A2.25 2.25 0 0119.5 9v.878m0 0a2.246 2.246 0 00-.75-.128H5.25c-.263 0-.515.045-.75.128m15 0A2.25 2.25 0 0121 12v6a2.25 2.25 0 01-2.25 2.25H5.25A2.25 2.25 0 013 18v-6c0-.98.626-1.813 1.5-2.122" />
                          </svg>
                          {language === 'ar' ? `المجلد ${vol.volume}` : `Volume ${vol.volume}`}
                        </span>
                      </div>
                      <span className="text-sm text-gray-500 dark:text-gray-400 bg-gray-200 dark:bg-gray-600 px-2 py-0.5 rounded-full">
                        {vol.pages.reduce((sum, p) => sum + p.results.length, 0)}
                      </span>
                    </button>

                    {expandedVolumes.has(`${book.bookId}-${vol.volume}`) && (
                      <div className="divide-y divide-gray-100 dark:divide-gray-700/50">
                        {vol.pages.map((pageGroup) => (
                          <div key={pageGroup.page} className="pl-16 pr-5 py-4">
                            <div className="flex items-center justify-between mb-3">
                              <Link
                                href={`/book/${book.bookId}/${vol.volume}/${pageGroup.page}?highlight=${encodeURIComponent(query)}`}
                                className="text-sm font-semibold text-gray-600 dark:text-gray-400 hover:text-blue-600 dark:hover:text-blue-400 flex items-center gap-1.5 transition-colors"
                              >
                                <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor" className="w-4 h-4">
                                  <path strokeLinecap="round" strokeLinejoin="round" d="M19.5 14.25v-2.625a3.375 3.375 0 00-3.375-3.375h-1.5A1.125 1.125 0 0113.5 7.125v-1.5a3.375 3.375 0 00-3.375-3.375H8.25m0 12.75h7.5m-7.5 3H12M10.5 2.25H5.625c-.621 0-1.125.504-1.125 1.125v17.25c0 .621.504 1.125 1.125 1.125h12.75c.621 0 1.125-.504 1.125-1.125V11.25a9 9 0 00-9-9z" />
                                </svg>
                                {language === 'ar' ? `صفحة ${pageGroup.page}` : `Page ${pageGroup.page}`}
                              </Link>
                              <ShareButton
                                url={`/book/${book.bookId}/${vol.volume}/${pageGroup.page}?highlight=${encodeURIComponent(query)}`}
                                title={`${book.bookTitleAr} - ${language === 'ar' ? `صفحة ${pageGroup.page}` : `Page ${pageGroup.page}`}`}
                              />
                            </div>
                            {pageGroup.results.map((result, idx) => (
                              <Link
                                key={idx}
                                href={result.shareUrl}
                                className="block mt-2 p-4 bg-gray-50 dark:bg-gray-700/30 rounded-xl hover:bg-gray-100 dark:hover:bg-gray-700/50 border border-transparent hover:border-blue-200 dark:hover:border-blue-800 transition-all"
                              >
                                <p
                                  className="text-gray-900 dark:text-gray-100 arabic-text text-sm leading-relaxed"
                                  dir="rtl"
                                  dangerouslySetInnerHTML={{ __html: result.snippet }}
                                />
                              </Link>
                            ))}
                          </div>
                        ))}
                      </div>
                    )}
                  </div>
                ))}
              </div>
            )}
          </div>
        ))}
      </div>

      {/* Pagination */}
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
  );
}

function SearchPageContent() {
  const searchParams = useSearchParams();
  const router = useRouter();
  const initialQuery = searchParams.get('q') || '';
  const modeParam = searchParams.get('mode') as SearchMode | null;

  const [query, setQuery] = useState(initialQuery);
  const [searchMode, setSearchMode] = useState<SearchMode>(modeParam || 'exact');
  const [language, setLanguage] = useState<'ar' | 'en'>('ar');

  useEffect(() => {
    const saved = localStorage.getItem('hadith-lang');
    if (saved === 'en' || saved === 'ar') {
      setLanguage(saved);
    }
  }, []);

  // Sync with URL changes - always update state from URL params
  useEffect(() => {
    const urlQuery = searchParams.get('q') || '';
    const urlMode = (searchParams.get('mode') as SearchMode) || 'exact';
    setQuery(urlQuery);
    setSearchMode(urlMode);
  }, [searchParams]);

  const handleModeChange = (mode: SearchMode) => {
    setSearchMode(mode);
    const params = new URLSearchParams(searchParams.toString());
    params.set('mode', mode);
    router.push(`/search?${params.toString()}`);
  };

  const handleSearch = (newQuery: string) => {
    setQuery(newQuery);
    const params = new URLSearchParams();
    params.set('q', newQuery);
    params.set('mode', searchMode);
    router.push(`/search?${params.toString()}`);
  };

  return (
    <div className="min-h-screen bg-gradient-to-b from-gray-50 to-gray-100 dark:from-gray-900 dark:to-gray-950">
      <SearchHeader
        language={language}
        searchMode={searchMode}
        onModeChange={handleModeChange}
        query={query}
        onSearch={handleSearch}
      />
      <main className="max-w-5xl mx-auto px-4 py-6">
        <SearchResultsContent
          query={query}
          searchMode={searchMode}
          language={language}
        />
      </main>
    </div>
  );
}

function SearchLoadingFallback() {
  return (
    <div className="min-h-screen bg-gradient-to-b from-gray-50 to-gray-100 dark:from-gray-900 dark:to-gray-950">
      <header className="sticky top-0 z-10 bg-white/80 dark:bg-gray-800/80 backdrop-blur-lg border-b border-gray-200/50 dark:border-gray-700/50 shadow-sm">
        <div className="max-w-5xl mx-auto px-4 py-4">
          <div className="flex items-center justify-between mb-4">
            <Link
              href="/"
              className="inline-flex items-center gap-2 px-3 py-1.5 text-sm font-medium text-gray-600 dark:text-gray-400 bg-gray-100 dark:bg-gray-700/50 rounded-lg"
            >
              <svg
                xmlns="http://www.w3.org/2000/svg"
                fill="none"
                viewBox="0 0 24 24"
                strokeWidth={2}
                stroke="currentColor"
                className="w-4 h-4"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  d="M10.5 19.5L3 12m0 0l7.5-7.5M3 12h18"
                />
              </svg>
              Back to library
            </Link>
            <div className="flex items-center gap-2">
              <LogoIcon className="w-7 h-7" />
              <ThemeToggle />
            </div>
          </div>

          <h1 className="text-2xl font-bold bg-gradient-to-r from-blue-600 to-purple-600 dark:from-blue-400 dark:to-purple-400 bg-clip-text text-transparent mb-4 flex items-center gap-2">
            <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor" className="w-7 h-7 text-blue-600 dark:text-blue-400">
              <path strokeLinecap="round" strokeLinejoin="round" d="M21 21l-5.197-5.197m0 0A7.5 7.5 0 105.196 5.196a7.5 7.5 0 0010.607 10.607z" />
            </svg>
            Advanced Search
          </h1>

          {/* Search Input */}
          <div className="relative">
            <div className="absolute left-4 top-1/2 -translate-y-1/2 text-gray-400">
              <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={2} stroke="currentColor" className="w-5 h-5">
                <path strokeLinecap="round" strokeLinejoin="round" d="M21 21l-5.197-5.197m0 0A7.5 7.5 0 105.196 5.196a7.5 7.5 0 0010.607 10.607z" />
              </svg>
            </div>
            <input
              type="text"
              disabled
              placeholder="Search hadith... (Arabic or English)"
              className="w-full pl-12 pr-14 py-3.5 text-lg bg-gray-100 dark:bg-gray-700/50 border border-gray-200 dark:border-gray-600 rounded-xl dark:text-white"
              dir="auto"
            />
          </div>

          {/* Search Mode Options */}
          <div className="mt-4 flex flex-wrap items-center gap-3">
            <span className="text-sm font-medium text-gray-500 dark:text-gray-400">
              Search type:
            </span>
            <div className="flex items-center bg-gray-100 dark:bg-gray-700/50 rounded-lg p-1">
              <span className="px-4 py-2 text-sm font-medium rounded-md bg-white dark:bg-gray-600 text-blue-600 dark:text-blue-400 shadow-sm">
                Exact
              </span>
              <span className="px-4 py-2 text-sm font-medium rounded-md text-gray-600 dark:text-gray-400">
                Word
              </span>
              <span className="px-4 py-2 text-sm font-medium rounded-md text-gray-600 dark:text-gray-400">
                Root
              </span>
            </div>
          </div>
        </div>
      </header>
      <main className="max-w-5xl mx-auto px-4 py-6">
        <div className="flex flex-col items-center justify-center py-20 gap-4">
          <div className="relative">
            <div className="w-16 h-16 border-4 border-blue-200 dark:border-blue-900 rounded-full"></div>
            <div className="absolute top-0 w-16 h-16 border-4 border-blue-500 border-t-transparent rounded-full animate-spin"></div>
          </div>
          <p className="text-gray-500 dark:text-gray-400 animate-pulse">Loading...</p>
        </div>
      </main>
    </div>
  );
}

export default function SearchPage() {
  return (
    <Suspense fallback={<SearchLoadingFallback />}>
      <SearchPageContent />
    </Suspense>
  );
}
