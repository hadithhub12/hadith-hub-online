'use client';

import { useState } from 'react';
import { useFont, type ArabicFont, type FontSize, type ColorPalette, ARABIC_FONTS, FONT_SIZES, COLOR_PALETTES } from '@/context/FontContext';

// Re-export for backwards compatibility
export type { ArabicFont };
export { ARABIC_FONTS };

// Legacy hook for backwards compatibility - now uses context
export function useArabicFont() {
  const { font, setFont, currentFont, fonts } = useFont();
  return { font, changeFont: setFont, currentFont, fonts };
}

interface FontSelectorProps {
  language?: 'ar' | 'en';
}

export default function FontSelector({ language = 'ar' }: FontSelectorProps) {
  const { font, fontSize, colorPalette, setFont, setFontSize, setColorPalette, fonts, fontSizes, palettes, currentFontSize, currentPalette } = useFont();
  const [isOpen, setIsOpen] = useState(false);
  const [activeTab, setActiveTab] = useState<'font' | 'size' | 'colors'>('font');

  return (
    <div className="relative">
      <button
        onClick={() => setIsOpen(!isOpen)}
        className="flex items-center gap-2 px-3 py-2 text-sm font-medium bg-gray-100 hover:bg-gray-200 dark:bg-gray-700 dark:hover:bg-gray-600 text-gray-700 dark:text-gray-300 rounded-lg transition-colors"
        title={language === 'ar' ? 'إعدادات الخط' : 'Font Settings'}
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
          <div className="absolute left-0 sm:right-0 sm:left-auto mt-2 w-80 bg-white dark:bg-gray-800 rounded-xl shadow-xl border border-gray-200 dark:border-gray-700 z-50 overflow-hidden">
            {/* Tabs */}
            <div className="flex border-b border-gray-200 dark:border-gray-700">
              <button
                onClick={() => setActiveTab('font')}
                className={`flex-1 px-3 py-3 text-xs font-medium transition-colors ${
                  activeTab === 'font'
                    ? 'text-blue-600 dark:text-blue-400 border-b-2 border-blue-600 dark:border-blue-400 bg-blue-50/50 dark:bg-blue-900/20'
                    : 'text-gray-600 dark:text-gray-400 hover:text-gray-800 dark:hover:text-gray-200'
                }`}
              >
                {language === 'ar' ? 'نوع الخط' : 'Font'}
              </button>
              <button
                onClick={() => setActiveTab('size')}
                className={`flex-1 px-3 py-3 text-xs font-medium transition-colors ${
                  activeTab === 'size'
                    ? 'text-blue-600 dark:text-blue-400 border-b-2 border-blue-600 dark:border-blue-400 bg-blue-50/50 dark:bg-blue-900/20'
                    : 'text-gray-600 dark:text-gray-400 hover:text-gray-800 dark:hover:text-gray-200'
                }`}
              >
                {language === 'ar' ? 'الحجم' : 'Size'}
              </button>
              <button
                onClick={() => setActiveTab('colors')}
                className={`flex-1 px-3 py-3 text-xs font-medium transition-colors ${
                  activeTab === 'colors'
                    ? 'text-blue-600 dark:text-blue-400 border-b-2 border-blue-600 dark:border-blue-400 bg-blue-50/50 dark:bg-blue-900/20'
                    : 'text-gray-600 dark:text-gray-400 hover:text-gray-800 dark:hover:text-gray-200'
                }`}
              >
                {language === 'ar' ? 'الألوان' : 'Colors'}
              </button>
            </div>

            {/* Font Selection Tab */}
            {activeTab === 'font' && (
              <div className="p-2 max-h-80 overflow-y-auto">
                {fonts.map((f) => (
                  <button
                    key={f.id}
                    onClick={() => {
                      setFont(f.id);
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
            )}

            {/* Font Size Tab */}
            {activeTab === 'size' && (
              <div className="p-3">
                <div className="mb-3 text-center">
                  <span
                    className="text-gray-700 dark:text-gray-300 arabic-text"
                    style={{ fontSize: `${currentFontSize.scale * 1.25}rem` }}
                    dir="rtl"
                  >
                    بِسْمِ اللَّهِ
                  </span>
                </div>
                <div className="flex flex-col gap-1">
                  {fontSizes.map((size) => (
                    <button
                      key={size.id}
                      onClick={() => {
                        setFontSize(size.id);
                      }}
                      className={`w-full flex items-center justify-between px-3 py-2.5 rounded-lg transition-colors ${
                        fontSize === size.id
                          ? 'bg-blue-50 dark:bg-blue-900/30 text-blue-700 dark:text-blue-300'
                          : 'hover:bg-gray-100 dark:hover:bg-gray-700 text-gray-700 dark:text-gray-300'
                      }`}
                    >
                      <span className="text-sm">{size.name}</span>
                      <span className="text-sm text-gray-500 dark:text-gray-400" dir="rtl">
                        {size.nameAr}
                      </span>
                    </button>
                  ))}
                </div>
              </div>
            )}

            {/* Color Palette Tab */}
            {activeTab === 'colors' && (
              <div className="p-3">
                <div className="flex flex-col gap-2">
                  {palettes.map((palette) => (
                    <button
                      key={palette.id}
                      onClick={() => {
                        setColorPalette(palette.id);
                      }}
                      className={`w-full px-3 py-3 rounded-lg transition-colors ${
                        colorPalette === palette.id
                          ? 'bg-blue-50 dark:bg-blue-900/30 ring-2 ring-blue-500'
                          : 'hover:bg-gray-100 dark:hover:bg-gray-700'
                      }`}
                    >
                      <div className="flex items-center justify-between mb-2">
                        <span className="text-sm font-medium text-gray-700 dark:text-gray-300">
                          {palette.name}
                        </span>
                        <span className="text-sm text-gray-500 dark:text-gray-400" dir="rtl">
                          {palette.nameAr}
                        </span>
                      </div>
                      {/* Color preview swatches */}
                      <div className="flex gap-1.5 justify-center">
                        <div
                          className="w-6 h-6 rounded-full border border-gray-200 dark:border-gray-600"
                          style={{ backgroundColor: palette.colors.chapterHeader }}
                          title={language === 'ar' ? 'عنوان الباب' : 'Chapter'}
                        />
                        <div
                          className="w-6 h-6 rounded-full border border-gray-200 dark:border-gray-600"
                          style={{ backgroundColor: palette.colors.hadithNumber }}
                          title={language === 'ar' ? 'رقم الحديث' : 'Number'}
                        />
                        <div
                          className="w-6 h-6 rounded-full border border-gray-200 dark:border-gray-600"
                          style={{ backgroundColor: palette.colors.sanad }}
                          title={language === 'ar' ? 'السند' : 'Sanad'}
                        />
                        <div
                          className="w-6 h-6 rounded-full border border-gray-200 dark:border-gray-600"
                          style={{ backgroundColor: palette.colors.matn }}
                          title={language === 'ar' ? 'المتن' : 'Matn'}
                        />
                        <div
                          className="w-6 h-6 rounded-full border border-gray-200 dark:border-gray-600"
                          style={{ backgroundColor: palette.colors.footnote }}
                          title={language === 'ar' ? 'الحاشية' : 'Footnote'}
                        />
                      </div>
                    </button>
                  ))}
                </div>
              </div>
            )}
          </div>
        </>
      )}
    </div>
  );
}
