/**
 * Database Build Script
 * Processes hadith-data zip files and creates SQLite database with FTS5 index
 *
 * Run: node scripts/build-database.js
 */

const fs = require('fs');
const path = require('path');
const Database = require('better-sqlite3');
const AdmZip = require('adm-zip');

// Paths
const HADITH_DATA_PATH = path.join(__dirname, '..', '..', 'arabic-library', 'hadith-data');
const BOOKS_JSON_PATH = path.join(HADITH_DATA_PATH, 'books.json');
const BOOKS_DIR = path.join(HADITH_DATA_PATH, 'books');
const OUTPUT_DB_PATH = path.join(__dirname, '..', 'src', 'data', 'hadith.db');

// Ensure output directory exists
const outputDir = path.dirname(OUTPUT_DB_PATH);
if (!fs.existsSync(outputDir)) {
  fs.mkdirSync(outputDir, { recursive: true });
}

// Arabic text normalization for search
function normalizeArabic(text) {
  if (!text) return '';
  return text
    // Remove Arabic diacritics (tashkeel)
    .replace(/[\u064B-\u065F\u0670]/g, '')
    // Normalize alef variants to bare alef
    .replace(/[أإآ]/g, 'ا')
    // Normalize alef maksura to yaa
    .replace(/ى/g, 'ي')
    // Normalize taa marbuta to haa
    .replace(/ة/g, 'ه')
    // Remove tatweel
    .replace(/ـ/g, '')
    // Normalize Persian/Urdu characters
    .replace(/ک/g, 'ك')
    .replace(/ی/g, 'ي')
    .trim();
}

// Clean up English title - remove IDs and weird formatting
function cleanEnglishTitle(titleEn, titleAr) {
  if (!titleEn) return '';

  // Remove trailing numbers like "02566", "01407" etc.
  let cleaned = titleEn.replace(/\s+\d{4,5}$/g, '');

  // Remove "Jld" followed by numbers
  cleaned = cleaned.replace(/\s+Jld\s*\d*/gi, '');

  // If it's just the ID or looks like garbage, return empty
  if (/^\d+$/.test(cleaned.trim()) || cleaned.trim().length < 3) {
    return '';
  }

  // Clean up multiple spaces
  cleaned = cleaned.replace(/\s+/g, ' ').trim();

  return cleaned;
}

console.log('Building Hadith Library Database...\n');

// Delete existing database
if (fs.existsSync(OUTPUT_DB_PATH)) {
  fs.unlinkSync(OUTPUT_DB_PATH);
  console.log('Deleted existing database.');
}

// Create new database
const db = new Database(OUTPUT_DB_PATH);
db.pragma('journal_mode = WAL');
db.pragma('foreign_keys = OFF'); // Disable during bulk import

// Create tables
console.log('Creating tables...');
db.exec(`
  -- Books table
  CREATE TABLE books (
    id TEXT PRIMARY KEY,
    title_ar TEXT NOT NULL,
    title_en TEXT,
    author_ar TEXT,
    author_en TEXT,
    sect TEXT,
    language TEXT DEFAULT 'ar',
    volumes INTEGER DEFAULT 1,
    total_pages INTEGER DEFAULT 0
  );

  -- Pages table
  CREATE TABLE pages (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    book_id TEXT NOT NULL,
    volume INTEGER NOT NULL,
    page INTEGER NOT NULL,
    text TEXT NOT NULL,
    text_normalized TEXT NOT NULL,
    FOREIGN KEY (book_id) REFERENCES books(id),
    UNIQUE(book_id, volume, page)
  );

  -- Create index for faster lookups
  CREATE INDEX idx_pages_book_volume ON pages(book_id, volume);
  CREATE INDEX idx_pages_book_volume_page ON pages(book_id, volume, page);

  -- FTS5 virtual table for full-text search
  CREATE VIRTUAL TABLE pages_fts USING fts5(
    text_normalized,
    content='pages',
    content_rowid='id'
  );

  -- Triggers to keep FTS in sync
  CREATE TRIGGER pages_ai AFTER INSERT ON pages BEGIN
    INSERT INTO pages_fts(rowid, text_normalized) VALUES (new.id, new.text_normalized);
  END;

  CREATE TRIGGER pages_ad AFTER DELETE ON pages BEGIN
    INSERT INTO pages_fts(pages_fts, rowid, text_normalized) VALUES('delete', old.id, old.text_normalized);
  END;

  CREATE TRIGGER pages_au AFTER UPDATE ON pages BEGIN
    INSERT INTO pages_fts(pages_fts, rowid, text_normalized) VALUES('delete', old.id, old.text_normalized);
    INSERT INTO pages_fts(rowid, text_normalized) VALUES (new.id, new.text_normalized);
  END;
`);

