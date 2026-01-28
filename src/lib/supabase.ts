import { createClient } from '@supabase/supabase-js';
import type { Book, Page } from './types';

const SUPABASE_URL = process.env.SUPABASE_URL || process.env.NEXT_PUBLIC_SUPABASE_URL;
const SUPABASE_ANON_KEY = process.env.SUPABASE_ANON_KEY || process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;

if (!SUPABASE_URL || !SUPABASE_ANON_KEY) {
  console.warn('Supabase credentials not configured');
}

// Create client (will be null if not configured)
export const supabase = SUPABASE_URL && SUPABASE_ANON_KEY
  ? createClient(SUPABASE_URL, SUPABASE_ANON_KEY)
  : null;

export const isSupabaseConfigured = !!supabase;

/**
 * Get all books
 */
export async function getAllBooks(): Promise<Book[]> {
  if (!supabase) throw new Error('Supabase not configured');

  const { data, error } = await supabase
    .from('books')
    .select('id, title_ar, title_en, author_ar, author_en, sect, volumes, total_pages')
    .order('title_ar');

  if (error) throw error;
  return data as Book[];
}

/**
 * Get a single book by ID
 */
export async function getBook(id: string): Promise<Book | undefined> {
  if (!supabase) throw new Error('Supabase not configured');

  const { data, error } = await supabase
    .from('books')
    .select('id, title_ar, title_en, author_ar, author_en, sect, volumes, total_pages')
    .eq('id', id)
    .single();

  if (error && error.code !== 'PGRST116') throw error;
  return data as Book | undefined;
}

/**
 * Get volumes for a book
 */
export async function getBookVolumes(bookId: string): Promise<{ volume: number; totalPages: number }[]> {
  if (!supabase) throw new Error('Supabase not configured');

  const { data, error } = await supabase
    .rpc('get_book_volumes', { p_book_id: bookId });

  if (error) {
    // Fallback to direct query if RPC not available
    const { data: pages, error: pagesError } = await supabase
      .from('pages')
      .select('volume, page')
      .eq('book_id', bookId);

    if (pagesError) throw pagesError;

    // Group by volume and get max page
    const volumeMap = new Map<number, number>();
    for (const p of pages || []) {
      const current = volumeMap.get(p.volume) || 0;
      if (p.page > current) volumeMap.set(p.volume, p.page);
    }

    return Array.from(volumeMap.entries())
      .map(([volume, totalPages]) => ({ volume, totalPages }))
      .sort((a, b) => a.volume - b.volume);
  }

  return data;
}

/**
 * Get total pages in a volume
 */
export async function getVolumeTotalPages(bookId: string, volume: number): Promise<number> {
  if (!supabase) throw new Error('Supabase not configured');

  const { data, error } = await supabase
    .from('pages')
    .select('page')
    .eq('book_id', bookId)
    .eq('volume', volume)
    .order('page', { ascending: false })
    .limit(1)
    .single();

  if (error && error.code !== 'PGRST116') throw error;
  return data?.page || 0;
}

/**
 * Get a specific page
 */
export async function getPage(bookId: string, volume: number, page: number): Promise<Page | undefined> {
  if (!supabase) throw new Error('Supabase not configured');

  const { data, error } = await supabase
    .from('pages')
    .select('id, book_id, volume, page, text, text_normalized, footnotes')
    .eq('book_id', bookId)
    .eq('volume', volume)
    .eq('page', page)
    .single();

  if (error && error.code !== 'PGRST116') throw error;
  return data as Page | undefined;
}

/**
 * Full-text search
 */
export async function searchPages(query: string, limit: number = 100): Promise<{
  page: Page;
  book: Book;
  snippet: string;
}[]> {
  if (!supabase) throw new Error('Supabase not configured');

  // Use PostgreSQL full-text search
  const { data, error } = await supabase
    .rpc('search_pages', {
      search_query: query,
      result_limit: limit
    });

  if (error) {
    // Fallback to LIKE search if RPC not available
    const { data: likeData, error: likeError } = await supabase
      .from('pages')
      .select(`
        id, book_id, volume, page, text, text_normalized,
        books!inner(id, title_ar, title_en, author_ar, author_en, sect, volumes, total_pages)
      `)
      .ilike('text', `%${query}%`)
      .limit(limit);

    if (likeError) throw likeError;

    return (likeData || []).map((row: Record<string, unknown>) => {
      const book = row.books as Record<string, unknown>;
      return {
        page: {
          id: row.id as number,
          book_id: row.book_id as string,
          volume: row.volume as number,
          page: row.page as number,
          text: row.text as string,
          text_normalized: row.text_normalized as string,
        },
        book: {
          id: book.id as string,
          title_ar: book.title_ar as string,
          title_en: book.title_en as string,
          author_ar: book.author_ar as string,
          author_en: book.author_en as string,
          sect: book.sect as string,
          volumes: book.volumes as number,
          total_pages: book.total_pages as number,
        },
        snippet: createSnippet(row.text as string, query),
      };
    });
  }

  return data;
}

/**
 * Semantic search using pg_vector
 */
export async function searchByEmbedding(embedding: number[], limit: number = 50): Promise<{
  id: number;
  book_id: string;
  volume: number;
  page: number;
  text: string;
  similarity: number;
}[]> {
  if (!supabase) throw new Error('Supabase not configured');

  const { data, error } = await supabase
    .rpc('match_pages', {
      query_embedding: `[${embedding.join(',')}]`,
      match_count: limit
    });

  if (error) throw error;
  return data;
}

/**
 * Get adjacent pages (prev/next)
 */
export async function getAdjacentPages(bookId: string, volume: number, currentPage: number): Promise<{
  prev: { volume: number; page: number } | null;
  next: { volume: number; page: number } | null;
}> {
  if (!supabase) throw new Error('Supabase not configured');

  // Get previous page
  const { data: prevData } = await supabase
    .from('pages')
    .select('volume, page')
    .eq('book_id', bookId)
    .or(`volume.lt.${volume},and(volume.eq.${volume},page.lt.${currentPage})`)
    .order('volume', { ascending: false })
    .order('page', { ascending: false })
    .limit(1)
    .single();

  // Get next page
  const { data: nextData } = await supabase
    .from('pages')
    .select('volume, page')
    .eq('book_id', bookId)
    .or(`volume.gt.${volume},and(volume.eq.${volume},page.gt.${currentPage})`)
    .order('volume', { ascending: true })
    .order('page', { ascending: true })
    .limit(1)
    .single();

  return {
    prev: prevData ? { volume: prevData.volume, page: prevData.page } : null,
    next: nextData ? { volume: nextData.volume, page: nextData.page } : null,
  };
}

/**
 * Create a snippet from text with highlighted search term
 */
function createSnippet(text: string, query: string, maxLength: number = 300): string {
  if (!text) return '';

  const lowerText = text.toLowerCase();
  const lowerQuery = query.toLowerCase();
  const index = lowerText.indexOf(lowerQuery);

  if (index === -1) {
    return text.length > maxLength ? text.substring(0, maxLength) + '...' : text;
  }

  // Extract around the match
  const start = Math.max(0, index - 100);
  const end = Math.min(text.length, index + query.length + 100);

  let snippet = text.substring(start, end);
  if (start > 0) snippet = '...' + snippet;
  if (end < text.length) snippet = snippet + '...';

  // Highlight the match
  const regex = new RegExp(`(${query})`, 'gi');
  snippet = snippet.replace(regex, '<mark>$1</mark>');

  return snippet;
}
