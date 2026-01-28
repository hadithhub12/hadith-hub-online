#!/usr/bin/env node

/**
 * Migrate Hadith Database to Supabase
 *
 * This script:
 * 1. Creates the schema in Supabase (with pg_vector)
 * 2. Migrates books and pages (without embeddings first)
 * 3. Then migrates embeddings in batches
 *
 * Prerequisites:
 * - Create a Supabase project at https://supabase.com
 * - Enable the vector extension in SQL Editor: CREATE EXTENSION IF NOT EXISTS vector;
 * - Set environment variables: SUPABASE_URL, SUPABASE_SERVICE_KEY
 */

require('dotenv').config({ path: '.env.local' });
const { createClient } = require('@supabase/supabase-js');
const Database = require('better-sqlite3');
const path = require('path');

const SUPABASE_URL = process.env.SUPABASE_URL;
const SUPABASE_SERVICE_KEY = process.env.SUPABASE_SERVICE_KEY;

if (!SUPABASE_URL || !SUPABASE_SERVICE_KEY) {
  console.error('Missing SUPABASE_URL or SUPABASE_SERVICE_KEY in .env.local');
  console.error('\nTo set up:');
  console.error('1. Create a project at https://supabase.com');
  console.error('2. Go to Settings > API');
  console.error('3. Copy the URL and service_role key');
  console.error('4. Add to .env.local:');
  console.error('   SUPABASE_URL=https://your-project.supabase.co');
  console.error('   SUPABASE_SERVICE_KEY=your-service-role-key');
  process.exit(1);
}

const LOCAL_DB_PATH = path.join(__dirname, '..', 'src', 'data', 'hadith.db');
const BATCH_SIZE = 500;
const LOG_EVERY = 5000;

const supabase = createClient(SUPABASE_URL, SUPABASE_SERVICE_KEY);

async function createSchema() {
  console.log('Creating schema...');

  // Enable vector extension
  const { error: extError } = await supabase.rpc('exec_sql', {
    query: 'CREATE EXTENSION IF NOT EXISTS vector;'
  }).catch(() => ({ error: 'RPC not available' }));

  if (extError) {
    console.log('Note: Run this in Supabase SQL Editor manually:');
    console.log('  CREATE EXTENSION IF NOT EXISTS vector;');
  }

  // Create books table
  const { error: booksError } = await supabase.from('books').select('id').limit(1);
  if (booksError?.code === '42P01') {
    console.log('Creating books table...');
    // Table doesn't exist, we'll create via SQL
  }

  // Create pages table
  const { error: pagesError } = await supabase.from('pages').select('id').limit(1);
  if (pagesError?.code === '42P01') {
    console.log('Creating pages table...');
  }

  console.log('Schema check complete. Run the SQL below in Supabase SQL Editor if tables do not exist:\n');

  const schemaSql = `
-- Enable vector extension
CREATE EXTENSION IF NOT EXISTS vector;

-- Books table
CREATE TABLE IF NOT EXISTS books (
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

-- Pages table with vector column for embeddings
CREATE TABLE IF NOT EXISTS pages (
  id BIGSERIAL PRIMARY KEY,
  book_id TEXT NOT NULL REFERENCES books(id),
  volume INTEGER NOT NULL,
  page INTEGER NOT NULL,
  text TEXT NOT NULL,
  text_normalized TEXT NOT NULL,
  footnotes TEXT,
  embedding vector(1536),
  UNIQUE(book_id, volume, page)
);

-- Create indexes
CREATE INDEX IF NOT EXISTS idx_pages_book_id ON pages(book_id);
CREATE INDEX IF NOT EXISTS idx_pages_book_volume_page ON pages(book_id, volume, page);

-- Create GIN index for full-text search
CREATE INDEX IF NOT EXISTS idx_pages_text_search ON pages USING GIN (to_tsvector('arabic', text));

-- Create HNSW index for vector similarity (after embeddings are loaded)
-- CREATE INDEX IF NOT EXISTS idx_pages_embedding ON pages USING hnsw (embedding vector_cosine_ops);

-- Function for semantic search
CREATE OR REPLACE FUNCTION match_pages(
  query_embedding vector(1536),
  match_count int DEFAULT 50
)
RETURNS TABLE (
  id bigint,
  book_id text,
  volume integer,
  page integer,
  text text,
  similarity float
)
LANGUAGE plpgsql
AS $$
BEGIN
  RETURN QUERY
  SELECT
    pages.id,
    pages.book_id,
    pages.volume,
    pages.page,
    pages.text,
    1 - (pages.embedding <=> query_embedding) as similarity
  FROM pages
  WHERE pages.embedding IS NOT NULL
  ORDER BY pages.embedding <=> query_embedding
  LIMIT match_count;
END;
$$;
`;

  console.log(schemaSql);
  console.log('\n--- End of SQL ---\n');

  return true;
}

