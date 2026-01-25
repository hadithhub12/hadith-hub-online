/**
 * Update Bihar al-Anwar Volume 25 with Footnotes
 *
 * This script adds a footnotes column to the pages table if it doesn't exist,
 * then imports Bihar al-Anwar Volume 25 data with footnotes from the exported zip.
 */
const fs = require('fs');
const path = require('path');
const Database = require('better-sqlite3');
const AdmZip = require('adm-zip');

// Paths
const DB_PATH = path.join(__dirname, '..', 'src', 'data', 'hadith.db');
const ZIP_PATH = path.join(__dirname, '..', '..', 'arabic-library', 'bihar-anwar-v25-with-footnotes.zip');

const BOOK_ID = '01407';
const VOLUME = 25;

// Arabic text normalization for search
function normalizeArabic(text) {
  if (!text) return '';
  return text
    .replace(/[\u064B-\u065F\u0670]/g, '') // Remove diacritics
    .replace(/[أإآ]/g, 'ا') // Normalize alef
    .replace(/ى/g, 'ي') // Normalize alef maksura
    .replace(/ة/g, 'ه') // Normalize taa marbuta
    .replace(/ـ/g, '') // Remove tatweel
    .replace(/ک/g, 'ك') // Normalize Persian kaf
    .replace(/ی/g, 'ي') // Normalize Persian yaa
    .trim();
}

console.log('Updating Bihar al-Anwar Volume 25 with Footnotes...\n');

// Check if database exists
if (!fs.existsSync(DB_PATH)) {
  console.error(`Database not found at ${DB_PATH}`);
  console.error('Please run the build-database.js script first.');
  process.exit(1);
}

// Check if zip exists
if (!fs.existsSync(ZIP_PATH)) {
  console.error(`Export zip not found at ${ZIP_PATH}`);
  console.error('Please run the export-bihar-v25-with-footnotes.js script first.');
  process.exit(1);
}

// Open database
const db = new Database(DB_PATH);
db.pragma('journal_mode = WAL');

// Add footnotes column if it doesn't exist
console.log('Checking database schema...');
const hasFootnotesColumn = db.prepare(`
  SELECT COUNT(*) as count
  FROM pragma_table_info('pages')
  WHERE name = 'footnotes'
`).get().count > 0;

if (!hasFootnotesColumn) {
  console.log('Adding footnotes column to pages table...');
  db.exec(`ALTER TABLE pages ADD COLUMN footnotes TEXT`);
  console.log('Footnotes column added.');
} else {
  console.log('Footnotes column already exists.');
}

// Prepare update statement
const updatePage = db.prepare(`
  UPDATE pages
  SET text = ?, text_normalized = ?, footnotes = ?
  WHERE book_id = ? AND volume = ? AND page = ?
`);

const insertPage = db.prepare(`
  INSERT OR REPLACE INTO pages (book_id, volume, page, text, text_normalized, footnotes)
  VALUES (?, ?, ?, ?, ?, ?)
`);

// Load zip file
console.log(`\nLoading ${path.basename(ZIP_PATH)}...`);
const zip = new AdmZip(ZIP_PATH);
const entries = zip.getEntries();

// Find all JSON files for pages
const pageFiles = entries.filter(e => e.entryName.match(/volumes\/\d+\/\d+\.json$/));
console.log(`Found ${pageFiles.length} page files with footnotes data.`);

// Process in transaction
console.log('\nUpdating pages...');
const startTime = Date.now();

const processPages = db.transaction(() => {
  let updated = 0;
  let inserted = 0;
  let withFootnotes = 0;

  for (const entry of pageFiles) {
    const match = entry.entryName.match(/volumes\/(\d+)\/(\d+)\.json$/);
    if (!match) continue;

    const vol = parseInt(match[1], 10);
    const pageNum = parseInt(match[2], 10);

    if (vol !== VOLUME) continue; // Only process volume 25

    try {
      const content = entry.getData().toString('utf8');
      const pageData = JSON.parse(content);

      const text = pageData.text || '';
      const normalized = normalizeArabic(text);
      const footnotes = pageData.footnotes && pageData.footnotes.length > 0
        ? JSON.stringify(pageData.footnotes)
        : null;

      if (footnotes) withFootnotes++;

      // Check if page exists
      const existing = db.prepare(`
        SELECT id FROM pages WHERE book_id = ? AND volume = ? AND page = ?
      `).get(BOOK_ID, vol, pageNum);

      if (existing) {
        updatePage.run(text, normalized, footnotes, BOOK_ID, vol, pageNum);
        updated++;
      } else {
        insertPage.run(BOOK_ID, vol, pageNum, text, normalized, footnotes);
        inserted++;
      }
    } catch (e) {
      console.error(`Error processing page ${pageNum}:`, e.message);
    }
  }

  return { updated, inserted, withFootnotes };
});

const result = processPages();
const elapsed = ((Date.now() - startTime) / 1000).toFixed(2);

console.log(`\n=== Update Complete ===`);
console.log(`Updated: ${result.updated} pages`);
console.log(`Inserted: ${result.inserted} pages`);
console.log(`Pages with footnotes: ${result.withFootnotes}`);
console.log(`Time: ${elapsed}s`);

// Rebuild FTS index for updated pages
console.log('\nRebuilding FTS index...');
db.exec(`INSERT INTO pages_fts(pages_fts) VALUES('rebuild')`);

// Update book total pages
db.exec(`
  UPDATE books SET total_pages = (
    SELECT COUNT(*) FROM pages WHERE pages.book_id = books.id
  ) WHERE id = '${BOOK_ID}'
`);

// Verify
console.log('\nVerifying...');
const pageCount = db.prepare(`
  SELECT COUNT(*) as total,
         SUM(CASE WHEN footnotes IS NOT NULL THEN 1 ELSE 0 END) as withFootnotes
  FROM pages
  WHERE book_id = ? AND volume = ?
`).get(BOOK_ID, VOLUME);

console.log(`Bihar al-Anwar Volume ${VOLUME}: ${pageCount.total} pages, ${pageCount.withFootnotes} with footnotes`);

// Sample a page with footnotes
const samplePage = db.prepare(`
  SELECT page, footnotes
  FROM pages
  WHERE book_id = ? AND volume = ? AND footnotes IS NOT NULL
  LIMIT 1
`).get(BOOK_ID, VOLUME);

if (samplePage) {
  const footnotes = JSON.parse(samplePage.footnotes);
  console.log(`\nSample page ${samplePage.page} footnotes:`);
  footnotes.slice(0, 2).forEach(fn => console.log(`  - ${fn.substring(0, 80)}...`));
}

db.close();
console.log('\nDone!');
