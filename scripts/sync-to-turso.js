/**
 * Sync local SQLite database changes to Turso
 *
 * Usage:
 *   TURSO_DATABASE_URL=libsql://... TURSO_AUTH_TOKEN=... node scripts/sync-to-turso.js
 *
 * Or create a .env.local file with the credentials
 */

const { createClient } = require('@libsql/client');
const Database = require('better-sqlite3');
const path = require('path');
require('dotenv').config({ path: '.env.local' });

const TURSO_DATABASE_URL = process.env.TURSO_DATABASE_URL;
const TURSO_AUTH_TOKEN = process.env.TURSO_AUTH_TOKEN;

if (!TURSO_DATABASE_URL || !TURSO_AUTH_TOKEN) {
  console.error('Error: TURSO_DATABASE_URL and TURSO_AUTH_TOKEN environment variables are required.');
  console.error('');
  console.error('Set them via:');
  console.error('  1. Create .env.local file with the credentials, or');
  console.error('  2. Pass them as environment variables:');
  console.error('     TURSO_DATABASE_URL=libsql://... TURSO_AUTH_TOKEN=... node scripts/sync-to-turso.js');
  process.exit(1);
}

const DB_PATH = path.join(__dirname, '..', 'src', 'data', 'hadith.db');

async function syncToTurso() {
  console.log('Connecting to local SQLite database...');
  const localDb = new Database(DB_PATH, { readonly: true });

  console.log('Connecting to Turso...');
  const tursoClient = createClient({
    url: TURSO_DATABASE_URL,
    authToken: TURSO_AUTH_TOKEN,
  });

  // Get all books from local database
  const localBooks = localDb.prepare('SELECT * FROM books').all();
  console.log(`Found ${localBooks.length} books in local database`);

  // Update books in Turso
  console.log('Syncing books to Turso...');
  let updated = 0;
  let errors = 0;

  for (const book of localBooks) {
    try {
      await tursoClient.execute({
        sql: `UPDATE books SET
          title_ar = ?,
          title_en = ?,
          author_ar = ?,
          author_en = ?,
          sect = ?,
          volumes = ?,
          total_pages = ?
        WHERE id = ?`,
        args: [
          book.title_ar,
          book.title_en,
          book.author_ar,
          book.author_en,
          book.sect,
          book.volumes,
          book.total_pages,
          book.id
        ],
      });
      updated++;

      if (updated % 50 === 0) {
        console.log(`  Updated ${updated}/${localBooks.length} books...`);
      }
    } catch (error) {
      console.error(`  Error updating book ${book.id}: ${error.message}`);
      errors++;
    }
  }

  console.log('');
  console.log('========================================');
  console.log(`Sync complete!`);
  console.log(`  Books updated: ${updated}`);
  console.log(`  Errors: ${errors}`);
  console.log('========================================');

  localDb.close();
}

syncToTurso().catch(console.error);
