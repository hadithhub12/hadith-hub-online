import { NextResponse } from 'next/server';
import { getPage, getBook, getAdjacentPages, getVolumeTotalPages } from '@/lib/db';

export const dynamic = 'force-dynamic';

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

    const pageData = await getPage(bookId, volume, page);

    if (!pageData) {
      return NextResponse.json(
        { error: 'Page not found' },
        { status: 404 }
      );
    }

    const book = await getBook(bookId);
    const navigation = await getAdjacentPages(bookId, volume, page);
    const totalPages = await getVolumeTotalPages(bookId, volume);

    return NextResponse.json({
      page: pageData,
      book,
      navigation,
      totalPages,
    });
  } catch (error) {
    console.error('Error fetching page:', error);
    return NextResponse.json(
      { error: 'Failed to fetch page' },
      { status: 500 }
    );
  }
}
