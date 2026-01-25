'use client';

import { useState, useEffect, use } from 'react';
import Link from 'next/link';
import { useSearchParams } from 'next/navigation';
import PageReader from '@/components/PageReader';
import ShareButton from '@/components/ShareButton';
import ThemeToggle from '@/components/ThemeToggle';
import FontSelector, { useArabicFont } from '@/components/FontSelector';
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
  const [totalPages, setTotalPages] = useState<number>(0);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [language, setLanguage] = useState<'ar' | 'en'>('ar');
  const [goToPage, setGoToPage] = useState('');
  const { font } = useArabicFont();

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
        setTotalPages(data.totalPages || 0);
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
      <div className="min-h-screen flex flex-col items-center justify-center bg-gradient-to-b from-gray-50 to-gray-100 dark:from-gray-900 dark:to-gray-950 gap-4">
        <div className="relative">
          <div className="w-16 h-16 border-4 border-blue-200 dark:border-blue-900 rounded-full"></div>
          <div className="absolute top-0 w-16 h-16 border-4 border-blue-500 border-t-transparent rounded-full animate-spin"></div>
        </div>
        <p className="text-gray-500 dark:text-gray-400 animate-pulse">
          {language === 'ar' ? 'جاري تحميل الصفحة...' : 'Loading page...'}
        </p>
      </div>
    );
  }

  if (error || !pageData || !book) {
    return (
      <div className="min-h-screen flex flex-col items-center justify-center bg-gradient-to-b from-gray-50 to-gray-100 dark:from-gray-900 dark:to-gray-950 gap-4">
        <div className="inline-flex items-center justify-center w-16 h-16 rounded-full bg-red-100 dark:bg-red-900/30 mb-2">
          <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor" className="w-8 h-8 text-red-500">
            <path strokeLinecap="round" strokeLinejoin="round" d="M12 9v3.75m9-.75a9 9 0 11-18 0 9 9 0 0118 0zm-9 3.75h.008v.008H12v-.008z" />
          </svg>
        </div>
        <p className="text-red-500 dark:text-red-400 font-medium">{error || 'Page not found'}</p>
        <Link href={`/book/${id}`} className="inline-flex items-center gap-2 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors">
          <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={2} stroke="currentColor" className="w-4 h-4">
            <path strokeLinecap="round" strokeLinejoin="round" d="M10.5 19.5L3 12m0 0l7.5-7.5M3 12h18" />
          </svg>
          {language === 'ar' ? 'العودة للكتاب' : 'Back to book'}
        </Link>
      </div>
    );
  }

  const title = language === 'en' && book.title_en ? book.title_en : book.title_ar;
  const currentUrl = `/book/${id}/${vol}/${pageNum}${highlight ? `?highlight=${encodeURIComponent(highlight)}` : ''}`;

  return (
    <div className="min-h-screen bg-gradient-to-b from-gray-50 to-gray-100 dark:from-gray-900 dark:to-gray-950">
      {/* Header */}
      <header className="sticky top-0 z-10 bg-white/80 dark:bg-gray-800/80 backdrop-blur-lg border-b border-gray-200/50 dark:border-gray-700/50 shadow-sm">
        <div className="max-w-4xl mx-auto px-4 py-3">
          {/* Breadcrumb */}
          <div className="flex items-center gap-2 text-sm text-gray-500 dark:text-gray-400 mb-2">
            <Link href="/" className="hover:text-blue-600 dark:hover:text-blue-400 transition-colors flex items-center gap-1">
              <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor" className="w-4 h-4">
                <path strokeLinecap="round" strokeLinejoin="round" d="M2.25 12l8.954-8.955c.44-.439 1.152-.439 1.591 0L21.75 12M4.5 9.75v10.125c0 .621.504 1.125 1.125 1.125H9.75v-4.875c0-.621.504-1.125 1.125-1.125h2.25c.621 0 1.125.504 1.125 1.125V21h4.125c.621 0 1.125-.504 1.125-1.125V9.75M8.25 21h8.25" />
              </svg>
              {language === 'ar' ? 'الرئيسية' : 'Home'}
            </Link>
            <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={2} stroke="currentColor" className="w-3 h-3">
              <path strokeLinecap="round" strokeLinejoin="round" d="M8.25 4.5l7.5 7.5-7.5 7.5" />
            </svg>
            <Link href={`/book/${id}`} className="hover:text-blue-600 dark:hover:text-blue-400 transition-colors truncate max-w-[200px]">
              {title}
            </Link>
            <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={2} stroke="currentColor" className="w-3 h-3">
              <path strokeLinecap="round" strokeLinejoin="round" d="M8.25 4.5l7.5 7.5-7.5 7.5" />
            </svg>
            <span className="font-medium text-gray-700 dark:text-gray-300">
              {language === 'ar' ? `المجلد ${vol}` : `Vol. ${vol}`}
            </span>
          </div>

          {/* Title and controls */}
          <div className="flex items-center justify-between gap-4">
            <h1 className="text-lg font-semibold bg-gradient-to-r from-blue-600 to-purple-600 dark:from-blue-400 dark:to-purple-400 bg-clip-text text-transparent truncate flex items-center gap-2">
              <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor" className="w-5 h-5 text-blue-600 dark:text-blue-400">
                <path strokeLinecap="round" strokeLinejoin="round" d="M19.5 14.25v-2.625a3.375 3.375 0 00-3.375-3.375h-1.5A1.125 1.125 0 0113.5 7.125v-1.5a3.375 3.375 0 00-3.375-3.375H8.25m0 12.75h7.5m-7.5 3H12M10.5 2.25H5.625c-.621 0-1.125.504-1.125 1.125v17.25c0 .621.504 1.125 1.125 1.125h12.75c.621 0 1.125-.504 1.125-1.125V11.25a9 9 0 00-9-9z" />
              </svg>
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
                  className="w-20 px-3 py-1.5 text-sm bg-gray-50 dark:bg-gray-700/50 border border-gray-200 dark:border-gray-600 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500/50 focus:border-blue-500 dark:text-white transition-all"
                  min="1"
                />
                <button
                  type="submit"
                  className="px-3 py-1.5 text-sm font-medium bg-gradient-to-r from-blue-600 to-purple-600 hover:from-blue-700 hover:to-purple-700 text-white rounded-lg shadow-sm transition-all"
                >
                  {language === 'ar' ? 'اذهب' : 'Go'}
                </button>
              </form>

              <FontSelector language={language} />
              <ThemeToggle />
              <ShareButton url={currentUrl} title={`${title} - ${language === 'ar' ? `صفحة ${pageNum}` : `Page ${pageNum}`}`} />
            </div>
          </div>

          {/* Navigation */}
          <div className="flex items-center justify-between mt-3">
            {navigation?.prev ? (
              <Link
                href={`/book/${id}/${navigation.prev.volume}/${navigation.prev.page}${highlight ? `?highlight=${encodeURIComponent(highlight)}` : ''}`}
                className="flex items-center gap-1.5 px-4 py-2 text-sm font-medium bg-gray-100 hover:bg-blue-50 dark:bg-gray-700/50 dark:hover:bg-blue-900/30 text-gray-700 dark:text-gray-300 hover:text-blue-600 dark:hover:text-blue-400 rounded-lg transition-all"
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

            <span className="text-sm font-medium text-gray-500 dark:text-gray-400 px-3 py-1.5 bg-gray-100 dark:bg-gray-700/50 rounded-lg">
              {language === 'ar'
                ? `المجلد ${vol} - صفحة ${pageNum}${totalPages ? ` / ${totalPages}` : ''}`
                : `Vol. ${vol} - Page ${pageNum}${totalPages ? ` / ${totalPages}` : ''}`}
            </span>

            {navigation?.next ? (
              <Link
                href={`/book/${id}/${navigation.next.volume}/${navigation.next.page}${highlight ? `?highlight=${encodeURIComponent(highlight)}` : ''}`}
                className="flex items-center gap-1.5 px-4 py-2 text-sm font-medium bg-gray-100 hover:bg-blue-50 dark:bg-gray-700/50 dark:hover:bg-blue-900/30 text-gray-700 dark:text-gray-300 hover:text-blue-600 dark:hover:text-blue-400 rounded-lg transition-all"
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
          <div className="mb-4 p-4 bg-amber-50 dark:bg-amber-900/20 border border-amber-200 dark:border-amber-700/50 rounded-xl text-sm flex items-center justify-between">
            <span className="text-amber-800 dark:text-amber-200 flex items-center gap-2">
              <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor" className="w-5 h-5">
                <path strokeLinecap="round" strokeLinejoin="round" d="M9.53 16.122a3 3 0 00-5.78 1.128 2.25 2.25 0 01-2.4 2.245 4.5 4.5 0 008.4-2.245c0-.399-.078-.78-.22-1.128zm0 0a15.998 15.998 0 003.388-1.62m-5.043-.025a15.994 15.994 0 011.622-3.395m3.42 3.42a15.995 15.995 0 004.764-4.648l3.876-5.814a1.151 1.151 0 00-1.597-1.597L14.146 6.32a15.996 15.996 0 00-4.649 4.763m3.42 3.42a6.776 6.776 0 00-3.42-3.42" />
              </svg>
              {language === 'ar'
                ? `تم تمييز: "${highlight}"`
                : `Highlighted: "${highlight}"`}
            </span>
            <Link
              href={`/book/${id}/${vol}/${pageNum}`}
              className="px-3 py-1 text-sm font-medium text-amber-700 dark:text-amber-300 hover:text-amber-900 dark:hover:text-amber-100 bg-amber-100 dark:bg-amber-800/30 hover:bg-amber-200 dark:hover:bg-amber-800/50 rounded-lg transition-colors"
            >
              {language === 'ar' ? 'إزالة التمييز' : 'Clear'}
            </Link>
          </div>
        )}

        <div className="bg-white dark:bg-gray-800 rounded-2xl shadow-xl shadow-gray-500/5 border border-gray-200 dark:border-gray-700 p-6 md:p-10">
          <PageReader text={pageData.text} highlight={highlight} bookId={id} font={font} footnotes={pageData.footnotes} />
        </div>
      </main>

      {/* Bottom Navigation (Mobile) */}
      <div className="fixed bottom-0 left-0 right-0 bg-white/90 dark:bg-gray-800/90 backdrop-blur-lg border-t border-gray-200/50 dark:border-gray-700/50 p-4 md:hidden">
        <div className="flex items-center justify-between max-w-4xl mx-auto">
          {navigation?.prev ? (
            <Link
              href={`/book/${id}/${navigation.prev.volume}/${navigation.prev.page}${highlight ? `?highlight=${encodeURIComponent(highlight)}` : ''}`}
              className="flex items-center justify-center w-12 h-12 bg-gray-100 dark:bg-gray-700 hover:bg-blue-50 dark:hover:bg-blue-900/30 text-gray-700 dark:text-gray-300 hover:text-blue-600 dark:hover:text-blue-400 rounded-xl transition-all"
            >
              <svg
                xmlns="http://www.w3.org/2000/svg"
                fill="none"
                viewBox="0 0 24 24"
                strokeWidth={2}
                stroke="currentColor"
                className="w-6 h-6"
              >
                <path strokeLinecap="round" strokeLinejoin="round" d="M15.75 19.5L8.25 12l7.5-7.5" />
              </svg>
            </Link>
          ) : (
            <div className="w-12 h-12"></div>
          )}

          <span className="text-sm font-semibold text-gray-700 dark:text-gray-300 px-4 py-2 bg-gradient-to-r from-blue-50 to-purple-50 dark:from-blue-900/20 dark:to-purple-900/20 rounded-xl">
            {pageNum}{totalPages ? `/${totalPages}` : ''}
          </span>

          {navigation?.next ? (
            <Link
              href={`/book/${id}/${navigation.next.volume}/${navigation.next.page}${highlight ? `?highlight=${encodeURIComponent(highlight)}` : ''}`}
              className="flex items-center justify-center w-12 h-12 bg-gray-100 dark:bg-gray-700 hover:bg-blue-50 dark:hover:bg-blue-900/30 text-gray-700 dark:text-gray-300 hover:text-blue-600 dark:hover:text-blue-400 rounded-xl transition-all"
            >
              <svg
                xmlns="http://www.w3.org/2000/svg"
                fill="none"
                viewBox="0 0 24 24"
                strokeWidth={2}
                stroke="currentColor"
                className="w-6 h-6"
              >
                <path strokeLinecap="round" strokeLinejoin="round" d="M8.25 4.5l7.5 7.5-7.5 7.5" />
              </svg>
            </Link>
          ) : (
            <div className="w-12 h-12"></div>
          )}
        </div>
      </div>

      {/* Spacer for mobile bottom nav */}
      <div className="h-20 md:hidden"></div>
    </div>
  );
}
