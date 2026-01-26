import { NextResponse } from 'next/server';
import { getPage, getBook, getAdjacentPages, getVolumeTotalPages } from '@/lib/db';

// Allow caching for page content - revalidate every hour
export const revalidate = 3600;

export async function GET(
  request: Request,
  { params }: { params: Promise<{ bookId: string; volume: string; page: string }> }
) {
  try {
    const { bookId, volume: volumeStr, page: pageStr } = await params;
    const volume = parseInt(volumeStr, 10);
    const page = parseInt(pageStr, 10);

    if (isNaN(volume) || isNaN(page)) {
      return NextResponse.json(
        { error: 'Invalid volume or page number' },
        { status: 400 }
      );
    }

    // Parallelize all database queries for better performance
    const [pageData, book, navigation, totalPages] = await Promise.all([
      getPage(bookId, volume, page),
      getBook(bookId),
      getAdjacentPages(bookId, volume, page),
      getVolumeTotalPages(bookId, volume),
    ]);

    if (!pageData) {
      return NextResponse.json(
        { error: 'Page not found' },
        { status: 404 }
      );
    }

    return NextResponse.json(
      {
        page: pageData,
        book,
        navigation,
        totalPages,
      },
      {
        headers: {
          'Cache-Control': 'public, s-maxage=3600, stale-while-revalidate=86400',
        },
      }
    );
  } catch (error) {
    console.error('Error fetching page:', error);
    return NextResponse.json(
      { error: 'Failed to fetch page' },
      { status: 500 }
    );
  }
}