async function migrateBooks(localDb) {
  console.log('\nMigrating books...');

  const books = localDb.prepare('SELECT * FROM books').all();
  console.log(`  Found ${books.length} books`);

  // Insert in batches
  for (let i = 0; i < books.length; i += BATCH_SIZE) {
    const batch = books.slice(i, i + BATCH_SIZE);

    const { error } = await supabase.from('books').upsert(batch, {
      onConflict: 'id'
    });

    if (error) {
      console.error(`  Error inserting books batch ${i}:`, error.message);
    }
  }

  console.log(`  Migrated ${books.length} books`);
  return books.length;
}

async function migratePages(localDb, withEmbeddings = false) {
  console.log(`\nMigrating pages ${withEmbeddings ? 'WITH' : 'WITHOUT'} embeddings...`);

  const pageCount = localDb.prepare('SELECT COUNT(*) as c FROM pages').get().c;
  console.log(`  Total pages: ${pageCount.toLocaleString()}`);

  const columns = withEmbeddings
    ? 'id, book_id, volume, page, text, text_normalized, footnotes, embedding'
    : 'id, book_id, volume, page, text, text_normalized, footnotes';

  const fetchPages = localDb.prepare(`
    SELECT ${columns}
    FROM pages
    WHERE id > ?
    ORDER BY id
    LIMIT ?
  `);

  const startTime = Date.now();
  let migrated = 0;
  let lastId = 0;
  let errors = 0;

  while (migrated < pageCount) {
    const batch = fetchPages.all(lastId, BATCH_SIZE);
    if (batch.length === 0) break;

    lastId = batch[batch.length - 1].id;

    // Transform for Supabase
    const transformed = batch.map(row => {
      const page = {
        id: row.id,
        book_id: row.book_id,
        volume: row.volume,
        page: row.page,
        text: row.text,
        text_normalized: row.text_normalized,
        footnotes: row.footnotes || null,
      };

      if (withEmbeddings && row.embedding) {
        // Parse JSON embedding string to array, then format for pg_vector
        try {
          const embArray = typeof row.embedding === 'string'
            ? JSON.parse(row.embedding)
            : row.embedding;
          page.embedding = `[${embArray.join(',')}]`;
        } catch {
          page.embedding = null;
        }
      }

      return page;
    });

    const { error } = await supabase.from('pages').upsert(transformed, {
      onConflict: 'id'
    });

    if (error) {
      errors++;
      if (errors <= 5) {
        console.error(`  Error at batch ${migrated}:`, error.message);
      }
    } else {
      migrated += batch.length;
    }

    if (migrated % LOG_EVERY < BATCH_SIZE) {
      const elapsed = (Date.now() - startTime) / 1000;
      const rate = migrated / elapsed;
      const remaining = pageCount - migrated;
      const eta = remaining / rate / 60;
      console.log(`  Progress: ${migrated.toLocaleString()}/${pageCount.toLocaleString()} (${(migrated/pageCount*100).toFixed(1)}%) | ${rate.toFixed(1)}/sec | ETA: ${eta.toFixed(1)}min`);
    }
  }

  const totalTime = (Date.now() - startTime) / 1000;
  console.log(`  Migrated ${migrated.toLocaleString()} pages in ${totalTime.toFixed(1)}s`);
  console.log(`  Errors: ${errors}`);

  return migrated;
}

