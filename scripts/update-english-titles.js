const Database = require('better-sqlite3');
const { createClient } = require('@libsql/client');

// Common Arabic names and words with proper English transliterations
const commonWords = {
  // Titles
  'الکافي': 'Al-Kafi',
  'الكافي': 'Al-Kafi',
  'بحار الأنوار': 'Bihar al-Anwar',
  'وسائل الشیعة': 'Wasail al-Shia',
  'وسائل الشيعة': 'Wasail al-Shia',
  'نهج البلاغة': 'Nahj al-Balagha',
  'نهج البلاغه': 'Nahj al-Balagha',
  'الصحيفة السجادية': 'Al-Sahifa al-Sajjadiyya',
  'الصحیفة السجادیة': 'Al-Sahifa al-Sajjadiyya',
  'صحیفه سجادیه': 'Sahifa Sajjadiyya',
  'صحیفه کامله سجادیه': 'Sahifa Kamila Sajjadiyya',
  'تهذيب الأحكام': 'Tahdhib al-Ahkam',
  'الاستبصار': 'Al-Istibsar',
  'من لايحضره الفقيه': 'Man La Yahduruhu al-Faqih',
  'الوافي': 'Al-Wafi',
  'مستدرك الوسائل': 'Mustadrak al-Wasail',
  'الأمالي': 'Al-Amali',
  'الأمالی': 'Al-Amali',
  'أمالي': 'Amali',
  'أمالى': 'Amali',
  'الخصال': 'Al-Khisal',
  'التوحيد': 'Al-Tawhid',
  'التوحید': 'Al-Tawhid',
  'الإرشاد': 'Al-Irshad',
  'الغيبة': 'Al-Ghayba',
  'الغیبة': 'Al-Ghayba',
  'بصائر الدرجات': 'Basair al-Darajat',
  'المحاسن': 'Al-Mahasin',
  'علل الشرائع': 'Ilal al-Sharai',
  'عيون أخبار الرضا': 'Uyun Akhbar al-Rida',
  'کمال الدین': 'Kamal al-Din',
  'كمال الدين': 'Kamal al-Din',
  'معاني الأخبار': 'Maani al-Akhbar',
  'ثواب الأعمال': 'Thawab al-Amal',
  'الاحتجاج': 'Al-Ihtijaj',
  'الإختصاص': 'Al-Ikhtisas',
  'الاختصاص': 'Al-Ikhtisas',
  'تفسير': 'Tafsir',
  'تفسیر': 'Tafsir',
  'شرح': 'Sharh',
  'ترجمه': 'Tarjuma',
  'ترجمة': 'Tarjuma',
  'رجال': 'Rijal',
  'الرجال': 'Al-Rijal',
  'مصباح': 'Misbah',
  'المصباح': 'Al-Misbah',
  'دعوات': 'Dawaat',
  'الدعوات': 'Al-Dawaat',
  'فقه': 'Fiqh',
  'الفقه': 'Al-Fiqh',
  'الفقيه': 'Al-Faqih',
  'الفقیه': 'Al-Faqih',
  'حدیث': 'Hadith',
  'حديث': 'Hadith',
  'أحادیث': 'Ahadith',
  'احادیث': 'Ahadith',
  'الأربعون': 'Al-Arbaun',
  'أربعون': 'Arbaun',
  'الأربعین': 'Al-Arbain',
  'مناقب': 'Manaqib',
  'المناقب': 'Al-Manaqib',
  'فضائل': 'Fadail',
  'الفضائل': 'Al-Fadail',
  'الروضة': 'Al-Rawda',
  'روضة': 'Rawda',

  // Common terms
  'الإمام': 'al-Imam',
  'الامام': 'al-Imam',
  'إمام': 'Imam',
  'امام': 'Imam',
  'علیه السلام': '(a.s.)',
  'عليه السلام': '(a.s.)',
  'علیهم السلام': '(a.s.)',
  'عليهم السلام': '(a.s.)',
  'صلی الله علیه وآله': '(s.a.w.a.)',
  'رضي الله عنه': '',

  // Authors - Common names
  'محمد': 'Muhammad',
  'علی': 'Ali',
  'علي': 'Ali',
  'حسن': 'Hasan',
  'حسین': 'Husayn',
  'حسين': 'Husayn',
  'جعفر': 'Jafar',
  'موسی': 'Musa',
  'موسى': 'Musa',
  'عبدالله': 'Abdullah',
  'عبد الله': 'Abd Allah',
  'احمد': 'Ahmad',
  'أحمد': 'Ahmad',
  'ابراهیم': 'Ibrahim',
  'ابراهيم': 'Ibrahim',
  'اسماعیل': 'Ismail',
  'یعقوب': 'Yaqub',
  'يعقوب': 'Yaqub',
  'یوسف': 'Yusuf',
  'يوسف': 'Yusuf',
  'داود': 'Dawud',
  'سلیمان': 'Sulayman',
  'سليمان': 'Sulayman',
  'هاشم': 'Hashim',
  'باقر': 'Baqir',
  'صادق': 'Sadiq',
  'کاظم': 'Kazim',
  'كاظم': 'Kazim',
  'رضا': 'Rida',
  'هادی': 'Hadi',
  'هادي': 'Hadi',
  'مهدی': 'Mahdi',
  'مهدي': 'Mahdi',
  'یحیی': 'Yahya',
  'يحيى': 'Yahya',
  'زکریا': 'Zakariya',
  'عمر': 'Umar',
  'عثمان': 'Uthman',
  'خالد': 'Khalid',
  'طاهر': 'Tahir',
  'ناصر': 'Nasir',
  'منصور': 'Mansur',
  'فضل': 'Fadl',
  'نعمت': 'Nimat',
  'نعمان': 'Numan',
  'سعید': 'Said',
  'سعيد': 'Said',
  'مسعود': 'Masud',

  // Author titles/nisba
  'ابن': 'Ibn',
  'بن': 'ibn',
  'أبو': 'Abu',
  'ابو': 'Abu',
  'آل': 'Al',
  'شیخ': 'Shaykh',
  'شيخ': 'Shaykh',
  'سید': 'Sayyid',
  'سيد': 'Sayyid',
  'علامه': 'Allama',
  'علامة': 'Allama',
  'العلامة': 'al-Allama',
  'العلامه': 'al-Allama',
  'میرزا': 'Mirza',
  'ملا': 'Mulla',

  // Locations/Nisba
  'کلینی': 'al-Kulayni',
  'كليني': 'al-Kulayni',
  'مجلسی': 'al-Majlisi',
  'مجلسي': 'al-Majlisi',
  'طوسی': 'al-Tusi',
  'طوسي': 'al-Tusi',
  'صدوق': 'al-Saduq',
  'مفید': 'al-Mufid',
  'مفيد': 'al-Mufid',
  'طبرسی': 'al-Tabrisi',
  'طبرسي': 'al-Tabrisi',
  'بحرانی': 'al-Bahrani',
  'بحراني': 'al-Bahrani',
  'عاملی': 'al-Amili',
  'عاملي': 'al-Amili',
  'حر عاملی': 'al-Hurr al-Amili',
  'حر عاملي': 'al-Hurr al-Amili',
  'قمی': 'al-Qummi',
  'قمي': 'al-Qummi',
  'نجفی': 'al-Najafi',
  'نجفي': 'al-Najafi',
  'کاشانی': 'al-Kashani',
  'كاشاني': 'al-Kashani',
  'فیض کاشانی': 'Fayd al-Kashani',
  'فيض كاشاني': 'Fayd al-Kashani',
  'راوندی': 'al-Rawandi',
  'راوندي': 'al-Rawandi',
  'حلی': 'al-Hilli',
  'حلي': 'al-Hilli',
  'نوری': 'al-Nuri',
  'نوري': 'al-Nuri',
  'کشی': 'al-Kashshi',
  'كشي': 'al-Kashshi',
  'برقی': 'al-Barqi',
  'برقي': 'al-Barqi',
  'همدانی': 'al-Hamdani',
  'همداني': 'al-Hamdani',
  'اصفهانی': 'al-Isfahani',
  'اصفهاني': 'al-Isfahani',
  'شیرازی': 'al-Shirazi',
  'شيرازي': 'al-Shirazi',
  'تبریزی': 'al-Tabrizi',
  'تبريزي': 'al-Tabrizi',
  'خراسانی': 'al-Khurasani',
  'خراساني': 'al-Khurasani',
  'بغدادی': 'al-Baghdadi',
  'بغدادي': 'al-Baghdadi',
  'دمشقی': 'al-Dimashqi',
  'دمشقي': 'al-Dimashqi',
  'مصری': 'al-Misri',
  'مصري': 'al-Misri',
  'مکی': 'al-Makki',
  'مكي': 'al-Makki',
  'مدنی': 'al-Madani',
  'مدني': 'al-Madani',
  'کوفی': 'al-Kufi',
  'كوفي': 'al-Kufi',
  'بصری': 'al-Basri',
  'بصري': 'al-Basri',
  'شبر': 'Shubar',
  'جزایری': 'al-Jazairi',
  'جزائري': 'al-Jazairi',

  // Ibn + name combinations
  'ابن‌بابویه': 'Ibn Babawayh',
  'ابن بابویه': 'Ibn Babawayh',
  'ابن‌طاووس': 'Ibn Tawus',
  'ابن طاووس': 'Ibn Tawus',
  'ابن‌شهرآشوب': 'Ibn Shahrashub',
  'ابن شهرآشوب': 'Ibn Shahrashub',
  'ابن‌ادریس': 'Ibn Idris',
  'ابن ادریس': 'Ibn Idris',
  'ابن‌حمزه': 'Ibn Hamza',
  'ابن حمزه': 'Ibn Hamza',

  // Other common
  'الله': 'Allah',
  'رسول': 'Rasul',
  'النبی': 'al-Nabi',
  'النبي': 'al-Nabi',
  'نبی': 'Nabi',
  'نبي': 'Nabi',
  'أهل البیت': 'Ahl al-Bayt',
  'اهل بیت': 'Ahl al-Bayt',
  'الأئمة': 'al-Aimma',
  'الائمة': 'al-Aimma',
  'أئمة': 'Aimma',
  'ائمة': 'Aimma',
  'أمیرالمؤمنین': 'Amir al-Muminin',
  'امیرالمومنین': 'Amir al-Muminin',
  'أبی طالب': 'Abi Talib',
  'أبي طالب': 'Abi Talib',
  'ابی طالب': 'Abi Talib',
  'ابي طالب': 'Abi Talib',
  'القرآن': 'al-Quran',
  'قرآن': 'Quran',
};

