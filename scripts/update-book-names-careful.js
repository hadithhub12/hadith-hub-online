/**
 * Carefully update book names from Excel mapping
 * Only updates when we have high confidence in the match
 */

const fs = require('fs');
const path = require('path');
const Database = require('better-sqlite3');
const XLSX = require('xlsx');

const DB_PATH = path.join(__dirname, '..', 'src', 'data', 'hadith.db');
const EXCEL_PATH = 'C:\\Users\\syedf\\OneDrive\\Desktop\\List_of_books.xlsx';

// Load Excel
const workbook = XLSX.readFile(EXCEL_PATH);
const sheet = workbook.Sheets[workbook.SheetNames[0]];

// Build array of Excel entries
const excelEntries = [];
for (let row = 2; row <= 750; row++) {
  const index = sheet['A' + row]?.v;
  const titleAr = sheet['B' + row]?.v || '';
  const titleEn = sheet['C' + row]?.v || '';
  const authorAr = sheet['D' + row]?.v || '';
  const authorEn = sheet['E' + row]?.v || '';

  if (titleAr) {
    excelEntries.push({
      row,
      index,
      titleAr: titleAr.trim(),
      titleEn: titleEn.trim(),
      authorAr: authorAr.trim(),
      authorEn: authorEn.trim()
    });
  }
}

console.log(`Loaded ${excelEntries.length} entries from Excel\n`);

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

// Create lookup by normalized Arabic title
const excelByTitle = new Map();
for (const entry of excelEntries) {
  const norm = normalizeArabic(entry.titleAr);
  if (!excelByTitle.has(norm)) {
    excelByTitle.set(norm, []);
  }
  excelByTitle.get(norm).push(entry);
}

// Track duplicates (for skipping)
const duplicateNorms = new Set();
for (const [norm, entries] of excelByTitle) {
  if (entries.length > 1) {
    duplicateNorms.add(norm);
  }
}
console.log(`Found ${duplicateNorms.size} normalized titles with duplicates in Excel\n`);

// Open database
const db = new Database(DB_PATH);
db.pragma('journal_mode = WAL');

const books = db.prepare('SELECT id, title_ar, title_en, author_ar, author_en FROM books').all();
console.log(`Found ${books.length} books in database\n`);

const updateStmt = db.prepare(`
  UPDATE books SET title_ar = ?, title_en = ?, author_ar = ?, author_en = ?
  WHERE id = ?
`);

let updated = 0;
let skippedDuplicate = 0;
let noMatch = 0;
let unchanged = 0;

const updateBooks = db.transaction(() => {
  for (const book of books) {
    const norm = normalizeArabic(book.title_ar);
    const matches = excelByTitle.get(norm);

    if (!matches || matches.length === 0) {
      noMatch++;
      continue;
    }

    // Skip if multiple matches (ambiguous)
    if (matches.length > 1) {
      skippedDuplicate++;
      continue;
    }

    const match = matches[0];

    // Only update if something actually changes
    if (
      book.title_ar === match.titleAr &&
      book.title_en === match.titleEn &&
      book.author_ar === match.authorAr &&
      book.author_en === match.authorEn
    ) {
      unchanged++;
      continue;
    }

    updateStmt.run(
      match.titleAr,
      match.titleEn,
      match.authorAr,
      match.authorEn,
      book.id
    );
    updated++;

    if (updated <= 10) {
      console.log(`Updated ${book.id}:`);
      console.log(`  Old En: ${book.title_en || '(empty)'}`);
      console.log(`  New En: ${match.titleEn}`);
      console.log();
    }
  }
});

updateBooks();

console.log(`\n========================================`);
console.log(`Results:`);
console.log(`  Updated: ${updated}`);
console.log(`  Skipped (duplicate): ${skippedDuplicate}`);
console.log(`  No match: ${noMatch}`);
console.log(`  Unchanged: ${unchanged}`);
console.log(`========================================\n`);

// Verify
const sample = db.prepare('SELECT id, title_ar, title_en, author_en FROM books LIMIT 5').all();
console.log('Sample after update:');
sample.forEach(b => {
  console.log(`  ${b.id}: ${b.title_ar} | ${b.title_en} | ${b.author_en}`);
});

db.close();
console.log('\nDone!');
