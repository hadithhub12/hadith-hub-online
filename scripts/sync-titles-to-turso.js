/**
 * Sync English book titles from local SQLite to Turso
 */

const Database = require('better-sqlite3');
const { createClient } = require('@libsql/client');
const path = require('path');

const TURSO_DATABASE_URL = process.env.TURSO_DATABASE_URL;
const TURSO_AUTH_TOKEN = process.env.TURSO_AUTH_TOKEN;

if (!TURSO_DATABASE_URL || !TURSO_AUTH_TOKEN) {
  console.error('Error: TURSO_DATABASE_URL and TURSO_AUTH_TOKEN environment variables are required');
  process.exit(1);
}

const localDbPath = path.join(process.cwd(), 'src', 'data', 'hadith.db');

async function main() {
  // Connect to local database
  const localDb = new Database(localDbPath, { readonly: true });

  // Connect to Turso
  const turso = createClient({
    url: TURSO_DATABASE_URL,
    authToken: TURSO_AUTH_TOKEN,
  });

  console.log('Connected to databases');

  // Get all books from local database
  const localBooks = localDb.prepare('SELECT id, title_en FROM books ORDER BY id').all();
  console.log(`Found ${localBooks.length} books in local database`);

  // Update titles in Turso
  let updated = 0;
  let errors = 0;

  for (const book of localBooks) {
    try {
      await turso.execute({
        sql: 'UPDATE books SET title_en = ? WHERE id = ?',
        args: [book.title_en, book.id],
      });
      updated++;
      if (updated % 100 === 0) {
        console.log(`Updated ${updated} books...`);
      }
    } catch (err) {
      console.error(`Error updating book ${book.id}: ${err.message}`);
      errors++;
    }
  }

  console.log(`\nSync complete: ${updated} books updated, ${errors} errors`);

  localDb.close();
}

main().catch(console.error);
