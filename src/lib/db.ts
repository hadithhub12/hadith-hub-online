import Database from 'better-sqlite3';
import path from 'path';
import type { Book, Page } from './types';

// Database path - stored in src/data/hadith.db
const DB_PATH = path.join(process.cwd(), 'src', 'data', 'hadith.db');

let db: Database.Database | null = null;

function getDb(): Database.Database {
  if (!db) {
    db = new Database(DB_PATH, { readonly: true });
    db.pragma('journal_mode = WAL');
  }
  return db;
}

export function getAllBooks(): Book[] {
  const db = getDb();
  return db.prepare(`
    SELECT id, title_ar, title_en, author_ar, author_en, sect, volumes, total_pages
    FROM books
    ORDER BY title_ar
  `).all() as Book[];
}

export function getBook(id: string): Book | undefined {
  const db = getDb();
  return db.prepare(`
    SELECT id, title_ar, title_en, author_ar, author_en, sect, volumes, total_pages
    FROM books
    WHERE id = ?
  `).get(id) as Book | undefined;
}

export function getBookVolumes(bookId: string): { volume: number; totalPages: number }[] {
  const db = getDb();
  return db.prepare(`
    SELECT volume, MAX(page) as totalPages
    FROM pages
    WHERE book_id = ?
    GROUP BY volume
    ORDER BY volume
  `).all(bookId) as { volume: number; totalPages: number }[];
}

export function getPage(bookId: string, volume: number, page: number): Page | undefined {
  const db = getDb();
  return db.prepare(`
    SELECT id, book_id, volume, page, text, text_normalized
    FROM pages
    WHERE book_id = ? AND volume = ? AND page = ?
  `).get(bookId, volume, page) as Page | undefined;
}

export function searchPages(query: string, limit: number = 100): {
  page: Page;
  book: Book;
  snippet: string;
}[] {
  const db = getDb();

  // Use FTS5 for full-text search
  const results = db.prepare(`
    SELECT
      p.id, p.book_id, p.volume, p.page, p.text, p.text_normalized,
      b.id as book_id, b.title_ar, b.title_en, b.author_ar, b.author_en, b.sect, b.volumes, b.total_pages,
      snippet(pages_fts, 0, '<mark>', '</mark>', '...', 32) as snippet
    FROM pages_fts
    JOIN pages p ON pages_fts.rowid = p.id
    JOIN books b ON p.book_id = b.id
    WHERE pages_fts MATCH ?
    ORDER BY rank
    LIMIT ?
  `).all(query, limit);

  return (results as Record<string, unknown>[]).map((row) => ({
    page: {
      id: row.id as number,
      book_id: row.book_id as string,
      volume: row.volume as number,
      page: row.page as number,
      text: row.text as string,
      text_normalized: row.text_normalized as string,
    },
    book: {
      id: row.book_id as string,
      title_ar: row.title_ar as string,
      title_en: row.title_en as string,
      author_ar: row.author_ar as string,
      author_en: row.author_en as string,
      sect: row.sect as string,
      volumes: row.volumes as number,
      total_pages: row.total_pages as number,
    },
    snippet: row.snippet as string,
  }));
}

export function getAdjacentPages(bookId: string, volume: number, currentPage: number): {
  prev: { volume: number; page: number } | null;
  next: { volume: number; page: number } | null;
} {
  const db = getDb();

  // Get previous page (could be previous volume)
  const prev = db.prepare(`
    SELECT volume, page FROM pages
    WHERE book_id = ? AND (volume < ? OR (volume = ? AND page < ?))
    ORDER BY volume DESC, page DESC
    LIMIT 1
  `).get(bookId, volume, volume, currentPage) as { volume: number; page: number } | undefined;

  // Get next page (could be next volume)
  const next = db.prepare(`
    SELECT volume, page FROM pages
    WHERE book_id = ? AND (volume > ? OR (volume = ? AND page > ?))
    ORDER BY volume ASC, page ASC
    LIMIT 1
  `).get(bookId, volume, volume, currentPage) as { volume: number; page: number } | undefined;

  return {
    prev: prev || null,
    next: next || null,
  };
}
