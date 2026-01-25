'use client';

import { useState, useEffect, use } from 'react';
import Link from 'next/link';
import ShareButton from '@/components/ShareButton';
import ThemeToggle from '@/components/ThemeToggle';
import type { Book } from '@/lib/types';

interface Volume {
  volume: number;
  totalPages: number;
}

export default function BookPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = use(params);
  const [book, setBook] = useState<Book | null>(null);
  const [volumes, setVolumes] = useState<Volume[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [language, setLanguage] = useState<'ar' | 'en'>('ar');

  useEffect(() => {
    const saved = localStorage.getItem('hadith-lang');
    if (saved === 'en' || saved === 'ar') {
      setLanguage(saved);
    }
  }, []);

  useEffect(() => {
    async function fetchBook() {
      try {
        const res = await fetch(`/api/books/${id}`);
        if (!res.ok) throw new Error('Failed to fetch book');
        const data = await res.json();
        setBook(data.book);
        setVolumes(data.volumes);
      } catch (e) {
        setError(e instanceof Error ? e.message : 'Failed to load book');
      } finally {
        setLoading(false);
      }
    }
    fetchBook();
  }, [id]);

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-50 dark:bg-gray-900">
        <div className="animate-spin rounded-full h-12 w-12 border-4 border-blue-500 border-t-transparent"></div>
      </div>
    );
  }

  if (error || !book) {
    return (
      <div className="min-h-screen flex flex-col items-center justify-center bg-gray-50 dark:bg-gray-900">
        <p className="text-red-500 dark:text-red-400 mb-4">{error || 'Book not found'}</p>
        <Link href="/" className="text-blue-600 hover:underline">
          {language === 'ar' ? '← العودة للرئيسية' : '← Back to home'}
        </Link>
      </div>
    );
  }

  const title = language === 'en' && book.title_en ? book.title_en : book.title_ar;
  const author = language === 'en' && book.author_en ? book.author_en : book.author_ar;
  const isRTL = language === 'ar';
  const totalPagesInVolumes = volumes.reduce((sum, v) => sum + v.totalPages, 0);

  return (
    <div className="min-h-screen bg-gray-50 dark:bg-gray-900">
      {/* Header */}
      <header className="bg-white dark:bg-gray-800 border-b border-gray-200 dark:border-gray-700 shadow-sm">
        <div className="max-w-4xl mx-auto px-4 py-6">
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

          <div className="flex items-start justify-between gap-4">
            <div className="flex-1">
              <h1
                className={`text-2xl md:text-3xl font-bold text-gray-900 dark:text-white mb-2 ${
                  isRTL ? 'arabic-text' : ''
                }`}
                dir={isRTL ? 'rtl' : 'ltr'}
              >
                {title}
              </h1>
              {author && (
                <p
                  className={`text-lg text-gray-600 dark:text-gray-400 ${
                    isRTL ? 'arabic-text' : ''
                  }`}
                  dir={isRTL ? 'rtl' : 'ltr'}
                >
                  {author}
                </p>
              )}
              <div className="mt-3 flex flex-wrap items-center gap-3 text-sm text-gray-500 dark:text-gray-400">
                <span className="inline-flex items-center gap-1.5 px-2.5 py-1 bg-gray-100 dark:bg-gray-700 rounded-md">
                  <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor" className="w-4 h-4">
                    <path strokeLinecap="round" strokeLinejoin="round" d="M12 6.042A8.967 8.967 0 006 3.75c-1.052 0-2.062.18-3 .512v14.25A8.987 8.987 0 016 18c2.305 0 4.408.867 6 2.292m0-14.25a8.966 8.966 0 016-2.292c1.052 0 2.062.18 3 .512v14.25A8.987 8.987 0 0018 18a8.967 8.967 0 00-6 2.292m0-14.25v14.25" />
                  </svg>
                  {volumes.length} {language === 'ar' ? 'مجلد' : (volumes.length === 1 ? 'volume' : 'volumes')}
                </span>
                <span className="inline-flex items-center gap-1.5 px-2.5 py-1 bg-gray-100 dark:bg-gray-700 rounded-md">
                  <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor" className="w-4 h-4">
                    <path strokeLinecap="round" strokeLinejoin="round" d="M19.5 14.25v-2.625a3.375 3.375 0 00-3.375-3.375h-1.5A1.125 1.125 0 0113.5 7.125v-1.5a3.375 3.375 0 00-3.375-3.375H8.25m0 12.75h7.5m-7.5 3H12M10.5 2.25H5.625c-.621 0-1.125.504-1.125 1.125v17.25c0 .621.504 1.125 1.125 1.125h12.75c.621 0 1.125-.504 1.125-1.125V11.25a9 9 0 00-9-9z" />
                  </svg>
                  {totalPagesInVolumes.toLocaleString()} {language === 'ar' ? 'صفحة' : 'pages'}
                </span>
                {book.sect && (
                  <span
                    className={`px-2.5 py-1 rounded-md text-xs font-medium ${
                      book.sect === 'shia'
                        ? 'bg-green-100 text-green-800 dark:bg-green-900/50 dark:text-green-300'
                        : 'bg-blue-100 text-blue-800 dark:bg-blue-900/50 dark:text-blue-300'
                    }`}
                  >
                    {book.sect === 'shia' ? (language === 'ar' ? 'شيعة' : 'Shia') : (language === 'ar' ? 'سنة' : 'Sunni')}
                  </span>
                )}
              </div>
            </div>
            <div className="flex items-center gap-2">
              <ThemeToggle />
              <ShareButton url={`/book/${id}`} title={title} />
            </div>
          </div>
        </div>
      </header>

      {/* Volumes */}
      <main className="max-w-4xl mx-auto px-4 py-8">
        <div className="flex items-center justify-between mb-6">
          <h2 className="text-xl font-semibold text-gray-900 dark:text-white">
            {language === 'ar' ? 'المجلدات' : 'Volumes'}
          </h2>
          {volumes.length === 1 && (
            <Link
              href={`/book/${id}/1/1`}
              className="px-4 py-2 bg-blue-600 text-white text-sm font-medium rounded-lg hover:bg-blue-700 transition-colors"
            >
              {language === 'ar' ? 'ابدأ القراءة' : 'Start Reading'}
            </Link>
          )}
        </div>

        {/* Single volume - show prominent CTA */}
        {volumes.length === 1 ? (
          <div className="bg-white dark:bg-gray-800 rounded-xl border border-gray-200 dark:border-gray-700 p-6 text-center">
            <div className="w-20 h-20 mx-auto bg-gradient-to-br from-blue-500 to-blue-600 rounded-xl flex items-center justify-center mb-4">
              <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="white" className="w-10 h-10">
                <path strokeLinecap="round" strokeLinejoin="round" d="M12 6.042A8.967 8.967 0 006 3.75c-1.052 0-2.062.18-3 .512v14.25A8.987 8.987 0 016 18c2.305 0 4.408.867 6 2.292m0-14.25a8.966 8.966 0 016-2.292c1.052 0 2.062.18 3 .512v14.25A8.987 8.987 0 0018 18a8.967 8.967 0 00-6 2.292m0-14.25v14.25" />
              </svg>
            </div>
            <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-2">
              {language === 'ar' ? 'مجلد واحد' : 'Single Volume'}
            </h3>
            <p className="text-gray-600 dark:text-gray-400 mb-4">
              {volumes[0].totalPages.toLocaleString()} {language === 'ar' ? 'صفحة' : 'pages'}
            </p>
            <Link
              href={`/book/${id}/1/1`}
              className="inline-flex items-center gap-2 px-6 py-3 bg-blue-600 text-white font-medium rounded-lg hover:bg-blue-700 transition-colors"
            >
              {language === 'ar' ? 'ابدأ القراءة' : 'Start Reading'}
              <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={2} stroke="currentColor" className="w-4 h-4">
                <path strokeLinecap="round" strokeLinejoin="round" d="M13.5 4.5L21 12m0 0l-7.5 7.5M21 12H3" />
              </svg>
            </Link>
          </div>
        ) : (
          /* Multiple volumes - grid layout */
          <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 gap-3">
            {volumes.map((vol) => (
              <Link
                key={vol.volume}
                href={`/book/${id}/${vol.volume}/1`}
                className="group relative bg-white dark:bg-gray-800 rounded-xl border border-gray-200 dark:border-gray-700 hover:border-blue-500 dark:hover:border-blue-400 hover:shadow-lg transition-all overflow-hidden"
              >
                {/* Volume number badge */}
                <div className="aspect-[3/4] flex flex-col items-center justify-center p-4">
                  {/* Book spine decoration */}
                  <div className="absolute left-0 top-0 bottom-0 w-2 bg-gradient-to-b from-blue-500 to-blue-600 group-hover:from-blue-600 group-hover:to-blue-700 transition-colors"></div>

                  {/* Volume info */}
                  <div className="text-center">
                    <span className="text-xs uppercase tracking-wider text-gray-400 dark:text-gray-500">
                      {language === 'ar' ? 'المجلد' : 'Vol'}
                    </span>
                    <div className="text-4xl font-bold text-gray-900 dark:text-white mt-1 group-hover:text-blue-600 dark:group-hover:text-blue-400 transition-colors">
                      {vol.volume}
                    </div>
                  </div>

                  {/* Page count */}
                  <div className="mt-4 text-center">
                    <span className="text-sm text-gray-500 dark:text-gray-400">
                      {vol.totalPages.toLocaleString()}
                    </span>
                    <span className="block text-xs text-gray-400 dark:text-gray-500">
                      {language === 'ar' ? 'صفحة' : 'pages'}
                    </span>
                  </div>
                </div>

                {/* Hover indicator */}
                <div className="absolute bottom-0 left-0 right-0 h-1 bg-blue-500 transform scale-x-0 group-hover:scale-x-100 transition-transform origin-left"></div>
              </Link>
            ))}
          </div>
        )}

        {/* Quick navigation hint */}
        {volumes.length > 1 && (
          <p className="mt-6 text-center text-sm text-gray-500 dark:text-gray-400">
            {language === 'ar'
              ? 'اختر مجلداً للبدء في القراءة'
              : 'Select a volume to start reading'}
          </p>
        )}
      </main>
    </div>
  );
}
