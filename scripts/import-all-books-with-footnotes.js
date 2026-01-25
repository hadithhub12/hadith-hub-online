/**
 * Import ALL books with footnotes from exported ZIP files
 *
 * This script:
 * 1. Preserves existing book names (title_ar, title_en, author_ar, author_en, sect)
 * 2. Updates page text with footnote markers
 * 3. Adds footnotes column data
 */
const fs = require('fs');
const path = require('path');
const Database = require('better-sqlite3');
const AdmZip = require('adm-zip');

// Paths
const DB_PATH = path.join(__dirname, '..', 'src', 'data', 'hadith.db');
const EXPORTS_DIR = path.join(__dirname, '..', '..', 'arabic-library', 'exports');

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

async function main() {
  console.log('Importing all books with footnotes...\n');

  // Check paths
  if (!fs.existsSync(DB_PATH)) {
    console.error(`Database not found at ${DB_PATH}`);
    process.exit(1);
  }

  if (!fs.existsSync(EXPORTS_DIR)) {
    console.error(`Exports directory not found at ${EXPORTS_DIR}`);
    process.exit(1);
  }

  // Open database
  const db = new Database(DB_PATH);
  db.pragma('journal_mode = WAL');

  // Ensure footnotes column exists
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

  // Get all export ZIP files
  const zipFiles = fs.readdirSync(EXPORTS_DIR)
    .filter(f => f.startsWith('book-') && f.endsWith('-with-footnotes.zip'))
    .sort();

  console.log(`\nFound ${zipFiles.length} book export files.\n`);

  // Prepare statements
  const updatePage = db.prepare(`
    UPDATE pages
    SET text = ?, text_normalized = ?, footnotes = ?
    WHERE book_id = ? AND volume = ? AND page = ?
  `);

  const checkPageExists = db.prepare(`
    SELECT id FROM pages WHERE book_id = ? AND volume = ? AND page = ?
  `);

  // Track totals
  let totalUpdated = 0;
  let totalWithFootnotes = 0;
  let booksProcessed = 0;
  let booksSkipped = 0;

  const startTime = Date.now();

  for (const zipFile of zipFiles) {
    const bookIdMatch = zipFile.match(/book-(\d+)-with-footnotes\.zip/);
    if (!bookIdMatch) continue;

    const bookId = bookIdMatch[1];

    // Check if book exists in database
    const bookExists = db.prepare('SELECT id FROM books WHERE id = ?').get(bookId);
    if (!bookExists) {
      console.log(`Skipping book ${bookId}: Not in database`);
      booksSkipped++;
      continue;
    }

    const zipPath = path.join(EXPORTS_DIR, zipFile);

    try {
      const zip = new AdmZip(zipPath);
      const entries = zip.getEntries();

      // Get JSON files for page data
      const jsonFiles = entries.filter(e => e.entryName.match(/volumes\/\d+\/\d+\.json$/));
      const txtFiles = entries.filter(e => e.entryName.match(/volumes\/\d+\/\d+\.txt$/));

      if (jsonFiles.length === 0) {
        console.log(`Skipping book ${bookId}: No page files`);
        booksSkipped++;
        continue;
      }

      // Build lookup for txt files
      const txtLookup = {};
      for (const entry of txtFiles) {
        const match = entry.entryName.match(/volumes\/(\d+)\/(\d+)\.txt$/);
        if (match) {
          const key = `${match[1]}/${match[2]}`;
          txtLookup[key] = entry;
        }
      }

      let bookUpdated = 0;
      let bookWithFootnotes = 0;

      // Process in transaction
      const processBook = db.transaction(() => {
        for (const entry of jsonFiles) {
          const match = entry.entryName.match(/volumes\/(\d+)\/(\d+)\.json$/);
          if (!match) continue;

          const volume = parseInt(match[1], 10);
          const pageNum = parseInt(match[2], 10);

          try {
            const content = entry.getData().toString('utf8');
            const pageData = JSON.parse(content);

            // Get text from TXT file (contains markers)
            const txtKey = `${volume}/${pageNum}`;
            const txtEntry = txtLookup[txtKey];
            let text = '';

            if (txtEntry) {
              const fullText = txtEntry.getData().toString('utf8');
              // Remove footnote section at bottom
              const dividerIndex = fullText.indexOf('───────────────────');
              text = dividerIndex > 0 ? fullText.substring(0, dividerIndex).trim() : fullText;
            } else {
              text = pageData.text || '';
            }

            const normalized = normalizeArabic(text);
            const footnotes = pageData.footnotes && pageData.footnotes.length > 0
              ? JSON.stringify(pageData.footnotes)
              : null;

            // Only update if page exists
            const existing = checkPageExists.get(bookId, volume, pageNum);
            if (existing) {
              updatePage.run(text, normalized, footnotes, bookId, volume, pageNum);
              bookUpdated++;
              if (footnotes) bookWithFootnotes++;
            }
          } catch (e) {
            // Skip errors silently
          }
        }
      });

      processBook();

      totalUpdated += bookUpdated;
      totalWithFootnotes += bookWithFootnotes;
      booksProcessed++;

      console.log(`Book ${bookId}: Updated ${bookUpdated} pages, ${bookWithFootnotes} with footnotes`);

    } catch (err) {
      console.error(`Error processing book ${bookId}: ${err.message}`);
      booksSkipped++;
    }
  }

  // Rebuild FTS index
  console.log('\nRebuilding FTS index...');
  db.exec(`INSERT INTO pages_fts(pages_fts) VALUES('rebuild')`);

  const elapsed = ((Date.now() - startTime) / 1000).toFixed(1);

  console.log('\n========================================');
  console.log('Import Complete!');
  console.log(`  Books processed: ${booksProcessed}`);
  console.log(`  Books skipped: ${booksSkipped}`);
  console.log(`  Pages updated: ${totalUpdated}`);
  console.log(`  Pages with footnotes: ${totalWithFootnotes}`);
  console.log(`  Time: ${elapsed}s`);
  console.log('========================================');

  db.close();
}

main().catch(console.error);
