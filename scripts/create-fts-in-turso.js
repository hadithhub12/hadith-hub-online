/**
 * Create FTS5 table in Turso for full-text search
 *
 * This script:
 * 1. Creates the pages_fts virtual table (FTS5) in Turso
 * 2. Populates it with text_normalized data from pages table
 *
 * Usage:
 *   node scripts/create-fts-in-turso.js
 */

const { createClient } = require('@libsql/client');
require('dotenv').config({ path: '.env.local' });

const TURSO_DATABASE_URL = process.env.TURSO_DATABASE_URL;
const TURSO_AUTH_TOKEN = process.env.TURSO_AUTH_TOKEN;

if (!TURSO_DATABASE_URL || !TURSO_AUTH_TOKEN) {
  console.error('Error: TURSO_DATABASE_URL and TURSO_AUTH_TOKEN environment variables are required.');
  process.exit(1);
}

async function createFtsInTurso() {
  console.log('Connecting to Turso...');
  const tursoClient = createClient({
    url: TURSO_DATABASE_URL,
    authToken: TURSO_AUTH_TOKEN,
  });

  const startTime = Date.now();

  // Step 1: Check if pages_fts already exists
  console.log('\n1. Checking if pages_fts table exists...');
  try {
    const result = await tursoClient.execute(`
      SELECT name FROM sqlite_master WHERE type='table' AND name='pages_fts'
    `);
    if (result.rows.length > 0) {
      console.log('   pages_fts table already exists!');
      console.log('   Dropping existing table to recreate...');
      await tursoClient.execute('DROP TABLE IF EXISTS pages_fts');
    }
  } catch (e) {
    console.log('   Table check error (continuing):', e.message);
  }

  // Step 2: Create FTS5 virtual table
  console.log('\n2. Creating FTS5 virtual table...');
  try {
    await tursoClient.execute(`
      CREATE VIRTUAL TABLE pages_fts USING fts5(
        text_normalized,
        content='pages',
        content_rowid='id'
      )
    `);
    console.log('   pages_fts table created successfully!');
  } catch (e) {
    console.error('   Error creating FTS5 table:', e.message);
    process.exit(1);
  }

  // Step 3: Populate FTS5 table from pages table
  console.log('\n3. Populating FTS5 table from pages...');

  // First, get the total count
  const countResult = await tursoClient.execute('SELECT COUNT(*) as count FROM pages');
  const totalPages = countResult.rows[0].count;
  console.log(`   Total pages to index: ${totalPages}`);

  // Populate using INSERT...SELECT
  console.log('   Running INSERT...SELECT (this may take a while)...');
  try {
    await tursoClient.execute(`
      INSERT INTO pages_fts(rowid, text_normalized)
      SELECT id, text_normalized FROM pages
    `);
    console.log('   FTS5 table populated successfully!');
  } catch (e) {
    console.error('   Error populating FTS5:', e.message);
    // Try batch approach if bulk insert fails
    console.log('   Trying batch approach...');

    const BATCH_SIZE = 1000;
    let offset = 0;
    let indexed = 0;

    while (offset < totalPages) {
      try {
        await tursoClient.execute({
          sql: `
            INSERT INTO pages_fts(rowid, text_normalized)
            SELECT id, text_normalized FROM pages
            ORDER BY id
            LIMIT ? OFFSET ?
          `,
          args: [BATCH_SIZE, offset]
        });
        indexed += BATCH_SIZE;
        offset += BATCH_SIZE;

        if (offset % 10000 === 0 || offset >= totalPages) {
          const progress = Math.min(offset, totalPages);
          const percent = ((progress / totalPages) * 100).toFixed(1);
          console.log(`   Progress: ${progress}/${totalPages} (${percent}%)`);
        }
      } catch (batchError) {
        console.error(`   Batch error at offset ${offset}:`, batchError.message);
        offset += BATCH_SIZE; // Skip problematic batch
      }
    }
  }

  // Step 4: Verify
  console.log('\n4. Verifying FTS5 table...');
  try {
    // Test a simple search
    const testResult = await tursoClient.execute(`
      SELECT COUNT(*) as count FROM pages_fts WHERE pages_fts MATCH 'الله'
    `);
    console.log(`   Test search for 'الله': ${testResult.rows[0].count} results`);

    // Check total indexed
    const ftsCount = await tursoClient.execute('SELECT COUNT(*) as count FROM pages_fts');
    console.log(`   Total indexed pages: ${ftsCount.rows[0].count}`);
  } catch (e) {
    console.error('   Verification error:', e.message);
  }

  const elapsed = ((Date.now() - startTime) / 1000).toFixed(1);

  console.log('\n========================================');
  console.log('FTS5 Setup Complete!');
  console.log(`  Time: ${elapsed}s`);
  console.log('========================================');
}

createFtsInTurso().catch(console.error);
