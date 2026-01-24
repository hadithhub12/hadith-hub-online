'use client';

import { useCallback } from 'react';

interface LanguageToggleProps {
  language: 'ar' | 'en';
  onChange: (lang: 'ar' | 'en') => void;
  className?: string;
}

export default function LanguageToggle({
  language,
  onChange,
  className = '',
}: LanguageToggleProps) {
  const handleToggle = useCallback(() => {
    onChange(language === 'ar' ? 'en' : 'ar');
  }, [language, onChange]);

  return (
    <button
      onClick={handleToggle}
      className={`inline-flex items-center gap-2 px-3 py-1.5 text-sm rounded-md bg-gray-100 hover:bg-gray-200 dark:bg-gray-700 dark:hover:bg-gray-600 transition-colors ${className}`}
      title="Toggle language"
    >
      <svg
        xmlns="http://www.w3.org/2000/svg"
        fill="none"
        viewBox="0 0 24 24"
        strokeWidth={1.5}
        stroke="currentColor"
        className="w-4 h-4"
      >
        <path
          strokeLinecap="round"
          strokeLinejoin="round"
          d="M10.5 21l5.25-11.25L21 21m-9-3h7.5M3 5.621a48.474 48.474 0 016-.371m0 0c1.12 0 2.233.038 3.334.114M9 5.25V3m3.334 2.364C11.176 10.658 7.69 15.08 3 17.502m9.334-12.138c.896.061 1.785.147 2.666.257m-4.589 8.495a18.023 18.023 0 01-3.827-5.802"
        />
      </svg>
      <span className="font-medium">
        {language === 'ar' ? 'العربية' : 'English'}
      </span>
    </button>
  );
}
