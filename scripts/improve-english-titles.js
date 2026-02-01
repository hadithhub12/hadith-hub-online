/**
 * Script to improve English transliteration of Arabic book titles
 * This improves readability while preserving all information
 */

const Database = require('better-sqlite3');
const path = require('path');

const dbPath = path.join(process.cwd(), 'src', 'data', 'hadith.db');

// Well-known book titles with proper English names (Arabic -> English mapping)
const knownBooks = {
  'الكافي': 'Al-Kafi',
  'الكافى': 'Al-Kafi',
  'بحار الأنوار': 'Bihar al-Anwar',
  'وسائل الشيعة': 'Wasail al-Shia',
  'وسائل الشیعة': 'Wasail al-Shia',
  'مستدرك الوسائل': 'Mustadrak al-Wasail',
  'نهج البلاغة': 'Nahj al-Balagha',
  'من لا يحضره الفقيه': 'Man La Yahduruhu al-Faqih',
  'من لا یحضره الفقیه': 'Man La Yahduruhu al-Faqih',
  'تهذيب الأحكام': 'Tahdhib al-Ahkam',
  'تهذیب الأحکام': 'Tahdhib al-Ahkam',
  'الاستبصار': 'Al-Istibsar',
  'الخصال': 'Al-Khisal',
  'التوحيد': 'Al-Tawhid',
  'التوحید': 'Al-Tawhid',
  'علل الشرائع': 'Ilal al-Sharai',
  'عيون أخبار الرضا': 'Uyun Akhbar al-Rida',
  'عیون أخبار الرضا': 'Uyun Akhbar al-Rida',
  'معاني الأخبار': 'Maani al-Akhbar',
  'معانی الأخبار': 'Maani al-Akhbar',
  'كمال الدين': 'Kamal al-Din',
  'کمال الدین': 'Kamal al-Din',
  'ثواب الأعمال': 'Thawab al-Amal',
  'عقاب الأعمال': 'Iqab al-Amal',
  'الأمالي': 'Al-Amali',
  'الأمالى': 'Al-Amali',
  'أمالي الصدوق': 'Amali al-Saduq',
  'أمالى الصدوق': 'Amali al-Saduq',
  'أمالي الطوسي': 'Amali al-Tusi',
  'أمالى الطوسی': 'Amali al-Tusi',
  'أمالي المفيد': 'Amali al-Mufid',
  'أمالى المفید': 'Amali al-Mufid',
  'رجال الكشي': 'Rijal al-Kashshi',
  'رجال الکشی': 'Rijal al-Kashshi',
  'رجال النجاشي': 'Rijal al-Najashi',
  'رجال النجاشی': 'Rijal al-Najashi',
  'إقبال الأعمال': 'Iqbal al-Amal',
  'مصباح المتهجد': 'Misbah al-Mutahajjid',
  'الإرشاد': 'Al-Irshad',
  'إرشاد القلوب': 'Irshad al-Qulub',
  'غرر الحكم': 'Ghurar al-Hikam',
  'مناقب آل أبي طالب': 'Manaqib Al Abi Talib',
  'كشف الغمة': 'Kashf al-Ghumma',
  'کشف الغمة': 'Kashf al-Ghumma',
  'الاحتجاج': 'Al-Ihtijaj',
  'تفسير العياشي': 'Tafsir al-Ayyashi',
  'تفسیر العیاشی': 'Tafsir al-Ayyashi',
  'تفسير القمي': 'Tafsir al-Qummi',
  'تفسیر القمی': 'Tafsir al-Qummi',
  'دعائم الإسلام': 'Daim al-Islam',
  'دعائم الاسلام': 'Daim al-Islam',
  'الجعفريات': 'Al-Jafariyyat',
  'قرب الإسناد': 'Qurb al-Isnad',
  'بصائر الدرجات': 'Basair al-Darajat',
  'المحاسن': 'Al-Mahasin',
  'الاختصاص': 'Al-Ikhtisas',
  'مختصر بصائر الدرجات': 'Mukhtasar Basair al-Darajat',
  'كفاية الأثر': 'Kifayat al-Athar',
  'کفایة الأثر': 'Kifayat al-Athar',
  'الغيبة': 'Al-Ghayba',
  'الغیبة': 'Al-Ghayba',
  'كامل الزيارات': 'Kamil al-Ziyarat',
  'کامل الزیارات': 'Kamil al-Ziyarat',
  'فضائل الشيعة': 'Fadail al-Shia',
  'فضائل الشیعة': 'Fadail al-Shia',
  'صفات الشيعة': 'Sifat al-Shia',
  'صفات الشیعة': 'Sifat al-Shia',
  'المقنعة': 'Al-Muqnia',
  'الفقه': 'Al-Fiqh',
  'جامع الأحاديث': 'Jami al-Ahadith',
  'جامع الأحادیث': 'Jami al-Ahadith',
};

