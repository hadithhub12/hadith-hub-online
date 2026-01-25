'use client';

import Link from 'next/link';
import type { Book } from '@/lib/types';

type ViewMode = 'grid' | 'list' | 'compact';

interface BookCardProps {
  book: Book;
  language?: 'ar' | 'en';
  viewMode?: ViewMode;
}

// Generate a consistent gradient based on book ID
function getBookGradient(bookId: string): string {
  const gradients = [
    'from-blue-500 to-indigo-600',
    'from-purple-500 to-pink-600',
    'from-emerald-500 to-teal-600',
    'from-orange-500 to-red-600',
    'from-cyan-500 to-blue-600',
    'from-rose-500 to-purple-600',
    'from-amber-500 to-orange-600',
    'from-teal-500 to-emerald-600',
  ];
  const index = bookId.split('').reduce((acc, char) => acc + char.charCodeAt(0), 0) % gradients.length;
  return gradients[index];
}

export default function BookCard({ book, language = 'ar', viewMode = 'grid' }: BookCardProps) {
  const title = language === 'en' && book.title_en ? book.title_en : book.title_ar;
  const author = language === 'en' && book.author_en ? book.author_en : book.author_ar;
  const isRTL = language === 'ar';
  const gradient = getBookGradient(book.id);

  // Compact list view - just title and page count
  if (viewMode === 'compact') {
    return (
      <Link
        href={`/book/${book.id}`}
        className="flex items-center justify-between px-4 py-2.5 hover:bg-gray-50 dark:hover:bg-gray-700/50 transition-colors group"
        dir={isRTL ? 'rtl' : 'ltr'}
      >
        <div className="flex items-center gap-2 min-w-0 flex-1">
          <div className={`w-1.5 h-1.5 rounded-full bg-gradient-to-r ${gradient} flex-shrink-0`}></div>
          <span className={`text-sm text-gray-700 dark:text-gray-300 group-hover:text-blue-600 dark:group-hover:text-blue-400 ${isRTL ? 'arabic-text' : ''} truncate transition-colors`}>
            {title}
          </span>
        </div>
        <div className="flex items-center gap-2 flex-shrink-0 ml-2">
          <span className="text-xs text-gray-400 dark:text-gray-500">
            {book.total_pages.toLocaleString()}
          </span>
          <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={2} stroke="currentColor" className="w-3.5 h-3.5 text-gray-400 group-hover:text-blue-500 transition-colors">
            <path strokeLinecap="round" strokeLinejoin="round" d="M8.25 4.5l7.5 7.5-7.5 7.5" />
          </svg>
        </div>
      </Link>
    );
  }

  // List view - horizontal layout with more details
  if (viewMode === 'list') {
    return (
      <Link
        href={`/book/${book.id}`}
        className="flex items-center gap-4 p-4 bg-white dark:bg-gray-800 rounded-xl border border-gray-100 dark:border-gray-700 hover:border-blue-300 dark:hover:border-blue-500/50 hover:shadow-lg hover:shadow-blue-500/5 transition-all duration-300 group"
        dir={isRTL ? 'rtl' : 'ltr'}
      >
        {/* Book Icon */}
        <div className={`w-14 h-14 flex-shrink-0 bg-gradient-to-br ${gradient} rounded-xl flex items-center justify-center shadow-lg group-hover:scale-105 transition-transform duration-300`}>
          <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="white" className="w-7 h-7">
            <path strokeLinecap="round" strokeLinejoin="round" d="M12 6.042A8.967 8.967 0 006 3.75c-1.052 0-2.062.18-3 .512v14.25A8.987 8.987 0 016 18c2.305 0 4.408.867 6 2.292m0-14.25a8.966 8.966 0 016-2.292c1.052 0 2.062.18 3 .512v14.25A8.987 8.987 0 0018 18a8.967 8.967 0 00-6 2.292m0-14.25v14.25" />
          </svg>
        </div>

        {/* Content */}
        <div className="flex-1 min-w-0">
          <h3 className={`text-base font-semibold text-gray-900 dark:text-white group-hover:text-blue-600 dark:group-hover:text-blue-400 transition-colors ${isRTL ? 'arabic-text' : ''} line-clamp-1`}>
            {title}
          </h3>
          {author && (
            <p className={`text-sm text-gray-500 dark:text-gray-400 mt-0.5 ${isRTL ? 'arabic-text' : ''} line-clamp-1 flex items-center gap-1`}>
              <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor" className="w-3.5 h-3.5 flex-shrink-0">
                <path strokeLinecap="round" strokeLinejoin="round" d="M15.75 6a3.75 3.75 0 11-7.5 0 3.75 3.75 0 017.5 0zM4.501 20.118a7.5 7.5 0 0114.998 0A17.933 17.933 0 0112 21.75c-2.676 0-5.216-.584-7.499-1.632z" />
              </svg>
              {author}
            </p>
          )}
          <div className="flex items-center gap-3 mt-2 text-xs text-gray-400 dark:text-gray-500">
            <span className="flex items-center gap-1">
              <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor" className="w-3.5 h-3.5">
                <path strokeLinecap="round" strokeLinejoin="round" d="M6 6.878V6a2.25 2.25 0 012.25-2.25h7.5A2.25 2.25 0 0118 6v.878m-12 0c.235-.083.487-.128.75-.128h10.5c.263 0 .515.045.75.128m-12 0A2.25 2.25 0 004.5 9v.878m13.5-3A2.25 2.25 0 0119.5 9v.878m0 0a2.246 2.246 0 00-.75-.128H5.25c-.263 0-.515.045-.75.128m15 0A2.25 2.25 0 0121 12v6a2.25 2.25 0 01-2.25 2.25H5.25A2.25 2.25 0 013 18v-6c0-.98.626-1.813 1.5-2.122" />
              </svg>
              {book.volumes} {language === 'ar' ? 'مجلد' : (book.volumes === 1 ? 'vol' : 'vols')}
            </span>
            <span className="w-1 h-1 bg-gray-300 dark:bg-gray-600 rounded-full"></span>
            <span className="flex items-center gap-1">
              <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor" className="w-3.5 h-3.5">
                <path strokeLinecap="round" strokeLinejoin="round" d="M19.5 14.25v-2.625a3.375 3.375 0 00-3.375-3.375h-1.5A1.125 1.125 0 0113.5 7.125v-1.5a3.375 3.375 0 00-3.375-3.375H8.25m0 12.75h7.5m-7.5 3H12M10.5 2.25H5.625c-.621 0-1.125.504-1.125 1.125v17.25c0 .621.504 1.125 1.125 1.125h12.75c.621 0 1.125-.504 1.125-1.125V11.25a9 9 0 00-9-9z" />
              </svg>
              {book.total_pages.toLocaleString()} {language === 'ar' ? 'صفحة' : 'pages'}
            </span>
            {book.sect && (
              <>
                <span className="w-1 h-1 bg-gray-300 dark:bg-gray-600 rounded-full"></span>
                <span className={`px-2 py-0.5 rounded-full font-medium ${
                  book.sect === 'shia'
                    ? 'bg-emerald-100 text-emerald-700 dark:bg-emerald-900/50 dark:text-emerald-300'
                    : 'bg-blue-100 text-blue-700 dark:bg-blue-900/50 dark:text-blue-300'
                }`}>
                  {book.sect === 'shia' ? (language === 'ar' ? 'شيعة' : 'Shia') : (language === 'ar' ? 'سنة' : 'Sunni')}
                </span>
              </>
            )}
          </div>
        </div>

        {/* Arrow */}
        <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={2} stroke="currentColor" className="w-5 h-5 text-gray-300 dark:text-gray-600 group-hover:text-blue-500 transition-colors flex-shrink-0">
          <path strokeLinecap="round" strokeLinejoin="round" d="M8.25 4.5l7.5 7.5-7.5 7.5" />
        </svg>
      </Link>
    );
  }

  // Grid view (default) - card layout
  return (
    <Link
      href={`/book/${book.id}`}
      className="block p-5 bg-white dark:bg-gray-800 rounded-xl border border-gray-100 dark:border-gray-700 hover:border-blue-300 dark:hover:border-blue-500/50 hover:shadow-xl hover:shadow-blue-500/10 transition-all duration-300 group"
    >
      {/* Header with Icon */}
      <div className="flex items-start justify-between mb-3">
        <div className={`w-12 h-12 bg-gradient-to-br ${gradient} rounded-xl flex items-center justify-center shadow-lg group-hover:scale-105 transition-transform duration-300`}>
          <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="white" className="w-6 h-6">
            <path strokeLinecap="round" strokeLinejoin="round" d="M12 6.042A8.967 8.967 0 006 3.75c-1.052 0-2.062.18-3 .512v14.25A8.987 8.987 0 016 18c2.305 0 4.408.867 6 2.292m0-14.25a8.966 8.966 0 016-2.292c1.052 0 2.062.18 3 .512v14.25A8.987 8.987 0 0018 18a8.967 8.967 0 00-6 2.292m0-14.25v14.25" />
          </svg>
        </div>
        {book.sect && (
          <span
            className={`px-2.5 py-1 text-xs font-medium rounded-full ${
              book.sect === 'shia'
                ? 'bg-emerald-100 text-emerald-700 dark:bg-emerald-900/50 dark:text-emerald-300'
                : book.sect === 'sunni'
                ? 'bg-blue-100 text-blue-700 dark:bg-blue-900/50 dark:text-blue-300'
                : 'bg-gray-100 text-gray-700 dark:bg-gray-700 dark:text-gray-300'
            }`}
          >
            {book.sect === 'shia' ? (language === 'ar' ? 'شيعة' : 'Shia') : book.sect === 'sunni' ? (language === 'ar' ? 'سنة' : 'Sunni') : book.sect}
          </span>
        )}
      </div>

      {/* Title */}
      <h3
        className={`text-lg font-semibold text-gray-900 dark:text-white group-hover:text-blue-600 dark:group-hover:text-blue-400 transition-colors mb-1.5 line-clamp-2 ${isRTL ? 'arabic-text' : ''}`}
        dir={isRTL ? 'rtl' : 'ltr'}
      >
        {title}
      </h3>

      {/* Author */}
      {author && (
        <p
          className={`text-sm text-gray-500 dark:text-gray-400 mb-3 line-clamp-1 flex items-center gap-1 ${isRTL ? 'arabic-text' : ''}`}
          dir={isRTL ? 'rtl' : 'ltr'}
        >
          <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor" className="w-3.5 h-3.5 flex-shrink-0">
            <path strokeLinecap="round" strokeLinejoin="round" d="M15.75 6a3.75 3.75 0 11-7.5 0 3.75 3.75 0 017.5 0zM4.501 20.118a7.5 7.5 0 0114.998 0A17.933 17.933 0 0112 21.75c-2.676 0-5.216-.584-7.499-1.632z" />
          </svg>
          {author}
        </p>
      )}

      {/* Stats */}
      <div className="flex items-center justify-between pt-3 border-t border-gray-100 dark:border-gray-700">
        <span className="flex items-center gap-1.5 text-xs text-gray-400 dark:text-gray-500">
          <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor" className="w-4 h-4">
            <path strokeLinecap="round" strokeLinejoin="round" d="M6 6.878V6a2.25 2.25 0 012.25-2.25h7.5A2.25 2.25 0 0118 6v.878m-12 0c.235-.083.487-.128.75-.128h10.5c.263 0 .515.045.75.128m-12 0A2.25 2.25 0 004.5 9v.878m13.5-3A2.25 2.25 0 0119.5 9v.878m0 0a2.246 2.246 0 00-.75-.128H5.25c-.263 0-.515.045-.75.128m15 0A2.25 2.25 0 0121 12v6a2.25 2.25 0 01-2.25 2.25H5.25A2.25 2.25 0 013 18v-6c0-.98.626-1.813 1.5-2.122" />
          </svg>
          {book.volumes} {language === 'ar' ? 'مجلد' : (book.volumes === 1 ? 'vol' : 'vols')}
        </span>
        <span className="flex items-center gap-1.5 text-xs text-gray-400 dark:text-gray-500">
          <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor" className="w-4 h-4">
            <path strokeLinecap="round" strokeLinejoin="round" d="M19.5 14.25v-2.625a3.375 3.375 0 00-3.375-3.375h-1.5A1.125 1.125 0 0113.5 7.125v-1.5a3.375 3.375 0 00-3.375-3.375H8.25m0 12.75h7.5m-7.5 3H12M10.5 2.25H5.625c-.621 0-1.125.504-1.125 1.125v17.25c0 .621.504 1.125 1.125 1.125h12.75c.621 0 1.125-.504 1.125-1.125V11.25a9 9 0 00-9-9z" />
          </svg>
          {book.total_pages.toLocaleString()} {language === 'ar' ? 'صفحة' : 'pages'}
        </span>
      </div>
    </Link>
  );
}