function transliterate(text) {
  if (!text) return '';

  let result = text;

  // Sort by length (longest first) to avoid partial replacements
  const sortedWords = Object.keys(commonWords).sort((a, b) => b.length - a.length);

  for (const arabic of sortedWords) {
    const english = commonWords[arabic];
    result = result.split(arabic).join(english);
  }

  // Clean up remaining Arabic characters with basic transliteration
  const basicTranslit = {
    'ا': 'a', 'أ': 'a', 'إ': 'i', 'آ': 'a', 'ء': '',
    'ب': 'b', 'پ': 'p', 'ت': 't', 'ث': 'th',
    'ج': 'j', 'چ': 'ch', 'ح': 'h', 'خ': 'kh',
    'د': 'd', 'ذ': 'dh', 'ر': 'r', 'ز': 'z', 'ژ': 'zh',
    'س': 's', 'ش': 'sh', 'ص': 's', 'ض': 'd',
    'ط': 't', 'ظ': 'z', 'ع': '', 'غ': 'gh',
    'ف': 'f', 'ق': 'q', 'ک': 'k', 'ك': 'k', 'گ': 'g',
    'ل': 'l', 'م': 'm', 'ن': 'n', 'ه': 'h', 'ة': 'a',
    'و': 'w', 'ؤ': '', 'ی': 'i', 'ي': 'i', 'ى': 'a', 'ئ': '',
    'َ': 'a', 'ِ': 'i', 'ُ': 'u', 'ً': '', 'ٍ': '', 'ٌ': '',
    'ّ': '', 'ْ': '', 'ـ': '', '‌': ' ', '،': ',', '؛': ';',
  };

  let cleaned = '';
  for (const char of result) {
    if (basicTranslit[char] !== undefined) {
      cleaned += basicTranslit[char];
    } else {
      cleaned += char;
    }
  }

  // Clean up
  cleaned = cleaned
    .replace(/\s+/g, ' ')
    .replace(/\(\s*\)/g, '')
    .replace(/\s*,\s*/g, ', ')
    .trim();

  return cleaned;
}

