'use client';

import Link from 'next/link';
import type { Book } from '@/lib/types';

type ViewMode = 'grid' | 'list' | 'compact';

interface BookCardProps {
  book: Book;
  language?: 'ar' | 'en';
  viewMode?: ViewMode;
}

export default function BookCard({ book, language = 'ar', viewMode = 'grid' }: BookCardProps) {
  const title = language === 'en' && book.title_en ? book.title_en : book.title_ar;
  const author = language === 'en' && book.author_en ? book.author_en : book.author_ar;
  const isRTL = language === 'ar';

  // Compact list view - just title and page count
  if (viewMode === 'compact') {
    return (
      <Link
        href={`/book/${book.id}`}
        className="flex items-center justify-between px-3 py-2 hover:bg-gray-100 dark:hover:bg-gray-700/50 rounded transition-colors"
        dir={isRTL ? 'rtl' : 'ltr'}
      >
        <span className={`text-sm ${isRTL ? 'arabic-text' : ''} truncate flex-1`}>
          {title}
        </span>
        <span className="text-xs text-gray-500 dark:text-gray-500 ml-2 flex-shrink-0">
          {book.total_pages.toLocaleString()}
        </span>
      </Link>
    );
  }

  // List view - horizontal layout with more details
  if (viewMode === 'list') {
    return (
      <Link
        href={`/book/${book.id}`}
        className="flex items-start gap-4 p-4 bg-white dark:bg-gray-800 rounded-lg border border-gray-200 dark:border-gray-700 hover:border-blue-500 dark:hover:border-blue-400 hover:shadow-md transition-all"
        dir={isRTL ? 'rtl' : 'ltr'}
      >
        {/* Book Icon */}
        <div className="w-12 h-12 flex-shrink-0 bg-gradient-to-br from-blue-500 to-blue-600 rounded-lg flex items-center justify-center">
          <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="white" className="w-6 h-6">
            <path strokeLinecap="round" strokeLinejoin="round" d="M12 6.042A8.967 8.967 0 006 3.75c-1.052 0-2.062.18-3 .512v14.25A8.987 8.987 0 016 18c2.305 0 4.408.867 6 2.292m0-14.25a8.966 8.966 0 016-2.292c1.052 0 2.062.18 3 .512v14.25A8.987 8.987 0 0018 18a8.967 8.967 0 00-6 2.292m0-14.25v14.25" />
          </svg>
        </div>

        {/* Content */}
        <div className="flex-1 min-w-0">
          <h3 className={`text-base font-semibold text-gray-900 dark:text-white ${isRTL ? 'arabic-text' : ''} line-clamp-1`}>
            {title}
          </h3>
          {author && (
            <p className={`text-sm text-gray-600 dark:text-gray-400 mt-0.5 ${isRTL ? 'arabic-text' : ''} line-clamp-1`}>
              {author}
            </p>
          )}
          <div className="flex items-center gap-3 mt-2 text-xs text-gray-500 dark:text-gray-500">
            <span>{book.volumes} {language === 'ar' ? 'مجلد' : (book.volumes === 1 ? 'vol' : 'vols')}</span>
            <span className="w-1 h-1 bg-gray-400 rounded-full"></span>
            <span>{book.total_pages.toLocaleString()} {language === 'ar' ? 'صفحة' : 'pages'}</span>
            {book.sect && (
              <>
                <span className="w-1 h-1 bg-gray-400 rounded-full"></span>
                <span className={`px-1.5 py-0.5 rounded ${
                  book.sect === 'shia'
                    ? 'bg-green-100 text-green-700 dark:bg-green-900/50 dark:text-green-300'
                    : 'bg-blue-100 text-blue-700 dark:bg-blue-900/50 dark:text-blue-300'
                }`}>
                  {book.sect === 'shia' ? (language === 'ar' ? 'شيعة' : 'Shia') : (language === 'ar' ? 'سنة' : 'Sunni')}
                </span>
              </>
            )}
          </div>
        </div>
      </Link>
    );
  }

  // Grid view (default) - card layout
  return (
    <Link
      href={`/book/${book.id}`}
      className="block p-4 bg-white dark:bg-gray-800 rounded-lg border border-gray-200 dark:border-gray-700 hover:border-blue-500 dark:hover:border-blue-400 hover:shadow-md transition-all"
    >
      <h3
        className={`text-lg font-semibold mb-2 line-clamp-2 ${isRTL ? 'arabic-text' : ''}`}
        dir={isRTL ? 'rtl' : 'ltr'}
      >
        {title}
      </h3>
      {author && (
        <p
          className={`text-sm text-gray-600 dark:text-gray-400 mb-2 line-clamp-1 ${isRTL ? 'arabic-text' : ''}`}
          dir={isRTL ? 'rtl' : 'ltr'}
        >
          {author}
        </p>
      )}
      <div className="flex items-center justify-between text-xs text-gray-500 dark:text-gray-500">
        <span>
          {book.volumes} {language === 'ar' ? 'مجلد' : (book.volumes === 1 ? 'volume' : 'volumes')}
        </span>
        <span>{book.total_pages.toLocaleString()} {language === 'ar' ? 'صفحة' : 'pages'}</span>
      </div>
      {book.sect && (
        <span
          className={`inline-block mt-2 px-2 py-0.5 text-xs rounded-full ${
            book.sect === 'shia'
              ? 'bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-200'
              : book.sect === 'sunni'
              ? 'bg-blue-100 text-blue-800 dark:bg-blue-900 dark:text-blue-200'
              : 'bg-gray-100 text-gray-800 dark:bg-gray-700 dark:text-gray-300'
          }`}
        >
          {book.sect === 'shia' ? (language === 'ar' ? 'شيعة' : 'Shia') : book.sect === 'sunni' ? (language === 'ar' ? 'سنة' : 'Sunni') : book.sect}
        </span>
      )}
    </Link>
  );
}
