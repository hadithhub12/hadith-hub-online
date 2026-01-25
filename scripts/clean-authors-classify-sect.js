/**
 * Clean author names (remove "(ra)") and classify books into Shia/Sunni
 */

const Database = require('better-sqlite3');
const path = require('path');

const DB_PATH = path.join(__dirname, '..', 'src', 'data', 'hadith.db');

// Open database
const db = new Database(DB_PATH);
db.pragma('journal_mode = WAL');

// Get all books
const books = db.prepare('SELECT id, title_ar, title_en, author_ar, author_en, sect FROM books').all();
console.log(`Found ${books.length} books in database\n`);

// Shia book titles/authors - based on knowledge of Islamic hadith literature
// These are the primary Shia hadith collections and their authors
const SHIA_INDICATORS = {
  // Major Shia Collections (Kutub al-Arba'a)
  titles: [
    'الكافي', 'الکافي', 'Al-Kafi',
    'من لا يحضره الفقيه', 'من لايحضره الفقيه', 'Man La Yahduruhu',
    'تهذيب الأحكام', 'تهذيب الاحكام', 'Tahdhib al-Ahkam',
    'الاستبصار', 'Al-Istibsar',

    // Major Shia Encyclopedias
    'بحار الأنوار', 'بحار الانوار', 'Bihar al-Anwar',
    'وسائل الشيعة', 'وسایل الشیعة', 'وسايل الشيعه', "Wasa'il al-Shia",
    'مستدرك الوسائل', "Mustadrak al-Wasa'il",

    // Nahj al-Balagha
    'نهج البلاغة', 'نهج البلاغه', 'Nahj al-Balagha',

    // Sahifa Sajjadiya
    'صحيفة سجادية', 'صحیفه سجادیه', 'الصحيفة السجادية', 'Sahifa Sajjadiya',

    // Other Major Shia Works
    'بصائر الدرجات', "Basa'ir al-Darajat",
    'الخصال', 'Al-Khisal',
    'التوحيد', 'التوحید', 'Al-Tawhid',
    'تحف العقول', "Tuhaf al-'Uqul",
    'الاحتجاج', 'الإحتجاج', 'Al-Ihtijaj',
    'الإرشاد', 'الارشاد', 'Al-Irshad',
    'الغيبة', 'الغیبة', 'Al-Ghaybah',
    'كمال الدين', 'کمال الدین', 'Kamal al-Din',
    'عيون أخبار الرضا', 'عیون أخبار الرضا', "'Uyun Akhbar al-Rida",
    'المحاسن', 'Al-Mahasin',
    'علل الشرائع', "'Ilal al-Shara'i",
    'ثواب الأعمال', "Thawab al-A'mal",
    'معاني الأخبار', 'معانی الأخبار', "Ma'ani al-Akhbar",
    'الأمالي', 'امالی', 'Al-Amali',
    'مفاتيح الجنان', 'مفاتیح الجنان', 'Mafatih al-Jinan',
    'إقبال الأعمال', "Iqbal al-A'mal",
    'اللهوف', 'Al-Luhuf',
    'الوافي', 'Al-Wafi',
    'غرر الحكم', 'غرر الحکم', 'Ghurar al-Hikam',
    'دلائل الإمامة', "Dala'il al-Imamah",
    'إثبات الهداة', 'Ithbat al-Hudat',
    'الخرائج والجرائح', "Al-Khara'ij",
    'مناقب آل أبي طالب', 'Manaqib Al Abi Talib',
    'روضة الواعظين', "Rawdat al-Wa'izin",
    'كشف الغمة', 'کشف الغمة', 'Kashf al-Ghummah',
    'مجمع البحرين', "Majma' al-Bahrayn",
    'الغارات', 'Al-Gharat',
    'وقعة صفين', "Waq'at Siffin",
    'تفسير القمي', 'تفسیر القمی', 'Tafsir al-Qummi',
    'تفسير العياشي', 'تفسیر العیاشی', "Tafsir al-'Ayyashi",
    'تفسير البرهان', 'Tafsir al-Burhan',
    'تفسير نور الثقلين', 'Tafsir Nur al-Thaqalayn',
    'تفسير الصافي', 'Tafsir al-Safi',
    'فقه الرضا', 'Fiqh al-Rida',
    'طب الأئمة', "Tibb al-A'immah",
    'كتاب سليم بن قيس', 'Kitab Sulaym ibn Qays',
    'رجال الكشي', 'رجال الکشی', 'Rijal al-Kashshi',
    'رجال النجاشي', 'رجال النجاشی', 'Rijal al-Najashi',
    'الفهرست', 'Al-Fihrist',
    'مصباح المتهجد', 'Misbah al-Mutahajjid',
    'المقنعة', "Al-Muqni'ah",
    'أوائل المقالات', "Awa'il al-Maqalat",
    'بشارة المصطفى', 'Bisharat al-Mustafa',
    'إرشاد القلوب', 'Irshad al-Qulub',
    'الدعوات', "Al-Da'awat",
    'الطرائف', "Al-Tara'if",
    'اليقين', 'الیقین', 'Al-Yaqin',
    'خصائص الأئمة', "Khasa'is al-A'immah",
    'فضائل الشيعة', "Fada'il al-Shi'ah",
    'الجواهر السنية', 'Al-Jawahir al-Saniyyah',
    'الأنوار النعمانية', "Al-Anwar al-Nu'maniyyah",
    'مكاسب', 'Makasib',
    'قرب الإسناد', 'Qurb al-Isnad',
  ],

  // Shia Authors
  authors: [
    'كليني', 'الكليني', 'Kulaini', 'Kulayni',
    'صدوق', 'الصدوق', 'ابن بابويه', 'Saduq', 'Ibn Babawayh', 'Ibn Babawaih',
    'طوسي', 'الطوسي', 'Tusi', 'Shaykh al-Tusi',
    'مجلسي', 'المجلسي', 'علامه مجلسی', 'Majlisi', 'Allama Majlisi',
    'حر عاملي', 'الحر العاملي', 'Hurr al-Amili', 'Al-Hurr al-Amili',
    'فيض كاشاني', 'فیض کاشانی', 'Fayd Kashani', 'Faiz Kashani',
    'شريف الرضي', 'الشریف الرضی', 'Sharif al-Radi',
    'مفيد', 'المفيد', 'الشيخ المفيد', 'Shaykh al-Mufid', 'Mufid',
    'نوري', 'میرزا نوری', 'Mirza Nuri', 'Mirza Husayn al-Nuri',
    'طبرسي', 'الطبرسی', 'Tabarsi', 'Al-Tabarsi',
    'ابن شعبة', 'Ibn Shu\'ba', 'Ibn Shuba',
    'راوندي', 'الراوندی', 'Rawandi', 'Al-Qutb al-Rawandi',
    'ابن طاووس', 'ابن طاوس', 'Ibn Tawus', 'Sayyid Ibn Tawus',
    'برقي', 'البرقی', 'Barqi', 'Al-Barqi',
    'صفار', 'الصفار', 'Saffar', 'Al-Saffar',
    'قمي', 'القمی', 'Qummi', 'Al-Qummi',
    'عياشي', 'العیاشی', 'Ayyashi', "Al-'Ayyashi",
    'بحراني', 'البحرانی', 'Bahrani', 'Al-Bahrani',
    'هويزي', 'الهویزی', 'Huwayzi',
    'شهيد ثاني', 'الشهید الثانی', 'Shahid al-Thani',
    'كفعمي', 'الکفعمی', "Kaf'ami", "Al-Kaf'ami",
    'كشي', 'الکشی', 'Kashshi', 'Al-Kashshi',
    'نجاشي', 'النجاشی', 'Najashi', 'Al-Najashi',
    'آميدي', 'الآمدی', 'Amidi', 'Al-Amidi',
    'اربلي', 'الاربلی', 'Irbili', 'Al-Irbili',
    'ديلمي', 'الدیلمی', 'Daylami', 'Al-Daylami',
    'حميري', 'الحمیری', 'Himyari', 'Al-Himyari',
    'بهائي', 'شیخ بهائی', 'Shaykh Baha\'i', 'Baha\'i',
    'طريحي', 'الطریحی', 'Turayhi', 'Al-Turayhi',
    'جزائري', 'الجزائری', 'Jaza\'iri', 'Al-Jaza\'iri',
    'انصاري', 'الانصاری', 'Ansari', 'Al-Ansari', 'Shaykh Murtada',
    'ابن شهر آشوب', 'Ibn Shahr Ashub',
    'فتال نيسابوري', 'Fattal al-Nisaburi',
    'ثقفي', 'الثقفی', 'Thaqafi',
    'مفضل', 'المفضل', 'Mufaddal',
    'سليم بن قيس', 'Sulaym ibn Qays',
  ]
};

