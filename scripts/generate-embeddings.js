/**
 * Generate embeddings for all hadith pages and store in Turso
 *
 * Prerequisites:
 *   npm install openai
 *
 * Usage:
 *   OPENAI_API_KEY=sk-... node scripts/generate-embeddings.js
 *
 * Options:
 *   --start=N     Start from page ID N (for resuming)
 *   --limit=N     Process only N pages (for testing)
 *   --dry-run     Don't write to database, just test embedding generation
 */

const { createClient } = require('@libsql/client');
const OpenAI = require('openai');
require('dotenv').config({ path: '.env.local' });

// Configuration
const EMBEDDING_MODEL = 'text-embedding-3-small'; // $0.02 per 1M tokens, 1536 dimensions
const EMBEDDING_DIMENSIONS = 1536;
const BATCH_SIZE = 100; // Pages to process per batch
const EMBEDDING_BATCH_SIZE = 50; // Texts to embed in single API call (max 2048 for OpenAI)
const LOG_EVERY = 500;

// Parse command line args
const args = process.argv.slice(2).reduce((acc, arg) => {
  const [key, value] = arg.replace('--', '').split('=');
  acc[key] = value === undefined ? true : parseInt(value) || value;
  return acc;
}, {});

const START_FROM = args.start || 0;
const LIMIT = args.limit || Infinity;
const DRY_RUN = args['dry-run'] || false;

// Environment variables
const TURSO_DATABASE_URL = process.env.TURSO_DATABASE_URL;
const TURSO_AUTH_TOKEN = process.env.TURSO_AUTH_TOKEN;
const OPENAI_API_KEY = process.env.OPENAI_API_KEY;

if (!OPENAI_API_KEY) {
  console.error('Error: OPENAI_API_KEY environment variable is required.');
  console.error('Get your API key from: https://platform.openai.com/api-keys');
  console.error('');
  console.error('Usage: OPENAI_API_KEY=sk-... node scripts/generate-embeddings.js');
  process.exit(1);
}

if (!TURSO_DATABASE_URL || !TURSO_AUTH_TOKEN) {
  console.error('Error: TURSO_DATABASE_URL and TURSO_AUTH_TOKEN are required.');
  process.exit(1);
}

const openai = new OpenAI({ apiKey: OPENAI_API_KEY });

const tursoClient = createClient({
  url: TURSO_DATABASE_URL,
  authToken: TURSO_AUTH_TOKEN,
});

/**
 * Generate embeddings for an array of texts
 */
async function generateEmbeddings(texts) {
  const response = await openai.embeddings.create({
    model: EMBEDDING_MODEL,
    input: texts,
    dimensions: EMBEDDING_DIMENSIONS,
  });

  return response.data.map(item => item.embedding);
}

/**
 * Convert embedding array to vector32 SQL format
 */
function embeddingToVector32(embedding) {
  return `vector32('[${embedding.join(',')}]')`;
}

/**
 * Add embedding column if it doesn't exist
 */
async function ensureEmbeddingColumn() {
  console.log('Checking embedding column...');

  try {
    // Check if column exists
    const result = await tursoClient.execute(`
      SELECT sql FROM sqlite_master WHERE type='table' AND name='pages'
    `);

    const schema = result.rows[0]?.sql || '';

    if (schema.includes('embedding')) {
      console.log('  Embedding column already exists');
      return;
    }

    console.log('  Adding embedding column...');
    await tursoClient.execute(`
      ALTER TABLE pages ADD COLUMN embedding F32_BLOB(${EMBEDDING_DIMENSIONS})
    `);
    console.log('  Embedding column added successfully');
  } catch (error) {
    if (error.message.includes('duplicate column')) {
      console.log('  Embedding column already exists');
    } else {
      throw error;
    }
  }
}

/**
 * Create vector index if it doesn't exist
 */
async function ensureVectorIndex() {
  console.log('Checking vector index...');

  try {
    const result = await tursoClient.execute(`
      SELECT name FROM sqlite_master WHERE type='index' AND name='pages_embedding_idx'
    `);

    if (result.rows.length > 0) {
      console.log('  Vector index already exists');
      return;
    }

    console.log('  Creating vector index (this may take a while)...');
    await tursoClient.execute(`
      CREATE INDEX pages_embedding_idx ON pages(libsql_vector_idx(embedding))
    `);
    console.log('  Vector index created successfully');
  } catch (error) {
    if (error.message.includes('already exists')) {
      console.log('  Vector index already exists');
    } else {
      console.log('  Note: Vector index creation may need to wait until embeddings are populated');
      console.log('  Error:', error.message);
    }
  }
}

/**
 * Get pages that need embeddings
 */
async function getPagesWithoutEmbeddings(offset, limit) {
  const result = await tursoClient.execute({
    sql: `
      SELECT id, text_normalized
      FROM pages
      WHERE embedding IS NULL AND id > ?
      ORDER BY id
      LIMIT ?
    `,
    args: [offset, limit],
  });

  return result.rows.map(row => ({
    id: row.id,
    text: row.text_normalized,
  }));
}

