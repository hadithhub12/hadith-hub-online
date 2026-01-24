import type { QuranReference } from './types';

// Mapping of Arabic surah names to numbers
const SURAH_NAMES: Record<string, number> = {
  'الفاتحة': 1,
  'البقرة': 2,
  'آل عمران': 3,
  'النساء': 4,
  'المائدة': 5,
  'الأنعام': 6,
  'الأعراف': 7,
  'الأنفال': 8,
  'التوبة': 9,
  'يونس': 10,
  'هود': 11,
  'يوسف': 12,
  'الرعد': 13,
  'إبراهيم': 14,
  'الحجر': 15,
  'النحل': 16,
  'الإسراء': 17,
  'الكهف': 18,
  'مريم': 19,
  'طه': 20,
  'الأنبياء': 21,
  'الحج': 22,
  'المؤمنون': 23,
  'النور': 24,
  'الفرقان': 25,
  'الشعراء': 26,
  'النمل': 27,
  'القصص': 28,
  'العنكبوت': 29,
  'الروم': 30,
  'لقمان': 31,
  'السجدة': 32,
  'الأحزاب': 33,
  'سبأ': 34,
  'فاطر': 35,
  'يس': 36,
  'الصافات': 37,
  'ص': 38,
  'الزمر': 39,
  'غافر': 40,
  'فصلت': 41,
  'الشورى': 42,
  'الزخرف': 43,
  'الدخان': 44,
  'الجاثية': 45,
  'الأحقاف': 46,
  'محمد': 47,
  'الفتح': 48,
  'الحجرات': 49,
  'ق': 50,
  'الذاريات': 51,
  'الطور': 52,
  'النجم': 53,
  'القمر': 54,
  'الرحمن': 55,
  'الواقعة': 56,
  'الحديد': 57,
  'المجادلة': 58,
  'الحشر': 59,
  'الممتحنة': 60,
  'الصف': 61,
  'الجمعة': 62,
  'المنافقون': 63,
  'التغابن': 64,
  'الطلاق': 65,
  'التحريم': 66,
  'الملك': 67,
  'القلم': 68,
  'الحاقة': 69,
  'المعارج': 70,
  'نوح': 71,
  'الجن': 72,
  'المزمل': 73,
  'المدثر': 74,
  'القيامة': 75,
  'الإنسان': 76,
  'المرسلات': 77,
  'النبأ': 78,
  'النازعات': 79,
  'عبس': 80,
  'التكوير': 81,
  'الانفطار': 82,
  'المطففين': 83,
  'الانشقاق': 84,
  'البروج': 85,
  'الطارق': 86,
  'الأعلى': 87,
  'الغاشية': 88,
  'الفجر': 89,
  'البلد': 90,
  'الشمس': 91,
  'الليل': 92,
  'الضحى': 93,
  'الشرح': 94,
  'التين': 95,
  'العلق': 96,
  'القدر': 97,
  'البينة': 98,
  'الزلزلة': 99,
  'العاديات': 100,
  'القارعة': 101,
  'التكاثر': 102,
  'العصر': 103,
  'الهمزة': 104,
  'الفيل': 105,
  'قريش': 106,
  'الماعون': 107,
  'الكوثر': 108,
  'الكافرون': 109,
  'النصر': 110,
  'المسد': 111,
  'الإخلاص': 112,
  'الفلق': 113,
  'الناس': 114,
};

// Reverse mapping for display
const SURAH_NUMBERS_TO_NAMES: Record<number, string> = Object.fromEntries(
  Object.entries(SURAH_NAMES).map(([name, num]) => [num, name])
);

// Max verses per surah (approximate, for validation)
const MAX_VERSES: Record<number, number> = {
  1: 7, 2: 286, 3: 200, 4: 176, 5: 120, 6: 165, 7: 206, 8: 75, 9: 129, 10: 109,
  11: 123, 12: 111, 13: 43, 14: 52, 15: 99, 16: 128, 17: 111, 18: 110, 19: 98, 20: 135,
  21: 112, 22: 78, 23: 118, 24: 64, 25: 77, 26: 227, 27: 93, 28: 88, 29: 69, 30: 60,
  31: 34, 32: 30, 33: 73, 34: 54, 35: 45, 36: 83, 37: 182, 38: 88, 39: 75, 40: 85,
  41: 54, 42: 53, 43: 89, 44: 59, 45: 37, 46: 35, 47: 38, 48: 29, 49: 18, 50: 45,
  51: 60, 52: 49, 53: 62, 54: 55, 55: 78, 56: 96, 57: 29, 58: 22, 59: 24, 60: 13,
  61: 14, 62: 11, 63: 11, 64: 18, 65: 12, 66: 12, 67: 30, 68: 52, 69: 52, 70: 44,
  71: 28, 72: 28, 73: 20, 74: 56, 75: 40, 76: 31, 77: 50, 78: 40, 79: 46, 80: 42,
  81: 29, 82: 19, 83: 36, 84: 25, 85: 22, 86: 17, 87: 19, 88: 26, 89: 30, 90: 20,
  91: 15, 92: 21, 93: 11, 94: 8, 95: 8, 96: 19, 97: 5, 98: 8, 99: 8, 100: 11,
  101: 11, 102: 8, 103: 3, 104: 9, 105: 5, 106: 4, 107: 7, 108: 3, 109: 6, 110: 3,
  111: 5, 112: 4, 113: 5, 114: 6,
};

