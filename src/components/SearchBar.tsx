'use client';

import { useState, useCallback } from 'react';
import { useRouter } from 'next/navigation';

type SearchMode = 'word' | 'root' | 'exact';

interface SearchBarProps {
  initialQuery?: string;
  placeholder?: string;
  onSearch?: (query: string) => void;
  className?: string;
  language?: 'ar' | 'en';
  showModeOptions?: boolean;
}

export default function SearchBar({
  initialQuery = '',
  placeholder = 'Search hadith... (Arabic or English)',
  onSearch,
  className = '',
  language = 'en',
  showModeOptions = true,
}: SearchBarProps) {
  const [query, setQuery] = useState(initialQuery);
  const [searchMode, setSearchMode] = useState<SearchMode>('exact');
  const router = useRouter();

  const handleSubmit = useCallback(
    (e: React.FormEvent) => {
      e.preventDefault();
      const trimmed = query.trim();
      if (trimmed) {
        if (onSearch) {
          onSearch(trimmed);
        } else {
          router.push(`/search?q=${encodeURIComponent(trimmed)}&mode=${searchMode}`);
        }
      }
    },
    [query, onSearch, router, searchMode]
  );

  const modeOptions = [
    { mode: 'exact' as SearchMode, labelAr: 'عبارة', labelEn: 'Exact', descAr: 'البحث عن العبارة بالضبط', descEn: 'Match exact phrase' },
    { mode: 'word' as SearchMode, labelAr: 'كلمة', labelEn: 'Word', descAr: 'البحث عن الكلمة', descEn: 'Match any word' },
    { mode: 'root' as SearchMode, labelAr: 'جذر', labelEn: 'Root', descAr: 'البحث عن الجذر', descEn: 'Match word roots' },
  ];

  return (
    <div className={className}>
      <form onSubmit={handleSubmit} className="relative">
        <input
          type="text"
          value={query}
          onChange={(e) => setQuery(e.target.value)}
          placeholder={placeholder}
          className="w-full px-4 py-3 pr-12 text-lg border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent dark:bg-gray-800 dark:border-gray-600 dark:text-white"
          dir="auto"
        />
        <button
          type="submit"
          className="absolute right-2 top-1/2 -translate-y-1/2 p-2 text-gray-500 hover:text-blue-600 dark:text-gray-400 dark:hover:text-blue-400"
          aria-label="Search"
        >
          <svg
            xmlns="http://www.w3.org/2000/svg"
            fill="none"
            viewBox="0 0 24 24"
            strokeWidth={2}
            stroke="currentColor"
            className="w-6 h-6"
          >
            <path
              strokeLinecap="round"
              strokeLinejoin="round"
              d="M21 21l-5.197-5.197m0 0A7.5 7.5 0 105.196 5.196a7.5 7.5 0 0010.607 10.607z"
            />
          </svg>
        </button>
      </form>

      {/* Search Mode Options */}
      {showModeOptions && (
        <div className="mt-3 flex flex-wrap items-center gap-3">
          <span className="text-sm font-medium text-gray-600 dark:text-gray-400">
            {language === 'ar' ? 'نوع البحث:' : 'Search type:'}
          </span>
          <div className="flex flex-wrap gap-2">
            {modeOptions.map(({ mode, labelAr, labelEn, descAr, descEn }) => (
              <button
                key={mode}
                type="button"
                onClick={() => setSearchMode(mode)}
                title={language === 'ar' ? descAr : descEn}
                className={`px-3 py-1.5 text-sm font-medium rounded-lg transition-colors ${
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
      )}
    </div>
  );
}
