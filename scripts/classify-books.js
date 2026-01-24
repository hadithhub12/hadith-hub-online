/**
 * Classify books as Shia or Sunni based on titles and authors
 * Also remove (ra) from Sunni authors
 */

const fs = require('fs');
const path = require('path');
const Database = require('better-sqlite3');

const DB_PATH = path.join(__dirname, '..', 'src', 'data', 'hadith.db');

// Known Shia scholars/authors (contains these terms)
const SHIA_AUTHORS = [
  'کلینی', 'kulaini', 'kulayni',
  'مجلسی', 'majlisi', 'majlesi',
  'طوسی', 'tusi', 'toosi',
  'صدوق', 'saduq', 'saduuq', 'sadooq',
  'حر عاملی', 'hurr amili', 'hurr al-amili',
  'بحرانی', 'bahrani',
  'نوری', 'nuri', 'noori',
  'کاشانی', 'kashani',
  'فیض کاشانی', 'fayd kashani',
  'سید رضی', 'sharif radi',
  'مفید', 'mufid',
  'ابن شهر آشوب', 'ibn shahr ashub',
  'طبرسی', 'tabarsi', 'tabrisi',
  'ابن بابویه', 'ibn babawayh', 'babawayh',
  'قمی', 'qummi', 'qumi',
  'عیاشی', 'ayyashi',
  'سید ابن طاووس', 'ibn tawus', 'sayyid ibn tawus',
  'ابن فهد حلی', 'ibn fahd',
  'شهید اول', 'shahid awwal', 'first martyr',
  'شهید ثانی', 'shahid thani', 'second martyr',
  'علامه حلی', 'allama hilli', 'allamah hilli',
  'محقق حلی', 'muhaqqiq hilli',
  'خوئی', 'khoei', 'khooi',
  'سیستانی', 'sistani',
  'خمینی', 'khomeini', 'khamenei',
];

// Known Sunni scholars/authors
const SUNNI_AUTHORS = [
  'بخاری', 'bukhari',
  'مسلم', 'muslim',
  'ترمذی', 'tirmidhi',
  'ابو داود', 'abu dawud',
  'نسائی', 'nasai',
  'ابن ماجه', 'ibn majah',
  'احمد بن حنبل', 'ahmad ibn hanbal',
  'مالک', 'malik',
  'شافعی', 'shafii', 'shafi',
  'ابو حنیفه', 'abu hanifa',
  'ابن تیمیه', 'ibn taymiyyah',
  'ابن قیم', 'ibn qayyim',
  'ابن کثیر', 'ibn kathir',
  'نووی', 'nawawi',
  'ذهبی', 'dhahabi',
  'ابن حجر', 'ibn hajar',
  'سیوطی', 'suyuti',
  'طبری', 'tabari',
  'ابن عبد البر', 'ibn abd al-barr',
  'ابن حبان', 'ibn hibban',
  'بیهقی', 'bayhaqi',
  'حاکم نیشابوری', 'hakim nishaburi',
  'دارقطنی', 'daraqutni',
  'ابن خزیمه', 'ibn khuzaymah',
  'ابوبکر', 'abu bakr',
  'عمر', 'umar',
  'عثمان', 'uthman',
  'عایشه', 'aisha',
  'ابن قدامه', 'ibn qudama',
  'ابن عربی', 'ibn arabi',
  'غزالی', 'ghazali',
];

// Known Shia book titles/keywords
const SHIA_TITLES = [
  'الکافي', 'al-kafi', 'کافی',
  'من لا یحضره الفقیه', 'man la yahduruhu', 'faqih',
  'تهذیب الاحکام', 'tahdhib', 'تهذيب',
  'استبصار', 'istibsar',
  'بحار الانوار', 'bihar', 'بحار',
  'وسائل الشیعه', 'wasail', 'وسایل',
  'مستدرک الوسائل', 'mustadrak',
  'نهج البلاغه', 'nahj al-balagha', 'نهج البلاغة',
  'صحیفه سجادیه', 'sahifa sajjadiyya',
  'غرر الحکم', 'ghurar',
  'تحف العقول', 'tuhaf al-uqul',
  'امالی', 'amali',
  'خصال', 'khisal',
  'توحید', 'tawhid',
  'اهل بیت', 'ahl al-bayt', 'اهل‌بیت',
  'ائمه', 'ائمة', 'imams',
  'امیرالمومنین', 'amir al-muminin',
  'علی بن ابی طالب', 'ali ibn abi talib',
  'فاطمه', 'fatima',
  'حسین', 'husayn', 'husain',
  'مهدی', 'mahdi',
  'غیبت', 'ghaybah', 'occultation',
  'امامت', 'imamate', 'imama',
  'ولایت', 'wilaya',
  'شیعه', 'shia',
  'جعفر الصادق', 'jafar sadiq',
  'رضا', 'rida', 'reza',
];

