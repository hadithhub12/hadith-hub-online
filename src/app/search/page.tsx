'use client';

import { useState, useEffect, Suspense } from 'react';
import { useSearchParams } from 'next/navigation';
import Link from 'next/link';
import SearchBar from '@/components/SearchBar';
import ShareButton from '@/components/ShareButton';
import type { SearchResult } from '@/lib/types';

function SearchContent() {
  const searchParams = useSearchParams();
  const query = searchParams.get('q') || '';

  const [results, setResults] = useState<SearchResult[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [total, setTotal] = useState(0);
  const [searchTerms, setSearchTerms] = useState<string[]>([]);
  const [wasTransliterated, setWasTransliterated] = useState(false);
  const [language, setLanguage] = useState<'ar' | 'en'>('ar');

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
      try {
        const res = await fetch(`/api/search?q=${encodeURIComponent(query)}&lang=${language}`);
        if (!res.ok) throw new Error('Search failed');
        const data = await res.json();
        setResults(data.results);
        setTotal(data.total);
        setSearchTerms(data.searchTerms || []);
        setWasTransliterated(data.transliterated || false);
      } catch (e) {
        setError(e instanceof Error ? e.message : 'Search failed');
      } finally {
        setLoading(false);
      }
    }

    performSearch();
  }, [query, language]);

  // Group results by book
  const groupedResults = results.reduce((acc, result) => {
    const key = result.bookId;
    if (!acc[key]) {
      acc[key] = {
        bookId: result.bookId,
        bookTitleAr: result.bookTitleAr,
        bookTitleEn: result.bookTitleEn,
        results: [],
      };
    }
    acc[key].results.push(result);
    return acc;
  }, {} as Record<string, { bookId: string; bookTitleAr: string; bookTitleEn: string; results: SearchResult[] }>);

  const bookGroups = Object.values(groupedResults);

  return (
    <div className="min-h-screen bg-gray-50 dark:bg-gray-900">
      {/* Header */}
      <header className="sticky top-0 z-10 bg-white dark:bg-gray-800 border-b border-gray-200 dark:border-gray-700 shadow-sm">
        <div className="max-w-4xl mx-auto px-4 py-4">
          <Link
            href="/"
            className="inline-flex items-center text-sm text-blue-600 hover:text-blue-800 dark:text-blue-400 dark:hover:text-blue-300 mb-4"
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

          <h1 className="text-2xl font-bold text-gray-900 dark:text-white mb-4">
            {language === 'ar' ? 'البحث' : 'Search'}
          </h1>

          <SearchBar
            initialQuery={query}
            placeholder={
              language === 'ar'
                ? 'ابحث في الحديث... (عربي أو إنجليزي)'
                : 'Search hadith... (Arabic or English)'
            }
          />

          {query && !loading && (
            <div className="mt-3 text-sm text-gray-500 dark:text-gray-400">
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
                  ? `${total} نتيجة في ${bookGroups.length} كتاب`
                  : `${total} results in ${bookGroups.length} books`}
              </p>
            </div>
          )}
        </div>
      </header>

      {/* Results */}
      <main className="max-w-4xl mx-auto px-4 py-6">
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
                ? 'جرب كلمات أخرى أو تهجئة مختلفة'
                : 'Try different keywords or spelling'}
            </p>
          </div>
        ) : (
          <div className="space-y-6">
            {bookGroups.map((group) => (
              <div
                key={group.bookId}
                className="bg-white dark:bg-gray-800 rounded-lg border border-gray-200 dark:border-gray-700 overflow-hidden"
              >
                {/* Book header */}
                <div className="bg-gray-50 dark:bg-gray-700/50 px-4 py-3 border-b border-gray-200 dark:border-gray-600">
                  <Link
                    href={`/book/${group.bookId}`}
                    className="text-lg font-semibold text-blue-600 hover:text-blue-800 dark:text-blue-400 dark:hover:text-blue-300"
                  >
                    <span
                      className={language === 'ar' ? 'arabic-text' : ''}
                      dir={language === 'ar' ? 'rtl' : 'ltr'}
                    >
                      {language === 'en' && group.bookTitleEn
                        ? group.bookTitleEn
                        : group.bookTitleAr}
                    </span>
                  </Link>
                  <span className="ml-2 text-sm text-gray-500 dark:text-gray-400">
                    ({group.results.length}{' '}
                    {language === 'ar' ? 'نتيجة' : 'results'})
                  </span>
                </div>

                {/* Results in book */}
                <div className="divide-y divide-gray-100 dark:divide-gray-700">
                  {group.results.map((result, idx) => (
                    <div
                      key={`${result.bookId}-${result.volume}-${result.page}-${idx}`}
                      className="p-4 hover:bg-gray-50 dark:hover:bg-gray-700/30"
                    >
                      <div className="flex items-start justify-between gap-4">
                        <Link
                          href={result.shareUrl}
                          className="flex-1 group"
                        >
                          <p className="text-sm text-gray-500 dark:text-gray-400 mb-1">
                            {language === 'ar'
                              ? `المجلد ${result.volume} - صفحة ${result.page}`
                              : `Vol. ${result.volume} - Page ${result.page}`}
                          </p>
                          <p
                            className="text-gray-900 dark:text-gray-100 arabic-text group-hover:text-blue-600 dark:group-hover:text-blue-400"
                            dir="rtl"
                            dangerouslySetInnerHTML={{ __html: result.snippet }}
                          />
                        </Link>
                        <ShareButton
                          url={result.shareUrl}
                          title={`${group.bookTitleAr} - ${language === 'ar' ? `صفحة ${result.page}` : `Page ${result.page}`}`}
                          className="flex-shrink-0"
                        />
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            ))}
          </div>
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
