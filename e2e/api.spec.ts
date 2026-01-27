import { test, expect } from '@playwright/test';

/**
 * API Routes E2E Tests
 * Tests all API endpoints for correct responses and error handling.
 */

test.describe('API - Books Endpoint', () => {
  test('GET /api/books returns list of books', async ({ request }) => {
    const response = await request.get('/api/books');

    expect(response.ok()).toBe(true);
    expect(response.status()).toBe(200);

    const data = await response.json();
    expect(data).toHaveProperty('books');
    expect(Array.isArray(data.books)).toBe(true);
    expect(data.books.length).toBeGreaterThan(0);
    expect(data).toHaveProperty('total');
  });

  test('books have required fields', async ({ request }) => {
    const response = await request.get('/api/books');
    const data = await response.json();

    const book = data.books[0];
    expect(book).toHaveProperty('id');
    expect(book).toHaveProperty('title_ar');
    expect(book).toHaveProperty('title_en');
    expect(book).toHaveProperty('author_ar');
    expect(book).toHaveProperty('sect');
    expect(book).toHaveProperty('volumes');
    expect(book).toHaveProperty('total_pages');
  });

  test('includes major hadith books', async ({ request }) => {
    const response = await request.get('/api/books');
    const data = await response.json();

    const bookIds = data.books.map((b: { id: string }) => b.id);

    // Al-Kafi
    expect(bookIds).toContain('01348');
    // Bihar al-Anwar
    expect(bookIds).toContain('01407');
  });

  test('has cache headers', async ({ request }) => {
    const response = await request.get('/api/books');

    const cacheControl = response.headers()['cache-control'];
    expect(cacheControl).toBeTruthy();
  });
});

test.describe('API - Single Book Endpoint', () => {
  test('GET /api/books/[id] returns book details', async ({ request }) => {
    const response = await request.get('/api/books/01348');

    expect(response.ok()).toBe(true);
    expect(response.status()).toBe(200);

    const data = await response.json();
    expect(data.book).toBeDefined();
    expect(data.book.id).toBe('01348');
  });

  test('returns volumes for book', async ({ request }) => {
    const response = await request.get('/api/books/01348');
    const data = await response.json();

    expect(data.volumes).toBeDefined();
    expect(Array.isArray(data.volumes)).toBe(true);
    expect(data.volumes.length).toBeGreaterThan(0);
  });

  test('volume has totalPages', async ({ request }) => {
    const response = await request.get('/api/books/01348');
    const data = await response.json();

    const volume = data.volumes[0];
    expect(volume).toHaveProperty('volume');
    expect(volume).toHaveProperty('totalPages');
    expect(volume.totalPages).toBeGreaterThan(0);
  });

  test('returns 404 for non-existent book', async ({ request }) => {
    const response = await request.get('/api/books/99999');

    expect(response.status()).toBe(404);
  });
});

test.describe('API - Page Endpoint', () => {
  test('GET /api/pages/[bookId]/[volume]/[page] returns page content', async ({ request }) => {
    const response = await request.get('/api/pages/01348/1/1');

    expect(response.ok()).toBe(true);
    expect(response.status()).toBe(200);

    const data = await response.json();
    expect(data.page).toBeDefined();
  });

  test('page has required fields', async ({ request }) => {
    const response = await request.get('/api/pages/01348/1/1');
    const data = await response.json();

    expect(data.page).toHaveProperty('book_id');
    expect(data.page).toHaveProperty('volume');
    expect(data.page).toHaveProperty('page');
    expect(data.page).toHaveProperty('text');
  });

  test('page text contains Arabic content', async ({ request }) => {
    const response = await request.get('/api/pages/01348/1/1');
    const data = await response.json();

    expect(data.page.text).toMatch(/[\u0600-\u06FF]/);
  });

  test('returns navigation info', async ({ request }) => {
    const response = await request.get('/api/pages/01348/1/5');
    const data = await response.json();

    expect(data).toHaveProperty('navigation');
    expect(data.navigation).toHaveProperty('prev');
    expect(data.navigation).toHaveProperty('next');
  });

  test('prev is null for first page', async ({ request }) => {
    const response = await request.get('/api/pages/01348/1/1');
    const data = await response.json();

    expect(data.navigation.prev).toBeNull();
    expect(data.navigation.next).toBeDefined();
  });

  test('returns 404 for non-existent page', async ({ request }) => {
    const response = await request.get('/api/pages/01348/999/999');

    expect(response.status()).toBe(404);
  });

  test('returns total pages for volume', async ({ request }) => {
    const response = await request.get('/api/pages/01348/1/1');
    const data = await response.json();

    expect(data).toHaveProperty('totalPages');
    expect(data.totalPages).toBeGreaterThan(0);
  });
});

