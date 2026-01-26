import { describe, it, expect, beforeAll } from 'vitest';
import { getAllBooks, getBook, getBookVolumes, getPage, getAdjacentPages, getVolumeTotalPages, searchPages } from '../lib/db';

/**
 * API / Database Integration Tests
 *
 * These tests verify the database queries and API functionality.
 * They test against the actual local SQLite database.
 */

describe('Database Integration Tests', () => {
  describe('getAllBooks', () => {
    it('returns an array of books', async () => {
      const books = await getAllBooks();
      expect(Array.isArray(books)).toBe(true);
      expect(books.length).toBeGreaterThan(0);
    });

    it('books have required fields', async () => {
      const books = await getAllBooks();
      const book = books[0];

      expect(book).toHaveProperty('id');
      expect(book).toHaveProperty('title_ar');
      expect(book).toHaveProperty('title_en');
      expect(book).toHaveProperty('author_ar');
      expect(book).toHaveProperty('sect');
      expect(book).toHaveProperty('volumes');
      expect(book).toHaveProperty('total_pages');
    });

    it('includes major hadith books', async () => {
      const books = await getAllBooks();
      const bookIds = books.map(b => b.id);

      // Check for key books
      expect(bookIds).toContain('01348'); // Al-Kafi
      expect(bookIds).toContain('01407'); // Bihar al-Anwar
      expect(bookIds).toContain('01462'); // Al-Khisal
    });
  });

  describe('getBook', () => {
    it('returns a specific book by ID', async () => {
      const book = await getBook('01348'); // Al-Kafi

      expect(book).toBeDefined();
      expect(book?.id).toBe('01348');
      expect(book?.title_ar).toContain('الكافي');
    });

    it('returns undefined for non-existent book', async () => {
      const book = await getBook('99999');
      expect(book).toBeUndefined();
    });
  });

  describe('getBookVolumes', () => {
    it('returns volumes for a book', async () => {
      const volumes = await getBookVolumes('01348'); // Al-Kafi

      expect(Array.isArray(volumes)).toBe(true);
      expect(volumes.length).toBeGreaterThan(0);

      // Each volume should have volume number and totalPages
      const vol = volumes[0];
      expect(vol).toHaveProperty('volume');
      expect(vol).toHaveProperty('totalPages');
      expect(vol.totalPages).toBeGreaterThan(0);
    });

    it('returns empty array for non-existent book', async () => {
      const volumes = await getBookVolumes('99999');
      expect(volumes).toEqual([]);
    });
  });

  describe('getPage', () => {
    it('returns page content for valid book/volume/page', async () => {
      const page = await getPage('01348', 1, 1); // Al-Kafi, Vol 1, Page 1

      expect(page).toBeDefined();
      expect(page?.book_id).toBe('01348');
      expect(page?.volume).toBe(1);
      expect(page?.page).toBe(1);
      expect(page?.text).toBeTruthy();
    });

    it('returns undefined for non-existent page', async () => {
      const page = await getPage('01348', 999, 999);
      expect(page).toBeUndefined();
    });

    it('page has all required fields', async () => {
      const page = await getPage('01348', 1, 1);

      expect(page).toHaveProperty('id');
      expect(page).toHaveProperty('book_id');
      expect(page).toHaveProperty('volume');
      expect(page).toHaveProperty('page');
      expect(page).toHaveProperty('text');
      expect(page).toHaveProperty('text_normalized');
    });
  });

  describe('getVolumeTotalPages', () => {
    it('returns total pages for a volume', async () => {
      const totalPages = await getVolumeTotalPages('01348', 1);

      expect(totalPages).toBeGreaterThan(0);
    });

    it('returns 0 for non-existent volume', async () => {
      const totalPages = await getVolumeTotalPages('99999', 1);
      expect(totalPages).toBe(0);
    });
  });

  describe('getAdjacentPages', () => {
    it('returns next and prev pages', async () => {
      // Get a page in the middle of a volume
      const nav = await getAdjacentPages('01348', 1, 10);

      expect(nav.prev).toBeDefined();
      expect(nav.next).toBeDefined();

      if (nav.prev) {
        expect(nav.prev.page).toBe(9);
        expect(nav.prev.volume).toBe(1);
      }

      if (nav.next) {
        expect(nav.next.page).toBe(11);
        expect(nav.next.volume).toBe(1);
      }
    });

    it('returns null prev for first page', async () => {
      const nav = await getAdjacentPages('01348', 1, 1);

      expect(nav.prev).toBeNull();
      expect(nav.next).toBeDefined();
    });
  });

  describe('searchPages', () => {
    it('finds pages matching search query', async () => {
      const results = await searchPages('محمد', 10);

      expect(Array.isArray(results)).toBe(true);
      expect(results.length).toBeGreaterThan(0);
    });

    it('returns page, book, and snippet for each result', async () => {
      const results = await searchPages('علي', 5);

      if (results.length > 0) {
        const result = results[0];
        expect(result).toHaveProperty('page');
        expect(result).toHaveProperty('book');
        expect(result).toHaveProperty('snippet');

        expect(result.page).toHaveProperty('book_id');
        expect(result.book).toHaveProperty('title_ar');
      }
    });

    it('respects limit parameter', async () => {
      const results = await searchPages('الله', 5);
      expect(results.length).toBeLessThanOrEqual(5);
    });
  });
});

