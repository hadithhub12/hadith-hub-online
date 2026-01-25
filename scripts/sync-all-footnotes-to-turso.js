/**
 * Sync ALL footnotes to Turso production database
 *
 * Usage:
 *   TURSO_DATABASE_URL=libsql://... TURSO_AUTH_TOKEN=... node scripts/sync-all-footnotes-to-turso.js
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
const BATCH_SIZE = 50; // Batch for transaction
const LOG_EVERY = 5000; // Log progress every N pages

async function syncAllFootnotesToTurso() {
  console.log('Connecting to local SQLite database...');
  const localDb = new Database(DB_PATH, { readonly: true });

  console.log('Connecting to Turso...');
  const tursoClient = createClient({
    url: TURSO_DATABASE_URL,
    authToken: TURSO_AUTH_TOKEN,
  });

  // Step 1: Ensure footnotes column exists
  console.log('\n1. Checking for footnotes column...');
  try {
    await tursoClient.execute('ALTER TABLE pages ADD COLUMN footnotes TEXT');
    console.log('   Added footnotes column to pages table.');
  } catch (error) {
    console.log('   Footnotes column already exists or error:', error.message?.substring(0, 50));
  }

  // Step 2: Get all pages with footnotes or updated text (containing markers)
  console.log('\n2. Getting pages with footnotes from local database...');

  // Get count first
  const countResult = localDb.prepare(`
    SELECT COUNT(*) as count FROM pages
    WHERE footnotes IS NOT NULL OR text LIKE '%【%'
  `).get();

  console.log(`   Found ${countResult.count} pages to sync.`);

  // Step 3: Sync in batches using batch() API
  console.log('\n3. Syncing pages to Turso in batches...');

  let offset = 0;
  let totalUpdated = 0;
  let totalErrors = 0;
  const startTime = Date.now();

  while (true) {
    const pages = localDb.prepare(`
      SELECT book_id, volume, page, text, footnotes
      FROM pages
      WHERE footnotes IS NOT NULL OR text LIKE '%【%'
      ORDER BY book_id, volume, page
      LIMIT ? OFFSET ?
    `).all(BATCH_SIZE, offset);

    if (pages.length === 0) break;

    // Use batch() to send multiple statements at once
    const statements = pages.map(pageData => ({
      sql: `UPDATE pages SET text = ?, footnotes = ?
            WHERE book_id = ? AND volume = ? AND page = ?`,
      args: [
        pageData.text,
        pageData.footnotes,
        pageData.book_id,
        pageData.volume,
        pageData.page
      ]
    }));

    try {
      await tursoClient.batch(statements);
      totalUpdated += pages.length;
    } catch (error) {
      // If batch fails, try individual updates
      for (const pageData of pages) {
        try {
          await tursoClient.execute({
            sql: `UPDATE pages SET text = ?, footnotes = ?
                  WHERE book_id = ? AND volume = ? AND page = ?`,
            args: [
              pageData.text,
              pageData.footnotes,
              pageData.book_id,
              pageData.volume,
              pageData.page
            ],
          });
          totalUpdated++;
        } catch (err) {
          totalErrors++;
          if (totalErrors <= 5) {
            console.error(`   Error: ${pageData.book_id}/${pageData.volume}/${pageData.page}: ${err.message}`);
          }
        }
      }
    }

    offset += BATCH_SIZE;

    // Log progress periodically
    if (offset % LOG_EVERY === 0 || offset >= countResult.count) {
      const progress = Math.min(offset, countResult.count);
      const percent = ((progress / countResult.count) * 100).toFixed(1);
      const elapsed = ((Date.now() - startTime) / 1000).toFixed(0);
      console.log(`   Progress: ${progress}/${countResult.count} (${percent}%) - ${elapsed}s elapsed`);
    }
  }

  // Step 4: Verify
  console.log('\n4. Verifying...');
  const verifyResult = await tursoClient.execute({
    sql: `SELECT COUNT(*) as count FROM pages WHERE footnotes IS NOT NULL`,
    args: []
  });

  const elapsed = ((Date.now() - startTime) / 1000).toFixed(1);

  console.log('\n========================================');
  console.log('Sync Complete!');
  console.log(`  Pages updated: ${totalUpdated}`);
  console.log(`  Errors: ${totalErrors}`);
  console.log(`  Pages with footnotes in Turso: ${verifyResult.rows[0].count}`);
  console.log(`  Time: ${elapsed}s`);
  console.log('========================================');

  localDb.close();
}

syncAllFootnotesToTurso().catch(console.error);