// Sunni book titles/authors
const SUNNI_INDICATORS = {
  titles: [
    // Kutub al-Sittah (Six Major Sunni Collections)
    'صحيح البخاري', 'Sahih al-Bukhari', 'Sahih Bukhari',
    'صحيح مسلم', 'Sahih Muslim',
    'سنن أبي داود', 'سنن ابی داود', 'Sunan Abi Dawud', 'Sunan Abu Dawud',
    'سنن الترمذي', 'جامع الترمذي', 'Jami al-Tirmidhi', 'Sunan al-Tirmidhi',
    'سنن النسائي', 'Sunan al-Nasa\'i',
    'سنن ابن ماجه', 'سنن ابن ماجة', 'Sunan Ibn Majah',

    // Other Major Sunni Collections
    'موطأ مالك', 'الموطأ', 'Muwatta Malik', 'Al-Muwatta',
    'مسند أحمد', 'مسند احمد', 'Musnad Ahmad',
    'صحيح ابن حبان', 'Sahih Ibn Hibban',
    'صحيح ابن خزيمة', 'Sahih Ibn Khuzaymah',
    'المستدرك على الصحيحين', 'Mustadrak al-Hakim',
    'سنن الدارمي', 'Sunan al-Darimi',
    'سنن الدارقطني', 'Sunan al-Daraqutni',
    'سنن البيهقي', 'السنن الكبرى للبيهقي', 'Sunan al-Bayhaqi',
    'مصنف ابن أبي شيبة', 'Musannaf Ibn Abi Shaybah',
    'مصنف عبد الرزاق', 'Musannaf Abd al-Razzaq',
    'المعجم الكبير', 'المعجم الأوسط', 'المعجم الصغير', "Mu'jam al-Tabarani",
    'شعب الإيمان', "Shu'ab al-Iman",
    'الأدب المفرد', 'Al-Adab al-Mufrad',
    'رياض الصالحين', 'Riyad al-Salihin',
    'فتح الباري', 'Fath al-Bari',
  ],

  authors: [
    'بخاري', 'البخاری', 'Bukhari', 'Al-Bukhari',
    'مسلم بن الحجاج', 'Muslim', 'Al-Hajjaj',
    'أبو داود', 'ابو داود', 'Abu Dawud',
    'ترمذي', 'الترمذی', 'Tirmidhi', 'Al-Tirmidhi',
    'نسائي', 'النسائی', 'Nasa\'i', 'Al-Nasa\'i',
    'ابن ماجه', 'ابن ماجة', 'Ibn Majah',
    'مالك بن أنس', 'Malik ibn Anas', 'Imam Malik',
    'أحمد بن حنبل', 'احمد بن حنبل', 'Ahmad ibn Hanbal', 'Imam Ahmad',
    'ابن حبان', 'Ibn Hibban',
    'ابن خزيمة', 'Ibn Khuzaymah',
    'الحاكم', 'Al-Hakim',
    'دارمي', 'الدارمی', 'Darimi', 'Al-Darimi',
    'دارقطني', 'الدارقطنی', 'Daraqutni', 'Al-Daraqutni',
    'بيهقي', 'البیهقی', 'Bayhaqi', 'Al-Bayhaqi',
    'ابن أبي شيبة', 'Ibn Abi Shaybah',
    'عبد الرزاق', 'Abd al-Razzaq',
    'طبراني', 'الطبرانی', 'Tabarani', 'Al-Tabarani',
    'ابن حجر', 'Ibn Hajar',
    'نووي', 'النووی', 'Nawawi', 'Al-Nawawi',
  ]
};

