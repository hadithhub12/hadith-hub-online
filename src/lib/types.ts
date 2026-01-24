export interface Book {
  id: string;
  title_ar: string;
  title_en: string;
  author_ar: string;
  author_en: string;
  sect: string;
  volumes: number;
  total_pages: number;
}

export interface Page {
  id: number;
  book_id: string;
  volume: number;
  page: number;
  text: string;
  text_normalized: string;
}

export interface SearchResult {
  bookId: string;
  bookTitleAr: string;
  bookTitleEn: string;
  volume: number;
  page: number;
  snippet: string;
  shareUrl: string;
}

export interface SearchResponse {
  query: string;
  total: number;
  results: SearchResult[];
}

export interface QuranReference {
  surah: number;
  ayah: number;
  ayahEnd?: number;
  display: string;
  url: string;
}

export type Language = 'ar' | 'en';
