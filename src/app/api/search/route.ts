import { NextResponse } from 'next/server';
import { searchPages } from '@/lib/db';
import { prepareSearchQuery, isRomanText } from '@/lib/transliteration';
import type { SearchResult } from '@/lib/types';

export const dynamic = 'force-dynamic';

type SearchMode = 'word' | 'root' | 'exact';

// Arabic root extraction - removes common prefixes/suffixes to find the root
function extractArabicRoot(word: string): string[] {
  const roots: string[] = [word];

  // Common Arabic prefixes
  const prefixes = ['ال', 'و', 'ف', 'ب', 'ك', 'ل', 'لل', 'وال', 'فال', 'بال', 'كال'];
  // Common Arabic suffixes
  const suffixes = ['ة', 'ه', 'ها', 'هم', 'هن', 'ك', 'كم', 'كن', 'ي', 'نا', 'ون', 'ين', 'ات', 'ان', 'تين', 'تان'];

  let base = word;

  // Remove prefixes
  for (const prefix of prefixes) {
    if (base.startsWith(prefix) && base.length > prefix.length + 2) {
      const stripped = base.slice(prefix.length);
      if (!roots.includes(stripped)) roots.push(stripped);
    }
  }

  // Remove suffixes
  for (const suffix of suffixes) {
    if (base.endsWith(suffix) && base.length > suffix.length + 2) {
      const stripped = base.slice(0, -suffix.length);
      if (!roots.includes(stripped)) roots.push(stripped);
    }
  }

  // Try removing both prefix and suffix
  for (const prefix of prefixes) {
    if (base.startsWith(prefix)) {
      const withoutPrefix = base.slice(prefix.length);
      for (const suffix of suffixes) {
        if (withoutPrefix.endsWith(suffix) && withoutPrefix.length > suffix.length + 2) {
          const stripped = withoutPrefix.slice(0, -suffix.length);
          if (!roots.includes(stripped)) roots.push(stripped);
        }
      }
    }
  }

  return roots;
}

// Build FTS5 query based on search mode
function buildFtsQuery(searchTerms: string[], mode: SearchMode): string {
  switch (mode) {
    case 'exact':
      // Exact phrase match - wrap entire phrase in quotes
      const phrase = searchTerms.join(' ').replace(/"/g, '""');
      return `"${phrase}"`;

    case 'root':
      // Root search - extract roots and search for all variations
      const rootVariations: string[] = [];
      for (const term of searchTerms) {
        const roots = extractArabicRoot(term);
        rootVariations.push(...roots);
      }
      // Use prefix matching (*) to find words containing the root
      return rootVariations
        .map(root => `"${root.replace(/"/g, '""')}"*`)
        .join(' OR ');

    case 'word':
    default:
      // Word search - match any of the words (current behavior)
      return searchTerms
        .filter(term => term.length > 0)
        .map(term => `"${term.replace(/"/g, '""')}"`)
        .join(' OR ');
  }
}

export async function GET(request: Request) {
  try {
    const { searchParams } = new URL(request.url);
    const query = searchParams.get('q') || '';
    const lang = searchParams.get('lang') || 'ar';
    const mode = (searchParams.get('mode') || 'word') as SearchMode;
    const limit = Math.min(parseInt(searchParams.get('limit') || '100', 10), 500);

    if (!query.trim()) {
      return NextResponse.json({
        query: '',
        total: 0,
        results: [],
        mode,
      });
    }

    // Convert query to Arabic search terms
    const searchQueries = prepareSearchQuery(query);

    if (searchQueries.length === 0) {
      return NextResponse.json({
        query,
        total: 0,
        results: [],
        mode,
      });
    }

    // Search with each query variation and combine results
    const allResults: Map<string, SearchResult> = new Map();

    for (const searchQuery of searchQueries) {
      try {
        // Split into terms
        const terms = searchQuery
          .split(/\s+/)
          .filter(term => term.length > 0);

        if (terms.length === 0) continue;

        // Build FTS query based on mode
        const ftsQuery = buildFtsQuery(terms, mode);

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
      mode,
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
