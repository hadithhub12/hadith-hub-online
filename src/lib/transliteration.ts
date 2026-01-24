/**
 * Roman-to-Arabic transliteration for quran.com-style search
 * Converts romanized Arabic words to possible Arabic equivalents
 */

// Common words mapping (exact matches)
const COMMON_WORDS: Record<string, string[]> = {
  'allah': ['الله'],
  'muhammad': ['محمد', 'محمّد'],
  'hadith': ['حديث', 'الحديث'],
  'imam': ['إمام', 'امام', 'الإمام'],
  'quran': ['قرآن', 'القرآن'],
  'prophet': ['نبي', 'النبي', 'رسول'],
  'rasool': ['رسول', 'الرسول'],
  'salam': ['سلام', 'السلام'],
  'salat': ['صلاة', 'الصلاة'],
  'zakat': ['زكاة', 'الزكاة'],
  'hajj': ['حج', 'الحج'],
  'sawm': ['صوم', 'الصوم'],
  'fasting': ['صوم', 'الصوم', 'صيام'],
  'prayer': ['صلاة', 'الصلاة', 'دعاء'],
  'book': ['كتاب', 'الكتاب'],
  'chapter': ['باب', 'فصل'],
  'narrated': ['روى', 'حدثنا', 'أخبرنا'],
  'said': ['قال', 'قالت'],
  'from': ['عن', 'من'],
  'ali': ['علي', 'عليّ'],
  'hussain': ['حسين', 'الحسين'],
  'hassan': ['حسن', 'الحسن'],
  'fatima': ['فاطمة'],
  'khadija': ['خديجة'],
  'aisha': ['عائشة'],
  'abu': ['أبو', 'ابو'],
  'ibn': ['ابن', 'بن'],
  'bint': ['بنت'],
  'sharif': ['شريف'],
  'hikam': ['حکم', 'حكم', 'الحكم'],
  'gharar': ['غرر'],
};

// Letter mappings (Roman to possible Arabic letters)
const LETTER_MAP: Record<string, string[]> = {
  'a': ['ا', 'أ', 'إ', 'آ', 'ع', 'ى'],
  'b': ['ب'],
  't': ['ت', 'ط'],
  'th': ['ث', 'ذ'],
  'j': ['ج'],
  'h': ['ه', 'ح', 'ة'],
  'kh': ['خ'],
  'd': ['د', 'ض'],
  'dh': ['ذ', 'ظ'],
  'r': ['ر'],
  'z': ['ز', 'ظ'],
  's': ['س', 'ص'],
  'sh': ['ش'],
  'gh': ['غ'],
  'f': ['ف'],
  'q': ['ق'],
  'k': ['ك', 'ک'],
  'l': ['ل'],
  'm': ['م'],
  'n': ['ن'],
  'w': ['و', 'ؤ'],
  'y': ['ي', 'ى', 'ئ'],
  'e': ['ي', 'ى', 'ا', 'ع'],
  'i': ['ي', 'إ', 'ا'],
  'o': ['و', 'ا'],
  'u': ['و', 'ا', 'ؤ'],
  'aa': ['ا', 'آ'],
  'ee': ['ي', 'ى'],
  'oo': ['و'],
};

// Prefix handling
const PREFIXES: Record<string, string[]> = {
  'al-': ['ال'],
  'al': ['ال'],
  'el-': ['ال'],
  'el': ['ال'],
};

/**
 * Check if a string contains only ASCII letters and basic punctuation
 */
export function isRomanText(text: string): boolean {
  return /^[a-zA-Z\s\-']+$/.test(text.trim());
}

/**
 * Normalize Arabic text for search (remove diacritics, normalize characters)
 */
export function normalizeArabic(text: string): string {
  return text
    // Remove Arabic diacritics (tashkeel)
    .replace(/[\u064B-\u065F\u0670]/g, '')
    // Normalize alef variants to bare alef
    .replace(/[أإآ]/g, 'ا')
    // Normalize alef maksura to yaa
    .replace(/ى/g, 'ي')
    // Normalize taa marbuta to haa
    .replace(/ة/g, 'ه')
    // Remove tatweel
    .replace(/ـ/g, '')
    // Normalize Persian/Urdu characters
    .replace(/ک/g, 'ك')
    .replace(/ی/g, 'ي')
    .trim();
}

/**
 * Convert Roman text to possible Arabic search queries
 */
export function romanToArabic(text: string): string[] {
  const normalized = text.toLowerCase().trim();
  const words = normalized.split(/\s+/);
  const results: string[][] = [];

  for (const word of words) {
    const arabicOptions = convertWord(word);
    results.push(arabicOptions);
  }

  // Generate combinations (limit to avoid explosion)
  return generateCombinations(results).slice(0, 10);
}

function convertWord(word: string): string[] {
  // Check common words first
  const lowerWord = word.toLowerCase();
  if (COMMON_WORDS[lowerWord]) {
    return COMMON_WORDS[lowerWord];
  }

  // Handle prefixes
  let prefix = '';
  let stem = word;

  for (const [romanPrefix, arabicPrefixes] of Object.entries(PREFIXES)) {
    if (lowerWord.startsWith(romanPrefix)) {
      prefix = arabicPrefixes[0];
      stem = word.slice(romanPrefix.length);
      break;
    }
  }

  // Convert letter by letter
  const arabicOptions = transliterateLetters(stem.toLowerCase());

  if (prefix) {
    return arabicOptions.map(opt => prefix + opt);
  }

  return arabicOptions;
}

function transliterateLetters(word: string): string[] {
  if (word.length === 0) return [''];

  const results: string[] = [];
  let i = 0;

  // Build possible transliterations
  function build(current: string, pos: number) {
    if (pos >= word.length) {
      results.push(current);
      return;
    }

    // Check for two-letter combinations first
    if (pos < word.length - 1) {
      const twoLetters = word.slice(pos, pos + 2);
      if (LETTER_MAP[twoLetters]) {
        for (const arabic of LETTER_MAP[twoLetters]) {
          build(current + arabic, pos + 2);
        }
        return;
      }
    }

    // Single letter
    const letter = word[pos];
    if (LETTER_MAP[letter]) {
      for (const arabic of LETTER_MAP[letter].slice(0, 2)) { // Limit options
        build(current + arabic, pos + 1);
      }
    } else {
      // Skip unknown characters
      build(current, pos + 1);
    }
  }

  build('', 0);

  // Limit results to prevent explosion
  return results.slice(0, 5);
}

function generateCombinations(wordOptions: string[][]): string[] {
  if (wordOptions.length === 0) return [''];
  if (wordOptions.length === 1) return wordOptions[0];

  const results: string[] = [];
  const [first, ...rest] = wordOptions;
  const restCombinations = generateCombinations(rest);

  for (const word of first.slice(0, 3)) { // Limit first word options
    for (const combo of restCombinations.slice(0, 3)) { // Limit combinations
      results.push(word + ' ' + combo);
    }
  }

  return results;
}

/**
 * Prepare query for FTS5 search
 * Handles both Arabic and Roman input
 */
export function prepareSearchQuery(query: string): string[] {
  const trimmed = query.trim();

  if (!trimmed) return [];

  if (isRomanText(trimmed)) {
    // Convert Roman to Arabic variations
    const arabicQueries = romanToArabic(trimmed);
    return arabicQueries.map(q => normalizeArabic(q));
  } else {
    // Direct Arabic search
    return [normalizeArabic(trimmed)];
  }
}