async function migrateEmbeddingsOnly(localDb) {
  console.log('\nMigrating embeddings only (updating existing pages)...');

  const embCount = localDb.prepare('SELECT COUNT(*) as c FROM pages WHERE embedding IS NOT NULL').get().c;
  console.log(`  Total embeddings: ${embCount.toLocaleString()}`);

  const fetchEmbeddings = localDb.prepare(`
    SELECT id, embedding
    FROM pages
    WHERE embedding IS NOT NULL AND id > ?
    ORDER BY id
    LIMIT ?
  `);

  const startTime = Date.now();
  let migrated = 0;
  let lastId = 0;
  let errors = 0;

  while (migrated < embCount) {
    const batch = fetchEmbeddings.all(lastId, BATCH_SIZE);
    if (batch.length === 0) break;

    lastId = batch[batch.length - 1].id;

    // Update embeddings one by one (Supabase doesn't support batch update easily)
    for (const row of batch) {
      try {
        const embArray = typeof row.embedding === 'string'
          ? JSON.parse(row.embedding)
          : row.embedding;
        const embString = `[${embArray.join(',')}]`;

        const { error } = await supabase
          .from('pages')
          .update({ embedding: embString })
          .eq('id', row.id);

        if (error) {
          errors++;
        } else {
          migrated++;
        }
      } catch {
        errors++;
      }
    }

    if (migrated % LOG_EVERY < BATCH_SIZE) {
      const elapsed = (Date.now() - startTime) / 1000;
      const rate = migrated / elapsed;
      const remaining = embCount - migrated;
      const eta = remaining / rate / 60;
      console.log(`  Progress: ${migrated.toLocaleString()}/${embCount.toLocaleString()} (${(migrated/embCount*100).toFixed(1)}%) | ${rate.toFixed(1)}/sec | ETA: ${eta.toFixed(1)}min`);
    }
  }

  const totalTime = (Date.now() - startTime) / 1000 / 60;
  console.log(`  Migrated ${migrated.toLocaleString()} embeddings in ${totalTime.toFixed(1)}min`);
  console.log(`  Errors: ${errors}`);

  return migrated;
}

async function main() {
  const args = process.argv.slice(2);
  const mode = args[0] || 'schema';

  console.log('========================================');
  console.log('Migrate Hadith Database to Supabase');
  console.log('========================================\n');

  console.log('Mode:', mode);
  console.log('Supabase URL:', SUPABASE_URL);
  console.log('');

  if (mode === 'schema') {
    await createSchema();
    console.log('\nNext steps:');
    console.log('1. Copy the SQL above and run it in Supabase SQL Editor');
    console.log('2. Run: node scripts/migrate-to-supabase.js books');
    return;
  }

  // Open local database
  console.log('Opening local database...');
  const localDb = new Database(LOCAL_DB_PATH, { readonly: true });

  if (mode === 'books') {
    await migrateBooks(localDb);
    console.log('\nNext: node scripts/migrate-to-supabase.js pages');
  } else if (mode === 'pages') {
    await migratePages(localDb, false);
    console.log('\nNext: node scripts/migrate-to-supabase.js embeddings');
  } else if (mode === 'embeddings') {
    await migrateEmbeddingsOnly(localDb);
    console.log('\nDone! Now create the HNSW index in Supabase SQL Editor:');
    console.log('CREATE INDEX idx_pages_embedding ON pages USING hnsw (embedding vector_cosine_ops);');
  } else if (mode === 'all') {
    await migrateBooks(localDb);
    await migratePages(localDb, true);
    console.log('\nDone! Now create the HNSW index in Supabase SQL Editor:');
    console.log('CREATE INDEX idx_pages_embedding ON pages USING hnsw (embedding vector_cosine_ops);');
  } else {
    console.log('Usage: node scripts/migrate-to-supabase.js [schema|books|pages|embeddings|all]');
  }

  localDb.close();
}

main().catch(console.error);