/**
 * Update pages with embeddings
 */
async function updatePageEmbeddings(pageEmbeddings) {
  // Turso batch update
  const statements = pageEmbeddings.map(({ id, embedding }) => ({
    sql: `UPDATE pages SET embedding = vector32(?) WHERE id = ?`,
    args: [JSON.stringify(embedding), id],
  }));

  await tursoClient.batch(statements);
}

/**
 * Main embedding generation process
 */
async function generateAllEmbeddings() {
  console.log('='.repeat(50));
  console.log('Hadith Embedding Generation');
  console.log('='.repeat(50));
  console.log(`Model: ${EMBEDDING_MODEL}`);
  console.log(`Dimensions: ${EMBEDDING_DIMENSIONS}`);
  console.log(`Start from ID: ${START_FROM}`);
  console.log(`Limit: ${LIMIT === Infinity ? 'None' : LIMIT}`);
  console.log(`Dry run: ${DRY_RUN}`);
  console.log('');

  // Step 1: Ensure schema is ready
  if (!DRY_RUN) {
    await ensureEmbeddingColumn();
  }

  // Step 2: Get total count
  const countResult = await tursoClient.execute(`
    SELECT COUNT(*) as total FROM pages WHERE embedding IS NULL
  `);
  const totalPages = Math.min(countResult.rows[0].total, LIMIT);
  console.log(`\nPages to process: ${totalPages}`);

  if (totalPages === 0) {
    console.log('All pages already have embeddings!');
    return;
  }

  // Step 3: Process in batches
  const startTime = Date.now();
  let processed = 0;
  let lastId = START_FROM;
  let totalTokens = 0;
  let errors = 0;

  console.log('\nProcessing...');

  while (processed < totalPages) {
    const batchSize = Math.min(BATCH_SIZE, totalPages - processed);
    const pages = await getPagesWithoutEmbeddings(lastId, batchSize);

    if (pages.length === 0) break;

    // Process in embedding batches
    for (let i = 0; i < pages.length; i += EMBEDDING_BATCH_SIZE) {
      const embeddingBatch = pages.slice(i, i + EMBEDDING_BATCH_SIZE);
      const texts = embeddingBatch.map(p => p.text || '');

      try {
        const embeddings = await generateEmbeddings(texts);

        // Estimate tokens (rough: 1 token per 4 chars for Arabic)
        totalTokens += texts.reduce((sum, t) => sum + Math.ceil(t.length / 2), 0);

        if (!DRY_RUN) {
          const pageEmbeddings = embeddingBatch.map((page, idx) => ({
            id: page.id,
            embedding: embeddings[idx],
          }));

          await updatePageEmbeddings(pageEmbeddings);
        }

        processed += embeddingBatch.length;
        lastId = embeddingBatch[embeddingBatch.length - 1].id;

      } catch (error) {
        console.error(`\nError at batch starting ID ${embeddingBatch[0].id}:`, error.message);
        errors++;

        // Skip this batch and continue
        lastId = embeddingBatch[embeddingBatch.length - 1].id;
        processed += embeddingBatch.length;

        // If too many errors, stop
        if (errors > 10) {
          console.error('Too many errors, stopping.');
          break;
        }

        // Rate limit handling
        if (error.message.includes('rate limit')) {
          console.log('Rate limited, waiting 60 seconds...');
          await new Promise(r => setTimeout(r, 60000));
        }
      }
    }

    // Progress logging
    if (processed % LOG_EVERY === 0 || processed >= totalPages) {
      const elapsed = (Date.now() - startTime) / 1000;
      const rate = processed / elapsed;
      const eta = (totalPages - processed) / rate;
      const cost = (totalTokens / 1000000) * 0.02; // $0.02 per 1M tokens

      console.log(
        `  Progress: ${processed}/${totalPages} (${((processed/totalPages)*100).toFixed(1)}%)` +
        ` | ${rate.toFixed(1)}/sec | ETA: ${(eta/60).toFixed(1)}min` +
        ` | Est. cost: $${cost.toFixed(2)}`
      );
    }
  }

  // Step 4: Create index after embeddings are done
  if (!DRY_RUN && processed > 0) {
    console.log('\nCreating vector index...');
    await ensureVectorIndex();
  }

  // Final stats
  const elapsed = (Date.now() - startTime) / 1000;
  const cost = (totalTokens / 1000000) * 0.02;

  console.log('\n' + '='.repeat(50));
  console.log('Complete!');
  console.log(`  Pages processed: ${processed}`);
  console.log(`  Errors: ${errors}`);
  console.log(`  Time: ${(elapsed/60).toFixed(1)} minutes`);
  console.log(`  Estimated tokens: ${totalTokens.toLocaleString()}`);
  console.log(`  Estimated cost: $${cost.toFixed(2)}`);
  console.log('='.repeat(50));
}

// Run
generateAllEmbeddings().catch(error => {
  console.error('Fatal error:', error);
  process.exit(1);
});