// Word-level replacements: bad transliteration -> proper form
// These fix specific badly transliterated words
const wordReplacements = {
  // Common terms that appear as single badly transliterated words
  'mshrq': 'Mashriq',
  'alshmsin': 'al-Shamsayn',
  'alttma': 'al-Tatimma',
  'thfa': 'Tuhfat',
  'alabrar': 'al-Abrar',
  'tslia': 'Tasliyat',
  'almjals': 'al-Majalis',
  'zina': 'Zinat',
  'alMullahm': 'al-Malahim',
  'Alftn': 'al-Fitan',
  'aldr': 'al-Durr',
  'alnzim': 'al-Nazim',
  'dlal': 'Dalail',
  'raha': 'Rahat',
  'alarwah': 'al-Arwah',
  'srwr': 'Surur',
  'aliiman': 'al-Iman',
  'alsltan': 'al-Sultan',
  'almFaraj': 'al-Mufarrij',
  'alathar': 'al-Athar',
  'trf': 'Turaf',
  'alanba': 'al-Anba',
  'shrf': 'Sharaf',
  'alaNabia': 'al-Anbiya',
  'trth': 'Itratihi',
  'alatab': 'al-Ataib',
  'tsrihh': 'Tasrihi',
  'balkhlafa': 'bil-Khilafa',
  'lAli': 'li-Ali',
  'iwn': 'Uyun',
  'algharat': 'al-Gharat',
  'ghrr': 'Ghurar',
  'drr': 'Durar',
  'alsmtin': 'al-Simtayn',
  'Alfswl': 'al-Fusul',
  'almhma': 'al-Muhimma',
  'almminin': 'al-Muminin',
  'liibn': 'li-Ibn',
  'qdh': 'Uqda',
  'kfAyah': 'Kifayat',
  'altalb': 'al-Talib',
  'bhar': 'Bihar',
  'kfaia': 'Kifayat',
  'almhtdi': 'al-Muhtadi',
  'nwadr': 'Nawadir',
  'atabki': 'Atabaki',
  'altf': 'al-Taf',
  'mkhnf': 'Mikhnaf',
  'mrshi': 'Marashi',
  'alistghatha': 'al-Istighatha',
  'bd': 'Bida',
  'althlatha': 'al-Thalatha',
  'aliiqaz': 'al-Iqaz',
  'al-Hija': 'al-Haja',
  'almsabih': 'al-Masabih',
  'Alfad': 'al-Fuad',
  'Talkhis': 'Talkhis',
  'aiti': 'Ayati',
  'mhdwi': 'Mahdawi',
  'damghani': 'Damghani',
  'twq': 'Tawq',
  'alqtifi': 'al-Qatifi',
  'alama': 'al-Umma',
  'ili': 'ila',
  'shih': 'Shia',
  'alAhadith': 'al-Ahadith',
  'alHaditha': 'al-Haditha',
  'alHadith': 'al-Hadith',
  'bRijal': 'bi-Rijal',
  'ghrib': 'Gharib',
  'Alfaq': 'al-Faiq',
  'almthalb': 'al-Mathalib',
  'mhdwi': 'Mahdawi',
  'Sulaymani': 'Sulaymani',
  'bal-Nusus': 'bil-Nusus',
  'llImam': 'lil-Imam',
  'al-Najafi': 'al-Najafi',
  'twarikh': 'Tawarikh',
  'bal-Wasiyya': 'bil-Wasiya',
};

