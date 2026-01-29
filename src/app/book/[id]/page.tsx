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

// Logo Icon
function LogoIcon({ className = 'w-8 h-8' }: { className?: string }) {
  return (
    <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 48 48" className={className}>
      <defs>
        <linearGradient id="bookLogoGradient" x1="0%" y1="0%" x2="100%" y2="100%">
          <stop offset="0%" stopColor="#3b82f6" />
          <stop offset="100%" stopColor="#8b5cf6" />
        </linearGradient>
      </defs>
      <circle cx="24" cy="24" r="22" fill="url(#bookLogoGradient)" />
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
      <div className="min-h-screen flex flex-col items-center justify-center bg-gradient-to-b from-gray-50 to-gray-100 dark:from-gray-900 dark:to-gray-950 gap-4">
        <div className="relative">
          <div className="w-16 h-16 border-4 border-blue-200 dark:border-blue-900 rounded-full"></div>
          <div className="absolute top-0 w-16 h-16 border-4 border-blue-500 border-t-transparent rounded-full animate-spin"></div>
        </div>
        <p className="text-gray-500 dark:text-gray-400 animate-pulse">
          {language === 'ar' ? 'جاري تحميل الكتاب...' : 'Loading book...'}
        </p>
      </div>
    );
  }

  if (error || !book) {
    return (
      <div className="min-h-screen flex flex-col items-center justify-center bg-gradient-to-b from-gray-50 to-gray-100 dark:from-gray-900 dark:to-gray-950 gap-4">
        <div className="inline-flex items-center justify-center w-16 h-16 rounded-full bg-red-100 dark:bg-red-900/30 mb-2">
          <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor" className="w-8 h-8 text-red-500">
            <path strokeLinecap="round" strokeLinejoin="round" d="M12 9v3.75m9-.75a9 9 0 11-18 0 9 9 0 0118 0zm-9 3.75h.008v.008H12v-.008z" />
          </svg>
        </div>
        <p className="text-red-500 dark:text-red-400 font-medium">{error || 'Book not found'}</p>
        <Link href="/" className="inline-flex items-center gap-2 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors">
          <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={2} stroke="currentColor" className="w-4 h-4">
            <path strokeLinecap="round" strokeLinejoin="round" d="M10.5 19.5L3 12m0 0l7.5-7.5M3 12h18" />
          </svg>
          {language === 'ar' ? 'العودة للرئيسية' : 'Back to home'}
        </Link>
      </div>
    );
  }

  const title = language === 'en' && book.title_en ? book.title_en : book.title_ar;
  const author = language === 'en' && book.author_en ? book.author_en : book.author_ar;
  const isRTL = language === 'ar';
  const totalPagesInVolumes = volumes.reduce((sum, v) => sum + v.totalPages, 0);

  return (
    <div className="min-h-screen bg-gradient-to-b from-gray-50 to-gray-100 dark:from-gray-900 dark:to-gray-950">
      {/* Header */}
      <header className="bg-white/80 dark:bg-gray-800/80 backdrop-blur-lg border-b border-gray-200/50 dark:border-gray-700/50 shadow-sm">
        <div className="max-w-4xl mx-auto px-4 py-6">
          {/* Top bar */}
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
              <Link
                href="/help"
                className="p-2 text-gray-500 dark:text-gray-400 hover:text-blue-600 dark:hover:text-blue-400 transition-colors"
                title={language === 'ar' ? 'المساعدة' : 'Help'}
              >
                <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor" className="w-5 h-5">
                  <path strokeLinecap="round" strokeLinejoin="round" d="M9.879 7.519c1.171-1.025 3.071-1.025 4.242 0 1.172 1.025 1.172 2.687 0 3.712-.203.179-.43.326-.67.442-.745.361-1.45.999-1.45 1.827v.75M21 12a9 9 0 11-18 0 9 9 0 0118 0zm-9 5.25h.008v.008H12v-.008z" />
                </svg>
              </Link>
              <LogoIcon className="w-7 h-7" />
              <ThemeToggle />
              <ShareButton url={`/book/${id}`} title={title} />
            </div>
          </div>

          <div className="flex items-start gap-5">
            {/* Book Icon */}
            <div className="hidden sm:flex w-20 h-20 flex-shrink-0 bg-gradient-to-br from-blue-500 to-purple-600 rounded-2xl items-center justify-center shadow-xl shadow-blue-500/20">
              <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="white" className="w-10 h-10">
                <path strokeLinecap="round" strokeLinejoin="round" d="M12 6.042A8.967 8.967 0 006 3.75c-1.052 0-2.062.18-3 .512v14.25A8.987 8.987 0 016 18c2.305 0 4.408.867 6 2.292m0-14.25a8.966 8.966 0 016-2.292c1.052 0 2.062.18 3 .512v14.25A8.987 8.987 0 0018 18a8.967 8.967 0 00-6 2.292m0-14.25v14.25" />
              </svg>
            </div>
            <div className="flex-1">
              <h1
                className={`text-2xl md:text-3xl font-bold bg-gradient-to-r from-gray-900 to-gray-700 dark:from-white dark:to-gray-300 bg-clip-text text-transparent mb-2 ${
                  isRTL ? 'arabic-text' : ''
                }`}
                dir={isRTL ? 'rtl' : 'ltr'}
              >
                {title}
              </h1>
              {author && (
                <p
                  className={`text-lg text-gray-600 dark:text-gray-400 flex items-center gap-2 ${
                    isRTL ? 'arabic-text' : ''
                  }`}
                  dir={isRTL ? 'rtl' : 'ltr'}
                >
                  <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor" className="w-4 h-4 flex-shrink-0">
                    <path strokeLinecap="round" strokeLinejoin="round" d="M15.75 6a3.75 3.75 0 11-7.5 0 3.75 3.75 0 017.5 0zM4.501 20.118a7.5 7.5 0 0114.998 0A17.933 17.933 0 0112 21.75c-2.676 0-5.216-.584-7.499-1.632z" />
                  </svg>
                  {author}
                </p>
              )}
              <div className="mt-4 flex flex-wrap items-center gap-2">
                <span className="inline-flex items-center gap-1.5 px-3 py-1.5 bg-blue-50 dark:bg-blue-900/30 text-blue-700 dark:text-blue-300 rounded-lg text-sm font-medium">
                  <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor" className="w-4 h-4">
                    <path strokeLinecap="round" strokeLinejoin="round" d="M6 6.878V6a2.25 2.25 0 012.25-2.25h7.5A2.25 2.25 0 0118 6v.878m-12 0c.235-.083.487-.128.75-.128h10.5c.263 0 .515.045.75.128m-12 0A2.25 2.25 0 004.5 9v.878m13.5-3A2.25 2.25 0 0119.5 9v.878m0 0a2.246 2.246 0 00-.75-.128H5.25c-.263 0-.515.045-.75.128m15 0A2.25 2.25 0 0121 12v6a2.25 2.25 0 01-2.25 2.25H5.25A2.25 2.25 0 013 18v-6c0-.98.626-1.813 1.5-2.122" />
                  </svg>
                  {volumes.length} {language === 'ar' ? 'مجلد' : (volumes.length === 1 ? 'volume' : 'volumes')}
                </span>
                <span className="inline-flex items-center gap-1.5 px-3 py-1.5 bg-purple-50 dark:bg-purple-900/30 text-purple-700 dark:text-purple-300 rounded-lg text-sm font-medium">
                  <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor" className="w-4 h-4">
                    <path strokeLinecap="round" strokeLinejoin="round" d="M19.5 14.25v-2.625a3.375 3.375 0 00-3.375-3.375h-1.5A1.125 1.125 0 0113.5 7.125v-1.5a3.375 3.375 0 00-3.375-3.375H8.25m0 12.75h7.5m-7.5 3H12M10.5 2.25H5.625c-.621 0-1.125.504-1.125 1.125v17.25c0 .621.504 1.125 1.125 1.125h12.75c.621 0 1.125-.504 1.125-1.125V11.25a9 9 0 00-9-9z" />
                  </svg>
                  {totalPagesInVolumes.toLocaleString()} {language === 'ar' ? 'صفحة' : 'pages'}
                </span>
                {book.sect && (
                  <span
                    className={`inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-sm font-medium ${
                      book.sect === 'shia'
                        ? 'bg-emerald-50 text-emerald-700 dark:bg-emerald-900/30 dark:text-emerald-300'
                        : 'bg-sky-50 text-sky-700 dark:bg-sky-900/30 dark:text-sky-300'
                    }`}
                  >
                    {book.sect === 'shia' ? (language === 'ar' ? 'شيعة' : 'Shia') : (language === 'ar' ? 'سنة' : 'Sunni')}
                  </span>
                )}
              </div>
            </div>
          </div>
        </div>
      </header>

      {/* Volumes */}
      <main className="max-w-4xl mx-auto px-4 py-8">
        <div className="flex items-center justify-between mb-6">
          <h2 className="text-xl font-semibold text-gray-900 dark:text-white flex items-center gap-2">
            <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor" className="w-6 h-6 text-blue-600 dark:text-blue-400">
              <path strokeLinecap="round" strokeLinejoin="round" d="M6 6.878V6a2.25 2.25 0 012.25-2.25h7.5A2.25 2.25 0 0118 6v.878m-12 0c.235-.083.487-.128.75-.128h10.5c.263 0 .515.045.75.128m-12 0A2.25 2.25 0 004.5 9v.878m13.5-3A2.25 2.25 0 0119.5 9v.878m0 0a2.246 2.246 0 00-.75-.128H5.25c-.263 0-.515.045-.75.128m15 0A2.25 2.25 0 0121 12v6a2.25 2.25 0 01-2.25 2.25H5.25A2.25 2.25 0 013 18v-6c0-.98.626-1.813 1.5-2.122" />
            </svg>
            {language === 'ar' ? 'المجلدات' : 'Volumes'}
          </h2>
          {volumes.length === 1 && (
            <Link
              href={`/book/${id}/1/1`}
              className="inline-flex items-center gap-2 px-4 py-2 bg-gradient-to-r from-blue-600 to-purple-600 hover:from-blue-700 hover:to-purple-700 text-white text-sm font-medium rounded-lg shadow-lg shadow-blue-500/25 transition-all"
            >
              {language === 'ar' ? 'ابدأ القراءة' : 'Start Reading'}
              <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={2} stroke="currentColor" className="w-4 h-4">
                <path strokeLinecap="round" strokeLinejoin="round" d="M13.5 4.5L21 12m0 0l-7.5 7.5M21 12H3" />
              </svg>
            </Link>
          )}
        </div>

        {/* Single volume - show prominent CTA */}
        {volumes.length === 1 ? (
          <div className="bg-white dark:bg-gray-800 rounded-2xl border border-gray-200 dark:border-gray-700 p-8 text-center shadow-xl shadow-gray-500/5">
            <div className="w-24 h-24 mx-auto bg-gradient-to-br from-blue-500 to-purple-600 rounded-2xl flex items-center justify-center mb-6 shadow-xl shadow-blue-500/20">
              <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="white" className="w-12 h-12">
                <path strokeLinecap="round" strokeLinejoin="round" d="M12 6.042A8.967 8.967 0 006 3.75c-1.052 0-2.062.18-3 .512v14.25A8.987 8.987 0 016 18c2.305 0 4.408.867 6 2.292m0-14.25a8.966 8.966 0 016-2.292c1.052 0 2.062.18 3 .512v14.25A8.987 8.987 0 0018 18a8.967 8.967 0 00-6 2.292m0-14.25v14.25" />
              </svg>
            </div>
            <h3 className="text-xl font-semibold text-gray-900 dark:text-white mb-2">
              {language === 'ar' ? 'مجلد واحد' : 'Single Volume'}
            </h3>
            <p className="text-gray-600 dark:text-gray-400 mb-6 text-lg">
              {volumes[0].totalPages.toLocaleString()} {language === 'ar' ? 'صفحة' : 'pages'}
            </p>
            <Link
              href={`/book/${id}/1/1`}
              className="inline-flex items-center gap-2 px-8 py-4 bg-gradient-to-r from-blue-600 to-purple-600 hover:from-blue-700 hover:to-purple-700 text-white font-semibold text-lg rounded-xl shadow-xl shadow-blue-500/25 transition-all hover:scale-105"
            >
              {language === 'ar' ? 'ابدأ القراءة' : 'Start Reading'}
              <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={2} stroke="currentColor" className="w-5 h-5">
                <path strokeLinecap="round" strokeLinejoin="round" d="M13.5 4.5L21 12m0 0l-7.5 7.5M21 12H3" />
              </svg>
            </Link>
          </div>
        ) : (
          /* Multiple volumes - grid layout */
          <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 gap-4">
            {volumes.map((vol) => (
              <Link
                key={vol.volume}
                href={`/book/${id}/${vol.volume}/1`}
                className="group relative bg-white dark:bg-gray-800 rounded-xl border border-gray-200 dark:border-gray-700 hover:border-blue-400 dark:hover:border-blue-500/50 hover:shadow-xl hover:shadow-blue-500/10 transition-all duration-300 overflow-hidden"
              >
                {/* Volume number badge */}
                <div className="aspect-[3/4] flex flex-col items-center justify-center p-4">
                  {/* Book spine decoration */}
                  <div className="absolute left-0 top-0 bottom-0 w-1.5 bg-gradient-to-b from-blue-500 to-purple-600 group-hover:from-blue-600 group-hover:to-purple-700 transition-colors"></div>

                  {/* Volume info */}
                  <div className="text-center">
                    <span className="text-xs uppercase tracking-wider text-gray-400 dark:text-gray-500 font-medium">
                      {language === 'ar' ? 'المجلد' : 'Vol'}
                    </span>
                    <div className="text-4xl font-bold bg-gradient-to-br from-gray-900 to-gray-600 dark:from-white dark:to-gray-400 bg-clip-text text-transparent mt-1 group-hover:from-blue-600 group-hover:to-purple-600 dark:group-hover:from-blue-400 dark:group-hover:to-purple-400 transition-all">
                      {vol.volume}
                    </div>
                  </div>

                  {/* Page count */}
                  <div className="mt-4 text-center">
                    <span className="text-sm font-medium text-gray-600 dark:text-gray-400">
                      {vol.totalPages.toLocaleString()}
                    </span>
                    <span className="block text-xs text-gray-400 dark:text-gray-500">
                      {language === 'ar' ? 'صفحة' : 'pages'}
                    </span>
                  </div>
                </div>

                {/* Hover indicator */}
                <div className="absolute bottom-0 left-0 right-0 h-1 bg-gradient-to-r from-blue-500 to-purple-600 transform scale-x-0 group-hover:scale-x-100 transition-transform origin-left"></div>
              </Link>
            ))}
          </div>
        )}

        {/* Quick navigation hint */}
        {volumes.length > 1 && (
          <p className="mt-8 text-center text-sm text-gray-500 dark:text-gray-400 flex items-center justify-center gap-2">
            <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor" className="w-4 h-4">
              <path strokeLinecap="round" strokeLinejoin="round" d="M15.042 21.672L13.684 16.6m0 0l-2.51 2.225.569-9.47 5.227 7.917-3.286-.672zM12 2.25V4.5m5.834.166l-1.591 1.591M20.25 10.5H18M7.757 14.743l-1.59 1.59M6 10.5H3.75m4.007-4.243l-1.59-1.59" />
            </svg>
            {language === 'ar'
              ? 'اختر مجلداً للبدء في القراءة'
              : 'Select a volume to start reading'}
          </p>
        )}
      </main>
    </div>
  );
}
