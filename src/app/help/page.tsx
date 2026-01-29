'use client';

import { useState, useEffect } from 'react';
import Link from 'next/link';
import ThemeToggle from '@/components/ThemeToggle';
import LanguageToggle from '@/components/LanguageToggle';

// Logo Icon (same as home page)
function LogoIcon({ className = 'w-8 h-8' }: { className?: string }) {
  return (
    <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 48 48" className={className}>
      <defs>
        <linearGradient id="logoGradient" x1="0%" y1="0%" x2="100%" y2="100%">
          <stop offset="0%" stopColor="#3b82f6" />
          <stop offset="100%" stopColor="#8b5cf6" />
        </linearGradient>
      </defs>
      <circle cx="24" cy="24" r="22" fill="url(#logoGradient)" />
      <path
        d="M14 12h20c1.1 0 2 .9 2 2v20c0 1.1-.9 2-2 2H14c-1.1 0-2-.9-2-2V14c0-1.1.9-2 2-2z"
        fill="none"
        stroke="white"
        strokeWidth="1.5"
      />
      <path d="M17 18h14M17 24h14M17 30h10" stroke="white" strokeWidth="1.5" strokeLinecap="round" />
      <circle cx="36" cy="36" r="8" fill="#10b981" />
      <path d="M33 36l2 2 4-4" stroke="white" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" />
    </svg>
  );
}

// Section icons
function SearchIcon({ className = 'w-6 h-6' }: { className?: string }) {
  return (
    <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor" className={className}>
      <path strokeLinecap="round" strokeLinejoin="round" d="M21 21l-5.197-5.197m0 0A7.5 7.5 0 105.196 5.196a7.5 7.5 0 0010.607 10.607z" />
    </svg>
  );
}

function BookIcon({ className = 'w-6 h-6' }: { className?: string }) {
  return (
    <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor" className={className}>
      <path strokeLinecap="round" strokeLinejoin="round" d="M12 6.042A8.967 8.967 0 006 3.75c-1.052 0-2.062.18-3 .512v14.25A8.987 8.987 0 016 18c2.305 0 4.408.867 6 2.292m0-14.25a8.966 8.966 0 016-2.292c1.052 0 2.062.18 3 .512v14.25A8.987 8.987 0 0018 18a8.967 8.967 0 00-6 2.292m0-14.25v14.25" />
    </svg>
  );
}

function DocumentIcon({ className = 'w-6 h-6' }: { className?: string }) {
  return (
    <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor" className={className}>
      <path strokeLinecap="round" strokeLinejoin="round" d="M19.5 14.25v-2.625a3.375 3.375 0 00-3.375-3.375h-1.5A1.125 1.125 0 0113.5 7.125v-1.5a3.375 3.375 0 00-3.375-3.375H8.25m0 12.75h7.5m-7.5 3H12M10.5 2.25H5.625c-.621 0-1.125.504-1.125 1.125v17.25c0 .621.504 1.125 1.125 1.125h12.75c.621 0 1.125-.504 1.125-1.125V11.25a9 9 0 00-9-9z" />
    </svg>
  );
}

function CogIcon({ className = 'w-6 h-6' }: { className?: string }) {
  return (
    <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor" className={className}>
      <path strokeLinecap="round" strokeLinejoin="round" d="M9.594 3.94c.09-.542.56-.94 1.11-.94h2.593c.55 0 1.02.398 1.11.94l.213 1.281c.063.374.313.686.645.87.074.04.147.083.22.127.324.196.72.257 1.075.124l1.217-.456a1.125 1.125 0 011.37.49l1.296 2.247a1.125 1.125 0 01-.26 1.431l-1.003.827c-.293.24-.438.613-.431.992a6.759 6.759 0 010 .255c-.007.378.138.75.43.99l1.005.828c.424.35.534.954.26 1.43l-1.298 2.247a1.125 1.125 0 01-1.369.491l-1.217-.456c-.355-.133-.75-.072-1.076.124a6.57 6.57 0 01-.22.128c-.331.183-.581.495-.644.869l-.213 1.28c-.09.543-.56.941-1.11.941h-2.594c-.55 0-1.02-.398-1.11-.94l-.213-1.281c-.062-.374-.312-.686-.644-.87a6.52 6.52 0 01-.22-.127c-.325-.196-.72-.257-1.076-.124l-1.217.456a1.125 1.125 0 01-1.369-.49l-1.297-2.247a1.125 1.125 0 01.26-1.431l1.004-.827c.292-.24.437-.613.43-.992a6.932 6.932 0 010-.255c.007-.378-.138-.75-.43-.99l-1.004-.828a1.125 1.125 0 01-.26-1.43l1.297-2.247a1.125 1.125 0 011.37-.491l1.216.456c.356.133.751.072 1.076-.124.072-.044.146-.087.22-.128.332-.183.582-.495.644-.869l.214-1.281z" />
      <path strokeLinecap="round" strokeLinejoin="round" d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
    </svg>
  );
}

