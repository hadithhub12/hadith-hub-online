import { NextResponse } from 'next/server';
import { createClient } from '@libsql/client';
import OpenAI from 'openai';

export const dynamic = 'force-dynamic';

const TURSO_DATABASE_URL = process.env.TURSO_DATABASE_URL;
const TURSO_AUTH_TOKEN = process.env.TURSO_AUTH_TOKEN;
const OPENAI_API_KEY = process.env.OPENAI_API_KEY;

const EMBEDDING_MODEL = 'text-embedding-3-small';
const EMBEDDING_DIMENSIONS = 1536;

// Initialize clients lazily
let tursoClient: ReturnType<typeof createClient> | null = null;
let openaiClient: OpenAI | null = null;

function getTursoClient() {
  if (!tursoClient && TURSO_DATABASE_URL && TURSO_AUTH_TOKEN) {
    tursoClient = createClient({
      url: TURSO_DATABASE_URL,
      authToken: TURSO_AUTH_TOKEN,
    });
  }
  return tursoClient;
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
 * Search for similar pages using vector similarity
 */
async function searchByEmbedding(embedding: number[], limit: number = 50) {
  const client = getTursoClient();
  if (!client) {
    throw new Error('Turso client not configured');
  }

  const embeddingJson = JSON.stringify(embedding);

  const result = await client.execute({
    sql: `
      SELECT
        p.id, p.book_id, p.volume, p.page, p.text, p.text_normalized,
        b.title_ar, b.title_en, b.author_ar, b.author_en, b.sect
      FROM vector_top_k('pages_embedding_idx', vector32(?), ?)
      JOIN pages p ON p.rowid = id
      JOIN books b ON p.book_id = b.id
    `,
    args: [embeddingJson, limit],
  });

  return result.rows;
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

    // Search by vector similarity
    const results = await searchByEmbedding(queryEmbedding, limit);

    const embeddingTime = Date.now() - startTime;

    // Format results
    const formattedResults = results.map((row) => ({
      bookId: row.book_id as string,
      bookTitleAr: row.title_ar as string,
      bookTitleEn: row.title_en as string,
      authorAr: row.author_ar as string,
      authorEn: row.author_en as string,
      volume: row.volume as number,
      page: row.page as number,
      snippet: createSnippet(row.text as string),
      shareUrl: `/book/${row.book_id}/${row.volume}/${row.page}`,
    }));

    return NextResponse.json(
      {
        query,
        total: formattedResults.length,
        results: formattedResults,
        mode: 'topic',
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