// Function to check if a string contains any of the indicators
function containsIndicator(text, indicators) {
  if (!text) return false;
  const lowerText = text.toLowerCase();
  return indicators.some(ind => {
    const lowerInd = ind.toLowerCase();
    return lowerText.includes(lowerInd);
  });
}

// Classify a book as shia or sunni
function classifyBook(book) {
  const titleAr = book.title_ar || '';
  const titleEn = book.title_en || '';
  const authorAr = book.author_ar || '';
  const authorEn = book.author_en || '';

  // Check Shia indicators
  if (containsIndicator(titleAr, SHIA_INDICATORS.titles) ||
      containsIndicator(titleEn, SHIA_INDICATORS.titles) ||
      containsIndicator(authorAr, SHIA_INDICATORS.authors) ||
      containsIndicator(authorEn, SHIA_INDICATORS.authors)) {
    return 'shia';
  }

  // Check Sunni indicators
  if (containsIndicator(titleAr, SUNNI_INDICATORS.titles) ||
      containsIndicator(titleEn, SUNNI_INDICATORS.titles) ||
      containsIndicator(authorAr, SUNNI_INDICATORS.authors) ||
      containsIndicator(authorEn, SUNNI_INDICATORS.authors)) {
    return 'sunni';
  }

  // Default to existing or shia (since most books in this collection appear to be Shia)
  return book.sect || 'shia';
}

