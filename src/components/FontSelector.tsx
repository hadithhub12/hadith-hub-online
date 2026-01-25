'use client';

import { useState, useEffect } from 'react';

export type ArabicFont = 'amiri' | 'scheherazade' | 'noto-naskh' | 'noto-nastaliq' | 'lateef';

interface FontOption {
  id: ArabicFont;
  name: string;
  nameAr: string;
  family: string;
  style: 'naskh' | 'nastaliq';
}

export const ARABIC_FONTS: FontOption[] = [
  {
    id: 'amiri',
    name: 'Amiri',
    nameAr: 'أميري',
    family: "'Amiri', serif",
    style: 'naskh',
  },
  {
    id: 'scheherazade',
    name: 'Scheherazade',
    nameAr: 'شهرزاد',
    family: "'Scheherazade New', serif",
    style: 'naskh',
  },
  {
    id: 'noto-naskh',
    name: 'Noto Naskh',
    nameAr: 'نوتو نسخ',
    family: "'Noto Naskh Arabic', serif",
    style: 'naskh',
  },
  {
    id: 'noto-nastaliq',
    name: 'Noto Nastaliq (Indo-Pak)',
    nameAr: 'نوتو نستعلیق',
    family: "'Noto Nastaliq Urdu', serif",
    style: 'nastaliq',
  },
  {
    id: 'lateef',
    name: 'Lateef',
    nameAr: 'لطیف',
    family: "'Lateef', serif",
    style: 'nastaliq',
  },
];

interface FontSelectorProps {
  language?: 'ar' | 'en';
}

export function useArabicFont() {
  const [font, setFont] = useState<ArabicFont>('amiri');

  useEffect(() => {
    const saved = localStorage.getItem('hadith-arabic-font') as ArabicFont | null;
    if (saved && ARABIC_FONTS.some(f => f.id === saved)) {
      setFont(saved);
    }
  }, []);

  const changeFont = (newFont: ArabicFont) => {
    setFont(newFont);
    localStorage.setItem('hadith-arabic-font', newFont);
  };

  const currentFont = ARABIC_FONTS.find(f => f.id === font) || ARABIC_FONTS[0];

  return { font, changeFont, currentFont, fonts: ARABIC_FONTS };
}

export default function FontSelector({ language = 'ar' }: FontSelectorProps) {
  const { font, changeFont, fonts } = useArabicFont();
  const [isOpen, setIsOpen] = useState(false);

  return (
    <div className="relative">
      <button
        onClick={() => setIsOpen(!isOpen)}
        className="flex items-center gap-2 px-3 py-2 text-sm font-medium bg-gray-100 hover:bg-gray-200 dark:bg-gray-700 dark:hover:bg-gray-600 text-gray-700 dark:text-gray-300 rounded-lg transition-colors"
        title={language === 'ar' ? 'اختر الخط' : 'Select Font'}
      >
        <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor" className="w-5 h-5">
          <path strokeLinecap="round" strokeLinejoin="round" d="M3.75 6.75h16.5M3.75 12h16.5M12 17.25h8.25" />
        </svg>
        <span className="hidden sm:inline">
          {language === 'ar' ? 'الخط' : 'Font'}
        </span>
      </button>

      {isOpen && (
        <>
          <div
            className="fixed inset-0 z-40"
            onClick={() => setIsOpen(false)}
          />
          <div className="absolute left-0 sm:right-0 sm:left-auto mt-2 w-64 bg-white dark:bg-gray-800 rounded-xl shadow-xl border border-gray-200 dark:border-gray-700 z-50 overflow-hidden">
            <div className="p-3 border-b border-gray-200 dark:border-gray-700">
              <h3 className="text-sm font-semibold text-gray-700 dark:text-gray-300">
                {language === 'ar' ? 'اختر خط العربي' : 'Select Arabic Font'}
              </h3>
            </div>
            <div className="p-2 max-h-80 overflow-y-auto">
              {fonts.map((f) => (
                <button
                  key={f.id}
                  onClick={() => {
                    changeFont(f.id);
                    setIsOpen(false);
                  }}
                  className={`w-full text-right px-3 py-3 rounded-lg transition-colors flex flex-col gap-1 ${
                    font === f.id
                      ? 'bg-blue-50 dark:bg-blue-900/30 text-blue-700 dark:text-blue-300'
                      : 'hover:bg-gray-100 dark:hover:bg-gray-700 text-gray-700 dark:text-gray-300'
                  }`}
                >
                  <span className="text-sm font-medium flex items-center justify-between">
                    <span className="text-xs text-gray-500 dark:text-gray-400">
                      {f.style === 'nastaliq' ? '(نستعلیق)' : '(نسخ)'}
                    </span>
                    <span>{f.name}</span>
                  </span>
                  <span
                    className="text-xl"
                    style={{ fontFamily: f.family }}
                    dir="rtl"
                  >
                    بِسْمِ اللَّهِ الرَّحْمَٰنِ الرَّحِيمِ
                  </span>
                </button>
              ))}
            </div>
          </div>
        </>
      )}
    </div>
  );
}
