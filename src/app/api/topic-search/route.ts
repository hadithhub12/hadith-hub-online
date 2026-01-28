import { NextResponse } from 'next/server';
import { createClient } from '@libsql/client';
import OpenAI from 'openai';
import path from 'path';

export const dynamic = 'force-dynamic';
export const maxDuration = 30; // Keep under Vercel timeout limits

const TURSO_DATABASE_URL = process.env.TURSO_DATABASE_URL;
const TURSO_AUTH_TOKEN = process.env.TURSO_AUTH_TOKEN;
const OPENAI_API_KEY = process.env.OPENAI_API_KEY;
const IS_DEV = process.env.NODE_ENV === 'development';

const EMBEDDING_MODEL = 'text-embedding-3-small';
const EMBEDDING_DIMENSIONS = 1536;

// Initialize clients lazily
let tursoClient: ReturnType<typeof createClient> | null = null;
let openaiClient: OpenAI | null = null;
let localDb: import('better-sqlite3').Database | null = null;

function getTursoClient() {
  if (!tursoClient && TURSO_DATABASE_URL && TURSO_AUTH_TOKEN) {
    tursoClient = createClient({
      url: TURSO_DATABASE_URL,
      authToken: TURSO_AUTH_TOKEN,
    });
  }
  return tursoClient;
}

function getLocalDb() {
  if (!localDb && IS_DEV) {
    try {
      // Dynamic import for better-sqlite3 (only works in Node.js)
      // eslint-disable-next-line @typescript-eslint/no-require-imports
      const Database = require('better-sqlite3');
      const dbPath = path.join(process.cwd(), 'src', 'data', 'hadith.db');
      localDb = new Database(dbPath, { readonly: true });
    } catch {
      console.log('Local SQLite not available, falling back to Turso');
    }
  }
  return localDb;
}

function getOpenAIClient() {
  if (!openaiClient && OPENAI_API_KEY) {
    openaiClient = new OpenAI({ apiKey: OPENAI_API_KEY });
  }
  return openaiClient;
}

/**
 * Generate embedding for a query
 */
async function generateQueryEmbedding(query: string): Promise<number[]> {
  const openai = getOpenAIClient();
  if (!openai) {
    throw new Error('OpenAI client not configured');
  }

  const response = await openai.embeddings.create({
    model: EMBEDDING_MODEL,
    input: query,
    dimensions: EMBEDDING_DIMENSIONS,
  });

  return response.data[0].embedding;
}

/**
 * Calculate cosine similarity between two vectors
 */
function cosineSimilarity(a: number[], b: number[]): number {
  let dotProduct = 0;
  let normA = 0;
  let normB = 0;
  for (let i = 0; i < a.length; i++) {
    dotProduct += a[i] * b[i];
    normA += a[i] * a[i];
    normB += b[i] * b[i];
  }
  return dotProduct / (Math.sqrt(normA) * Math.sqrt(normB));
}

/**
 * Search using local SQLite with manual cosine similarity
 */
function searchLocalDb(queryEmbedding: number[], limit: number = 50) {
  const db = getLocalDb();
  if (!db) {
    throw new Error('Local database not available');
  }

  // Get pages with embeddings
  const pages = db.prepare(`
    SELECT p.id, p.book_id, p.volume, p.page, p.text, p.text_normalized, p.embedding,
           b.title_ar, b.title_en, b.author_ar, b.author_en, b.sect
    FROM pages p
    JOIN books b ON p.book_id = b.id
    WHERE p.embedding IS NOT NULL
    LIMIT 50000
  `).all() as Array<{
    id: number;
    book_id: string;
    volume: number;
    page: number;
    text: string;
    text_normalized: string;
    embedding: string;
    title_ar: string;
    title_en: string;
    author_ar: string;
    author_en: string;
    sect: string;
  }>;

  // Calculate similarities and sort
  const scored = pages.map(page => {
    const pageEmbedding = JSON.parse(page.embedding) as number[];
    const similarity = cosineSimilarity(queryEmbedding, pageEmbedding);
    return { ...page, similarity };
  });

  scored.sort((a, b) => b.similarity - a.similarity);

  return scored.slice(0, limit);
}

// Result type for search functions
type SearchResult = {
  book_id: string;
  title_ar: string;
  title_en: string;
  author_ar: string;
  author_en: string;
  volume: number;
  page: number;
  text: string;
  similarity: number;
};

/**
 * Search for similar pages using vector similarity (Turso)
 * Uses server-side cosine similarity calculation since embeddings are stored as JSON text
 *
 * Strategy: Process multiple batches in parallel to maximize coverage within time limits.
 */
