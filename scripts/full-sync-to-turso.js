/**
 * Full database sync to Turso
 *
 * This script creates tables if they don't exist and syncs all data
 * from the local SQLite database to Turso production.
 *
 * Usage:
 *   node scripts/full-sync-to-turso.js
 */

const { createClient } = require('@libsql/client');
const Database = require('better-sqlite3');
const path = require('path');
require('dotenv').config({ path: '.env.local' });

const TURSO_DATABASE_URL = process.env.TURSO_DATABASE_URL;
const TURSO_AUTH_TOKEN = process.env.TURSO_AUTH_TOKEN;

if (!TURSO_DATABASE_URL || !TURSO_AUTH_TOKEN) {
  console.error('Error: TURSO_DATABASE_URL and TURSO_AUTH_TOKEN environment variables are required.');
  process.exit(1);
}

const DB_PATH = path.join(__dirname, '..', 'src', 'data', 'hadith.db');
const BATCH_SIZE = 50;
const LOG_EVERY = 5000;

async function fullSyncToTurso() {
  console.log('Connecting to local SQLite database...');
  const localDb = new Database(DB_PATH, { readonly: true });

  console.log('Connecting to Turso...');
  const tursoClient = createClient({
    url: TURSO_DATABASE_URL,
    authToken: TURSO_AUTH_TOKEN,
  });

  // Step 1: Create tables if they don't exist
  console.log('\n1. Creating tables if needed...');

  await tursoClient.execute(`
    CREATE TABLE IF NOT EXISTS books (
      id TEXT PRIMARY KEY,
      title_ar TEXT,
      title_en TEXT,
      author_ar TEXT,
      author_en TEXT,
      sect TEXT,
      volumes INTEGER,
      total_pages INTEGER
    )
  `);
  console.log('   Books table ready');

  await tursoClient.execute(`
    CREATE TABLE IF NOT EXISTS pages (
      id INTEGER PRIMARY KEY,
      book_id TEXT,
      volume INTEGER,
      page INTEGER,
      text TEXT,
      text_normalized TEXT,
      footnotes TEXT
    )
  `);
  console.log('   Pages table ready');

  // Create index if not exists
  try {
    await tursoClient.execute(`
      CREATE INDEX IF NOT EXISTS idx_pages_book_vol_page ON pages(book_id, volume, page)
    `);
    console.log('   Index ready');
  } catch (e) {
    console.log('   Index might already exist');
  }

  // Step 2: Sync books
  console.log('\n2. Syncing books...');
  const localBooks = localDb.prepare('SELECT * FROM books').all();
  console.log(`   Found ${localBooks.length} books`);

  for (const book of localBooks) {
    try {
      await tursoClient.execute({
        sql: `INSERT OR REPLACE INTO books (id, title_ar, title_en, author_ar, author_en, sect, volumes, total_pages)
              VALUES (?, ?, ?, ?, ?, ?, ?, ?)`,
        args: [
          book.id,
          book.title_ar,
          book.title_en,
          book.author_ar,
          book.author_en,
          book.sect,
          book.volumes,
          book.total_pages
        ]
      });
    } catch (e) {
      console.error(`   Error with book ${book.id}: ${e.message}`);
    }
  }
  console.log(`   Synced ${localBooks.length} books`);

  // Step 3: Sync pages in batches
  console.log('\n3. Syncing pages...');

  const pageCount = localDb.prepare('SELECT COUNT(*) as count FROM pages').get().count;
  console.log(`   Found ${pageCount} pages to sync`);

  let offset = 0;
  let synced = 0;
  let errors = 0;
  const startTime = Date.now();

  while (true) {
    const pages = localDb.prepare(`
      SELECT id, book_id, volume, page, text, text_normalized, footnotes
      FROM pages
      ORDER BY book_id, volume, page
      LIMIT ? OFFSET ?
    `).all(BATCH_SIZE, offset);

    if (pages.length === 0) break;

    // Build batch statements
    const statements = pages.map(p => ({
      sql: `INSERT OR REPLACE INTO pages (id, book_id, volume, page, text, text_normalized, footnotes)
            VALUES (?, ?, ?, ?, ?, ?, ?)`,
      args: [p.id, p.book_id, p.volume, p.page, p.text, p.text_normalized, p.footnotes]
    }));

    try {
      await tursoClient.batch(statements);
      synced += pages.length;
    } catch (e) {
      // Try individually on batch failure
      for (const p of pages) {
        try {
          await tursoClient.execute({
            sql: `INSERT OR REPLACE INTO pages (id, book_id, volume, page, text, text_normalized, footnotes)
                  VALUES (?, ?, ?, ?, ?, ?, ?)`,
            args: [p.id, p.book_id, p.volume, p.page, p.text, p.text_normalized, p.footnotes]
          });
          synced++;
        } catch (err) {
          errors++;
          if (errors <= 5) {
            console.error(`   Error: ${p.book_id}/${p.volume}/${p.page}: ${err.message}`);
          }
        }
      }
    }

    offset += BATCH_SIZE;

    if (offset % LOG_EVERY === 0 || offset >= pageCount) {
      const progress = Math.min(offset, pageCount);
      const percent = ((progress / pageCount) * 100).toFixed(1);
      const elapsed = ((Date.now() - startTime) / 1000).toFixed(0);
      console.log(`   Progress: ${progress}/${pageCount} (${percent}%) - ${elapsed}s elapsed`);
    }
  }

  // Step 4: Verify
  console.log('\n4. Verifying...');
  const tursoBooks = await tursoClient.execute('SELECT COUNT(*) as count FROM books');
  const tursoPages = await tursoClient.execute('SELECT COUNT(*) as count FROM pages');
  const tursoFootnotes = await tursoClient.execute('SELECT COUNT(*) as count FROM pages WHERE footnotes IS NOT NULL');

  const elapsed = ((Date.now() - startTime) / 1000).toFixed(1);

  console.log('\n========================================');
  console.log('Full Sync Complete!');
  console.log(`  Books in Turso: ${tursoBooks.rows[0].count}`);
  console.log(`  Pages in Turso: ${tursoPages.rows[0].count}`);
  console.log(`  Pages with footnotes: ${tursoFootnotes.rows[0].count}`);
  console.log(`  Errors: ${errors}`);
  console.log(`  Time: ${elapsed}s`);
  console.log('========================================');

  localDb.close();
}

fullSyncToTurso().catch(console.error);