// Mapping of common bad transliterations to proper ones (regex patterns)
const fixPatterns = [
  // Fix "ll" prefix issues (Arabic ل before al-)
  [/\bll([A-Z])/g, 'lil-$1'],
  [/\bllal-/gi, 'lil-'],
  [/\bllibn/gi, 'li-Ibn '],
  [/\bllShaykh/gi, 'lil-Shaykh '],

  // Fix common prefix issues
  [/\balal-/gi, 'al-'],
  [/\b([a-z]+)al([A-Z])/g, '$1 al-$2'],  // Fix joined words like "balNusus" -> "bal- Nusus"

  // Fix common Islamic terms
  [/\balislam\b/gi, 'al-Islam'],
  [/\balnbi\b/gi, 'al-Nabi'],
  [/\balnjashi\b/gi, 'al-Najashi'],
  [/\balqlwb\b/gi, 'al-Qulub'],
  [/\balmqalat\b/gi, 'al-Maqalat'],
  [/\balwra\b/gi, 'al-Wara'],
  [/\balhdi\b/gi, 'al-Huda'],
  [/\balwri\b/gi, 'al-Wara'],
  [/\balmrwf\b/gi, 'al-Maruf'],
  [/\balhdaa\b/gi, 'al-Hudat'],
  [/\balmjzat\b/gi, 'al-Mujizat'],
  [/\balmshhdi\b/gi, 'al-Mashhadi'],
  [/\balmstbsr\b/gi, 'al-Mustabsir'],
  [/\balkbir\b/gi, 'al-Kabir'],
  [/\balsalkin\b/gi, 'al-Salikin'],
  [/\balmruf\b/gi, 'al-Maruf'],
  [/\baltfdil\b/gi, 'al-Tafdil'],
  [/\balnasb\b/gi, 'al-Nasib'],
  [/\balminia\b/gi, 'al-Muiniyya'],
  [/\balkafi\b/gi, 'al-Kafi'],
  [/\baljml\b/gi, 'al-Jamal'],
  [/\baldin\b/gi, 'al-Din'],
  [/\balshafi\b/gi, 'al-Shafi'],
  [/\balsaduq\b/gi, 'al-Saduq'],
  [/\balmufid\b/gi, 'al-Mufid'],
  [/\baltusi\b/gi, 'al-Tusi'],
  [/\balhdid\b/gi, 'al-Hadid'],
  [/\balmkarm\b/gi, 'al-Makarim'],
  [/\balakhlaq\b/gi, 'al-Akhlaq'],
  [/\balamal\b/gi, 'al-Amal'],
  [/\balkashshi\b/gi, 'al-Kashshi'],
  [/\balrida\b/gi, 'al-Rida'],
  [/\balbalagha\b/gi, 'al-Balagha'],
  [/\bal-Qummi\b/gi, 'al-Qummi'],

  // Fix common names
  [/\bMuhammad\s*Baqir\b/gi, 'Muhammad Baqir'],
  [/\bMuhammad\s*tqi\b/gi, 'Muhammad Taqi'],
  [/\bbdalsmd\b/gi, 'Abd al-Samad'],
  [/\bbdalkrim\b/gi, 'Abd al-Karim'],
  [/\bzin\s*alabdin\b/gi, 'Zayn al-Abidin'],
  [/\bamiralmminin\b/gi, 'Amir al-Muminin'],

  // Fix author names
  [/\bdilmi\b/gi, 'Daylami'],
  [/\btbri\b/gi, 'Tabari'],
  [/\bnwfli\b/gi, 'Nawfali'],
  [/\bshjri\b/gi, 'Shajari'],

  // Fix common terms (keep these)
  [/\bTarjuma\b/g, 'Translation'],
  [/\bSharh\b/g, 'Commentary on'],
  [/\bMukhtasar\b/g, 'Summary of'],
  [/\bjld\b/gi, 'Vol.'],
  [/\(t\.\s+/g, '(Ed. '],
  [/\bt\.\s+al/gi, 'Ed. al-'],

  // Fix spacing and punctuation
  [/\s+/g, ' '],
  [/\s*-\s*/g, '-'],
  [/\s*\/\s*/g, ' / '],
  [/\(\s+/g, '('],
  [/\s+\)/g, ')'],
  [/\(\s*\)/g, ''],  // Remove empty parentheses
  [/^\s*\/\s*/g, ''],  // Remove leading slash
  [/\s*\/\s*$/g, ''],  // Remove trailing slash

  // Capitalize first letter after al-
  [/\bal-([a-z])/g, (match, letter) => 'al-' + letter.toUpperCase()],

  // Fix double al-al-
  [/\bal-al-/gi, 'al-'],

  // Capitalize first letter of sentence
  [/^([a-z])/g, (match, letter) => letter.toUpperCase()],
];

function improveTitle(arabicTitle, currentEnglish) {
  let result = currentEnglish;

  // First apply word-level replacements
  for (const [bad, good] of Object.entries(wordReplacements)) {
    // Use word boundary matching to avoid partial replacements
    const regex = new RegExp(`\\b${bad}\\b`, 'g');
    result = result.replace(regex, good);
  }

  // Apply fix patterns
  for (const [pattern, replacement] of fixPatterns) {
    result = result.replace(pattern, replacement);
  }

  // Final cleanup
  result = result
    .replace(/\s+/g, ' ')
    .replace(/^\s+|\s+$/g, '')
    .trim();

  // Capitalize Al- at the start
  if (result.toLowerCase().startsWith('al-')) {
    result = 'Al-' + result.slice(3);
  }

  return result;
}

async function main() {
  const db = new Database(dbPath);

  // Get all books
  const books = db.prepare('SELECT id, title_ar, title_en FROM books ORDER BY id').all();

  console.log(`Found ${books.length} books to process`);

  let updates = [];

  for (const book of books) {
    const improved = improveTitle(book.title_ar, book.title_en);

    if (improved !== book.title_en) {
      updates.push({
        id: book.id,
        original: book.title_en,
        improved: improved,
        arabic: book.title_ar
      });
    }
  }

  // Show first 50 improvements
  console.log('\nSample improvements:');
  console.log('='.repeat(100));
  for (let i = 0; i < Math.min(50, updates.length); i++) {
    const u = updates[i];
    console.log(`\n[${u.id}] ${u.arabic}`);
    console.log(`  Before: ${u.original}`);
    console.log(`  After:  ${u.improved}`);
  }

  console.log('\n' + '='.repeat(100));
  console.log(`\nTotal books that would be updated: ${updates.length} out of ${books.length}`);

  // Ask for confirmation
  const args = process.argv.slice(2);
  if (args.includes('--apply')) {
    console.log('\nApplying updates...');

    const updateStmt = db.prepare('UPDATE books SET title_en = ? WHERE id = ?');

    const transaction = db.transaction(() => {
      for (const update of updates) {
        updateStmt.run(update.improved, update.id);
      }
    });

    transaction();
    console.log(`Updated ${updates.length} books.`);
  } else {
    console.log('\nRun with --apply to apply these changes');
  }

  db.close();
}

main().catch(console.error);
