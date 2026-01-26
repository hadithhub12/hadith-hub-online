'use client';

import { createContext, useContext, useState, useEffect, ReactNode } from 'react';

export type ArabicFont = 'amiri' | 'scheherazade' | 'noto-naskh' | 'noto-nastaliq' | 'lateef';
export type FontSize = 'xs' | 'sm' | 'md' | 'lg' | 'xl';

interface FontOption {
  id: ArabicFont;
  name: string;
  nameAr: string;
  family: string;
  style: 'naskh' | 'nastaliq';
}

interface FontSizeOption {
  id: FontSize;
  name: string;
  nameAr: string;
  scale: number; // multiplier for base font size
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

export const FONT_SIZES: FontSizeOption[] = [
  { id: 'xs', name: 'Extra Small', nameAr: 'صغير جداً', scale: 0.85 },
  { id: 'sm', name: 'Small', nameAr: 'صغير', scale: 0.95 },
  { id: 'md', name: 'Medium', nameAr: 'متوسط', scale: 1.0 },
  { id: 'lg', name: 'Large', nameAr: 'كبير', scale: 1.15 },
  { id: 'xl', name: 'Extra Large', nameAr: 'كبير جداً', scale: 1.3 },
];

interface FontContextType {
  font: ArabicFont;
  fontSize: FontSize;
  setFont: (font: ArabicFont) => void;
  setFontSize: (size: FontSize) => void;
  currentFont: FontOption;
  currentFontSize: FontSizeOption;
  fonts: FontOption[];
  fontSizes: FontSizeOption[];
}

const FontContext = createContext<FontContextType | undefined>(undefined);

export function FontProvider({ children }: { children: ReactNode }) {
  const [font, setFontState] = useState<ArabicFont>('amiri');
  const [fontSize, setFontSizeState] = useState<FontSize>('md');
  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    setMounted(true);
    const savedFont = localStorage.getItem('hadith-arabic-font') as ArabicFont | null;
    const savedSize = localStorage.getItem('hadith-font-size') as FontSize | null;

    if (savedFont && ARABIC_FONTS.some(f => f.id === savedFont)) {
      setFontState(savedFont);
    }
    if (savedSize && FONT_SIZES.some(s => s.id === savedSize)) {
      setFontSizeState(savedSize);
    }
  }, []);

  const setFont = (newFont: ArabicFont) => {
    setFontState(newFont);
    localStorage.setItem('hadith-arabic-font', newFont);
  };

  const setFontSize = (newSize: FontSize) => {
    setFontSizeState(newSize);
    localStorage.setItem('hadith-font-size', newSize);
  };

  const currentFont = ARABIC_FONTS.find(f => f.id === font) || ARABIC_FONTS[0];
  const currentFontSize = FONT_SIZES.find(s => s.id === fontSize) || FONT_SIZES[2];

  // Always provide context (with defaults before mounting to prevent hydration issues)
  return (
    <FontContext.Provider value={{
      font,
      fontSize,
      setFont,
      setFontSize,
      currentFont,
      currentFontSize,
      fonts: ARABIC_FONTS,
      fontSizes: FONT_SIZES,
    }}>
      {children}
    </FontContext.Provider>
  );
}

export function useFont() {
  const context = useContext(FontContext);
  if (context === undefined) {
    throw new Error('useFont must be used within a FontProvider');
  }
  return context;
}