async function main() {
  const TURSO_DATABASE_URL = 'libsql://hadith-hadithhub12.aws-us-east-2.turso.io';
  const TURSO_AUTH_TOKEN = process.env.TURSO_AUTH_TOKEN;

  if (!TURSO_AUTH_TOKEN) {
    console.error('TURSO_AUTH_TOKEN required');
    process.exit(1);
  }

  // Connect to local DB
  const localDb = new Database('./src/data/hadith.db');

  // Connect to Turso
  const turso = createClient({
    url: TURSO_DATABASE_URL,
    authToken: TURSO_AUTH_TOKEN,
  });

  // Get all books
  const books = localDb.prepare('SELECT id, title_ar, author_ar FROM books').all();
  console.log(`Processing ${books.length} books...`);

  // Update local DB
  const updateLocal = localDb.prepare('UPDATE books SET title_en = ?, author_en = ? WHERE id = ?');

  let count = 0;
  const updates = [];

  for (const book of books) {
    const titleEn = transliterate(book.title_ar);
    const authorEn = transliterate(book.author_ar);

    // Update local
    updateLocal.run(titleEn, authorEn, book.id);

    // Prepare for Turso batch
    updates.push({
      sql: 'UPDATE books SET title_en = ?, author_en = ? WHERE id = ?',
      args: [titleEn, authorEn, book.id]
    });

    count++;
    if (count % 100 === 0) {
      console.log(`Processed ${count}/${books.length} books locally`);
    }
  }

  console.log(`\nLocal database updated: ${count} books`);

  // Sync to Turso in batches
  console.log('\nSyncing to Turso production...');
  const BATCH_SIZE = 50;

  for (let i = 0; i < updates.length; i += BATCH_SIZE) {
    const batch = updates.slice(i, i + BATCH_SIZE);
    await turso.batch(batch, 'write');

    if ((i + BATCH_SIZE) % 200 < BATCH_SIZE) {
      console.log(`Turso progress: ${Math.min(i + BATCH_SIZE, updates.length)}/${updates.length}`);
    }
  }

  console.log(`\nTurso production updated: ${updates.length} books`);
  console.log('\nDone!');

  localDb.close();
}

main().catch(console.error);
