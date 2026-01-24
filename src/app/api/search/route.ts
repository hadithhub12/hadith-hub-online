import { NextResponse } from 'next/server';
import { searchPages } from '@/lib/db';
import { prepareSearchQuery, isRomanText } from '@/lib/transliteration';
import type { SearchResult } from '@/lib/types';

export const dynamic = 'force-dynamic';

export async function GET(request: Request) {
  try {
    const { searchParams } = new URL(request.url);
    const query = searchParams.get('q') || '';
    const lang = searchParams.get('lang') || 'ar';
    const limit = Math.min(parseInt(searchParams.get('limit') || '100', 10), 500);

    if (!query.trim()) {
      return NextResponse.json({
        query: '',
        total: 0,
        results: [],
      });
    }

    // Convert query to Arabic search terms
    const searchQueries = prepareSearchQuery(query);

    if (searchQueries.length === 0) {
      return NextResponse.json({
        query,
        total: 0,
        results: [],
      });
    }

    // Search with each query variation and combine results
    const allResults: Map<string, SearchResult> = new Map();

    for (const searchQuery of searchQueries) {
      try {
        // Escape special FTS5 characters and format query
        const ftsQuery = searchQuery
          .split(/\s+/)
          .filter(term => term.length > 0)
          .map(term => `"${term.replace(/"/g, '""')}"`)
          .join(' OR ');

        if (!ftsQuery) continue;

        const results = await searchPages(ftsQuery, limit);

        for (const result of results) {
          const key = `${result.page.book_id}-${result.page.volume}-${result.page.page}`;

          if (!allResults.has(key)) {
            allResults.set(key, {
              bookId: result.page.book_id,
              bookTitleAr: result.book.title_ar,
              bookTitleEn: result.book.title_en,
              volume: result.page.volume,
              page: result.page.page,
              snippet: result.snippet,
              shareUrl: `/book/${result.page.book_id}/${result.page.volume}/${result.page.page}?highlight=${encodeURIComponent(query)}`,
            });
          }
        }
      } catch (e) {
        // Individual search query failed, continue with others
        console.warn('Search query failed:', searchQuery, e);
      }
    }

    const results = Array.from(allResults.values()).slice(0, limit);

    // Determine if this was a transliterated search
    const wasTransliterated = isRomanText(query);

    return NextResponse.json({
      query,
      total: results.length,
      results,
      transliterated: wasTransliterated,
      searchTerms: searchQueries.slice(0, 3), // Show what was actually searched
    });
  } catch (error) {
    console.error('Search error:', error);
    return NextResponse.json(
      { error: 'Search failed' },
      { status: 500 }
    );
  }
}
