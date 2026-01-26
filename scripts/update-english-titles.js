const Database = require('better-sqlite3');
const { createClient } = require('@libsql/client');

// Common Arabic names and words with proper English transliterations
const commonWords = {
  // Full book titles (longest first for proper matching)
  '[ألف] آية نزلت في الإمام علي (ع)': '[Alf] Ayah Nazalat fi al-Imam Ali (a.s.)',
  // Decomposed version (alef + superscript alef)
  '[ألف] آية نزلت في الإمام علي (ع)': '[Alf] Ayah Nazalat fi al-Imam Ali (a.s.)',
  'ألف آية نزلت في الإمام علي': 'Alf Ayah Nazalat fi al-Imam Ali',
  'ألف آيه نزلت في الإمام علي': 'Alf Ayah Nazalat fi al-Imam Ali',
  'الف آيه نزلت في الامام علي': 'Alf Ayah Nazalat fi al-Imam Ali',
  'الف آية نزلت في الامام علي': 'Alf Ayah Nazalat fi al-Imam Ali',

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
  'عَلی': 'Ali',
  'عَلي': 'Ali',
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
  'حمیری': 'al-Himyari',
  'حميري': 'al-Himyari',
  'مسعودی': 'al-Masudi',
  'مسعودي': 'al-Masudi',
  'بروجردی': 'al-Burujirdi',
  'بروجردي': 'al-Burujirdi',
  'کراجکی': 'al-Karajaki',
  'کراجكي': 'al-Karajaki',
  'طبری': 'al-Tabari',
  'طبري': 'al-Tabari',
  'سبزواری': 'al-Sabzawari',
  'سبزواري': 'al-Sabzawari',
  'خوئی': 'al-Khui',
  'خوئي': 'al-Khui',
  'خویی': 'al-Khui',
  'خويي': 'al-Khui',
  'لاهیجی': 'al-Lahiji',
  'لاهيجي': 'al-Lahiji',
  'خوانساری': 'al-Khwansari',
  'خوانساري': 'al-Khwansari',
  'سمرقندی': 'al-Samarqandi',
  'سمرقندي': 'al-Samarqandi',
  'اربلی': 'al-Arbili',
  'اربلي': 'al-Arbili',

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

  // Common name patterns in titles
  'علي بن': 'Ali ibn',
  'علی بن': 'Ali ibn',
  'بن علي': 'ibn Ali',
  'بن علی': 'ibn Ali',
  'محمد بن علي': 'Muhammad ibn Ali',
  'محمد بن علی': 'Muhammad ibn Ali',
  'علي بن محمد': 'Ali ibn Muhammad',
  'علی بن محمد': 'Ali ibn Muhammad',
  'علي بن حسن': 'Ali ibn Hasan',
  'علی بن حسن': 'Ali ibn Hasan',
  'علي بن حسین': 'Ali ibn Husayn',
  'علی بن حسین': 'Ali ibn Husayn',
  'علي بن حسين': 'Ali ibn Husayn',
  'علی بن حسين': 'Ali ibn Husayn',
  'حسن بن علي': 'Hasan ibn Ali',
  'حسن بن علی': 'Hasan ibn Ali',
  'حسین بن علي': 'Husayn ibn Ali',
  'حسین بن علی': 'Husayn ibn Ali',
  'حسين بن علي': 'Husayn ibn Ali',
  'حسين بن علی': 'Husayn ibn Ali',
  'جعفر بن محمد': 'Jafar ibn Muhammad',
  'احمد بن محمد': 'Ahmad ibn Muhammad',
  'أحمد بن محمد': 'Ahmad ibn Muhammad',
  'محمد بن احمد': 'Muhammad ibn Ahmad',
  'محمد بن أحمد': 'Muhammad ibn Ahmad',
  'محمد بن حسن': 'Muhammad ibn Hasan',
  'حسن بن محمد': 'Hasan ibn Muhammad',
  'محمد بن جعفر': 'Muhammad ibn Jafar',
  'محمد بن ابراهیم': 'Muhammad ibn Ibrahim',
  'محمد بن ابراهيم': 'Muhammad ibn Ibrahim',
  'ابراهیم بن محمد': 'Ibrahim ibn Muhammad',
  'ابراهيم بن محمد': 'Ibrahim ibn Muhammad',
  'عبد الله بن جعفر': 'Abdullah ibn Jafar',
  'عبدالله بن جعفر': 'Abdullah ibn Jafar',
  'محمد بن عمر': 'Muhammad ibn Umar',
  'علی بن ابراهیم': 'Ali ibn Ibrahim',
  'علي بن ابراهيم': 'Ali ibn Ibrahim',
  'فضل بن حسن': 'Fadl ibn Hasan',

  // More titles/terms
  'العلوية': 'al-Alawiyya',
  'العلويين': 'al-Alawiyyin',
  'علوي': 'Alawi',
  'علوی': 'Alawi',
  'العلوي': 'al-Alawi',
  'العلوی': 'al-Alawi',

  // Common Arabic words
  'ألف': 'Alf',
  'الف': 'Alf',
  'آية': 'Ayah',
  'آيه': 'Ayah',
  'آیة': 'Ayah',
  'آیه': 'Ayah',
  'ایه': 'Ayah',
  'اية': 'Ayah',
  'نزلت': 'Nazalat',
  'نزل': 'Nazal',
  'في': 'fi',
  'فی': 'fi',
  'على': 'ala',
  'علی': 'ala',
  'من': 'min',
  'إلى': 'ila',
  'الی': 'ila',
  'عن': 'an',
  'مع': 'maa',
  'هذا': 'hadha',
  'هذه': 'hadhihi',
  'ذلک': 'dhalik',
  'ذلك': 'dhalik',
  'کتاب': 'Kitab',
  'كتاب': 'Kitab',
  'الکتاب': 'al-Kitab',
  'الكتاب': 'al-Kitab',
  'باب': 'Bab',
  'الباب': 'al-Bab',
  'أبواب': 'Abwab',
  'ابواب': 'Abwab',
  'دار': 'Dar',
  'الدار': 'al-Dar',
  'بیت': 'Bayt',
  'بيت': 'Bayt',
  'البیت': 'al-Bayt',
  'البيت': 'al-Bayt',
  'أهل': 'Ahl',
  'اهل': 'Ahl',
  'خبر': 'Khabar',
  'الخبر': 'al-Khabar',
  'أخبار': 'Akhbar',
  'اخبار': 'Akhbar',
  'الأخبار': 'al-Akhbar',
  'الاخبار': 'al-Akhbar',
  'عمل': 'Amal',
  'الأعمال': 'al-Amal',
  'الاعمال': 'al-Amal',
  'أعمال': 'Amal',
  'اعمال': 'Amal',
  'عقاب': 'Iqab',
  'العقاب': 'al-Iqab',
  'ثواب': 'Thawab',
  'الثواب': 'al-Thawab',
  'دعاء': 'Dua',
  'الدعاء': 'al-Dua',
  'دعا': 'Dua',
  'صلاة': 'Salat',
  'الصلاة': 'al-Salat',
  'صلوة': 'Salat',
  'الصلوة': 'al-Salat',
  'زیارة': 'Ziyarat',
  'زيارة': 'Ziyarat',
  'الزیارة': 'al-Ziyarat',
  'الزيارة': 'al-Ziyarat',
  'زیارت': 'Ziyarat',
  'مقتل': 'Maqtal',
  'المقتل': 'al-Maqtal',
  'شهید': 'Shahid',
  'شهيد': 'Shahid',
  'الشهید': 'al-Shahid',
  'الشهيد': 'al-Shahid',
  'شهادة': 'Shahada',
  'الشهادة': 'al-Shahada',
  'سیرة': 'Sira',
  'سيرة': 'Sira',
  'السیرة': 'al-Sira',
  'السيرة': 'al-Sira',
  'تاریخ': 'Tarikh',
  'تاريخ': 'Tarikh',
  'التاریخ': 'al-Tarikh',
  'التاريخ': 'al-Tarikh',
  'علم': 'Ilm',
  'العلم': 'al-Ilm',
  'علوم': 'Ulum',
  'العلوم': 'al-Ulum',
  'أصول': 'Usul',
  'اصول': 'Usul',
  'الأصول': 'al-Usul',
  'الاصول': 'al-Usul',
  'فروع': 'Furu',
  'الفروع': 'al-Furu',
  'عقائد': 'Aqaid',
  'العقائد': 'al-Aqaid',
  'عقیدة': 'Aqida',
  'عقيدة': 'Aqida',
  'العقیدة': 'al-Aqida',
  'العقيدة': 'al-Aqida',
  'توحید': 'Tawhid',
  'توحيد': 'Tawhid',
  'عدل': 'Adl',
  'العدل': 'al-Adl',
  'نبوة': 'Nubuwwa',
  'النبوة': 'al-Nubuwwa',
  'إمامة': 'Imama',
  'امامة': 'Imama',
  'الإمامة': 'al-Imama',
  'الامامة': 'al-Imama',
  'معاد': 'Maad',
  'المعاد': 'al-Maad',
  'جنة': 'Janna',
  'الجنة': 'al-Janna',
  'نار': 'Nar',
  'النار': 'al-Nar',
  'قیامة': 'Qiyama',
  'قيامة': 'Qiyama',
  'القیامة': 'al-Qiyama',
  'القيامة': 'al-Qiyama',
  'موت': 'Mawt',
  'الموت': 'al-Mawt',
  'برزخ': 'Barzakh',
  'البرزخ': 'al-Barzakh',
  'غیبة': 'Ghayba',
  'غيبة': 'Ghayba',
  'رجعة': 'Raja',
  'الرجعة': 'al-Raja',
  'ظهور': 'Zuhur',
  'الظهور': 'al-Zuhur',
  'انتظار': 'Intizar',
  'الانتظار': 'al-Intizar',
  'فرج': 'Faraj',
  'الفرج': 'al-Faraj',

  // More title words
  'رسائل': 'Rasail',
  'الرسائل': 'al-Rasail',
  'رسالة': 'Risala',
  'الرسالة': 'al-Risala',
  'مناهج': 'Manahij',
  'المناهج': 'al-Manahij',
  'هدایة': 'Hidaya',
  'هداية': 'Hidaya',
  'الهدایة': 'al-Hidaya',
  'الهداية': 'al-Hidaya',
  'هدی': 'Huda',
  'هدي': 'Huda',
  'الهدی': 'al-Huda',
  'الهدي': 'al-Huda',
  'إسناد': 'Isnad',
  'اسناد': 'Isnad',
  'الإسناد': 'al-Isnad',
  'الاسناد': 'al-Isnad',
  'قرب': 'Qurb',
  'القرب': 'al-Qurb',
  'اختیار': 'Ikhtiyar',
  'اختيار': 'Ikhtiyar',
  'الاختیار': 'al-Ikhtiyar',
  'الاختيار': 'al-Ikhtiyar',
  'معرفة': 'Marifa',
  'المعرفة': 'al-Marifa',
  'معروف': 'Maruf',
  'المعروف': 'al-Maruf',
  'منابع': 'Manabi',
  'المنابع': 'al-Manabi',
  'جامع': 'Jami',
  'الجامع': 'al-Jami',
  'إثبات': 'Ithbat',
  'اثبات': 'Ithbat',
  'الإثبات': 'al-Ithbat',
  'الاثبات': 'al-Ithbat',
  'هداة': 'Hudat',
  'الهداة': 'al-Hudat',
  'نصوص': 'Nusus',
  'النصوص': 'al-Nusus',
  'معجزات': 'Mujizat',
  'المعجزات': 'al-Mujizat',
  'وصیة': 'Wasiyya',
  'وصية': 'Wasiyya',
  'الوصیة': 'al-Wasiyya',
  'الوصية': 'al-Wasiyya',
  'ثاقب': 'Thaqib',
  'الثاقب': 'al-Thaqib',
  'جواهر': 'Jawahir',
  'الجواهر': 'al-Jawahir',
  'مطالب': 'Matalib',
  'المطالب': 'al-Matalib',
  'مصادر': 'Masadir',
  'المصادر': 'al-Masadir',
  'عوالم': 'Awalim',
  'العوالم': 'al-Awalim',
  'فرائد': 'Faraid',
  'الفرائد': 'al-Faraid',
  'إعلام': 'Ilam',
  'اعلام': 'Ilam',
  'الإعلام': 'al-Ilam',
  'الاعلام': 'al-Ilam',
  'إیقاظ': 'Iqaz',
  'ايقاظ': 'Iqaz',
  'الإیقاظ': 'al-Iqaz',
  'الايقاظ': 'al-Iqaz',
  'هجعة': 'Hija',
  'الهجعة': 'al-Hija',
  'تلخیص': 'Talkhis',
  'تلخيص': 'Talkhis',
  'التلخیص': 'al-Talkhis',
  'التلخيص': 'al-Talkhis',
  'شافي': 'Shafi',
  'الشافي': 'al-Shafi',
  'قاضی': 'Qadi',
  'قاضي': 'Qadi',
  'القاضی': 'al-Qadi',
  'القاضي': 'al-Qadi',
  'سعید': 'Said',
  'سعيد': 'Said',
  'طاهرین': 'Tahirin',
  'طاهرين': 'Tahirin',
  'الطاهرین': 'al-Tahirin',
  'الطاهرين': 'al-Tahirin',
  'وری': 'Wara',
  'وري': 'Wara',
  'الوری': 'al-Wara',
  'الوري': 'al-Wara',
  'أعلام': 'Alam',
  'اعلام': 'Alam',
  'الأعلام': 'al-Alam',
  'الاعلام': 'al-Alam',
  'صفین': 'Siffin',
  'صفين': 'Siffin',
  'وقعة': 'Waqia',
  'الوقعة': 'al-Waqia',

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

  // Normalize Unicode - compose decomposed characters
  result = result.normalize('NFC');

  // Also handle some common decomposed forms manually
  result = result
    .replace(/ا\u0653/g, 'آ')  // alef + maddah above -> alef with maddah
    .replace(/ا\u0655/g, 'إ')  // alef + hamza below -> alef with hamza below
    .replace(/ا\u0654/g, 'أ')  // alef + hamza above -> alef with hamza above
    .replace(/\(ع\)/g, '(a.s.)')  // (ع) -> (a.s.)
    .replace(/\(ص\)/g, '(s.a.w.a.)')  // (ص) -> (s.a.w.a.)
    .replace(/\(س\)/g, '(a.s.)')  // (س) -> (a.s.)
    .replace(/\(رض\)/g, '')  // (رض) -> remove
    .replace(/\(قدس سره\)/g, '');

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