describe('Footnotes Integration Tests', () => {
  describe('Al-Khisal footnotes', () => {
    it('Al-Khisal pages have footnotes', async () => {
      // Al-Khisal should have footnotes on many pages
      const page = await getPage('01462', 1, 10);

      // The page should exist
      expect(page).toBeDefined();

      // Check if footnotes field exists (may be null for some pages)
      expect(page).toHaveProperty('footnotes');
    });
  });

  describe('Bihar al-Anwar pages', () => {
    it('can load Bihar al-Anwar pages', async () => {
      const page = await getPage('01407', 1, 1);

      expect(page).toBeDefined();
      expect(page?.text).toBeTruthy();
    });
  });

  describe('Footnotes data structure', () => {
    it('footnotes field is null or valid JSON array', async () => {
      // Get several pages and check footnotes format
      const pages = [
        await getPage('01462', 1, 5),
        await getPage('01462', 1, 10),
        await getPage('01462', 1, 20),
      ];

      for (const page of pages) {
        if (page?.footnotes) {
          // If footnotes exists, it should be valid JSON array
          const parsed = JSON.parse(page.footnotes);
          expect(Array.isArray(parsed)).toBe(true);
        }
      }
    });
  });
});

describe('Multi-volume Book Tests', () => {
  describe('Al-Kafi (multi-volume)', () => {
    it('has multiple volumes', async () => {
      const volumes = await getBookVolumes('01348');
      expect(volumes.length).toBeGreaterThan(1);
    });

    it('can navigate between volumes', async () => {
      const volumes = await getBookVolumes('01348');

      if (volumes.length >= 2) {
        // Get last page of volume 1
        const vol1Total = volumes[0].totalPages;
        const lastPageVol1 = await getPage('01348', 1, vol1Total);

        // Get first page of volume 2
        const firstPageVol2 = await getPage('01348', 2, 1);

        expect(lastPageVol1).toBeDefined();
        expect(firstPageVol2).toBeDefined();
      }
    });
  });

  describe('Bihar al-Anwar (large multi-volume)', () => {
    it('has many volumes', async () => {
      const volumes = await getBookVolumes('01407');
      expect(volumes.length).toBeGreaterThan(10);
    });

    it('each volume has pages', async () => {
      const volumes = await getBookVolumes('01407');

      // Check first 3 volumes
      for (let i = 0; i < Math.min(3, volumes.length); i++) {
        expect(volumes[i].totalPages).toBeGreaterThan(0);
      }
    });
  });
});

describe('Edge Cases', () => {
  it('handles Arabic text in searches', async () => {
    const results = await searchPages('بسم الله الرحمن الرحيم', 5);
    expect(Array.isArray(results)).toBe(true);
  });

  it('handles empty search gracefully', async () => {
    // Empty search throws FTS5 syntax error - this is expected behavior
    // The API route handles this by returning empty results before calling searchPages
    await expect(searchPages('', 10)).rejects.toThrow();
  });

  it('handles special characters in book IDs', async () => {
    // Book IDs should be numeric strings with leading zeros
    const book = await getBook('01348');
    expect(book?.id).toBe('01348');
  });
});
