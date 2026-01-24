const XLSX = require('xlsx');
const fs = require('fs');
const Database = require('better-sqlite3');
const path = require('path');

const workbook = XLSX.readFile('C:\\Users\\syedf\\OneDrive\\Desktop\\List_of_books.xlsx');
const sheet = workbook.Sheets[workbook.SheetNames[0]];

// Check if Arabic titles in Excel match those in database
const DB_PATH = path.join(__dirname, '..', 'src', 'data', 'hadith.db');
const db = new Database(DB_PATH, { readonly: true });

// Normalize function
function normalize(text) {
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

// Get all database titles
const dbBooks = db.prepare('SELECT id, title_ar, title_en FROM books').all();
console.log(`Database has ${dbBooks.length} books`);

// Create normalized map of DB titles
const dbTitleMap = new Map();
for (const book of dbBooks) {
  const norm = normalize(book.title_ar);
  dbTitleMap.set(norm, book);
}

// Check first 100 rows of Excel - are these aligned correctly?
console.log('\nFirst 100 rows alignment check:');
let aligned = 0;
let notFound = 0;

for (let row = 2; row <= 101; row++) {
  const arExcel = sheet['B' + row]?.v || '';
  const enExcel = sheet['C' + row]?.v || '';
  const normExcel = normalize(arExcel);

  const dbBook = dbTitleMap.get(normExcel);
  if (dbBook) {
    aligned++;
    // Check if first 10 look sensible
    if (row <= 11) {
      console.log(`Row ${row}: DB=${dbBook.id} | Excel Ar=${arExcel.substring(0, 30)} | Excel En=${enExcel.substring(0, 30)}`);
    }
  } else {
    notFound++;
    if (notFound <= 5) {
      console.log(`Not found: Row ${row} - ${arExcel}`);
    }
  }
}

console.log(`\nFirst 100 rows: ${aligned} found in DB, ${notFound} not found`);
db.close();