// Function to clean author name - remove "(ra)" and similar
function cleanAuthorName(author) {
  if (!author) return author;

  // Remove (ra), (as), (RA), (AS), etc.
  return author
    .replace(/\s*\(ra\)\s*/gi, '')
    .replace(/\s*\(as\)\s*/gi, '')
    .replace(/\s*\(r\.a\.\)\s*/gi, '')
    .replace(/\s*\(a\.s\.\)\s*/gi, '')
    .replace(/\s*\(rh\)\s*/gi, '')
    .replace(/\s*\(rah\)\s*/gi, '')
    .replace(/\s*رضي الله عنه\s*/g, '')
    .replace(/\s*رضی الله عنه\s*/g, '')
    .replace(/\s*عليه السلام\s*/g, '')
    .replace(/\s*علیه السلام\s*/g, '')
    .trim();
}

// Prepare update statement
const updateStmt = db.prepare(`
  UPDATE books SET author_en = ?, author_ar = ?, sect = ?
  WHERE id = ?
`);

let authorsCleaned = 0;
let sectUpdated = 0;
let shiaCount = 0;
let sunniCount = 0;

const updateBooks = db.transaction(() => {
  for (const book of books) {
    const cleanedAuthorEn = cleanAuthorName(book.author_en);
    const cleanedAuthorAr = cleanAuthorName(book.author_ar);
    const newSect = classifyBook(book);

    const authorChanged = cleanedAuthorEn !== book.author_en || cleanedAuthorAr !== book.author_ar;
    const sectChanged = newSect !== book.sect;

    if (authorChanged || sectChanged) {
      updateStmt.run(cleanedAuthorEn, cleanedAuthorAr, newSect, book.id);

      if (authorChanged) authorsCleaned++;
      if (sectChanged) sectUpdated++;
    }

    if (newSect === 'shia') shiaCount++;
    else if (newSect === 'sunni') sunniCount++;
  }
});

updateBooks();

console.log(`\n========================================`);
console.log(`Results:`);
console.log(`  Authors cleaned (removed "(ra)" etc): ${authorsCleaned}`);
console.log(`  Sect classifications updated: ${sectUpdated}`);
console.log(`  Total Shia books: ${shiaCount}`);
console.log(`  Total Sunni books: ${sunniCount}`);
console.log(`========================================\n`);

// Show sample of updated books
const sample = db.prepare('SELECT id, title_ar, title_en, author_en, sect FROM books LIMIT 20').all();
console.log('Sample after update:');
sample.forEach(b => {
  console.log(`  ${b.id}: ${b.title_en || b.title_ar}`);
  console.log(`       Author: ${b.author_en} | Sect: ${b.sect}`);
});

db.close();
console.log('\nDone!');