/**
 * Generate quran.com URL for a verse
 */
export function quranComUrl(surah: number, ayah: number, ayahEnd?: number): string {
  if (ayahEnd && ayahEnd !== ayah) {
    return `https://quran.com/${surah}/${ayah}-${ayahEnd}`;
  }
  return `https://quran.com/${surah}/${ayah}`;
}

/**
 * Validate a surah:ayah reference
 */
function isValidReference(surah: number, ayah: number): boolean {
  if (surah < 1 || surah > 114) return false;
  if (ayah < 1) return false;
  const maxAyah = MAX_VERSES[surah] || 300;
  return ayah <= maxAyah;
}

/**
 * Detect Quran verse references in text
 */
export function detectQuranVerses(text: string): QuranReference[] {
  const references: QuranReference[] = [];
  const seen = new Set<string>();

  // Pattern 1: سورة البقرة آية 255
  const pattern1 = /سورة\s+([^\s]+)\s+آية\s+(\d+)(?:\s*-\s*(\d+))?/g;
  let match;

  while ((match = pattern1.exec(text)) !== null) {
    const surahName = match[1];
    const ayah = parseInt(match[2], 10);
    const ayahEnd = match[3] ? parseInt(match[3], 10) : undefined;
    const surah = SURAH_NAMES[surahName];

    if (surah && isValidReference(surah, ayah)) {
      const key = `${surah}:${ayah}:${ayahEnd || ''}`;
      if (!seen.has(key)) {
        seen.add(key);
        references.push({
          surah,
          ayah,
          ayahEnd,
          display: `${surahName}: ${ayahEnd ? `${ayah}-${ayahEnd}` : ayah}`,
          url: quranComUrl(surah, ayah, ayahEnd),
        });
      }
    }
  }

  // Pattern 2: (البقرة: 255) or (البقرة: 255-260)
  const pattern2 = /\(([^:()]+):\s*(\d+)(?:\s*-\s*(\d+))?\)/g;

  while ((match = pattern2.exec(text)) !== null) {
    const surahName = match[1].trim();
    const ayah = parseInt(match[2], 10);
    const ayahEnd = match[3] ? parseInt(match[3], 10) : undefined;
    const surah = SURAH_NAMES[surahName];

    if (surah && isValidReference(surah, ayah)) {
      const key = `${surah}:${ayah}:${ayahEnd || ''}`;
      if (!seen.has(key)) {
        seen.add(key);
        references.push({
          surah,
          ayah,
          ayahEnd,
          display: `${surahName}: ${ayahEnd ? `${ayah}-${ayahEnd}` : ayah}`,
          url: quranComUrl(surah, ayah, ayahEnd),
        });
      }
    }
  }

  // Pattern 3: Numeric format 2:255 or 2:255-260
  // Only match when surrounded by non-digit characters to avoid false positives
  const pattern3 = /(?<![0-9])(\d{1,3}):(\d{1,3})(?:-(\d{1,3}))?(?![0-9])/g;

  while ((match = pattern3.exec(text)) !== null) {
    const surah = parseInt(match[1], 10);
    const ayah = parseInt(match[2], 10);
    const ayahEnd = match[3] ? parseInt(match[3], 10) : undefined;

    if (isValidReference(surah, ayah)) {
      const key = `${surah}:${ayah}:${ayahEnd || ''}`;
      if (!seen.has(key)) {
        seen.add(key);
        const surahName = SURAH_NUMBERS_TO_NAMES[surah] || `Surah ${surah}`;
        references.push({
          surah,
          ayah,
          ayahEnd,
          display: `${surahName}: ${ayahEnd ? `${ayah}-${ayahEnd}` : ayah}`,
          url: quranComUrl(surah, ayah, ayahEnd),
        });
      }
    }
  }

  return references;
}

/**
 * Replace Quran references in text with linked versions
 * Returns HTML with anchor tags
 */
export function linkQuranVerses(text: string): string {
  let result = text;

  // Pattern 1: سورة البقرة آية 255
  result = result.replace(
    /سورة\s+([^\s]+)\s+آية\s+(\d+)(?:\s*-\s*(\d+))?/g,
    (match, surahName, ayah, ayahEnd) => {
      const surah = SURAH_NAMES[surahName];
      if (surah && isValidReference(surah, parseInt(ayah, 10))) {
        const url = quranComUrl(surah, parseInt(ayah, 10), ayahEnd ? parseInt(ayahEnd, 10) : undefined);
        return `<a href="${url}" target="_blank" rel="noopener noreferrer" class="quran-link">${match}</a>`;
      }
      return match;
    }
  );

  // Pattern 2: (البقرة: 255)
  result = result.replace(
    /\(([^:()]+):\s*(\d+)(?:\s*-\s*(\d+))?\)/g,
    (match, surahName, ayah, ayahEnd) => {
      const surah = SURAH_NAMES[surahName.trim()];
      if (surah && isValidReference(surah, parseInt(ayah, 10))) {
        const url = quranComUrl(surah, parseInt(ayah, 10), ayahEnd ? parseInt(ayahEnd, 10) : undefined);
        return `<a href="${url}" target="_blank" rel="noopener noreferrer" class="quran-link">${match}</a>`;
      }
      return match;
    }
  );

  return result;
}
