'use client';

import { createContext, useContext, useState, useEffect, ReactNode } from 'react';

export type ArabicFont = 'amiri' | 'scheherazade' | 'noto-naskh' | 'noto-nastaliq' | 'lateef';
export type FontSize = 'xs' | 'sm' | 'md' | 'lg' | 'xl';
export type ColorPalette = 'default' | 'sepia' | 'ocean' | 'forest' | 'royal' | 'sunset';

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

interface ColorPaletteOption {
  id: ColorPalette;
  name: string;
  nameAr: string;
  colors: {
    // Light mode colors
    chapterHeader: string;    // Chapter headers (باب)
    hadithNumber: string;     // Hadith number badge background
    sanad: string;            // Narrator chain
    matn: string;             // Actual hadith text
    footnote: string;         // Footnote references
    // Dark mode colors
    chapterHeaderDark: string;
    hadithNumberDark: string;
    sanadDark: string;
    matnDark: string;
    footnoteDark: string;
  };
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

export const COLOR_PALETTES: ColorPaletteOption[] = [
  {
    id: 'default',
    name: 'Classic',
    nameAr: 'كلاسيكي',
    colors: {
      chapterHeader: '#c2410c',    // Orange
      hadithNumber: '#0891b2',     // Cyan
      sanad: '#6b7280',            // Gray
      matn: '#1e40af',             // Dark blue
      footnote: '#dc2626',         // Red
      chapterHeaderDark: '#fb923c',
      hadithNumberDark: '#22d3ee',
      sanadDark: '#9ca3af',
      matnDark: '#22d3ee',
      footnoteDark: '#f87171',
    },
  },
  {
    id: 'sepia',
    name: 'Sepia',
    nameAr: 'بني داكن',
    colors: {
      chapterHeader: '#92400e',    // Amber brown
      hadithNumber: '#78350f',     // Dark amber
      sanad: '#78716c',            // Warm gray
      matn: '#44403c',             // Stone
      footnote: '#b45309',         // Amber
      chapterHeaderDark: '#fbbf24',
      hadithNumberDark: '#f59e0b',
      sanadDark: '#a8a29e',
      matnDark: '#fef3c7',
      footnoteDark: '#fcd34d',
    },
  },
  {
    id: 'ocean',
    name: 'Ocean',
    nameAr: 'محيط',
    colors: {
      chapterHeader: '#0369a1',    // Sky blue
      hadithNumber: '#0e7490',     // Cyan
      sanad: '#64748b',            // Slate
      matn: '#1e3a5f',             // Navy
      footnote: '#0891b2',         // Cyan
      chapterHeaderDark: '#38bdf8',
      hadithNumberDark: '#22d3ee',
      sanadDark: '#94a3b8',
      matnDark: '#7dd3fc',
      footnoteDark: '#67e8f9',
    },
  },
  {
    id: 'forest',
    name: 'Forest',
    nameAr: 'غابة',
    colors: {
      chapterHeader: '#166534',    // Green
      hadithNumber: '#15803d',     // Emerald
      sanad: '#6b7280',            // Gray
      matn: '#14532d',             // Dark green
      footnote: '#b45309',         // Amber
      chapterHeaderDark: '#4ade80',
      hadithNumberDark: '#34d399',
      sanadDark: '#9ca3af',
      matnDark: '#86efac',
      footnoteDark: '#fbbf24',
    },
  },
  {
    id: 'royal',
    name: 'Royal',
    nameAr: 'ملكي',
    colors: {
      chapterHeader: '#7c3aed',    // Violet
      hadithNumber: '#6d28d9',     // Purple
      sanad: '#71717a',            // Zinc
      matn: '#4c1d95',             // Dark purple
      footnote: '#be185d',         // Pink
      chapterHeaderDark: '#a78bfa',
      hadithNumberDark: '#8b5cf6',
      sanadDark: '#a1a1aa',
      matnDark: '#c4b5fd',
      footnoteDark: '#f472b6',
    },
  },
  {
    id: 'sunset',
    name: 'Sunset',
    nameAr: 'غروب',
    colors: {
      chapterHeader: '#c2410c',    // Orange
      hadithNumber: '#b91c1c',     // Red
      sanad: '#78716c',            // Stone
      matn: '#9a3412',             // Deep orange
      footnote: '#be185d',         // Pink
      chapterHeaderDark: '#fb923c',
      hadithNumberDark: '#f87171',
      sanadDark: '#a8a29e',
      matnDark: '#fdba74',
      footnoteDark: '#f472b6',
    },
  },
];

interface FontContextType {
  font: ArabicFont;
  fontSize: FontSize;
  colorPalette: ColorPalette;
  setFont: (font: ArabicFont) => void;
  setFontSize: (size: FontSize) => void;
  setColorPalette: (palette: ColorPalette) => void;
  currentFont: FontOption;
  currentFontSize: FontSizeOption;
  currentPalette: ColorPaletteOption;
  fonts: FontOption[];
  fontSizes: FontSizeOption[];
  palettes: ColorPaletteOption[];
}

const FontContext = createContext<FontContextType | undefined>(undefined);

// Helper function to apply color palette CSS variables
function applyColorPalette(palette: ColorPaletteOption) {
  if (typeof document === 'undefined') return;

  const root = document.documentElement;
  root.style.setProperty('--palette-chapter-header', palette.colors.chapterHeader);
  root.style.setProperty('--palette-hadith-number', palette.colors.hadithNumber);
  root.style.setProperty('--palette-sanad', palette.colors.sanad);
  root.style.setProperty('--palette-matn', palette.colors.matn);
  root.style.setProperty('--palette-footnote', palette.colors.footnote);
  root.style.setProperty('--palette-chapter-header-dark', palette.colors.chapterHeaderDark);
  root.style.setProperty('--palette-hadith-number-dark', palette.colors.hadithNumberDark);
  root.style.setProperty('--palette-sanad-dark', palette.colors.sanadDark);
  root.style.setProperty('--palette-matn-dark', palette.colors.matnDark);
  root.style.setProperty('--palette-footnote-dark', palette.colors.footnoteDark);
}

export function FontProvider({ children }: { children: ReactNode }) {
  const [font, setFontState] = useState<ArabicFont>('amiri');
  const [fontSize, setFontSizeState] = useState<FontSize>('md');
  const [colorPalette, setColorPaletteState] = useState<ColorPalette>('default');
  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    setMounted(true);
    const savedFont = localStorage.getItem('hadith-arabic-font') as ArabicFont | null;
    const savedSize = localStorage.getItem('hadith-font-size') as FontSize | null;
    const savedPalette = localStorage.getItem('hadith-color-palette') as ColorPalette | null;

    if (savedFont && ARABIC_FONTS.some(f => f.id === savedFont)) {
      setFontState(savedFont);
    }
    if (savedSize && FONT_SIZES.some(s => s.id === savedSize)) {
      setFontSizeState(savedSize);
    }
    if (savedPalette && COLOR_PALETTES.some(p => p.id === savedPalette)) {
      setColorPaletteState(savedPalette);
      const palette = COLOR_PALETTES.find(p => p.id === savedPalette);
      if (palette) applyColorPalette(palette);
    } else {
      // Apply default palette
      applyColorPalette(COLOR_PALETTES[0]);
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

  const setColorPalette = (newPalette: ColorPalette) => {
    setColorPaletteState(newPalette);
    localStorage.setItem('hadith-color-palette', newPalette);
    const palette = COLOR_PALETTES.find(p => p.id === newPalette);
    if (palette) applyColorPalette(palette);
  };

  const currentFont = ARABIC_FONTS.find(f => f.id === font) || ARABIC_FONTS[0];
  const currentFontSize = FONT_SIZES.find(s => s.id === fontSize) || FONT_SIZES[2];
  const currentPalette = COLOR_PALETTES.find(p => p.id === colorPalette) || COLOR_PALETTES[0];

  // Always provide context (with defaults before mounting to prevent hydration issues)
  return (
    <FontContext.Provider value={{
      font,
      fontSize,
      colorPalette,
      setFont,
      setFontSize,
      setColorPalette,
      currentFont,
      currentFontSize,
      currentPalette,
      fonts: ARABIC_FONTS,
      fontSizes: FONT_SIZES,
      palettes: COLOR_PALETTES,
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