async function searchByEmbedding(queryEmbedding: number[], limit: number = 50): Promise<SearchResult[]> {
  const client = getTursoClient();
  if (!client) {
    throw new Error('Turso client not configured');
  }

  // Optimized: Fetch smaller sample for faster response
  // Using random sampling across the database for good coverage
  const BATCH_SIZE = 500;
  const NUM_BATCHES = 3;
  const TOTAL_PAGES = 723000; // Approximate total pages with embeddings

  // Create batch queries that sample from different parts of the database
  const batchPromises = [];
  for (let i = 0; i < NUM_BATCHES; i++) {
    // Sample from beginning, middle, and end of database
    const offset = Math.floor((TOTAL_PAGES / NUM_BATCHES) * i);
    batchPromises.push(
      client.execute({
        sql: `
          SELECT
            p.id, p.book_id, p.volume, p.page, p.text, p.embedding,
            b.title_ar, b.title_en, b.author_ar, b.author_en, b.sect
          FROM pages p
          JOIN books b ON p.book_id = b.id
          WHERE p.embedding IS NOT NULL
          LIMIT ?
          OFFSET ?
        `,
        args: [BATCH_SIZE, offset],
      })
    );
  }

  // Execute all batches in parallel
  const batchResults = await Promise.all(batchPromises);

  // Combine all results
  const allRows = batchResults.flatMap(result => result.rows);

  // Calculate cosine similarity for each result
  const scored = allRows.map(row => {
    try {
      const pageEmbedding = JSON.parse(row.embedding as string) as number[];
      const similarity = cosineSimilarity(queryEmbedding, pageEmbedding);
      return {
        book_id: row.book_id as string,
        title_ar: row.title_ar as string,
        title_en: row.title_en as string,
        author_ar: row.author_ar as string,
        author_en: row.author_en as string,
        volume: row.volume as number,
        page: row.page as number,
        text: row.text as string,
        similarity,
      };
    } catch {
      return {
        book_id: row.book_id as string,
        title_ar: row.title_ar as string,
        title_en: row.title_en as string,
        author_ar: row.author_ar as string,
        author_en: row.author_en as string,
        volume: row.volume as number,
        page: row.page as number,
        text: row.text as string,
        similarity: 0,
      };
    }
  });

  // Sort by similarity and return top results
  scored.sort((a, b) => b.similarity - a.similarity);

  return scored.slice(0, limit);
}

/**
 * Create a snippet from text around potential topic matches
 */
function createSnippet(text: string, maxLength: number = 300): string {
  if (!text) return '';

  // Just return first part of text as snippet for topic search
  if (text.length <= maxLength) return text;

  return text.substring(0, maxLength) + '...';
}

export async function GET(request: Request) {
  try {
    // Check if feature is enabled
    if (!OPENAI_API_KEY) {
      return NextResponse.json(
        { error: 'Topic search is not configured. Missing OpenAI API key.' },
        { status: 503 }
      );
    }

    const { searchParams } = new URL(request.url);
    const query = searchParams.get('q') || '';
    const limit = Math.min(parseInt(searchParams.get('limit') || '50', 10), 100);

    if (!query.trim()) {
      return NextResponse.json({
        query: '',
        total: 0,
        results: [],
      });
    }

    const startTime = Date.now();

    // Generate embedding for the query
    const queryEmbedding = await generateQueryEmbedding(query);

    // Search by vector similarity - use local DB in dev if available
    let results: Array<{
      book_id: string;
      title_ar: string;
      title_en: string;
      author_ar: string;
      author_en: string;
      volume: number;
      page: number;
      text: string;
      similarity: number;
    }>;
    let source = 'turso';

    if (IS_DEV) {
      try {
        const localResults = searchLocalDb(queryEmbedding, limit);
        results = localResults;
        source = 'local';
      } catch {
        // Fall back to Turso
        results = await searchByEmbedding(queryEmbedding, limit);
      }
    } else {
      results = await searchByEmbedding(queryEmbedding, limit);
    }

    const embeddingTime = Date.now() - startTime;

    // Format results
    const formattedResults = results.map((row) => ({
      bookId: row.book_id,
      bookTitleAr: row.title_ar,
      bookTitleEn: row.title_en,
      authorAr: row.author_ar,
      authorEn: row.author_en,
      volume: row.volume,
      page: row.page,
      snippet: createSnippet(row.text),
      shareUrl: `/book/${row.book_id}/${row.volume}/${row.page}?highlight=${encodeURIComponent(query)}&mode=topic`,
    }));

    return NextResponse.json(
      {
        query,
        total: formattedResults.length,
        results: formattedResults,
        mode: 'topic',
        source: IS_DEV ? source : undefined,
        timing: {
          embeddingMs: embeddingTime,
        },
      },
      {
        headers: {
          'Cache-Control': 'public, s-maxage=300, stale-while-revalidate=3600',
        },
      }
    );
  } catch (error) {
    console.error('Topic search error:', error);

    // Check for specific errors
    const errorMessage = error instanceof Error ? error.message : 'Unknown error';

    if (errorMessage.includes('no such table') || errorMessage.includes('pages_embedding_idx')) {
      return NextResponse.json(
        { error: 'Topic search index not yet available. Embeddings are being generated.' },
        { status: 503 }
      );
    }

    return NextResponse.json(
      { error: 'Topic search failed', details: errorMessage },
      { status: 500 }
    );
  }
}