function EnvelopeIcon({ className = 'w-6 h-6' }: { className?: string }) {
  return (
    <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor" className={className}>
      <path strokeLinecap="round" strokeLinejoin="round" d="M21.75 6.75v10.5a2.25 2.25 0 01-2.25 2.25h-15a2.25 2.25 0 01-2.25-2.25V6.75m19.5 0A2.25 2.25 0 0019.5 4.5h-15a2.25 2.25 0 00-2.25 2.25m19.5 0v.243a2.25 2.25 0 01-1.07 1.916l-7.5 4.615a2.25 2.25 0 01-2.36 0L3.32 8.91a2.25 2.25 0 01-1.07-1.916V6.75" />
    </svg>
  );
}

function SparklesIcon({ className = 'w-5 h-5' }: { className?: string }) {
  return (
    <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor" className={className}>
      <path strokeLinecap="round" strokeLinejoin="round" d="M9.813 15.904L9 18.75l-.813-2.846a4.5 4.5 0 00-3.09-3.09L2.25 12l2.846-.813a4.5 4.5 0 003.09-3.09L9 5.25l.813 2.846a4.5 4.5 0 003.09 3.09L15.75 12l-2.846.813a4.5 4.5 0 00-3.09 3.09zM18.259 8.715L18 9.75l-.259-1.035a3.375 3.375 0 00-2.455-2.456L14.25 6l1.036-.259a3.375 3.375 0 002.455-2.456L18 2.25l.259 1.035a3.375 3.375 0 002.456 2.456L21.75 6l-1.035.259a3.375 3.375 0 00-2.456 2.456zM16.894 20.567L16.5 21.75l-.394-1.183a2.25 2.25 0 00-1.423-1.423L13.5 18.75l1.183-.394a2.25 2.25 0 001.423-1.423l.394-1.183.394 1.183a2.25 2.25 0 001.423 1.423l1.183.394-1.183.394a2.25 2.25 0 00-1.423 1.423z" />
    </svg>
  );
}

