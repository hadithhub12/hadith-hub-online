/**
 * Knowledge-based mapping of English book titles to Arabic titles
 * This maps based on scholarly knowledge of Islamic texts
 */

// Key known mappings: English title -> Arabic title patterns
const TITLE_MAPPINGS = {
  // Major Hadith Collections
  'Al Kafi': 'الکافي',
  'Al-Kafi': 'الکافي',
  'Man La Yahduruhu al-Faqih': 'من لايحضره الفقيه',
  'Tahdhib al-Ahkam': 'تهذيب الأحكام',
  'Al-Istibsar': 'الاستبصار',
  'Bihar al-Anwar': 'بحار الأنوار',
  "Wasa'il al-Shia": 'وسائل الشیعة',
  "Mustadrak al-Wasa'il": 'مستدرك الوسائل',
  'Al-Wafi': 'الوافي',

  // Nahj al-Balagha
  'Nahj al-Balagha': 'نهج البلاغة',

  // Sahifa Sajjadiya
  'Sahifa Sajjadiya': 'صحیفه سجادیه',
  'Al-Sahifa al-Sajjadiya': 'الصحیفة السجادیة',

  // Other major works
  'Al-Amali': 'الأمالي',
  'Al-Khisal': 'الخصال',
  'Al-Tawhid': 'التوحید',
  "Tuhaf al-'Uqul": 'تحف العقول',
  'Al-Ihtijaj': 'الإحتجاج',
  'Al-Irshad': 'الإرشاد',
  'Al-Ghaybah': 'الغیبة',
  "Basa'ir al-Darajat": 'بصائر الدرجات',
  'Kamal al-Din': 'کمال الدین',
  "Uyun Akhbar al-Rida": 'عیون أخبار الرضا',
  'Al-Mahasin': 'المحاسن',
  'Qurb al-Isnad': 'قرب الإسناد',
  "Tafsir al-Qummi": 'تفسیر القمی',
  "Tafsir al-'Ayyashi": 'تفسیر العیاشی',

  // A'lam al-Din
  "A'lam al-Din": 'أعلام الدین',
  'Aalam al-Din': 'أعلام الدین',

  // Misbah
  "Misbah al-Shari'a": 'مصباح الشریعة',
  'Misbah al-Mutahajjid': 'مصباح المتهجد',

  // Rijal works
  'Rijal al-Kashshi': 'رجال الکشی',
  'Rijal al-Najashi': 'رجال النجاشی',
  'Rijal al-Tusi': 'رجال الطوسی',
};

// Author mappings
const AUTHOR_MAPPINGS = {
  'Kulaini': 'کلینی',
  'Kulayni': 'کلینی',
  'Shaykh Saduq': 'شیخ صدوق',
  'Ibn Babawayh': 'ابن بابویه',
  'Shaykh al-Tusi': 'شیخ طوسی',
  'Shaykh al-Mufid': 'شیخ مفید',
  'Allama Majlisi': 'علامه مجلسی',
  'Al-Hurr al-Amili': 'حر عاملی',
  'Sharif al-Radi': 'شریف رضی',
  'Fayd Kashani': 'فیض کاشانی',
  'Mirza Husayn al-Nuri': 'میرزا حسین نوری',
  'Al-Barqi': 'برقی',
  "Al-Nu'mani": 'نعمانی',
  'Al-Rawandi': 'راوندی',
  'Al-Qutb al-Rawandi': 'قطب راوندی',
  'Sayyid Ibn Tawus': 'سید ابن طاووس',
  'Al-Tabarsi': 'طبرسی',
  'Ibn Shahr Ashub': 'ابن شهر آشوب',
};

module.exports = { TITLE_MAPPINGS, AUTHOR_MAPPINGS };