// Load books.json for metadata
console.log('Loading books.json...');
const booksData = JSON.parse(fs.readFileSync(BOOKS_JSON_PATH, 'utf8'));
console.log(`Found ${booksData.totalBooks} books in manifest.`);

// Create a map of book IDs to book info from books.json
const bookInfoMap = new Map();
for (const book of booksData.books) {
  bookInfoMap.set(book.id, book);
}

// Prepare statements
const insertBook = db.prepare(`
  INSERT OR REPLACE INTO books (id, title_ar, title_en, author_ar, author_en, sect, language, volumes, total_pages)
  VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)
`);

const insertPage = db.prepare(`
  INSERT OR REPLACE INTO pages (book_id, volume, page, text, text_normalized)
  VALUES (?, ?, ?, ?, ?)
`);

// Process books
let totalPages = 0;
let processedZips = 0;
const errors = [];

// Get all zip files in books directory
const zipFiles = fs.readdirSync(BOOKS_DIR).filter(f => f.endsWith('.zip'));
console.log(`Found ${zipFiles.length} zip files to process.\n`);

// Track books we've added and their info
const addedBooks = new Map(); // bookId -> {title, author, volumes: Set}

// Process zip files with transaction
const processZip = db.transaction((zipPath) => {
  try {
    const zip = new AdmZip(zipPath);
    const entries = zip.getEntries();

    // Find manifest.json
    const manifestEntry = entries.find(e => e.entryName === 'manifest.json');
    if (!manifestEntry) {
      errors.push(`No manifest in ${path.basename(zipPath)}`);
      return 0;
    }

    const manifest = JSON.parse(manifestEntry.getData().toString('utf8'));
    const bookId = manifest.id;

    // Track this book
    if (!addedBooks.has(bookId)) {
      addedBooks.set(bookId, {
        title: manifest.title,
        author: manifest.author || '',
        volumes: new Set()
      });
    }

    // Track volumes from this zip
    const bookData = addedBooks.get(bookId);

    // Process page files
    let pagesInZip = 0;
    for (const entry of entries) {
      const match = entry.entryName.match(/volumes\/(\d+)\/(\d+)\.txt$/);
      if (match) {
        const volume = parseInt(match[1], 10);
        const page = parseInt(match[2], 10);

        bookData.volumes.add(volume);

        try {
          const content = entry.getData().toString('utf8');
          // Parse JSON array of paragraphs
          let text;
          try {
            const paragraphs = JSON.parse(content);
            text = Array.isArray(paragraphs) ? paragraphs.join('\n') : content;
          } catch {
            text = content; // Use raw content if not valid JSON
          }
          const normalized = normalizeArabic(text);

          insertPage.run(bookId, volume, page, text, normalized);
          pagesInZip++;
        } catch (e) {
          // First file of first few books - log errors
          if (processedZips < 3) {
            console.error(`Error processing page ${entry.entryName}:`, e.message);
          }
        }
      }
    }

    return pagesInZip;
  } catch (e) {
    errors.push(`Error processing ${path.basename(zipPath)}: ${e.message}`);
    return 0;
  }
});

// Process all zip files
console.log('Processing zip files...');
const startTime = Date.now();

for (let i = 0; i < zipFiles.length; i++) {
  const zipFile = zipFiles[i];
  const zipPath = path.join(BOOKS_DIR, zipFile);

  const pages = processZip(zipPath);
  totalPages += pages;
  processedZips++;

  // Progress update every 50 files
  if (processedZips % 50 === 0) {
    const elapsed = ((Date.now() - startTime) / 1000).toFixed(1);
    console.log(`  Processed ${processedZips}/${zipFiles.length} files (${elapsed}s)...`);
  }
}