// Content translations
const content = {
  ar: {
    title: 'دليل الاستخدام',
    subtitle: 'تعرّف على جميع ميزات مَرْكَز دِرَاسَاتِ الحَدِيث',
    backToHome: 'العودة للرئيسية',

    // Table of Contents
    toc: 'المحتويات',

    // Introduction
    introTitle: 'مقدمة',
    introText: 'مرحباً بك في مَرْكَز دِرَاسَاتِ الحَدِيث - مكتبة رقمية شاملة تضم أكثر من 1200 كتاب من كتب الحديث الإسلامي من المذهبين الشيعي والسني. يمكنك البحث والتصفح وقراءة النصوص بسهولة تامة.',

    // Search Section
    searchTitle: 'دليل البحث',
    searchIntro: 'يوفر الموقع أربعة أنواع من البحث لتلبية احتياجاتك المختلفة:',

    exactSearchTitle: 'البحث الدقيق',
    exactSearchDesc: 'يبحث عن العبارة كما هي بالضبط في النصوص.',
    exactSearchExample: 'مثال: البحث عن "الإمام الصادق" يجد الصفحات التي تحتوي على هذه العبارة بالضبط.',
    exactSearchTip: 'استخدم هذا النوع عندما تبحث عن اسم محدد أو عبارة معينة.',

    wordSearchTitle: 'البحث بالكلمات',
    wordSearchDesc: 'يبحث عن أي من الكلمات المدخلة (منطق OR).',
    wordSearchExample: 'مثال: البحث عن "الصلاة الصيام" يجد الصفحات التي تحتوي على كلمة "الصلاة" أو "الصيام" أو كلاهما.',
    wordSearchTip: 'مفيد للبحث الواسع عن مواضيع متعددة.',

    rootSearchTitle: 'البحث بالجذر',
    rootSearchDesc: 'يبحث عن جميع الكلمات المشتقة من نفس الجذر العربي.',
    rootSearchExample: 'مثال: البحث عن "كتب" يجد: كاتب، مكتوب، كتاب، يكتبون، مكتبة، إلخ.',
    rootSearchTip: 'ممتاز للبحث اللغوي والعثور على جميع أشكال الكلمة.',

    topicSearchTitle: 'البحث الموضوعي (ذكاء اصطناعي)',
    topicSearchDesc: 'يستخدم الذكاء الاصطناعي لفهم معنى بحثك وإيجاد المحتوى المرتبط موضوعياً.',
    topicSearchExample1: 'يمكنك البحث بالعربية: "فضل العلم والعلماء"',
    topicSearchExample2: 'أو بالإنجليزية: "Imam Hussain in Karbala"',
    topicSearchTip: 'الأفضل للبحث عن مفاهيم ومواضيع بدلاً من كلمات محددة.',
    topicSearchAI: 'مدعوم بالذكاء الاصطناعي',

    // Library Section
    libraryTitle: 'تصفح المكتبة',
    libraryIntro: 'عدة طرق لتصفح الكتب:',

    viewModesTitle: 'أنماط العرض',
    viewModeGrid: 'عرض الشبكة: بطاقات كبيرة مع تفاصيل الكتاب',
    viewModeList: 'عرض القائمة: صفوف أفقية مع معلومات أكثر',
    viewModeCompact: 'عرض مضغوط: صفوف بسيطة لتصفح سريع',

    filterTitle: 'التصفية',
    filterAll: 'الكل: جميع الكتب',
    filterShia: 'الشيعة: كتب المذهب الشيعي فقط',
    filterSunni: 'السنة: كتب المذهب السني فقط',

    sortTitle: 'الترتيب',
    sortByTitle: 'حسب العنوان: ترتيب أبجدي',
    sortByAuthor: 'حسب المؤلف: ترتيب حسب اسم المؤلف',
    sortByPages: 'حسب الصفحات: ترتيب حسب عدد الصفحات',

    quickFilterTitle: 'البحث السريع',
    quickFilterDesc: 'اكتب في حقل "تصفية الكتب" للبحث السريع عن كتاب بالاسم أو المؤلف.',

    // Reading Section
    readingTitle: 'قراءة الصفحات',
    readingIntro: 'أدوات متعددة لتجربة قراءة مريحة:',

    navigationTitle: 'التنقل',
    navButtons: 'أزرار السابق/التالي للتنقل بين الصفحات',
    navKeyboard: 'مفاتيح الأسهم (← →) للتنقل السريع',
    navJump: 'حقل "الانتقال إلى صفحة" للقفز لصفحة محددة',

    fontTitle: 'إعدادات الخط',
    fontFamilies: 'خمسة خطوط عربية: Amiri، Scheherazade، Noto Naskh، Noto Nastaliq، Lateef',
    fontSizes: 'خمسة أحجام: من صغير جداً إلى كبير جداً',
    fontPersist: 'تُحفظ إعداداتك تلقائياً للزيارات القادمة',

    specialTitle: 'ميزات خاصة',
    specialBihar: 'تنسيق خاص لكتاب بحار الأنوار مع ألوان مميزة للأبواب والأحاديث',
    specialQuran: 'روابط تفاعلية للآيات القرآنية',
    specialHighlight: 'تمييز كلمات البحث في النص',

    // Settings Section
    settingsTitle: 'الإعدادات',

    languageTitle: 'اللغة',
    languageDesc: 'اضغط على زر اللغة للتبديل بين العربية والإنجليزية',

    themeTitle: 'المظهر',
    themeDesc: 'اضغط على أيقونة الشمس/القمر للتبديل بين الوضع الفاتح والداكن',

    shareTitle: 'المشاركة',
    shareDesc: 'اضغط على أيقونة المشاركة لنسخ رابط الصفحة أو مشاركتها مباشرة',

    // Contact Section
    contactTitle: 'اتصل بنا',
    contactText: 'للأسئلة والاقتراحات والملاحظات، يرجى التواصل معنا عبر البريد الإلكتروني:',
    contactEmail: 'hadithhub141@gmail.com',
    contactFooter: 'نرحب بجميع ملاحظاتكم واقتراحاتكم لتحسين الموقع.',
  },
  en: {
    title: 'User Guide',
    subtitle: 'Learn about all features of Hadith Hub Online',
    backToHome: 'Back to Home',

    // Table of Contents
    toc: 'Contents',

    // Introduction
    introTitle: 'Introduction',
    introText: 'Welcome to Hadith Hub Online - a comprehensive digital library containing over 1,200 Islamic hadith books from both Shia and Sunni traditions. Search, browse, and read texts with ease.',

    // Search Section
    searchTitle: 'Search Guide',
    searchIntro: 'The site offers four types of search to meet your different needs:',

    exactSearchTitle: 'Exact Search',
    exactSearchDesc: 'Searches for the exact phrase as entered.',
    exactSearchExample: 'Example: Searching for "الإمام الصادق" finds pages containing this exact phrase.',
    exactSearchTip: 'Use this when searching for a specific name or phrase.',

    wordSearchTitle: 'Word Search',
    wordSearchDesc: 'Searches for any of the entered words (OR logic).',
    wordSearchExample: 'Example: Searching for "الصلاة الصيام" finds pages containing "prayer" OR "fasting" or both.',
    wordSearchTip: 'Useful for broad searches across multiple topics.',

    rootSearchTitle: 'Root Search',
    rootSearchDesc: 'Searches for all words derived from the same Arabic root.',
    rootSearchExample: 'Example: Searching for "كتب" finds: writer, written, book, they write, library, etc.',
    rootSearchTip: 'Excellent for linguistic research and finding all word forms.',

    topicSearchTitle: 'Topic Search (AI-Powered)',
    topicSearchDesc: 'Uses artificial intelligence to understand the meaning of your search and find topically related content.',
    topicSearchExample1: 'Search in Arabic: "فضل العلم والعلماء" (virtues of knowledge)',
    topicSearchExample2: 'Or in English: "Imam Hussain in Karbala"',
    topicSearchTip: 'Best for searching concepts and topics rather than specific words.',
    topicSearchAI: 'AI-Powered',

    // Library Section
    libraryTitle: 'Browse the Library',
    libraryIntro: 'Multiple ways to browse books:',

    viewModesTitle: 'View Modes',
    viewModeGrid: 'Grid View: Large cards with book details',
    viewModeList: 'List View: Horizontal rows with more information',
    viewModeCompact: 'Compact View: Simple rows for quick browsing',

    filterTitle: 'Filtering',
    filterAll: 'All: All books',
    filterShia: 'Shia: Shia tradition books only',
    filterSunni: 'Sunni: Sunni tradition books only',

    sortTitle: 'Sorting',
    sortByTitle: 'By Title: Alphabetical order',
    sortByAuthor: 'By Author: Order by author name',
    sortByPages: 'By Pages: Order by page count',

    quickFilterTitle: 'Quick Filter',
    quickFilterDesc: 'Type in the "Filter books" field to quickly search for a book by name or author.',

    // Reading Section
    readingTitle: 'Reading Pages',
    readingIntro: 'Multiple tools for a comfortable reading experience:',

    navigationTitle: 'Navigation',
    navButtons: 'Previous/Next buttons to navigate between pages',
    navKeyboard: 'Arrow keys (← →) for quick navigation',
    navJump: '"Go to page" field to jump to a specific page',

    fontTitle: 'Font Settings',
    fontFamilies: 'Five Arabic fonts: Amiri, Scheherazade, Noto Naskh, Noto Nastaliq, Lateef',
    fontSizes: 'Five sizes: from Extra Small to Extra Large',
    fontPersist: 'Your settings are automatically saved for future visits',

    specialTitle: 'Special Features',
    specialBihar: 'Special formatting for Bihar al-Anwar with distinct colors for chapters and hadith',
    specialQuran: 'Interactive links for Quranic verses',
    specialHighlight: 'Search term highlighting in text',

    // Settings Section
    settingsTitle: 'Settings',

    languageTitle: 'Language',
    languageDesc: 'Click the language button to toggle between Arabic and English',

    themeTitle: 'Theme',
    themeDesc: 'Click the sun/moon icon to toggle between light and dark mode',

    shareTitle: 'Sharing',
    shareDesc: 'Click the share icon to copy the page link or share directly',

    // Contact Section
    contactTitle: 'Contact Us',
    contactText: 'For questions, suggestions, and feedback, please contact us via email:',
    contactEmail: 'hadithhub141@gmail.com',
    contactFooter: 'We welcome all your feedback and suggestions to improve the site.',
  },
};

