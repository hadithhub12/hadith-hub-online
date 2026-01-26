#!/usr/bin/env node
/**
 * Sync footnote markers from local hadith.db to Turso production database
 * Updates only the text column for pages that have 【】 markers
 */

const Database = require('better-sqlite3');
const { createClient } = require('@libsql/client');

// Turso credentials from .env.local
const TURSO_DATABASE_URL = 'libsql://hadith-hadithhub12.aws-us-east-2.turso.io';
const TURSO_AUTH_TOKEN = process.env.TURSO_AUTH_TOKEN;

if (!TURSO_AUTH_TOKEN) {
  console.error('Error: TURSO_AUTH_TOKEN environment variable is required');
  console.error('Run with: TURSO_AUTH_TOKEN=your_token node scripts/sync-markers-to-turso.js');
  process.exit(1);
}

const BATCH_SIZE = 100; // Number of updates per batch
const PROGRESS_INTERVAL = 1000; // Log progress every N pages

async function main() {
  console.log('Connecting to databases...');

  // Local SQLite
  const localDb = new Database('./src/data/hadith.db', { readonly: true });

  // Turso production
  const turso = createClient({
    url: TURSO_DATABASE_URL,
    authToken: TURSO_AUTH_TOKEN,
  });

  // Get all pages with markers
  console.log('Fetching pages with footnote markers...');
  const pages = localDb.prepare(`
    SELECT id, text
    FROM pages
    WHERE text LIKE '%【%'
  `).all();

  console.log(`Found ${pages.length} pages to update`);

  let updated = 0;
  let errors = 0;
  const startTime = Date.now();

  // Process in batches
  for (let i = 0; i < pages.length; i += BATCH_SIZE) {
    const batch = pages.slice(i, i + BATCH_SIZE);

    try {
      // Build batch transaction
      const statements = batch.map(page => ({
        sql: 'UPDATE pages SET text = ? WHERE id = ?',
        args: [page.text, page.id]
      }));

      await turso.batch(statements, 'write');
      updated += batch.length;

    } catch (err) {
      console.error(`Error updating batch at index ${i}:`, err.message);
      errors += batch.length;

      // Try individual updates for this batch
      for (const page of batch) {
        try {
          await turso.execute({
            sql: 'UPDATE pages SET text = ? WHERE id = ?',
            args: [page.text, page.id]
          });
          updated++;
          errors--;
        } catch (e) {
          console.error(`  Failed page ${page.id}:`, e.message);
        }
      }
    }

    // Progress logging
    if ((i + BATCH_SIZE) % PROGRESS_INTERVAL < BATCH_SIZE || i + BATCH_SIZE >= pages.length) {
      const elapsed = (Date.now() - startTime) / 1000;
      const rate = updated / elapsed;
      const remaining = (pages.length - i - BATCH_SIZE) / rate;
      console.log(`Progress: ${updated}/${pages.length} (${((updated/pages.length)*100).toFixed(1)}%) - ${rate.toFixed(0)} pages/sec - ETA: ${Math.round(remaining)}s`);
    }
  }

  const totalTime = (Date.now() - startTime) / 1000;
  console.log('\n=== Sync Complete ===');
  console.log(`Updated: ${updated} pages`);
  console.log(`Errors: ${errors} pages`);
  console.log(`Total time: ${totalTime.toFixed(1)} seconds`);

  localDb.close();
  process.exit(errors > 0 ? 1 : 0);
}

main().catch(err => {
  console.error('Fatal error:', err);
  process.exit(1);
});
