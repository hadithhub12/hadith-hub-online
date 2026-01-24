/**
 * Update book names in database from Excel mapping
 * Matches books by Arabic title and updates with proper English titles
 */

const fs = require('fs');
const path = require('path');
const Database = require('better-sqlite3');

const MAPPING_PATH = path.join(__dirname, 'book-names-mapping.json');
const DB_PATH = path.join(__dirname, '..', 'src', 'data', 'hadith.db');

// Normalize Arabic text for matching
function normalizeArabic(text) {
  if (!text) return '';
  return text
    // Remove diacritics
    .replace(/[\u064B-\u065F\u0670]/g, '')
    // Normalize alef variants
    .replace(/[أإآء]/g, 'ا')
    // Normalize alef maksura
    .replace(/ى/g, 'ي')
    // Normalize taa marbuta
    .replace(/ة/g, 'ه')
    // Remove tatweel
    .replace(/ـ/g, '')
    // Normalize Persian characters
    .replace(/ک/g, 'ك')
    .replace(/ی/g, 'ي')
    // Remove spaces and common punctuation for better matching
    .replace(/[\s\-\(\)\[\]\/\\,،.۔:؛«»\"\']/g, '')
    .toLowerCase()
    .trim();
}

console.log('Updating book names from Excel mapping...\n');

// Load mapping
const mapping = JSON.parse(fs.readFileSync(MAPPING_PATH, 'utf8'));
console.log(`Loaded ${mapping.length} entries from Excel mapping`);

// Create a lookup map by normalized Arabic title
const titleMap = new Map();
for (const entry of mapping) {
  const normalized = normalizeArabic(entry.titleAr);
  if (normalized) {
    // Store array in case of duplicates
    if (!titleMap.has(normalized)) {
      titleMap.set(normalized, []);
    }
    titleMap.get(normalized).push(entry);
  }
}

console.log(`Created lookup map with ${titleMap.size} unique normalized titles\n`);

// Open database
const db = new Database(DB_PATH);
db.pragma('journal_mode = WAL');

// Get all books from database
const books = db.prepare('SELECT id, title_ar, title_en, author_ar, author_en FROM books').all();
console.log(`Found ${books.length} books in database\n`);

// Prepare update statement
const updateStmt = db.prepare(`
  UPDATE books
  SET title_ar = ?, title_en = ?, author_ar = ?, author_en = ?
  WHERE id = ?
`);

let matched = 0;
let notMatched = 0;
const unmatchedBooks = [];

// Transaction for bulk update
const updateBooks = db.transaction(() => {
  for (const book of books) {
    const normalized = normalizeArabic(book.title_ar);
    const matches = titleMap.get(normalized);

    if (matches && matches.length > 0) {
      // Use first match
      const match = matches[0];
      updateStmt.run(
        match.titleAr,
        match.titleEn,
        match.authorAr,
        match.authorEn,
        book.id
      );
      matched++;

      // Log first few matches
      if (matched <= 5) {
        console.log(`✓ Matched: ${book.id}`);
        console.log(`  Old: ${book.title_ar}`);
        console.log(`  New: ${match.titleAr}`);
        console.log(`  En:  ${match.titleEn}`);
        console.log();
      }
    } else {
      notMatched++;
      unmatchedBooks.push({
        id: book.id,
        titleAr: book.title_ar,
        normalized: normalized
      });
    }
  }
});

updateBooks();

console.log(`\n========================================`);
console.log(`Results:`);
console.log(`  Matched: ${matched}`);
console.log(`  Not matched: ${notMatched}`);
console.log(`========================================\n`);

if (unmatchedBooks.length > 0 && unmatchedBooks.length <= 50) {
  console.log('Unmatched books:');
  unmatchedBooks.forEach(b => {
    console.log(`  ${b.id}: ${b.titleAr}`);
  });
}

// Save unmatched books to file for review
fs.writeFileSync(
  path.join(__dirname, 'unmatched-books.json'),
  JSON.stringify(unmatchedBooks, null, 2),
  'utf8'
);
console.log(`\nUnmatched books saved to: scripts/unmatched-books.json`);

db.close();
console.log('\nDatabase updated successfully!');