// Known Sunni book titles/keywords
const SUNNI_TITLES = [
  'صحیح بخاری', 'sahih bukhari',
  'صحیح مسلم', 'sahih muslim',
  'سنن', 'sunan',
  'موطا', 'muwatta',
  'مسند احمد', 'musnad ahmad',
  'سته', 'sitta',
];

function normalize(text) {
  if (!text) return '';
  return text
    .toLowerCase()
    .replace(/[\u064B-\u065F\u0670]/g, '')
    .replace(/[أإآء]/g, 'ا')
    .replace(/ى/g, 'ي')
    .replace(/ة/g, 'ه')
    .replace(/ـ/g, '')
    .replace(/ک/g, 'ك')
    .replace(/ی/g, 'ي');
}

function containsAny(text, keywords) {
  const normalized = normalize(text);
  return keywords.some(kw => normalized.includes(normalize(kw)));
}

function classifyBook(book) {
  const title = (book.title_ar || '') + ' ' + (book.title_en || '');
  const author = (book.author_ar || '') + ' ' + (book.author_en || '');
  const combined = title + ' ' + author;

  // Check for Shia indicators
  const hasShiaAuthor = containsAny(author, SHIA_AUTHORS);
  const hasShiaTitle = containsAny(title, SHIA_TITLES);

  // Check for Sunni indicators
  const hasSunniAuthor = containsAny(author, SUNNI_AUTHORS);
  const hasSunniTitle = containsAny(title, SUNNI_TITLES);

  // Scoring
  let shiaScore = 0;
  let sunniScore = 0;

  if (hasShiaAuthor) shiaScore += 3;
  if (hasShiaTitle) shiaScore += 2;
  if (hasSunniAuthor) sunniScore += 3;
  if (hasSunniTitle) sunniScore += 2;

  // Default to shia if no clear indicator (since most books in this collection are Shia)
  if (shiaScore === 0 && sunniScore === 0) {
    return 'shia';
  }

  return shiaScore >= sunniScore ? 'shia' : 'sunni';
}

function removeRaFromSunniAuthor(author) {
  if (!author) return author;
  // Remove (ra), (r.a.), [ra], etc.
  return author
    .replace(/\s*\(ra\)\s*/gi, '')
    .replace(/\s*\(r\.a\.\)\s*/gi, '')
    .replace(/\s*\[ra\]\s*/gi, '')
    .trim();
}

console.log('Classifying books and updating authors...\n');

const db = new Database(DB_PATH);
db.pragma('journal_mode = WAL');

// Get all books
const books = db.prepare('SELECT id, title_ar, title_en, author_ar, author_en, sect FROM books').all();
console.log(`Processing ${books.length} books...\n`);

// Prepare update statement
const updateStmt = db.prepare(`
  UPDATE books SET sect = ?, author_en = ? WHERE id = ?
`);

let shiaCount = 0;
let sunniCount = 0;

const updateAll = db.transaction(() => {
  for (const book of books) {
    const sect = classifyBook(book);
    let authorEn = book.author_en || '';

    // If Sunni, remove (ra) from English author
    if (sect === 'sunni') {
      authorEn = removeRaFromSunniAuthor(authorEn);
      sunniCount++;
    } else {
      shiaCount++;
    }

    updateStmt.run(sect, authorEn, book.id);
  }
});

updateAll();

console.log(`Classification complete:`);
console.log(`  Shia books: ${shiaCount}`);
console.log(`  Sunni books: ${sunniCount}`);

// Show sample of Sunni books found
const sunniBooks = db.prepare("SELECT id, title_ar, title_en, author_ar, author_en FROM books WHERE sect = 'sunni' LIMIT 10").all();
if (sunniBooks.length > 0) {
  console.log('\nSample Sunni books:');
  sunniBooks.forEach(b => {
    console.log(`  ${b.id}: ${b.title_ar} | ${b.author_en}`);
  });
}

db.close();
console.log('\nDone!');