test.describe('API - Search Endpoint', () => {
  test('GET /api/search returns results', async ({ request }) => {
    const response = await request.get('/api/search?q=محمد');

    expect(response.ok()).toBe(true);
    expect(response.status()).toBe(200);

    const data = await response.json();
    expect(data).toHaveProperty('results');
    expect(Array.isArray(data.results)).toBe(true);
  });

  test('search results have required fields', async ({ request }) => {
    const response = await request.get('/api/search?q=محمد&limit=5');
    const data = await response.json();

    if (data.results.length > 0) {
      const result = data.results[0];
      expect(result).toHaveProperty('bookId');
      expect(result).toHaveProperty('bookTitleAr');
      expect(result).toHaveProperty('volume');
      expect(result).toHaveProperty('page');
      expect(result).toHaveProperty('snippet');
    }
  });

  test('word mode search works', async ({ request }) => {
    const response = await request.get('/api/search?q=الله&mode=word');

    expect(response.ok()).toBe(true);
    const data = await response.json();
    expect(data.results.length).toBeGreaterThan(0);
  });

  test('root mode search works', async ({ request }) => {
    const response = await request.get('/api/search?q=علم&mode=root');

    expect(response.ok()).toBe(true);
    const data = await response.json();
    // Root search may find more variations
  });

  test('exact mode search works', async ({ request }) => {
    const response = await request.get('/api/search?q=بسم الله&mode=exact');

    expect(response.ok()).toBe(true);
    const data = await response.json();
  });

  test('respects limit parameter', async ({ request }) => {
    const response = await request.get('/api/search?q=محمد&limit=5');
    const data = await response.json();

    expect(data.results.length).toBeLessThanOrEqual(5);
  });

  test('returns search metadata', async ({ request }) => {
    const response = await request.get('/api/search?q=الله');
    const data = await response.json();

    expect(data).toHaveProperty('query');
    expect(data).toHaveProperty('total');
    expect(data).toHaveProperty('mode');
  });

  test('handles empty query', async ({ request }) => {
    const response = await request.get('/api/search?q=');

    expect(response.ok()).toBe(true);
    const data = await response.json();
    expect(data.results).toEqual([]);
  });

  test('handles special characters', async ({ request }) => {
    const response = await request.get('/api/search?q=' + encodeURIComponent('بسم الله الرحمن الرحيم'));

    expect(response.ok()).toBe(true);
  });
});

test.describe('API - Topic Search Endpoint', () => {
  test('GET /api/topic-search returns results', async ({ request }) => {
    const response = await request.get('/api/topic-search?q=الصبر');

    // May return 503 if not configured
    if (response.status() === 200) {
      const data = await response.json();
      expect(data).toHaveProperty('results');
      expect(data).toHaveProperty('mode');
      expect(data.mode).toBe('topic');
    } else if (response.status() === 503) {
      // Topic search not configured - acceptable
      const data = await response.json();
      expect(data).toHaveProperty('error');
    }
  });

  test('topic search results have required fields', async ({ request }) => {
    const response = await request.get('/api/topic-search?q=patience&limit=5');

    if (response.status() === 200) {
      const data = await response.json();
      if (data.results && data.results.length > 0) {
        const result = data.results[0];
        expect(result).toHaveProperty('bookId');
        expect(result).toHaveProperty('bookTitleAr');
        expect(result).toHaveProperty('volume');
        expect(result).toHaveProperty('page');
        expect(result).toHaveProperty('snippet');
        expect(result).toHaveProperty('shareUrl');
      }
    }
  });

  test('handles empty query', async ({ request }) => {
    const response = await request.get('/api/topic-search?q=');

    if (response.status() === 200) {
      const data = await response.json();
      expect(data.results).toEqual([]);
    }
  });

  test('respects limit parameter', async ({ request }) => {
    const response = await request.get('/api/topic-search?q=test&limit=10');

    if (response.status() === 200) {
      const data = await response.json();
      expect(data.results.length).toBeLessThanOrEqual(10);
    }
  });
});

test.describe('API - Error Handling', () => {
  test('invalid book ID format handled', async ({ request }) => {
    const response = await request.get('/api/books/invalid-id');

    // Should return 404 or handle gracefully
    expect([200, 404]).toContain(response.status());
  });

  test('invalid page parameters handled', async ({ request }) => {
    const response = await request.get('/api/pages/01348/abc/xyz');

    // Should handle invalid params
    expect(response.status()).toBeGreaterThanOrEqual(400);
  });

  test('missing required search parameter', async ({ request }) => {
    const response = await request.get('/api/search');

    // Should handle missing q param
    expect(response.ok()).toBe(true);
    const data = await response.json();
    expect(data.results).toEqual([]);
  });
});

test.describe('API - Performance', () => {
  test('books endpoint responds quickly', async ({ request }) => {
    const startTime = Date.now();
    await request.get('/api/books');
    const duration = Date.now() - startTime;

    expect(duration).toBeLessThan(5000);
  });

  test('page endpoint responds quickly', async ({ request }) => {
    const startTime = Date.now();
    await request.get('/api/pages/01348/1/1');
    const duration = Date.now() - startTime;

    expect(duration).toBeLessThan(3000);
  });

  test('search endpoint responds reasonably', async ({ request }) => {
    const startTime = Date.now();
    await request.get('/api/search?q=test&limit=10');
    const duration = Date.now() - startTime;

    expect(duration).toBeLessThan(5000);
  });
});

test.describe('API - Cache Headers', () => {
  test('books endpoint has cache headers', async ({ request }) => {
    const response = await request.get('/api/books');

    const headers = response.headers();
    // Should have some cache strategy
    expect(headers['cache-control'] || headers['etag']).toBeTruthy();
  });

  test('page endpoint has cache headers', async ({ request }) => {
    const response = await request.get('/api/pages/01348/1/1');

    const headers = response.headers();
    expect(headers['cache-control'] || headers['etag']).toBeTruthy();
  });
});

test.describe('API - Content Type', () => {
  test('all endpoints return JSON', async ({ request }) => {
    const endpoints = [
      '/api/books',
      '/api/books/01348',
      '/api/pages/01348/1/1',
      '/api/search?q=test',
    ];

    for (const endpoint of endpoints) {
      const response = await request.get(endpoint);
      const contentType = response.headers()['content-type'];
      expect(contentType).toContain('application/json');
    }
  });
});
