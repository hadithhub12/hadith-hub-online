/**
 * Roman-to-Arabic transliteration for quran.com-style search
 * Converts romanized Arabic words to possible Arabic equivalents
 */

// Common words mapping (exact matches)
const COMMON_WORDS: Record<string, string[]> = {
  // Core Islamic terms
  'allah': ['الله', 'اللّه'],
  'muhammad': ['محمد', 'محمّد'],
  'hadith': ['حديث', 'الحديث', 'حدیث'],
  'imam': ['إمام', 'امام', 'الإمام', 'الامام'],
  'quran': ['قرآن', 'القرآن'],
  'prophet': ['نبي', 'النبي', 'رسول'],
  'rasool': ['رسول', 'الرسول'],
  'rasul': ['رسول', 'الرسول'],
  'salam': ['سلام', 'السلام'],
  'salat': ['صلاة', 'الصلاة'],
  'zakat': ['زكاة', 'الزكاة'],
  'hajj': ['حج', 'الحج'],
  'sawm': ['صوم', 'الصوم'],
  'fasting': ['صوم', 'الصوم', 'صيام'],
  'prayer': ['صلاة', 'الصلاة', 'دعاء'],
  'dua': ['دعاء', 'الدعاء'],

  // Famous hadith terms - man kunto maula
  'man': ['من', 'مَن', 'مَنْ'],
  'kunto': ['كنت', 'كُنت', 'كُنْت', 'کنت'],
  'kunt': ['كنت', 'كُنت', 'كُنْت', 'کنت'],
  'maula': ['مولا', 'مولى', 'مَولا', 'مَوْلا', 'مولاه'],
  'mawla': ['مولا', 'مولى', 'مَولا', 'مَوْلا', 'مولاه'],
  'mola': ['مولا', 'مولى', 'مَولا', 'مولاه'],
  'hadha': ['هذا', 'هَذا', 'فهذا'],
  'haza': ['هذا', 'هَذا', 'فهذا'],
  'ghadir': ['غدير', 'الغدير', 'غَدير'],
  'khumm': ['خم', 'خُم'],
  'khum': ['خم', 'خُم'],
  'thaqalayn': ['ثقلين', 'الثقلين', 'ثَقَلَين'],
  'saqlain': ['ثقلين', 'الثقلين'],

  // Book and chapter terms
  'book': ['كتاب', 'الكتاب', 'کتاب'],
  'kitab': ['كتاب', 'الكتاب', 'کتاب'],
  'chapter': ['باب', 'فصل'],
  'bab': ['باب', 'الباب'],

  // Narration terms
  'narrated': ['روى', 'حدثنا', 'أخبرنا'],
  'said': ['قال', 'قالت', 'قَال'],
  'qala': ['قال', 'قَال'],
  'qal': ['قال', 'قَال'],
  'from': ['عن', 'من'],
  'an': ['عن', 'أن', 'أنّ', 'إن'],
  'inna': ['إن', 'إنّ', 'أن', 'أنّ'],
  'anna': ['أن', 'أنّ', 'أنه'],

  // Names - Imams and Prophets
  'ali': ['علي', 'عليّ', 'علیّ'],
  'hussain': ['حسين', 'الحسين', 'حُسين'],
  'husain': ['حسين', 'الحسين', 'حُسين'],
  'husayn': ['حسين', 'الحسين', 'حُسين'],
  'hussein': ['حسين', 'الحسين', 'حُسين'],
  'hassan': ['حسن', 'الحسن', 'حَسن'],
  'hasan': ['حسن', 'الحسن', 'حَسن'],
  'fatima': ['فاطمة', 'فاطمه'],
  'zahra': ['زهراء', 'الزهراء'],
  'jafar': ['جعفر', 'جَعفر'],
  'sadiq': ['صادق', 'الصادق'],
  'baqir': ['باقر', 'الباقر'],
  'kazim': ['كاظم', 'الكاظم', 'کاظم'],
  'rida': ['رضا', 'الرضا'],
  'ridha': ['رضا', 'الرضا'],
  'jawad': ['جواد', 'الجواد'],
  'hadi': ['هادي', 'الهادي', 'هادی'],
  'askari': ['عسكري', 'العسكري', 'عسکری'],
  'mahdi': ['مهدي', 'المهدي', 'مهدی'],

  // Other names
  'khadija': ['خديجة', 'خدیجه'],
  'aisha': ['عائشة', 'عایشه'],
  'abu': ['أبو', 'ابو', 'أبي', 'ابی'],
  'ibn': ['ابن', 'بن'],
  'bin': ['بن', 'ابن'],
  'bint': ['بنت'],
  'umm': ['أم', 'ام'],

  // Common descriptors
  'sharif': ['شريف', 'شریف'],
  'hikam': ['حکم', 'حكم', 'الحكم'],
  'gharar': ['غرر'],
  'amir': ['أمير', 'امیر', 'أمیر'],
  'muminin': ['مؤمنين', 'المؤمنین', 'المومنین'],
  'mumineen': ['مؤمنين', 'المؤمنین', 'المومنین'],

  // Theological terms
  'tawhid': ['توحيد', 'التوحيد', 'توحید'],
  'nubuwwa': ['نبوة', 'النبوة', 'نبوه'],
  'imama': ['امامة', 'الامامة', 'إمامة'],
  'adl': ['عدل', 'العدل'],
  'maad': ['معاد', 'المعاد'],
  'qiyama': ['قيامة', 'القيامة', 'قیامه'],

  // Book titles
  'kafi': ['كافي', 'الكافي', 'کافی'],
  'bihar': ['بحار', 'بِحار'],
  'anwar': ['أنوار', 'الأنوار', 'انوار'],
  'wasail': ['وسائل', 'الوسائل'],
  'nahj': ['نهج', 'نَهج'],
  'balagha': ['بلاغة', 'البلاغة', 'بلاغه'],

  // Verbs and common words
  'alayka': ['عليك', 'علیک'],
  'alayhi': ['عليه', 'علیه'],
  'alayha': ['عليها', 'علیها'],
  'salla': ['صلى', 'صَلّى'],
  'wasallam': ['وسلم', 'وسلّم'],
  'rabb': ['رب', 'ربّ', 'الرب'],
  'rabbi': ['ربي', 'ربّي'],
  'ilahi': ['إلهي', 'الهي'],
  'ya': ['يا', 'یا'],
  'wa': ['و', 'وَ'],
  'la': ['لا', 'لَا'],
  'ila': ['إلى', 'الى', 'إلی'],
  'fi': ['في', 'فی', 'فِي'],
  'min': ['من', 'مِن'],
  'ala': ['على', 'علی', 'عَلى'],
  'huwa': ['هو', 'هُو'],
  'hiya': ['هي', 'هِي'],
  'ana': ['أنا', 'انا'],
  'anta': ['أنت', 'انت'],
  'nahnu': ['نحن'],
  'hum': ['هم', 'هُم'],
  'allahumma': ['اللهم', 'اللّهم'],
  'bismillah': ['بسم الله', 'بسمالله'],
  'subhan': ['سبحان'],
  'alhamdulillah': ['الحمد لله', 'الحمدلله'],
};