// Now insert all books
console.log('\nInserting books...');
for (const [bookId, bookData] of addedBooks) {
  // Get additional metadata from books.json if available
  const bookInfo = bookInfoMap.get(bookId);

  const titleAr = bookInfo?.titleAr || bookData.title || `Book ${bookId}`;
  const titleEn = cleanEnglishTitle(bookInfo?.titleEn, titleAr);
  // Handle array authors (join them with comma)
  let authorAr = bookInfo?.authorAr || bookData.author || '';
  if (Array.isArray(authorAr)) {
    authorAr = authorAr.join('، ');
  }
  let authorEn = bookInfo?.authorEn || '';
  if (Array.isArray(authorEn)) {
    authorEn = authorEn.join(', ');
  }
  const sect = bookInfo?.sect || '';
  const language = bookInfo?.language || 'ar';
  const volumes = bookData.volumes.size;

  try {
    insertBook.run(
      bookId,
      titleAr,
      titleEn,
      authorAr,
      authorEn,
      sect,
      language,
      volumes,
      0 // Will update later
    );
  } catch (e) {
    console.error(`Error inserting book ${bookId}:`, e.message);
    console.error('Values:', { bookId, titleAr, titleEn, authorAr, authorEn, sect, language, volumes });
  }
}

// Update total_pages for each book
console.log('Updating book page counts...');
db.exec(`
  UPDATE books SET total_pages = (
    SELECT COUNT(*) FROM pages WHERE pages.book_id = books.id
  )
`);

// Update volumes count accurately
db.exec(`
  UPDATE books SET volumes = (
    SELECT COUNT(DISTINCT volume) FROM pages WHERE pages.book_id = books.id
  )
`);

// Optimize FTS index
console.log('Optimizing FTS index...');
db.exec(`INSERT INTO pages_fts(pages_fts) VALUES('optimize')`);

// Print summary
const elapsed = ((Date.now() - startTime) / 1000).toFixed(1);
console.log('\n=== Build Complete ===');
console.log(`Books: ${addedBooks.size}`);
console.log(`Pages: ${totalPages}`);
console.log(`Processed: ${processedZips} zip files`);
console.log(`Time: ${elapsed}s`);
console.log(`Database: ${OUTPUT_DB_PATH}`);

// Get database size
const stats = fs.statSync(OUTPUT_DB_PATH);
const sizeMB = (stats.size / 1024 / 1024).toFixed(2);
console.log(`Size: ${sizeMB} MB`);

if (errors.length > 0) {
  console.log(`\nWarnings/Errors: ${errors.length}`);
  errors.slice(0, 10).forEach(e => console.log(`  - ${e}`));
  if (errors.length > 10) {
    console.log(`  ... and ${errors.length - 10} more`);
  }
}

// Verify database
console.log('\nVerifying database...');
const bookCount = db.prepare('SELECT COUNT(*) as count FROM books').get().count;
const pageCount = db.prepare('SELECT COUNT(*) as count FROM pages').get().count;
const sampleBook = db.prepare('SELECT id, title_ar, title_en, total_pages FROM books LIMIT 1').get();
const sampleSearch = db.prepare(`
  SELECT p.book_id, p.volume, p.page, snippet(pages_fts, 0, '<mark>', '</mark>', '...', 16) as snippet
  FROM pages_fts
  JOIN pages p ON pages_fts.rowid = p.id
  WHERE pages_fts MATCH 'الله'
  LIMIT 3
`).all();

console.log(`Verified: ${bookCount} books, ${pageCount} pages`);
if (sampleBook) {
  console.log(`Sample book: ${sampleBook.title_ar} (${sampleBook.id}) - ${sampleBook.total_pages} pages`);
}
if (sampleSearch.length > 0) {
  console.log(`Sample search for 'الله': ${sampleSearch.length} results`);
}

db.close();
console.log('\nDone!');
