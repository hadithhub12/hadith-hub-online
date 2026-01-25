'use client';

import { useState, useEffect, Suspense, useMemo } from 'react';
import { useSearchParams, useRouter } from 'next/navigation';
import Link from 'next/link';
import SearchBar from '@/components/SearchBar';
import ShareButton from '@/components/ShareButton';
import ThemeToggle from '@/components/ThemeToggle';
import type { SearchResult } from '@/lib/types';

type SearchMode = 'word' | 'root' | 'exact';

const RESULTS_PER_PAGE = 50;

function ChevronIcon({ expanded, className = 'w-5 h-5' }: { expanded: boolean; className?: string }) {
  return (
    <svg
      xmlns="http://www.w3.org/2000/svg"
      fill="none"
      viewBox="0 0 24 24"
      strokeWidth={2}
      stroke="currentColor"
      className={`${className} transition-transform ${expanded ? 'rotate-180' : ''}`}
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

function SearchContent() {
  const searchParams = useSearchParams();
  const router = useRouter();
  const query = searchParams.get('q') || '';
  const modeParam = searchParams.get('mode') as SearchMode | null;

  const [results, setResults] = useState<SearchResult[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [total, setTotal] = useState(0);
  const [searchTerms, setSearchTerms] = useState<string[]>([]);
  const [wasTransliterated, setWasTransliterated] = useState(false);
  const [language, setLanguage] = useState<'ar' | 'en'>('ar');
  const [searchMode, setSearchMode] = useState<SearchMode>(modeParam || 'word');
  const [currentPage, setCurrentPage] = useState(1);
  const [expandedBooks, setExpandedBooks] = useState<Set<string>>(new Set());
  const [expandedVolumes, setExpandedVolumes] = useState<Set<string>>(new Set());

  useEffect(() => {
    const saved = localStorage.getItem('hadith-lang');
    if (saved === 'en' || saved === 'ar') {
      setLanguage(saved);
    }
  }, []);

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
        setResults(data.results);
        setTotal(data.total);
        setSearchTerms(data.searchTerms || []);
        setWasTransliterated(data.transliterated || false);

        // Auto-expand first book if there are results
        if (data.results.length > 0) {
          const firstBookId = data.results[0].bookId;
          setExpandedBooks(new Set([firstBookId]));
        }
      } catch (e) {
        setError(e instanceof Error ? e.message : 'Search failed');
      } finally {
        setLoading(false);
      }
    }

    performSearch();
  }, [query, language, searchMode]);

  // Group results hierarchically
  const groupedResults = useMemo(() => groupResultsByBookVolumePage(results), [results]);

  // Pagination for books
  const totalPages = Math.ceil(groupedResults.length / RESULTS_PER_PAGE);
  const paginatedBooks = groupedResults.slice(
    (currentPage - 1) * RESULTS_PER_PAGE,
    currentPage * RESULTS_PER_PAGE
  );

  const handleModeChange = (mode: SearchMode) => {
    setSearchMode(mode);
    // Update URL with new mode
    const params = new URLSearchParams(searchParams.toString());
    params.set('mode', mode);
    router.push(`/search?${params.toString()}`);
  };

  const toggleBook = (bookId: string) => {
    setExpandedBooks(prev => {
      const next = new Set(prev);
      if (next.has(bookId)) {
        next.delete(bookId);
      } else {
        next.add(bookId);
      }
      return next;
    });
  };

  const toggleVolume = (bookId: string, volume: number) => {
    const key = `${bookId}-${volume}`;
    setExpandedVolumes(prev => {
      const next = new Set(prev);
      if (next.has(key)) {
        next.delete(key);
      } else {
        next.add(key);
      }
      return next;
    });
  };

  const expandAll = () => {
    const allBooks = new Set(groupedResults.map(g => g.bookId));
    const allVolumes = new Set<string>();
    for (const book of groupedResults) {
      for (const vol of book.volumes) {
        allVolumes.add(`${book.bookId}-${vol.volume}`);
      }
    }
    setExpandedBooks(allBooks);
    setExpandedVolumes(allVolumes);
  };

  const collapseAll = () => {
    setExpandedBooks(new Set());
    setExpandedVolumes(new Set());
  };

  return (
    <div className="min-h-screen bg-gray-50 dark:bg-gray-900">
      {/* Header */}
      <header className="sticky top-0 z-10 bg-white dark:bg-gray-800 border-b border-gray-200 dark:border-gray-700 shadow-sm">
        <div className="max-w-5xl mx-auto px-4 py-4">
          <div className="flex items-center justify-between mb-4">
            <Link
              href="/"
              className="inline-flex items-center text-sm text-blue-600 hover:text-blue-800 dark:text-blue-400 dark:hover:text-blue-300"
            >
              <svg
                xmlns="http://www.w3.org/2000/svg"
                fill="none"
                viewBox="0 0 24 24"
                strokeWidth={2}
                stroke="currentColor"
                className="w-4 h-4 mr-1"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  d="M10.5 19.5L3 12m0 0l7.5-7.5M3 12h18"
                />
              </svg>
              {language === 'ar' ? 'العودة للرئيسية' : 'Back to library'}
            </Link>
            <ThemeToggle />
          </div>

          <h1 className="text-2xl font-bold text-gray-900 dark:text-white mb-4">
            {language === 'ar' ? 'البحث المتقدم' : 'Advanced Search'}
          </h1>

          {/* Search Mode Options - BEFORE the search bar */}
          <div className="mb-4 flex flex-wrap items-center gap-4">
            <span className="text-sm font-medium text-gray-700 dark:text-gray-300">
              {language === 'ar' ? 'نوع البحث:' : 'Search type:'}
            </span>
            <div className="flex flex-wrap gap-2">
              {([
                { mode: 'word' as SearchMode, labelAr: 'كلمة', labelEn: 'Word', descAr: 'البحث عن الكلمة', descEn: 'Match any word' },
                { mode: 'root' as SearchMode, labelAr: 'جذر', labelEn: 'Root', descAr: 'البحث عن الجذر', descEn: 'Match word roots' },
                { mode: 'exact' as SearchMode, labelAr: 'عبارة', labelEn: 'Exact', descAr: 'البحث عن العبارة بالضبط', descEn: 'Match exact phrase' },
              ]).map(({ mode, labelAr, labelEn, descAr, descEn }) => (
                <button
                  key={mode}
                  onClick={() => handleModeChange(mode)}
                  title={language === 'ar' ? descAr : descEn}
                  className={`px-4 py-2 text-sm font-medium rounded-lg transition-colors ${
                    searchMode === mode
                      ? 'bg-blue-600 text-white'
                      : 'bg-gray-100 dark:bg-gray-700 text-gray-700 dark:text-gray-300 hover:bg-gray-200 dark:hover:bg-gray-600'
                  }`}
                >
                  {language === 'ar' ? labelAr : labelEn}
                </button>
              ))}
            </div>
          </div>

          <SearchBar
            initialQuery={query}
            placeholder={
              language === 'ar'
                ? 'ابحث في الحديث... (عربي أو إنجليزي)'
                : 'Search hadith... (Arabic or English)'
            }
          />

          {query && !loading && (
            <div className="mt-4 flex flex-wrap items-center justify-between gap-4">
              <div className="text-sm text-gray-500 dark:text-gray-400">
                {wasTransliterated && searchTerms.length > 0 && (
                  <p className="mb-1">
                    {language === 'ar' ? 'تم البحث عن:' : 'Searched for:'}{' '}
                    <span className="arabic-text font-medium" dir="rtl">
                      {searchTerms.join(' ، ')}
                    </span>
                  </p>
                )}
                <p>
                  {total === 0
                    ? language === 'ar'
                      ? 'لا توجد نتائج'
                      : 'No results found'
                    : language === 'ar'
                    ? `${total} نتيجة في ${groupedResults.length} كتاب`
                    : `${total} results in ${groupedResults.length} books`}
                </p>
              </div>

              {results.length > 0 && (
                <div className="flex gap-2">
                  <button
                    onClick={expandAll}
                    className="text-sm text-blue-600 hover:text-blue-800 dark:text-blue-400"
                  >
                    {language === 'ar' ? 'توسيع الكل' : 'Expand all'}
                  </button>
                  <span className="text-gray-300 dark:text-gray-600">|</span>
                  <button
                    onClick={collapseAll}
                    className="text-sm text-blue-600 hover:text-blue-800 dark:text-blue-400"
                  >
                    {language === 'ar' ? 'طي الكل' : 'Collapse all'}
                  </button>
                </div>
              )}
            </div>
          )}
        </div>
      </header>

      {/* Results */}
      <main className="max-w-5xl mx-auto px-4 py-6">
        {loading ? (
          <div className="flex items-center justify-center py-20">
            <div className="animate-spin rounded-full h-12 w-12 border-4 border-blue-500 border-t-transparent"></div>
          </div>
        ) : error ? (
          <div className="text-center py-20">
            <p className="text-red-500 dark:text-red-400">{error}</p>
          </div>
        ) : !query ? (
          <div className="text-center py-20 text-gray-500 dark:text-gray-400">
            <p className="text-lg">
              {language === 'ar'
                ? 'أدخل كلمة للبحث في مكتبة الحديث'
                : 'Enter a term to search the hadith library'}
            </p>
            <p className="mt-2 text-sm">
              {language === 'ar'
                ? 'يمكنك البحث بالعربية أو الإنجليزية'
                : 'You can search in Arabic or English (transliteration)'}
            </p>
            <div className="mt-6 p-4 bg-white dark:bg-gray-800 rounded-lg border border-gray-200 dark:border-gray-700 max-w-md mx-auto text-left">
              <h3 className="font-semibold text-gray-900 dark:text-white mb-2">
                {language === 'ar' ? 'أنواع البحث:' : 'Search Types:'}
              </h3>
              <ul className="space-y-2 text-sm">
                <li>
                  <strong>{language === 'ar' ? 'كلمة:' : 'Word:'}</strong>{' '}
                  {language === 'ar' ? 'يبحث عن أي كلمة من الكلمات المدخلة' : 'Matches any of the entered words'}
                </li>
                <li>
                  <strong>{language === 'ar' ? 'جذر:' : 'Root:'}</strong>{' '}
                  {language === 'ar' ? 'يبحث عن الكلمات المشتقة من نفس الجذر' : 'Matches words derived from the same root'}
                </li>
                <li>
                  <strong>{language === 'ar' ? 'عبارة:' : 'Exact:'}</strong>{' '}
                  {language === 'ar' ? 'يبحث عن العبارة بالضبط كما هي' : 'Matches the exact phrase as entered'}
                </li>
              </ul>
            </div>
          </div>
        ) : results.length === 0 ? (
          <div className="text-center py-20 text-gray-500 dark:text-gray-400">
            <p>
              {language === 'ar'
                ? `لم يتم العثور على نتائج لـ "${query}"`
                : `No results found for "${query}"`}
            </p>
            <p className="mt-2 text-sm">
              {language === 'ar'
                ? 'جرب كلمات أخرى أو نوع بحث مختلف'
                : 'Try different keywords or search type'}
            </p>
          </div>
        ) : (
          <>
            <div className="space-y-4">
              {paginatedBooks.map((book) => (
                <div
                  key={book.bookId}
                  className="bg-white dark:bg-gray-800 rounded-lg border border-gray-200 dark:border-gray-700 overflow-hidden"
                >
                  {/* Book header - collapsible */}
                  <button
                    onClick={() => toggleBook(book.bookId)}
                    className="w-full flex items-center justify-between px-4 py-3 bg-gradient-to-r from-blue-50 to-transparent dark:from-blue-900/20 dark:to-transparent hover:from-blue-100 dark:hover:from-blue-900/30 transition-colors"
                  >
                    <div className="flex items-center gap-3">
                      <ChevronIcon expanded={expandedBooks.has(book.bookId)} />
                      <div className="text-left">
                        <Link
                          href={`/book/${book.bookId}`}
                          onClick={(e) => e.stopPropagation()}
                          className="text-lg font-semibold text-blue-600 hover:text-blue-800 dark:text-blue-400 dark:hover:text-blue-300"
                        >
                          <span
                            className={language === 'ar' ? 'arabic-text' : ''}
                            dir={language === 'ar' ? 'rtl' : 'ltr'}
                          >
                            {language === 'en' && book.bookTitleEn
                              ? book.bookTitleEn
                              : book.bookTitleAr}
                          </span>
                        </Link>
                      </div>
                    </div>
                    <span className="px-2.5 py-1 text-sm font-medium bg-blue-100 dark:bg-blue-900/50 text-blue-800 dark:text-blue-200 rounded-full">
                      {book.totalResults} {language === 'ar' ? 'نتيجة' : 'results'}
                    </span>
                  </button>

                  {/* Book content - volumes */}
                  {expandedBooks.has(book.bookId) && (
                    <div className="border-t border-gray-200 dark:border-gray-700">
                      {book.volumes.map((vol) => (
                        <div key={vol.volume} className="border-b border-gray-100 dark:border-gray-700 last:border-b-0">
                          {/* Volume header - collapsible */}
                          <button
                            onClick={() => toggleVolume(book.bookId, vol.volume)}
                            className="w-full flex items-center justify-between px-4 py-2 pl-10 bg-gray-50 dark:bg-gray-700/50 hover:bg-gray-100 dark:hover:bg-gray-700 transition-colors"
                          >
                            <div className="flex items-center gap-2">
                              <ChevronIcon expanded={expandedVolumes.has(`${book.bookId}-${vol.volume}`)} className="w-4 h-4" />
                              <span className="font-medium text-gray-700 dark:text-gray-300">
                                {language === 'ar' ? `المجلد ${vol.volume}` : `Volume ${vol.volume}`}
                              </span>
                            </div>
                            <span className="text-sm text-gray-500 dark:text-gray-400">
                              {vol.pages.reduce((sum, p) => sum + p.results.length, 0)} {language === 'ar' ? 'نتيجة' : 'results'}
                            </span>
                          </button>

                          {/* Volume content - pages */}
                          {expandedVolumes.has(`${book.bookId}-${vol.volume}`) && (
                            <div className="divide-y divide-gray-100 dark:divide-gray-700">
                              {vol.pages.map((pageGroup) => (
                                <div key={pageGroup.page} className="pl-14 pr-4 py-3">
                                  <div className="flex items-center justify-between mb-2">
                                    <Link
                                      href={`/book/${book.bookId}/${vol.volume}/${pageGroup.page}?highlight=${encodeURIComponent(query)}`}
                                      className="text-sm font-medium text-gray-600 dark:text-gray-400 hover:text-blue-600 dark:hover:text-blue-400"
                                    >
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
                                      className="block mt-2 p-3 bg-gray-50 dark:bg-gray-700/30 rounded-lg hover:bg-gray-100 dark:hover:bg-gray-700/50 transition-colors"
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
        )}
      </main>
    </div>
  );
}

export default function SearchPage() {
  return (
    <Suspense
      fallback={
        <div className="min-h-screen flex items-center justify-center bg-gray-50 dark:bg-gray-900">
          <div className="animate-spin rounded-full h-12 w-12 border-4 border-blue-500 border-t-transparent"></div>
        </div>
      }
    >
      <SearchContent />
    </Suspense>
  );
}
