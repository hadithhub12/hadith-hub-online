const Database = require('better-sqlite3');
const db = new Database('./src/data/hadith.db', { readonly: true });

const books = db.prepare('SELECT id, title_ar, title_en, volumes FROM books ORDER BY title_ar').all();
console.log('=== Books in our database ===');
console.log('Total books:', books.length);
console.log('');

// Key books from the Excel list to check
const expectedBooks = [
  { title: 'الکافي', volumes: 8 },
  { title: 'الکافي (دارالحدیث)', volumes: 15 },
  { title: 'من لايحضره الفقيه', volumes: 4 },
  { title: 'تهذيب الأحكام', volumes: 10 },
  { title: 'الاستبصار', volumes: 4 },
  { title: 'الوافي', volumes: 26 },
  { title: 'وسائل الشیعة', volumes: 30 },
  { title: 'بحار الأنوار', volumes: 110 },
  { title: 'مستدرك الوسائل', volumes: 30 },
  { title: 'نهج البلاغة', volumes: 1 },
  { title: 'الصحيفة السجادية', volumes: 1 },
  { title: 'بصائر الدرجات', volumes: 1 },
  { title: 'المحاسن', volumes: 2 },
  { title: 'علل الشرائع', volumes: 2 },
  { title: 'عيون أخبار الرضا', volumes: 2 },
  { title: 'الأمالي (الصدوق)', volumes: 1 },
  { title: 'الخصال', volumes: 2 },
  { title: 'کمال الدین', volumes: 2 },
  { title: 'التوحید', volumes: 1 },
  { title: 'معاني الأخبار', volumes: 1 },
  { title: 'ثواب الأعمال', volumes: 1 },
  { title: 'الأمالي (الطوسي)', volumes: 1 },
  { title: 'الأمالي (المفید)', volumes: 1 },
  { title: 'الغیبة (الطوسي)', volumes: 1 },
  { title: 'الإرشاد', volumes: 2 },
  { title: 'الاحتجاج', volumes: 2 },
  { title: 'تفسير العياشي', volumes: 2 },
  { title: 'تفسير القمي', volumes: 2 },
  { title: 'الکافي (روضة)', volumes: 1 },
  { title: 'نهج الفصاحة', volumes: 2 },
];

console.log('Checking for key books...\n');

const ourTitles = books.map(b => b.title_ar);

expectedBooks.forEach(exp => {
  // Search for partial match
  const found = books.find(b =>
    b.title_ar.includes(exp.title) ||
    exp.title.includes(b.title_ar) ||
    b.title_ar.replace(/[ىيیئ]/g, 'ي').includes(exp.title.replace(/[ىيیئ]/g, 'ي'))
  );

  if (found) {
    const volMatch = found.volumes === exp.volumes ? '✓' : `(have ${found.volumes}, expected ${exp.volumes})`;
    console.log(`✓ ${exp.title} - FOUND as "${found.title_ar}" ${volMatch}`);
  } else {
    console.log(`✗ ${exp.title} (${exp.volumes} vols) - MISSING`);
  }
});

console.log('\n=== All books in our database ===');
books.forEach(b => {
  console.log(`${b.id}: ${b.title_ar} (${b.volumes} vols)`);
});

db.close();
