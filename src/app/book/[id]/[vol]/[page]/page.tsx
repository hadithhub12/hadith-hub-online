'use client';

import { useState, useEffect, use } from 'react';
import Link from 'next/link';
import { useSearchParams } from 'next/navigation';
import PageReader from '@/components/PageReader';
import ShareButton from '@/components/ShareButton';
import type { Book, Page } from '@/lib/types';

interface Navigation {
  prev: { volume: number; page: number } | null;
  next: { volume: number; page: number } | null;
}

export default function ReaderPage({
  params,
}: {
  params: Promise<{ id: string; vol: string; page: string }>;
}) {
  const { id, vol, page: pageNum } = use(params);
  const searchParams = useSearchParams();
  const highlight = searchParams.get('highlight') || undefined;

  const [pageData, setPageData] = useState<Page | null>(null);
  const [book, setBook] = useState<Book | null>(null);
  const [navigation, setNavigation] = useState<Navigation | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [language, setLanguage] = useState<'ar' | 'en'>('ar');
  const [goToPage, setGoToPage] = useState('');

  useEffect(() => {
    const saved = localStorage.getItem('hadith-lang');
    if (saved === 'en' || saved === 'ar') {
      setLanguage(saved);
    }
  }, []);

  useEffect(() => {
    async function fetchPage() {
      setLoading(true);
      try {
        const res = await fetch(`/api/pages/${id}/${vol}/${pageNum}`);
        if (!res.ok) throw new Error('Failed to fetch page');
        const data = await res.json();
        setPageData(data.page);
        setBook(data.book);
        setNavigation(data.navigation);
      } catch (e) {
        setError(e instanceof Error ? e.message : 'Failed to load page');
      } finally {
        setLoading(false);
      }
    }
    fetchPage();
  }, [id, vol, pageNum]);

  const handleGoToPage = (e: React.FormEvent) => {
    e.preventDefault();
    const num = parseInt(goToPage, 10);
    if (!isNaN(num) && num > 0) {
      window.location.href = `/book/${id}/${vol}/${num}${highlight ? `?highlight=${encodeURIComponent(highlight)}` : ''}`;
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-50 dark:bg-gray-900">
        <div className="animate-spin rounded-full h-12 w-12 border-4 border-blue-500 border-t-transparent"></div>
      </div>
    );
  }

  if (error || !pageData || !book) {
    return (
      <div className="min-h-screen flex flex-col items-center justify-center bg-gray-50 dark:bg-gray-900">
        <p className="text-red-500 dark:text-red-400 mb-4">{error || 'Page not found'}</p>
        <Link href={`/book/${id}`} className="text-blue-600 hover:underline">
          {language === 'ar' ? '← العودة للكتاب' : '← Back to book'}
        </Link>
      </div>
    );
  }

  const title = language === 'en' && book.title_en ? book.title_en : book.title_ar;
  const currentUrl = `/book/${id}/${vol}/${pageNum}${highlight ? `?highlight=${encodeURIComponent(highlight)}` : ''}`;

  return (
    <div className="min-h-screen bg-gray-50 dark:bg-gray-900">
      {/* Header */}
      <header className="sticky top-0 z-10 bg-white dark:bg-gray-800 border-b border-gray-200 dark:border-gray-700 shadow-sm">
        <div className="max-w-4xl mx-auto px-4 py-3">
          {/* Breadcrumb */}
          <div className="flex items-center gap-2 text-sm text-gray-500 dark:text-gray-400 mb-2">
            <Link href="/" className="hover:text-blue-600">
              {language === 'ar' ? 'الرئيسية' : 'Home'}
            </Link>
            <span>/</span>
            <Link href={`/book/${id}`} className="hover:text-blue-600 truncate max-w-[200px]">
              {title}
            </Link>
            <span>/</span>
            <span>
              {language === 'ar' ? `المجلد ${vol}` : `Vol. ${vol}`}
            </span>
          </div>

          {/* Title and controls */}
          <div className="flex items-center justify-between gap-4">
            <h1 className="text-lg font-semibold text-gray-900 dark:text-white truncate">
              {language === 'ar' ? `صفحة ${pageNum}` : `Page ${pageNum}`}
            </h1>

            <div className="flex items-center gap-2">
              {/* Go to page */}
              <form onSubmit={handleGoToPage} className="hidden sm:flex items-center gap-1">
                <input
                  type="number"
                  value={goToPage}
                  onChange={(e) => setGoToPage(e.target.value)}
                  placeholder={language === 'ar' ? 'صفحة' : 'Page'}
                  className="w-20 px-2 py-1 text-sm border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 dark:bg-gray-700 dark:border-gray-600 dark:text-white"
                  min="1"
                />
                <button
                  type="submit"
                  className="px-2 py-1 text-sm bg-blue-600 text-white rounded-md hover:bg-blue-700"
                >
                  {language === 'ar' ? 'اذهب' : 'Go'}
                </button>
              </form>

              <ShareButton url={currentUrl} title={`${title} - ${language === 'ar' ? `صفحة ${pageNum}` : `Page ${pageNum}`}`} />
            </div>
          </div>

          {/* Navigation */}
          <div className="flex items-center justify-between mt-3">
            {navigation?.prev ? (
              <Link
                href={`/book/${id}/${navigation.prev.volume}/${navigation.prev.page}${highlight ? `?highlight=${encodeURIComponent(highlight)}` : ''}`}
                className="flex items-center gap-1 px-3 py-1.5 text-sm bg-gray-100 hover:bg-gray-200 dark:bg-gray-700 dark:hover:bg-gray-600 rounded-md"
              >
                <svg
                  xmlns="http://www.w3.org/2000/svg"
                  fill="none"
                  viewBox="0 0 24 24"
                  strokeWidth={2}
                  stroke="currentColor"
                  className="w-4 h-4"
                >
                  <path strokeLinecap="round" strokeLinejoin="round" d="M15.75 19.5L8.25 12l7.5-7.5" />
                </svg>
                {language === 'ar' ? 'السابق' : 'Previous'}
              </Link>
            ) : (
              <div></div>
            )}

            <span className="text-sm text-gray-500 dark:text-gray-400">
              {language === 'ar'
                ? `المجلد ${vol} - صفحة ${pageNum}`
                : `Vol. ${vol} - Page ${pageNum}`}
            </span>

            {navigation?.next ? (
              <Link
                href={`/book/${id}/${navigation.next.volume}/${navigation.next.page}${highlight ? `?highlight=${encodeURIComponent(highlight)}` : ''}`}
                className="flex items-center gap-1 px-3 py-1.5 text-sm bg-gray-100 hover:bg-gray-200 dark:bg-gray-700 dark:hover:bg-gray-600 rounded-md"
              >
                {language === 'ar' ? 'التالي' : 'Next'}
                <svg
                  xmlns="http://www.w3.org/2000/svg"
                  fill="none"
                  viewBox="0 0 24 24"
                  strokeWidth={2}
                  stroke="currentColor"
                  className="w-4 h-4"
                >
                  <path strokeLinecap="round" strokeLinejoin="round" d="M8.25 4.5l7.5 7.5-7.5 7.5" />
                </svg>
              </Link>
            ) : (
              <div></div>
            )}
          </div>
        </div>
      </header>

      {/* Page Content */}
      <main className="max-w-4xl mx-auto px-4 py-8">
        {highlight && (
          <div className="mb-4 p-3 bg-yellow-50 dark:bg-yellow-900/30 border border-yellow-200 dark:border-yellow-700 rounded-lg text-sm">
            <span className="text-yellow-800 dark:text-yellow-200">
              {language === 'ar'
                ? `تم تمييز: "${highlight}"`
                : `Highlighted: "${highlight}"`}
            </span>
            <Link
              href={`/book/${id}/${vol}/${pageNum}`}
              className="ml-2 text-blue-600 hover:underline"
            >
              {language === 'ar' ? 'إزالة التمييز' : 'Clear highlight'}
            </Link>
          </div>
        )}

        <div className="bg-white dark:bg-gray-800 rounded-lg shadow-sm border border-gray-200 dark:border-gray-700 p-6 md:p-8">
          <PageReader text={pageData.text} highlight={highlight} />
        </div>
      </main>

      {/* Bottom Navigation (Mobile) */}
      <div className="fixed bottom-0 left-0 right-0 bg-white dark:bg-gray-800 border-t border-gray-200 dark:border-gray-700 p-3 md:hidden">
        <div className="flex items-center justify-between max-w-4xl mx-auto">
          {navigation?.prev ? (
            <Link
              href={`/book/${id}/${navigation.prev.volume}/${navigation.prev.page}${highlight ? `?highlight=${encodeURIComponent(highlight)}` : ''}`}
              className="flex items-center gap-1 px-4 py-2 bg-gray-100 dark:bg-gray-700 rounded-md"
            >
              <svg
                xmlns="http://www.w3.org/2000/svg"
                fill="none"
                viewBox="0 0 24 24"
                strokeWidth={2}
                stroke="currentColor"
                className="w-5 h-5"
              >
                <path strokeLinecap="round" strokeLinejoin="round" d="M15.75 19.5L8.25 12l7.5-7.5" />
              </svg>
            </Link>
          ) : (
            <div className="w-12"></div>
          )}

          <span className="text-sm font-medium">
            {vol}:{pageNum}
          </span>

          {navigation?.next ? (
            <Link
              href={`/book/${id}/${navigation.next.volume}/${navigation.next.page}${highlight ? `?highlight=${encodeURIComponent(highlight)}` : ''}`}
              className="flex items-center gap-1 px-4 py-2 bg-gray-100 dark:bg-gray-700 rounded-md"
            >
              <svg
                xmlns="http://www.w3.org/2000/svg"
                fill="none"
                viewBox="0 0 24 24"
                strokeWidth={2}
                stroke="currentColor"
                className="w-5 h-5"
              >
                <path strokeLinecap="round" strokeLinejoin="round" d="M8.25 4.5l7.5 7.5-7.5 7.5" />
              </svg>
            </Link>
          ) : (
            <div className="w-12"></div>
          )}
        </div>
      </div>

      {/* Spacer for mobile bottom nav */}
      <div className="h-16 md:hidden"></div>
    </div>
  );
}