// Letter mappings (Roman to possible Arabic letters)
const LETTER_MAP: Record<string, string[]> = {
  // Vowels - most common first
  'a': ['ا', 'أ', 'ع', 'ى', 'إ', 'آ'],
  'e': ['ي', 'ا', 'ى', 'ع'],
  'i': ['ي', 'ا', 'إ'],
  'o': ['و', 'ا'],
  'u': ['و', 'ا', 'ؤ'],
  // Long vowels
  'aa': ['ا', 'آ', 'ى'],
  'ee': ['ي', 'ى'],
  'ii': ['ي', 'ى'],
  'oo': ['و'],
  'ou': ['و'],
  'aw': ['او', 'و'],
  'ay': ['اي', 'ي'],

  // Consonants
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
  'ss': ['ص'],
  'gh': ['غ'],
  'f': ['ف'],
  'q': ['ق', 'ك'],
  'k': ['ك', 'ک', 'ق'],
  'l': ['ل'],
  'm': ['م'],
  'n': ['ن'],
  'w': ['و', 'ؤ'],
  'y': ['ي', 'ى', 'ئ'],
  'c': ['ك', 'س'],
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
  // Increase limit for better coverage
  return generateCombinations(results).slice(0, 20);
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

  // Build possible transliterations
  function build(current: string, pos: number) {
    // Limit results during generation
    if (results.length >= 10) return;

    if (pos >= word.length) {
      results.push(current);
      return;
    }

    // Check for two-letter combinations first
    if (pos < word.length - 1) {
      const twoLetters = word.slice(pos, pos + 2);
      if (LETTER_MAP[twoLetters]) {
        for (const arabic of LETTER_MAP[twoLetters].slice(0, 3)) {
          build(current + arabic, pos + 2);
        }
        // Also try single letter to allow for more variations
        const letter = word[pos];
        if (LETTER_MAP[letter]) {
          for (const arabic of LETTER_MAP[letter].slice(0, 2)) {
            build(current + arabic, pos + 1);
          }
        }
        return;
      }
    }

    // Single letter
    const letter = word[pos];
    if (LETTER_MAP[letter]) {
      for (const arabic of LETTER_MAP[letter].slice(0, 3)) { // Increase limit
        build(current + arabic, pos + 1);
      }
    } else {
      // Skip unknown characters
      build(current, pos + 1);
    }
  }

  build('', 0);

  // Return unique results
  return [...new Set(results)].slice(0, 8);
}

function generateCombinations(wordOptions: string[][]): string[] {
  if (wordOptions.length === 0) return [''];
  if (wordOptions.length === 1) return wordOptions[0];

  const results: string[] = [];
  const [first, ...rest] = wordOptions;
  const restCombinations = generateCombinations(rest);

  // Increase limits for better coverage
  for (const word of first.slice(0, 4)) {
    for (const combo of restCombinations.slice(0, 5)) {
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
