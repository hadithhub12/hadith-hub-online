/**
 * Update all book names using:
 * 1. Excel data for first ~200 rows (where alignment is correct)
 * 2. Knowledge-based matching for English titles to Arabic books
 */

const fs = require('fs');
const path = require('path');
const Database = require('better-sqlite3');
const XLSX = require('xlsx');

const DB_PATH = path.join(__dirname, '..', 'src', 'data', 'hadith.db');
const EXCEL_PATH = 'C:\\Users\\syedf\\OneDrive\\Desktop\\List_of_books.xlsx';

// Normalize Arabic for matching
function normalizeArabic(text) {
  if (!text) return '';
  return text
    .replace(/[\u064B-\u065F\u0670]/g, '')
    .replace(/[أإآء]/g, 'ا')
    .replace(/ى/g, 'ي')
    .replace(/ة/g, 'ه')
    .replace(/ـ/g, '')
    .replace(/ک/g, 'ك')
    .replace(/ی/g, 'ي')
    .replace(/[\s\-\(\)\[\]\/\\,،.۔:؛«»\"\']/g, '')
    .toLowerCase()
    .trim();
}

// Load Excel
const workbook = XLSX.readFile(EXCEL_PATH);
const sheet = workbook.Sheets[workbook.SheetNames[0]];

// Get all unique English entries (title + author) from Excel
const englishEntries = [];
for (let row = 2; row <= 750; row++) {
  const titleEn = (sheet['C' + row]?.v || '').trim();
  const authorEn = (sheet['E' + row]?.v || '').trim();
  if (titleEn) {
    englishEntries.push({ titleEn, authorEn, row });
  }
}

// Deduplicate English entries (keep first occurrence)
const uniqueEnglish = new Map();
for (const entry of englishEntries) {
  const key = entry.titleEn;
  if (!uniqueEnglish.has(key)) {
    uniqueEnglish.set(key, entry);
  }
}

console.log(`Loaded ${uniqueEnglish.size} unique English titles from Excel\n`);

// Open database
const db = new Database(DB_PATH);
db.pragma('journal_mode = WAL');

const books = db.prepare('SELECT id, title_ar, title_en, author_ar, author_en FROM books').all();
console.log(`Found ${books.length} books in database\n`);

// Knowledge-based mapping: Arabic title patterns -> English title
const ARABIC_TO_ENGLISH = {
  // Kutub Arba'a (Four Books)
  'الكافي': { en: 'Al-Kafi', author: 'Kulaini, Muhammad bin Yaqub (ra)' },
  'الکافي': { en: 'Al-Kafi', author: 'Kulaini, Muhammad bin Yaqub (ra)' },
  'من لايحضره الفقيه': { en: 'Man La Yahduruhu al-Faqih', author: 'Ibn Babawayh, Muhammad bin Ali (Shaykh Saduq) (ra)' },
  'تهذيب الأحكام': { en: 'Tahdhib al-Ahkam', author: 'Shaykh al-Tusi, Muhammad bin Hasan (ra)' },
  'الاستبصار': { en: 'Al-Istibsar', author: 'Shaykh al-Tusi, Muhammad bin Hasan (ra)' },

  // Major Collections
  'بحار الأنوار': { en: 'Bihar al-Anwar', author: 'Allama Majlisi, Muhammad Baqir (ra)' },
  'وسائل الشیعة': { en: "Wasa'il al-Shia", author: 'Al-Hurr al-Amili, Muhammad bin Hasan (ra)' },
  'وسايل الشيعه': { en: "Wasa'il al-Shia", author: 'Al-Hurr al-Amili, Muhammad bin Hasan (ra)' },
  'مستدرك الوسائل': { en: "Mustadrak al-Wasa'il", author: 'Mirza Husayn al-Nuri (ra)' },
  'الوافي': { en: 'Al-Wafi', author: 'Fayd Kashani, Muhammad bin Shah Murtadha (ra)' },

  // Nahj al-Balagha
  'نهج البلاغة': { en: 'Nahj al-Balagha', author: 'Sharif al-Radi, Muhammad bin Husayn (ra)' },
  'نهج البلاغه': { en: 'Nahj al-Balagha', author: 'Sharif al-Radi, Muhammad bin Husayn (ra)' },

  // Sahifa
  'صحیفه سجادیه': { en: 'Sahifa Sajjadiya', author: 'Imam Zayn al-Abidin Ali ibn Husayn (as)' },
  'الصحیفة السجادیة': { en: 'Al-Sahifa al-Sajjadiya', author: 'Imam Zayn al-Abidin Ali ibn Husayn (as)' },
  'صحيفه سجاديه': { en: 'Sahifa Sajjadiya', author: 'Imam Zayn al-Abidin Ali ibn Husayn (as)' },

  // Amali
  'الأمالي': { en: 'Al-Amali', author: '' },
  'أمالي': { en: 'Al-Amali', author: '' },

  // Other Major Works
  'الخصال': { en: 'Al-Khisal', author: 'Ibn Babawayh, Muhammad bin Ali (Shaykh Saduq) (ra)' },
  'التوحید': { en: 'Al-Tawhid', author: 'Ibn Babawayh, Muhammad bin Ali (Shaykh Saduq) (ra)' },
  'التوحيد': { en: 'Al-Tawhid', author: 'Ibn Babawayh, Muhammad bin Ali (Shaykh Saduq) (ra)' },
  'تحف العقول': { en: "Tuhaf al-'Uqul", author: 'Ibn Shu\'ba al-Harrani (ra)' },
  'الإحتجاج': { en: 'Al-Ihtijaj', author: 'Al-Tabarsi, Ahmad bin Ali (ra)' },
  'الاحتجاج': { en: 'Al-Ihtijaj', author: 'Al-Tabarsi, Ahmad bin Ali (ra)' },
  'الإرشاد': { en: 'Al-Irshad', author: 'Shaykh al-Mufid (ra)' },
  'الغیبة': { en: 'Al-Ghaybah', author: '' },
  'الغيبة': { en: 'Al-Ghaybah', author: '' },
  'بصائر الدرجات': { en: "Basa'ir al-Darajat", author: 'Muhammad ibn Hasan al-Saffar (ra)' },
  'كمال الدين': { en: 'Kamal al-Din', author: 'Ibn Babawayh, Muhammad bin Ali (Shaykh Saduq) (ra)' },
  'کمال الدین': { en: 'Kamal al-Din', author: 'Ibn Babawayh, Muhammad bin Ali (Shaykh Saduq) (ra)' },
  'عیون أخبار الرضا': { en: "'Uyun Akhbar al-Rida (as)", author: 'Ibn Babawayh, Muhammad bin Ali (Shaykh Saduq) (ra)' },
  'عيون اخبار الرضا': { en: "'Uyun Akhbar al-Rida (as)", author: 'Ibn Babawayh, Muhammad bin Ali (Shaykh Saduq) (ra)' },
  'المحاسن': { en: 'Al-Mahasin', author: 'Ahmad ibn Muhammad al-Barqi (ra)' },
  'قرب الإسناد': { en: 'Qurb al-Isnad', author: 'Abdullah ibn Ja\'far al-Himyari (ra)' },

  // Tafsir
  'تفسیر القمی': { en: 'Tafsir al-Qummi', author: 'Ali ibn Ibrahim al-Qummi (ra)' },
  'تفسير القمي': { en: 'Tafsir al-Qummi', author: 'Ali ibn Ibrahim al-Qummi (ra)' },
  'تفسیر العیاشی': { en: "Tafsir al-'Ayyashi", author: "Muhammad ibn Mas'ud al-'Ayyashi (ra)" },
  'تفسير العياشي': { en: "Tafsir al-'Ayyashi", author: "Muhammad ibn Mas'ud al-'Ayyashi (ra)" },
  'تفسیر البرهان': { en: 'Tafsir al-Burhan', author: 'Sayyid Hashim al-Bahrani (ra)' },
  'البرهان في تفسير القرآن': { en: 'Al-Burhan fi Tafsir al-Quran', author: 'Sayyid Hashim al-Bahrani (ra)' },
  'تفسیر نور الثقلین': { en: 'Tafsir Nur al-Thaqalayn', author: 'Abd Ali al-Huwayzi (ra)' },
  'تفسیر الصافی': { en: 'Tafsir al-Safi', author: 'Fayd Kashani (ra)' },
  'تفسير فرات الکوفي': { en: 'Tafsir Furat al-Kufi', author: 'Furat ibn Ibrahim al-Kufi (ra)' },

  // A'lam al-Din
  'أعلام الدین': { en: "A'lam al-Din", author: 'Al-Daylami (ra)' },
  'اعلام الدين': { en: "A'lam al-Din", author: 'Al-Daylami (ra)' },

  // I'lam al-Wara
  'إعلام الورى': { en: "I'lam al-Wara", author: 'Al-Tabarsi, Fadl bin Hasan (ra)' },

  // Misbah
  'مصباح الشریعة': { en: "Misbah al-Shari'a", author: 'Attributed to Imam Ja\'far al-Sadiq (as)' },
  'مصباح المتهجد': { en: 'Misbah al-Mutahajjid', author: 'Shaykh al-Tusi (ra)' },

  // Du'a books
  'مفاتیح الجنان': { en: 'Mafatih al-Jinan', author: 'Shaykh Abbas Qummi (ra)' },
  'البلد الأمین': { en: 'Al-Balad al-Amin', author: 'Al-Kaf\'ami (ra)' },
  'المصباح': { en: 'Al-Misbah', author: 'Al-Kaf\'ami (ra)' },
  'الدعوات': { en: "Al-Da'awat", author: 'Al-Qutb al-Rawandi (ra)' },
  'الدروع الواقية': { en: "Al-Duru' al-Waqiyah", author: 'Sayyid Ibn Tawus (ra)' },

  // Rijal
  'رجال الکشی': { en: 'Rijal al-Kashshi', author: 'Muhammad ibn Umar al-Kashshi (ra)' },
  'رجال النجاشی': { en: 'Rijal al-Najashi', author: 'Ahmad ibn Ali al-Najashi (ra)' },
  'الفهرست': { en: 'Al-Fihrist', author: 'Shaykh al-Tusi (ra)' },

  // 'Ilal
  'علل الشرائع': { en: "'Ilal al-Shara'i", author: 'Ibn Babawayh, Muhammad bin Ali (Shaykh Saduq) (ra)' },

  // Thawab al-A'mal
  'ثواب الأعمال': { en: "Thawab al-A'mal", author: 'Ibn Babawayh, Muhammad bin Ali (Shaykh Saduq) (ra)' },

  // 'Iqab al-A'mal
  'عقاب الأعمال': { en: "'Iqab al-A'mal", author: 'Ibn Babawayh, Muhammad bin Ali (Shaykh Saduq) (ra)' },

  // Ma'ani al-Akhbar
  'معانی الأخبار': { en: "Ma'ani al-Akhbar", author: 'Ibn Babawayh, Muhammad bin Ali (Shaykh Saduq) (ra)' },

  // Manaqib
  'مناقب آل أبی طالب': { en: 'Manaqib Al Abi Talib', author: 'Ibn Shahr Ashub (ra)' },
  'مناقب': { en: 'Al-Manaqib', author: '' },

  // Rawdat al-Wa'izin
  'روضة الواعظین': { en: "Rawdat al-Wa'izin", author: 'Al-Fattal al-Nisaburi (ra)' },

  // Kashf al-Ghummah
  'کشف الغمة': { en: 'Kashf al-Ghummah', author: 'Ali ibn Isa al-Irbili (ra)' },

  // Iqbal al-A'mal
  'إقبال الأعمال': { en: "Iqbal al-A'mal", author: 'Sayyid Ibn Tawus (ra)' },

  // Khara'ij
  'الخرائج و الجرائح': { en: "Al-Khara'ij wa al-Jara'ih", author: 'Al-Qutb al-Rawandi (ra)' },

  // Makasib
  'مکاسب': { en: 'Makasib', author: 'Shaykh Murtada al-Ansari (ra)' },

  // Ghurr al-Hikam
  'غرر الحکم': { en: 'Ghurar al-Hikam', author: 'Al-Amidi (ra)' },

  // Al-Kharaj
  'الخراج': { en: 'Al-Kharaj', author: '' },

  // Mustadrak
  'مستدرک': { en: 'Mustadrak', author: '' },

  // Additional books
  'عدة السفر': { en: "'Uddat al-Safar", author: '' },
  'عين العبرة': { en: "'Ayn al-'Ibra", author: '' },
  'عین الحیات': { en: "'Ayn al-Hayat", author: 'Allama Majlisi (ra)' },
  'عیون الحکم': { en: "'Uyun al-Hikam", author: '' },
  'عیون المعجزات': { en: "'Uyun al-Mu'jizat", author: '' },
  'الآداب الدينية': { en: 'Al-Adab al-Diniyyah', author: '' },
  'الاعتقادات': { en: "Al-I'tiqadat", author: '' },
  'العدد القویّة': { en: "Al-'Udad al-Qawiyyah", author: 'Ali ibn Yusuf al-Hilli (ra)' },
  'الأذان بحي علی خیر العمل': { en: "Al-Adhan bi Hayya 'ala Khayr al-'Amal", author: '' },
  'الأمان': { en: 'Al-Aman', author: 'Sayyid Ibn Tawus (ra)' },
  'الأنوار اللامعة': { en: "Al-Anwar al-Lami'ah", author: '' },
  'الأنوار النعمانیة': { en: "Al-Anwar al-Nu'maniyyah", author: 'Sayyid Ni\'matullah al-Jaza\'iri (ra)' },
  'الأربعين': { en: "Al-Arba'in", author: '' },
  'الأربعون حديثا': { en: "Al-Arba'un Hadithan", author: '' },
  'البضاعة المزجاة': { en: "Al-Bida'ah al-Muzjah", author: 'Allama Majlisi (ra)' },
  'البحر الزخار': { en: 'Al-Bahr al-Zakhkhar', author: '' },
  'الذریعة': { en: "Al-Dhari'ah", author: '' },
  'الدر المنثور': { en: 'Al-Durr al-Manthur', author: '' },
  'الدر المنظوم': { en: 'Al-Durr al-Manzum', author: '' },
  'الدرّ النظيم': { en: 'Al-Durr al-Nazim', author: '' },
  'الدرة الباهرة': { en: 'Al-Durrah al-Bahirah', author: '' },
  'الفائق في غريب الحديث': { en: "Al-Fa'iq fi Gharib al-Hadith", author: 'Al-Zamakhshari (ra)' },
  'الفضائل': { en: "Al-Fada'il", author: '' },
  'الفرائد الطریفة': { en: "Al-Fara'id al-Tarifah", author: '' },
  'الفصول المهمة': { en: 'Al-Fusul al-Muhimmah', author: '' },
  'الفصول المختارة': { en: 'Al-Fusul al-Mukhtarah', author: 'Shaykh al-Mufid (ra)' },
  'الفوائد المکية': { en: "Al-Fawa'id al-Makkiyyah", author: '' },
  'الفوائد الطوسیة': { en: "Al-Fawa'id al-Tusiyyah", author: '' },
  'الحیاة': { en: 'Al-Hayat', author: '' },
  'الحبل المتين': { en: 'Al-Habl al-Matin', author: 'Shaykh Baha\'i (ra)' },
  'الهدایة': { en: 'Al-Hidayah', author: '' },
  'الجمل و النصرة': { en: 'Al-Jamal wa al-Nusrah', author: 'Shaykh al-Mufid (ra)' },
  'الجواهر السنیة': { en: 'Al-Jawahir al-Saniyyah', author: 'Al-Hurr al-Amili (ra)' },
  'الکامل': { en: 'Al-Kamil', author: '' },
  'الکواکب الدریة': { en: 'Al-Kawakib al-Durriyyah', author: '' },
  'اللهوف': { en: 'Al-Luhuf', author: 'Sayyid Ibn Tawus (ra)' },
  'المقنعة': { en: "Al-Muqni'ah", author: 'Shaykh al-Mufid (ra)' },
  'المستجاد': { en: 'Al-Mustajad', author: '' },
  'المسترشد': { en: 'Al-Mustarshid', author: 'Al-Tabari al-Imami (ra)' },
  'النوادر': { en: 'Al-Nawadir', author: '' },
  'النقض': { en: 'Al-Naqd', author: '' },
  'الصراط المستقیم': { en: 'Al-Sirat al-Mustaqim', author: '' },
  'الطرائف': { en: "Al-Tara'if", author: 'Sayyid Ibn Tawus (ra)' },
  'التمحیص': { en: 'Al-Tamhis', author: '' },
  'الیقین': { en: 'Al-Yaqin', author: 'Sayyid Ibn Tawus (ra)' },

  // Ithbat books
  'إثبات الهداة': { en: 'Ithbat al-Hudat', author: 'Al-Hurr al-Amili (ra)' },
  'إثبات الوصية': { en: 'Ithbat al-Wasiyyah', author: 'Al-Mas\'udi (ra)' },
  'إثبات الرجعة': { en: "Ithbat al-Raj'ah", author: '' },

  // Irshad books
  'إرشاد القلوب': { en: 'Irshad al-Qulub', author: 'Al-Daylami (ra)' },

  // Siffin & Jamal
  'وقعة صفین': { en: "Waq'at Siffin", author: 'Nasr ibn Muzahim (ra)' },
  'أخبار الجمل': { en: 'Akhbar al-Jamal', author: 'Abu Mikhnaf (ra)' },

  // Dala'il
  'دلائل الإمامة': { en: "Dala'il al-Imamah", author: 'Al-Tabari al-Imami (ra)' },

  // Basa'ir
  'مختصر بصائر الدرجات': { en: "Mukhtasar Basa'ir al-Darajat", author: '' },

  // Khasais
  'خصائص الأئمة': { en: "Khasa'is al-A'immah", author: 'Sharif al-Radi (ra)' },

  // Kitab Sulaym
  'كتاب سليم بن قيس': { en: 'Kitab Sulaym ibn Qays', author: 'Sulaym ibn Qays al-Hilali (ra)' },

  // Fiqh al-Rida
  'فقه الرضا': { en: 'Fiqh al-Rida (as)', author: 'Attributed to Imam al-Rida (as)' },

  // Tibb
  'طب الأئمة': { en: 'Tibb al-A\'immah', author: '' },
  'طب الرضا': { en: 'Tibb al-Rida (as)', author: '' },

  // Wasiyyah
  'الوصية': { en: 'Al-Wasiyyah', author: '' },

  // Gharat
  'الغارات': { en: 'Al-Gharat', author: 'Ibrahim ibn Muhammad al-Thaqafi (ra)' },

  // Tawhid al-Mufaddal
  'توحید المفضل': { en: 'Tawhid al-Mufaddal', author: 'Mufaddal ibn Umar (ra)' },

  // Fadail
  'فضائل الشیعة': { en: "Fada'il al-Shi'ah", author: 'Ibn Babawayh (Shaykh Saduq) (ra)' },
  'فضائل الخمسة': { en: "Fada'il al-Khamsah", author: '' },

  // Misc
  'أوائل المقالات': { en: "Awa'il al-Maqalat", author: 'Shaykh al-Mufid (ra)' },
  'بشارة المصطفی': { en: 'Bisharat al-Mustafa', author: 'Al-Tabari al-Imami (ra)' },
  'جامع الأخبار': { en: "Jami' al-Akhbar", author: '' },
  'محاسبة النفس': { en: 'Muhasabat al-Nafs', author: '' },
  'منیة المرید': { en: 'Munyat al-Murid', author: 'Al-Shahid al-Thani (ra)' },
  'کشف الریبة': { en: 'Kashf al-Raybah', author: 'Al-Shahid al-Thani (ra)' },
  'مجمع البحرین': { en: "Majma' al-Bahrayn", author: 'Al-Turayhi (ra)' },
  'منهاج الحق': { en: 'Minhaj al-Haqq', author: '' },
  'راحة الأرواح': { en: 'Rahat al-Arwah', author: '' },
  'ذريعة الضراعة': { en: "Dhari'at al-Dara'ah", author: '' },
  'معالم الزلفى': { en: "Ma'alim al-Zulfa", author: '' },
  'لوامع الأنوار': { en: "Lawami' al-Anwar", author: '' },
  'عین الحیوة': { en: "'Ayn al-Hayat", author: '' },
};

// Build lookup for fast matching
function findEnglishMapping(arabicTitle) {
  const normalized = normalizeArabic(arabicTitle);

  // Try exact normalized match first
  for (const [arPattern, mapping] of Object.entries(ARABIC_TO_ENGLISH)) {
    if (normalizeArabic(arPattern) === normalized) {
      return mapping;
    }
  }

  // Try partial match (Arabic title contains the pattern)
  for (const [arPattern, mapping] of Object.entries(ARABIC_TO_ENGLISH)) {
    const normPattern = normalizeArabic(arPattern);
    if (normalized.includes(normPattern) || normPattern.includes(normalized)) {
      return mapping;
    }
  }

  return null;
}

// Also try to match from Excel unique English list
function findExcelMatch(arabicTitle, normalized) {
  // Try to find in Excel by matching Arabic with first 200 rows
  for (let row = 2; row <= 200; row++) {
    const arExcel = normalizeArabic(sheet['B' + row]?.v || '');
    if (arExcel === normalized) {
      const titleEn = (sheet['C' + row]?.v || '').trim();
      const authorEn = (sheet['E' + row]?.v || '').trim();
      return { en: titleEn, author: authorEn };
    }
  }
  return null;
}

// Generate proper English name from Arabic transliteration patterns
function generateEnglishFromArabic(arabicTitle) {
  // Common Arabic book prefixes/patterns
  const patterns = [
    // Kitab patterns
    [/^کتاب\s+(.+)$/, 'Kitab $1'],
    // Sharh patterns
    [/شرح\s+(.+)$/, 'Sharh $1'],
    // Hashiya patterns
    [/الحاشیة\s+علی\s+(.+)$/, 'Hashiyah on $1'],
    // Translation patterns
    [/\/\s*ترجمه\s+(.+)$/, ' (Translation)'],
  ];

  // This is a fallback - mainly used for logging
  return null;
}

// Prepare update statement
const updateStmt = db.prepare(`
  UPDATE books SET title_en = ?, author_en = ?
  WHERE id = ?
`);

let updatedKnowledge = 0;
let updatedExcel = 0;
let noMatch = 0;

const updateBooks = db.transaction(() => {
  for (const book of books) {
    const normalized = normalizeArabic(book.title_ar);

    // Try Excel first (for first 200 aligned rows)
    let match = findExcelMatch(book.title_ar, normalized);
    let source = 'excel';

    // If not found in Excel, try knowledge-based
    if (!match) {
      match = findEnglishMapping(book.title_ar);
      source = 'knowledge';
    }

    if (match) {
      const newTitleEn = match.en || book.title_en;
      const newAuthorEn = match.author || book.author_en;

      // Only update if something changes
      if (newTitleEn !== book.title_en || newAuthorEn !== book.author_en) {
        updateStmt.run(newTitleEn, newAuthorEn, book.id);
        if (source === 'excel') {
          updatedExcel++;
        } else {
          updatedKnowledge++;
        }

        if (updatedExcel + updatedKnowledge <= 15) {
          console.log(`Updated (${source}): ${book.id}`);
          console.log(`  Arabic: ${book.title_ar}`);
          console.log(`  Old En: ${book.title_en}`);
          console.log(`  New En: ${newTitleEn}`);
          console.log();
        }
      }
    } else {
      noMatch++;
    }
  }
});

updateBooks();

console.log(`\n========================================`);
console.log(`Results:`);
console.log(`  Updated from Excel: ${updatedExcel}`);
console.log(`  Updated from Knowledge: ${updatedKnowledge}`);
console.log(`  No match found: ${noMatch}`);
console.log(`  Total updated: ${updatedExcel + updatedKnowledge}`);
console.log(`========================================\n`);

// Show sample of updated books
const sample = db.prepare('SELECT id, title_ar, title_en, author_en FROM books LIMIT 10').all();
console.log('Sample after update:');
sample.forEach(b => {
  console.log(`  ${b.id}: ${b.title_ar}`);
  console.log(`       En: ${b.title_en} | Author: ${b.author_en}`);
});

db.close();
console.log('\nDone!');
