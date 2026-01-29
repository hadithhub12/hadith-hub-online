/**
 * Vector Search Provider Abstraction
 *
 * Supports multiple backends for vector similarity search:
 * - turso: Native Turso/libSQL vector search (vector_top_k)
 * - pinecone: Pinecone vector database
 * - none: Disabled (falls back to FTS)
 *
 * Set VECTOR_PROVIDER env var to switch between providers.
 */

import { getTursoClient } from './turso';

// Types
export interface VectorSearchResult {
  id: number;
  score: number;
}

export interface VectorProvider {
  name: string;
  search(embedding: number[], limit: number): Promise<VectorSearchResult[]>;
  isAvailable(): boolean;
}

// Provider configuration
const VECTOR_PROVIDER = process.env.VECTOR_PROVIDER || 'turso';
const PINECONE_API_KEY = process.env.PINECONE_API_KEY;
const PINECONE_INDEX_URL = process.env.PINECONE_INDEX_URL;

/**
 * Turso Native Vector Provider
 * Uses libSQL's built-in vector_top_k function with DiskANN index
 */
class TursoVectorProvider implements VectorProvider {
  name = 'turso';

  isAvailable(): boolean {
    return !!getTursoClient();
  }

  async search(embedding: number[], limit: number): Promise<VectorSearchResult[]> {
    const client = getTursoClient();
    if (!client) {
      throw new Error('Turso client not configured');
    }

    const result = await client.execute({
      sql: `SELECT id, distance FROM vector_top_k('pages_embedding_vec_idx', vector32(?), ?) AS v`,
      args: [JSON.stringify(embedding), limit],
    });

    return result.rows.map(row => ({
      id: row.id as number,
      score: 1 - (row.distance as number), // Convert distance to similarity score
    }));
  }
}

/**
 * Pinecone Vector Provider
 * Uses Pinecone's managed vector database service
 */
class PineconeVectorProvider implements VectorProvider {
  name = 'pinecone';

  isAvailable(): boolean {
    return !!(PINECONE_API_KEY && PINECONE_INDEX_URL);
  }

  async search(embedding: number[], limit: number): Promise<VectorSearchResult[]> {
    if (!PINECONE_API_KEY || !PINECONE_INDEX_URL) {
      throw new Error('Pinecone not configured. Set PINECONE_API_KEY and PINECONE_INDEX_URL.');
    }

    const response = await fetch(`${PINECONE_INDEX_URL}/query`, {
      method: 'POST',
      headers: {
        'Api-Key': PINECONE_API_KEY,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        vector: embedding,
        topK: limit,
        includeMetadata: false,
      }),
    });

    if (!response.ok) {
      const error = await response.text();
      throw new Error(`Pinecone query failed: ${error}`);
    }

    const data = await response.json();

    return data.matches.map((match: { id: string; score: number }) => ({
      id: parseInt(match.id, 10),
      score: match.score,
    }));
  }
}

/**
 * Null Vector Provider
 * Used when vector search is disabled
 */
class NullVectorProvider implements VectorProvider {
  name = 'none';

  isAvailable(): boolean {
    return false;
  }

  async search(): Promise<VectorSearchResult[]> {
    throw new Error('Vector search is disabled');
  }
}

// Provider instances
const providers: Record<string, VectorProvider> = {
  turso: new TursoVectorProvider(),
  pinecone: new PineconeVectorProvider(),
  none: new NullVectorProvider(),
};

/**
 * Get the configured vector provider
 */
export function getVectorProvider(): VectorProvider {
  const provider = providers[VECTOR_PROVIDER];
  if (!provider) {
    console.warn(`Unknown VECTOR_PROVIDER: ${VECTOR_PROVIDER}, falling back to 'none'`);
    return providers.none;
  }
  return provider;
}

/**
 * Check if vector search is available
 */
export function isVectorSearchAvailable(): boolean {
  const provider = getVectorProvider();
  return provider.name !== 'none' && provider.isAvailable();
}

/**
 * Perform vector similarity search using the configured provider
 */
export async function vectorSearch(
  embedding: number[],
  limit: number = 50
): Promise<VectorSearchResult[]> {
  const provider = getVectorProvider();

  if (!provider.isAvailable()) {
    throw new Error(`Vector provider '${provider.name}' is not available`);
  }

  return provider.search(embedding, limit);
}

/**
 * Get provider info for debugging/logging
 */
export function getProviderInfo(): { name: string; available: boolean; configured: string } {
  const provider = getVectorProvider();
  return {
    name: provider.name,
    available: provider.isAvailable(),
    configured: VECTOR_PROVIDER,
  };
}
