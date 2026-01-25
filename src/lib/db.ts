import { createClient, Client } from '@libsql/client';
import Database from 'better-sqlite3';
import path from 'path';
import type { Book, Page } from './types';

// Environment variables for Turso connection
const TURSO_DATABASE_URL = process.env.TURSO_DATABASE_URL;
const TURSO_AUTH_TOKEN = process.env.TURSO_AUTH_TOKEN;

// Local database path for development
const DB_PATH = path.join(process.cwd(), 'src', 'data', 'hadith.db');

// Use Turso in production, local SQLite in development
const useTurso = !!TURSO_DATABASE_URL;

let tursoClient: Client | null = null;
let sqliteDb: Database.Database | null = null;

function getTursoClient(): Client {
  if (!tursoClient) {
    tursoClient = createClient({
      url: TURSO_DATABASE_URL!,
      authToken: TURSO_AUTH_TOKEN,
    });
  }
  return tursoClient;
}

function getSqliteDb(): Database.Database {
  if (!sqliteDb) {
    sqliteDb = new Database(DB_PATH, { readonly: true });
    sqliteDb.pragma('journal_mode = WAL');
  }
  return sqliteDb;
}

export async function getAllBooks(): Promise<Book[]> {
  if (useTurso) {
    const client = getTursoClient();
    const result = await client.execute(`
      SELECT id, title_ar, title_en, author_ar, author_en, sect, volumes, total_pages
      FROM books
      ORDER BY title_ar
    `);
    return result.rows as unknown as Book[];
  } else {
    const db = getSqliteDb();
    return db.prepare(`
      SELECT id, title_ar, title_en, author_ar, author_en, sect, volumes, total_pages
      FROM books
      ORDER BY title_ar
    `).all() as Book[];
  }
}

export async function getBook(id: string): Promise<Book | undefined> {
  if (useTurso) {
    const client = getTursoClient();
    const result = await client.execute({
      sql: `SELECT id, title_ar, title_en, author_ar, author_en, sect, volumes, total_pages
            FROM books WHERE id = ?`,
      args: [id],
    });
    return result.rows[0] as unknown as Book | undefined;
  } else {
    const db = getSqliteDb();
    return db.prepare(`
      SELECT id, title_ar, title_en, author_ar, author_en, sect, volumes, total_pages
      FROM books
      WHERE id = ?
    `).get(id) as Book | undefined;
  }
}

export async function getBookVolumes(bookId: string): Promise<{ volume: number; totalPages: number }[]> {
  if (useTurso) {
    const client = getTursoClient();
    const result = await client.execute({
      sql: `SELECT volume, MAX(page) as totalPages
            FROM pages
            WHERE book_id = ?
            GROUP BY volume
            ORDER BY volume`,
      args: [bookId],
    });
    return result.rows.map(row => ({
      volume: row.volume as number,
      totalPages: row.totalPages as number,
    }));
  } else {
    const db = getSqliteDb();
    return db.prepare(`
      SELECT volume, MAX(page) as totalPages
      FROM pages
      WHERE book_id = ?
      GROUP BY volume
      ORDER BY volume
    `).all(bookId) as { volume: number; totalPages: number }[];
  }
}

export async function getVolumeTotalPages(bookId: string, volume: number): Promise<number> {
  if (useTurso) {
    const client = getTursoClient();
    const result = await client.execute({
      sql: `SELECT MAX(page) as totalPages FROM pages WHERE book_id = ? AND volume = ?`,
      args: [bookId, volume],
    });
    return (result.rows[0]?.totalPages as number) || 0;
  } else {
    const db = getSqliteDb();
    const result = db.prepare(`
      SELECT MAX(page) as totalPages FROM pages WHERE book_id = ? AND volume = ?
    `).get(bookId, volume) as { totalPages: number } | undefined;
    return result?.totalPages || 0;
  }
}

export async function getPage(bookId: string, volume: number, page: number): Promise<Page | undefined> {
  if (useTurso) {
    const client = getTursoClient();
    // Try with footnotes column first, fall back to without if column doesn't exist
    try {
      const result = await client.execute({
        sql: `SELECT id, book_id, volume, page, text, text_normalized, footnotes
              FROM pages
              WHERE book_id = ? AND volume = ? AND page = ?`,
        args: [bookId, volume, page],
      });
      return result.rows[0] as unknown as Page | undefined;
    } catch (error) {
      // Fallback: footnotes column might not exist yet in Turso
      const result = await client.execute({
        sql: `SELECT id, book_id, volume, page, text, text_normalized, NULL as footnotes
              FROM pages
              WHERE book_id = ? AND volume = ? AND page = ?`,
        args: [bookId, volume, page],
      });
      return result.rows[0] as unknown as Page | undefined;
    }
  } else {
    const db = getSqliteDb();
    return db.prepare(`
      SELECT id, book_id, volume, page, text, text_normalized, footnotes
      FROM pages
      WHERE book_id = ? AND volume = ? AND page = ?
    `).get(bookId, volume, page) as Page | undefined;
  }
}

export async function searchPages(query: string, limit: number = 100): Promise<{
  page: Page;
  book: Book;
  snippet: string;
}[]> {
  if (useTurso) {
    const client = getTursoClient();
    const result = await client.execute({
      sql: `SELECT
              p.id, p.book_id, p.volume, p.page, p.text, p.text_normalized,
              b.id as bid, b.title_ar, b.title_en, b.author_ar, b.author_en, b.sect, b.volumes, b.total_pages,
              snippet(pages_fts, 0, '<mark>', '</mark>', '...', 32) as snippet
            FROM pages_fts
            JOIN pages p ON pages_fts.rowid = p.id
            JOIN books b ON p.book_id = b.id
            WHERE pages_fts MATCH ?
            ORDER BY rank
            LIMIT ?`,
      args: [query, limit],
    });

    return result.rows.map((row) => ({
      page: {
        id: row.id as number,
        book_id: row.book_id as string,
        volume: row.volume as number,
        page: row.page as number,
        text: row.text as string,
        text_normalized: row.text_normalized as string,
      },
      book: {
        id: row.bid as string,
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
  } else {
    const db = getSqliteDb();
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
}

export async function getAdjacentPages(bookId: string, volume: number, currentPage: number): Promise<{
  prev: { volume: number; page: number } | null;
  next: { volume: number; page: number } | null;
}> {
  if (useTurso) {
    const client = getTursoClient();

    const prevResult = await client.execute({
      sql: `SELECT volume, page FROM pages
            WHERE book_id = ? AND (volume < ? OR (volume = ? AND page < ?))
            ORDER BY volume DESC, page DESC
            LIMIT 1`,
      args: [bookId, volume, volume, currentPage],
    });

    const nextResult = await client.execute({
      sql: `SELECT volume, page FROM pages
            WHERE book_id = ? AND (volume > ? OR (volume = ? AND page > ?))
            ORDER BY volume ASC, page ASC
            LIMIT 1`,
      args: [bookId, volume, volume, currentPage],
    });

    return {
      prev: prevResult.rows[0] ? { volume: prevResult.rows[0].volume as number, page: prevResult.rows[0].page as number } : null,
      next: nextResult.rows[0] ? { volume: nextResult.rows[0].volume as number, page: nextResult.rows[0].page as number } : null,
    };
  } else {
    const db = getSqliteDb();

    const prev = db.prepare(`
      SELECT volume, page FROM pages
      WHERE book_id = ? AND (volume < ? OR (volume = ? AND page < ?))
      ORDER BY volume DESC, page DESC
      LIMIT 1
    `).get(bookId, volume, volume, currentPage) as { volume: number; page: number } | undefined;

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
}
