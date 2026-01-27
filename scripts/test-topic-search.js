/**
 * Test topic search functionality
 */
const { createClient } = require('@libsql/client');
const OpenAI = require('openai');
require('dotenv').config({ path: '.env.local' });

const OPENAI_API_KEY = process.env.OPENAI_API_KEY;
const TURSO_DATABASE_URL = process.env.TURSO_DATABASE_URL;
const TURSO_AUTH_TOKEN = process.env.TURSO_AUTH_TOKEN;

if (!OPENAI_API_KEY) {
  console.error('OPENAI_API_KEY required');
  process.exit(1);
}

const client = createClient({
  url: TURSO_DATABASE_URL,
  authToken: TURSO_AUTH_TOKEN,
});

const openai = new OpenAI({ apiKey: OPENAI_API_KEY });

async function testSearch(query) {
  console.log(`\nSearching for: "${query}"`);
  console.log('='.repeat(50));

  // Generate embedding
  console.log('Generating embedding...');
  const response = await openai.embeddings.create({
    model: 'text-embedding-3-small',
    input: query,
    dimensions: 1536,
  });
  const embedding = response.data[0].embedding;
  console.log('Embedding generated');

  // Vector search
  console.log('Searching with vector_top_k...');
  const result = await client.execute({
    sql: `
      SELECT p.id, p.book_id, p.volume, p.page,
             substr(p.text, 1, 200) as snippet
      FROM vector_top_k('pages_embedding_idx', vector32(?), 5) AS v
      JOIN pages p ON p.rowid = v.id
    `,
    args: [JSON.stringify(embedding)]
  });

  console.log(`Found ${result.rows.length} results:\n`);
  for (const row of result.rows) {
    console.log(`Book: ${row.book_id}, Vol: ${row.volume}, Page: ${row.page}`);
    console.log(`Text: ${row.snippet?.substring(0, 150)}...`);
    console.log('');
  }
}

async function main() {
  // Test queries
  await testSearch('benefits of knowledge');
  await testSearch('patience in hardship');
  await testSearch('فضل العلم'); // Benefits of knowledge in Arabic
}

main().catch(console.error);
