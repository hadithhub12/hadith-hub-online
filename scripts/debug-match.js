const fs = require('fs');

// Normalize Arabic text for matching
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

const mapping = JSON.parse(fs.readFileSync('./scripts/book-names-mapping.json', 'utf8'));

// Find the entry for 'أعلام الدین'
const test = 'أعلام الدین';
const normalized = normalizeArabic(test);
console.log('Looking for:', test);
console.log('Normalized:', normalized);

const matches = mapping.filter(m => normalizeArabic(m.titleAr) === normalized);
console.log('Matches in Excel:', matches.length);
matches.forEach(m => console.log(' -', m.titleAr, '|', m.titleEn));