// Table of contents items
const tocItems = {
  ar: [
    { id: 'intro', label: 'مقدمة' },
    { id: 'search', label: 'دليل البحث' },
    { id: 'library', label: 'تصفح المكتبة' },
    { id: 'reading', label: 'قراءة الصفحات' },
    { id: 'settings', label: 'الإعدادات' },
    { id: 'contact', label: 'اتصل بنا' },
  ],
  en: [
    { id: 'intro', label: 'Introduction' },
    { id: 'search', label: 'Search Guide' },
    { id: 'library', label: 'Browse Library' },
    { id: 'reading', label: 'Reading Pages' },
    { id: 'settings', label: 'Settings' },
    { id: 'contact', label: 'Contact Us' },
  ],
};

export default function HelpPage() {
  const [language, setLanguage] = useState<'ar' | 'en'>('ar');
  const t = content[language];
  const toc = tocItems[language];

  // Load saved language preference
  useEffect(() => {
    const savedLang = localStorage.getItem('hadith-lang');
    if (savedLang === 'en' || savedLang === 'ar') {
      setLanguage(savedLang);
    }
  }, []);

  const handleLanguageChange = (lang: 'ar' | 'en') => {
    setLanguage(lang);
    localStorage.setItem('hadith-lang', lang);
  };

  return (
    <div className="min-h-screen bg-gradient-to-b from-gray-50 to-gray-100 dark:from-gray-900 dark:to-gray-950" dir={language === 'ar' ? 'rtl' : 'ltr'}>
      {/* Header */}
      <header className="sticky top-0 z-10 bg-white/80 dark:bg-gray-800/80 backdrop-blur-lg border-b border-gray-200/50 dark:border-gray-700/50 shadow-sm">
        <div className="max-w-4xl mx-auto px-4 py-4">
          <div className="flex items-center justify-between gap-4">
            <Link href="/" className="flex items-center gap-3 hover:opacity-80 transition-opacity">
              <LogoIcon className="w-10 h-10" />
              <div>
                <h1 className="text-xl font-bold bg-gradient-to-r from-blue-600 to-purple-600 dark:from-blue-400 dark:to-purple-400 bg-clip-text text-transparent">
                  {language === 'ar' ? 'مَرْكَزُ دِرَاسَاتِ الحَدِيث' : 'Hadith Hub Online'}
                </h1>
              </div>
            </Link>
            <div className="flex items-center gap-2">
              <ThemeToggle />
              <LanguageToggle language={language} onChange={handleLanguageChange} />
            </div>
          </div>
        </div>
      </header>

      <main className="max-w-4xl mx-auto px-4 py-8">
        {/* Page Title */}
        <div className="text-center mb-10">
          <h1 className="text-3xl md:text-4xl font-bold text-gray-900 dark:text-white mb-3">
            {t.title}
          </h1>
          <p className="text-lg text-gray-600 dark:text-gray-400">
            {t.subtitle}
          </p>
          <Link
            href="/"
            className="inline-flex items-center gap-2 mt-4 px-4 py-2 text-sm font-medium text-blue-600 dark:text-blue-400 hover:text-blue-700 dark:hover:text-blue-300 transition-colors"
          >
            <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={2} stroke="currentColor" className="w-4 h-4">
              <path strokeLinecap="round" strokeLinejoin="round" d={language === 'ar' ? "M13.5 4.5L21 12m0 0l-7.5 7.5M21 12H3" : "M10.5 19.5L3 12m0 0l7.5-7.5M3 12h18"} />
            </svg>
            {t.backToHome}
          </Link>
        </div>

        {/* Table of Contents */}
        <nav className="bg-white dark:bg-gray-800 rounded-xl shadow-sm border border-gray-200 dark:border-gray-700 p-6 mb-8">
          <h2 className="text-lg font-semibold text-gray-900 dark:text-white mb-4">{t.toc}</h2>
          <ul className="grid grid-cols-2 md:grid-cols-3 gap-3">
            {toc.map((item) => (
              <li key={item.id}>
                <a
                  href={`#${item.id}`}
                  className="block px-3 py-2 text-sm font-medium text-gray-600 dark:text-gray-400 hover:text-blue-600 dark:hover:text-blue-400 hover:bg-gray-50 dark:hover:bg-gray-700/50 rounded-lg transition-colors"
                >
                  {item.label}
                </a>
              </li>
            ))}
          </ul>
        </nav>

        {/* Content Sections */}
        <div className="space-y-10">
          {/* Introduction */}
          <section id="intro" className="scroll-mt-24">
            <div className="flex items-center gap-3 mb-4">
              <div className="p-2 bg-blue-100 dark:bg-blue-900/30 rounded-lg">
                <BookIcon className="w-6 h-6 text-blue-600 dark:text-blue-400" />
              </div>
              <h2 className="text-2xl font-bold text-gray-900 dark:text-white">{t.introTitle}</h2>
            </div>
            <div className="bg-white dark:bg-gray-800 rounded-xl shadow-sm border border-gray-200 dark:border-gray-700 p-6">
              <p className="text-gray-700 dark:text-gray-300 leading-relaxed">{t.introText}</p>
            </div>
          </section>

          {/* Search Guide */}
          <section id="search" className="scroll-mt-24">
            <div className="flex items-center gap-3 mb-4">
              <div className="p-2 bg-green-100 dark:bg-green-900/30 rounded-lg">
                <SearchIcon className="w-6 h-6 text-green-600 dark:text-green-400" />
              </div>
              <h2 className="text-2xl font-bold text-gray-900 dark:text-white">{t.searchTitle}</h2>
            </div>
            <p className="text-gray-600 dark:text-gray-400 mb-4">{t.searchIntro}</p>

            <div className="space-y-4">
              {/* Exact Search */}
              <div className="bg-white dark:bg-gray-800 rounded-xl shadow-sm border border-gray-200 dark:border-gray-700 p-6">
                <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-2">{t.exactSearchTitle}</h3>
                <p className="text-gray-700 dark:text-gray-300 mb-3">{t.exactSearchDesc}</p>
                <div className="bg-gray-50 dark:bg-gray-700/50 rounded-lg p-4 mb-3">
                  <p className="text-sm text-gray-600 dark:text-gray-400">{t.exactSearchExample}</p>
                </div>
                <p className="text-sm text-blue-600 dark:text-blue-400 flex items-center gap-2">
                  <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor" className="w-4 h-4">
                    <path strokeLinecap="round" strokeLinejoin="round" d="M12 18v-5.25m0 0a6.01 6.01 0 001.5-.189m-1.5.189a6.01 6.01 0 01-1.5-.189m3.75 7.478a12.06 12.06 0 01-4.5 0m3.75 2.383a14.406 14.406 0 01-3 0M14.25 18v-.192c0-.983.658-1.823 1.508-2.316a7.5 7.5 0 10-7.517 0c.85.493 1.509 1.333 1.509 2.316V18" />
                  </svg>
                  {t.exactSearchTip}
                </p>
              </div>

              {/* Word Search */}
              <div className="bg-white dark:bg-gray-800 rounded-xl shadow-sm border border-gray-200 dark:border-gray-700 p-6">
                <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-2">{t.wordSearchTitle}</h3>
                <p className="text-gray-700 dark:text-gray-300 mb-3">{t.wordSearchDesc}</p>
                <div className="bg-gray-50 dark:bg-gray-700/50 rounded-lg p-4 mb-3">
                  <p className="text-sm text-gray-600 dark:text-gray-400">{t.wordSearchExample}</p>
                </div>
                <p className="text-sm text-blue-600 dark:text-blue-400 flex items-center gap-2">
                  <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor" className="w-4 h-4">
                    <path strokeLinecap="round" strokeLinejoin="round" d="M12 18v-5.25m0 0a6.01 6.01 0 001.5-.189m-1.5.189a6.01 6.01 0 01-1.5-.189m3.75 7.478a12.06 12.06 0 01-4.5 0m3.75 2.383a14.406 14.406 0 01-3 0M14.25 18v-.192c0-.983.658-1.823 1.508-2.316a7.5 7.5 0 10-7.517 0c.85.493 1.509 1.333 1.509 2.316V18" />
                  </svg>
                  {t.wordSearchTip}
                </p>
              </div>

              {/* Root Search */}
              <div className="bg-white dark:bg-gray-800 rounded-xl shadow-sm border border-gray-200 dark:border-gray-700 p-6">
                <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-2">{t.rootSearchTitle}</h3>
                <p className="text-gray-700 dark:text-gray-300 mb-3">{t.rootSearchDesc}</p>
                <div className="bg-gray-50 dark:bg-gray-700/50 rounded-lg p-4 mb-3">
                  <p className="text-sm text-gray-600 dark:text-gray-400">{t.rootSearchExample}</p>
                </div>
                <p className="text-sm text-blue-600 dark:text-blue-400 flex items-center gap-2">
                  <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor" className="w-4 h-4">
                    <path strokeLinecap="round" strokeLinejoin="round" d="M12 18v-5.25m0 0a6.01 6.01 0 001.5-.189m-1.5.189a6.01 6.01 0 01-1.5-.189m3.75 7.478a12.06 12.06 0 01-4.5 0m3.75 2.383a14.406 14.406 0 01-3 0M14.25 18v-.192c0-.983.658-1.823 1.508-2.316a7.5 7.5 0 10-7.517 0c.85.493 1.509 1.333 1.509 2.316V18" />
                  </svg>
                  {t.rootSearchTip}
                </p>
              </div>

              {/* Topic Search (AI) */}
              <div className="bg-gradient-to-br from-purple-50 to-blue-50 dark:from-purple-900/20 dark:to-blue-900/20 rounded-xl shadow-sm border border-purple-200 dark:border-purple-700 p-6">
                <div className="flex items-center gap-2 mb-2">
                  <h3 className="text-lg font-semibold text-gray-900 dark:text-white">{t.topicSearchTitle}</h3>
                  <span className="inline-flex items-center gap-1 px-2 py-0.5 text-xs font-medium bg-purple-100 dark:bg-purple-900/50 text-purple-700 dark:text-purple-300 rounded-full">
                    <SparklesIcon className="w-3 h-3" />
                    {t.topicSearchAI}
                  </span>
                </div>
                <p className="text-gray-700 dark:text-gray-300 mb-3">{t.topicSearchDesc}</p>
                <div className="bg-white/60 dark:bg-gray-800/60 rounded-lg p-4 mb-3 space-y-2">
                  <p className="text-sm text-gray-600 dark:text-gray-400">{t.topicSearchExample1}</p>
                  <p className="text-sm text-gray-600 dark:text-gray-400">{t.topicSearchExample2}</p>
                </div>
                <p className="text-sm text-purple-600 dark:text-purple-400 flex items-center gap-2">
                  <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor" className="w-4 h-4">
                    <path strokeLinecap="round" strokeLinejoin="round" d="M12 18v-5.25m0 0a6.01 6.01 0 001.5-.189m-1.5.189a6.01 6.01 0 01-1.5-.189m3.75 7.478a12.06 12.06 0 01-4.5 0m3.75 2.383a14.406 14.406 0 01-3 0M14.25 18v-.192c0-.983.658-1.823 1.508-2.316a7.5 7.5 0 10-7.517 0c.85.493 1.509 1.333 1.509 2.316V18" />
                  </svg>
                  {t.topicSearchTip}
                </p>
              </div>
            </div>
          </section>

          {/* Library Section */}
          <section id="library" className="scroll-mt-24">
            <div className="flex items-center gap-3 mb-4">
              <div className="p-2 bg-amber-100 dark:bg-amber-900/30 rounded-lg">
                <BookIcon className="w-6 h-6 text-amber-600 dark:text-amber-400" />
              </div>
              <h2 className="text-2xl font-bold text-gray-900 dark:text-white">{t.libraryTitle}</h2>
            </div>
            <p className="text-gray-600 dark:text-gray-400 mb-4">{t.libraryIntro}</p>

            <div className="grid md:grid-cols-2 gap-4">
              {/* View Modes */}
              <div className="bg-white dark:bg-gray-800 rounded-xl shadow-sm border border-gray-200 dark:border-gray-700 p-6">
                <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-3">{t.viewModesTitle}</h3>
                <ul className="space-y-2 text-gray-700 dark:text-gray-300">
                  <li className="flex items-start gap-2">
                    <span className="text-blue-500 mt-1">&#9632;</span>
                    {t.viewModeGrid}
                  </li>
                  <li className="flex items-start gap-2">
                    <span className="text-blue-500 mt-1">&#9632;</span>
                    {t.viewModeList}
                  </li>
                  <li className="flex items-start gap-2">
                    <span className="text-blue-500 mt-1">&#9632;</span>
                    {t.viewModeCompact}
                  </li>
                </ul>
              </div>

              {/* Filtering */}
              <div className="bg-white dark:bg-gray-800 rounded-xl shadow-sm border border-gray-200 dark:border-gray-700 p-6">
                <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-3">{t.filterTitle}</h3>
                <ul className="space-y-2 text-gray-700 dark:text-gray-300">
                  <li className="flex items-start gap-2">
                    <span className="text-gray-500 mt-1">&#9679;</span>
                    {t.filterAll}
                  </li>
                  <li className="flex items-start gap-2">
                    <span className="text-emerald-500 mt-1">&#9679;</span>
                    {t.filterShia}
                  </li>
                  <li className="flex items-start gap-2">
                    <span className="text-blue-500 mt-1">&#9679;</span>
                    {t.filterSunni}
                  </li>
                </ul>
              </div>

              {/* Sorting */}
              <div className="bg-white dark:bg-gray-800 rounded-xl shadow-sm border border-gray-200 dark:border-gray-700 p-6">
                <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-3">{t.sortTitle}</h3>
                <ul className="space-y-2 text-gray-700 dark:text-gray-300">
                  <li className="flex items-start gap-2">
                    <span className="text-purple-500 mt-1">&#8593;</span>
                    {t.sortByTitle}
                  </li>
                  <li className="flex items-start gap-2">
                    <span className="text-purple-500 mt-1">&#8593;</span>
                    {t.sortByAuthor}
                  </li>
                  <li className="flex items-start gap-2">
                    <span className="text-purple-500 mt-1">&#8593;</span>
                    {t.sortByPages}
                  </li>
                </ul>
              </div>

              {/* Quick Filter */}
              <div className="bg-white dark:bg-gray-800 rounded-xl shadow-sm border border-gray-200 dark:border-gray-700 p-6">
                <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-3">{t.quickFilterTitle}</h3>
                <p className="text-gray-700 dark:text-gray-300">{t.quickFilterDesc}</p>
              </div>
            </div>
          </section>

          {/* Reading Section */}
          <section id="reading" className="scroll-mt-24">
            <div className="flex items-center gap-3 mb-4">
              <div className="p-2 bg-cyan-100 dark:bg-cyan-900/30 rounded-lg">
                <DocumentIcon className="w-6 h-6 text-cyan-600 dark:text-cyan-400" />
              </div>
              <h2 className="text-2xl font-bold text-gray-900 dark:text-white">{t.readingTitle}</h2>
            </div>
            <p className="text-gray-600 dark:text-gray-400 mb-4">{t.readingIntro}</p>

            <div className="space-y-4">
              {/* Navigation */}
              <div className="bg-white dark:bg-gray-800 rounded-xl shadow-sm border border-gray-200 dark:border-gray-700 p-6">
                <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-3">{t.navigationTitle}</h3>
                <ul className="space-y-2 text-gray-700 dark:text-gray-300">
                  <li className="flex items-start gap-2">
                    <span className="text-cyan-500 mt-1">&#10148;</span>
                    {t.navButtons}
                  </li>
                  <li className="flex items-start gap-2">
                    <span className="text-cyan-500 mt-1">&#10148;</span>
                    {t.navKeyboard}
                  </li>
                  <li className="flex items-start gap-2">
                    <span className="text-cyan-500 mt-1">&#10148;</span>
                    {t.navJump}
                  </li>
                </ul>
              </div>

              {/* Font Settings */}
              <div className="bg-white dark:bg-gray-800 rounded-xl shadow-sm border border-gray-200 dark:border-gray-700 p-6">
                <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-3">{t.fontTitle}</h3>
                <ul className="space-y-2 text-gray-700 dark:text-gray-300">
                  <li className="flex items-start gap-2">
                    <span className="text-cyan-500 mt-1">&#9733;</span>
                    {t.fontFamilies}
                  </li>
                  <li className="flex items-start gap-2">
                    <span className="text-cyan-500 mt-1">&#9733;</span>
                    {t.fontSizes}
                  </li>
                  <li className="flex items-start gap-2">
                    <span className="text-cyan-500 mt-1">&#9733;</span>
                    {t.fontPersist}
                  </li>
                </ul>
              </div>

              {/* Special Features */}
              <div className="bg-white dark:bg-gray-800 rounded-xl shadow-sm border border-gray-200 dark:border-gray-700 p-6">
                <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-3">{t.specialTitle}</h3>
                <ul className="space-y-2 text-gray-700 dark:text-gray-300">
                  <li className="flex items-start gap-2">
                    <span className="text-amber-500 mt-1">&#10022;</span>
                    {t.specialBihar}
                  </li>
                  <li className="flex items-start gap-2">
                    <span className="text-green-500 mt-1">&#10022;</span>
                    {t.specialQuran}
                  </li>
                  <li className="flex items-start gap-2">
                    <span className="text-yellow-500 mt-1">&#10022;</span>
                    {t.specialHighlight}
                  </li>
                </ul>
              </div>
            </div>
          </section>

          {/* Settings Section */}
          <section id="settings" className="scroll-mt-24">
            <div className="flex items-center gap-3 mb-4">
              <div className="p-2 bg-rose-100 dark:bg-rose-900/30 rounded-lg">
                <CogIcon className="w-6 h-6 text-rose-600 dark:text-rose-400" />
              </div>
              <h2 className="text-2xl font-bold text-gray-900 dark:text-white">{t.settingsTitle}</h2>
            </div>

            <div className="grid md:grid-cols-3 gap-4">
              {/* Language */}
              <div className="bg-white dark:bg-gray-800 rounded-xl shadow-sm border border-gray-200 dark:border-gray-700 p-6">
                <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-2">{t.languageTitle}</h3>
                <p className="text-gray-700 dark:text-gray-300 text-sm">{t.languageDesc}</p>
              </div>

              {/* Theme */}
              <div className="bg-white dark:bg-gray-800 rounded-xl shadow-sm border border-gray-200 dark:border-gray-700 p-6">
                <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-2">{t.themeTitle}</h3>
                <p className="text-gray-700 dark:text-gray-300 text-sm">{t.themeDesc}</p>
              </div>

              {/* Sharing */}
              <div className="bg-white dark:bg-gray-800 rounded-xl shadow-sm border border-gray-200 dark:border-gray-700 p-6">
                <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-2">{t.shareTitle}</h3>
                <p className="text-gray-700 dark:text-gray-300 text-sm">{t.shareDesc}</p>
              </div>
            </div>
          </section>

          {/* Contact Section */}
          <section id="contact" className="scroll-mt-24">
            <div className="flex items-center gap-3 mb-4">
              <div className="p-2 bg-indigo-100 dark:bg-indigo-900/30 rounded-lg">
                <EnvelopeIcon className="w-6 h-6 text-indigo-600 dark:text-indigo-400" />
              </div>
              <h2 className="text-2xl font-bold text-gray-900 dark:text-white">{t.contactTitle}</h2>
            </div>

            <div className="bg-gradient-to-br from-indigo-50 to-purple-50 dark:from-indigo-900/20 dark:to-purple-900/20 rounded-xl shadow-sm border border-indigo-200 dark:border-indigo-700 p-6 text-center">
              <p className="text-gray-700 dark:text-gray-300 mb-4">{t.contactText}</p>
              <a
                href={`mailto:${t.contactEmail}`}
                className="inline-flex items-center gap-2 px-6 py-3 bg-indigo-600 hover:bg-indigo-700 text-white font-medium rounded-lg transition-colors"
              >
                <EnvelopeIcon className="w-5 h-5" />
                {t.contactEmail}
              </a>
              <p className="text-sm text-gray-600 dark:text-gray-400 mt-4">{t.contactFooter}</p>
            </div>
          </section>
        </div>
      </main>

      {/* Footer */}
      <footer className="border-t border-gray-200/50 dark:border-gray-700/50 bg-white/50 dark:bg-gray-800/50 backdrop-blur-sm py-8 mt-12">
        <div className="max-w-4xl mx-auto px-4">
          <div className="flex flex-col md:flex-row items-center justify-between gap-4">
            <Link href="/" className="flex items-center gap-2 hover:opacity-80 transition-opacity">
              <LogoIcon className="w-6 h-6" />
              <span className="font-semibold bg-gradient-to-r from-blue-600 to-purple-600 dark:from-blue-400 dark:to-purple-400 bg-clip-text text-transparent">
                {language === 'ar' ? 'مَرْكَزُ دِرَاسَاتِ الحَدِيث' : 'Hadith Hub Online'}
              </span>
            </Link>
            <p className="text-sm text-gray-500 dark:text-gray-400">
              {language === 'ar' ? 'جميع الحقوق محفوظة' : 'All rights reserved'}
            </p>
          </div>
        </div>
      </footer>
    </div>
  );
}
