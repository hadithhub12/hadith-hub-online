import { NextResponse } from 'next/server';
import { getBook, getBookVolumes } from '@/lib/db';

// Book metadata rarely changes - cache for 1 hour
export const revalidate = 3600;

export async function GET(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;

    // Parallelize database queries
    const [book, volumes] = await Promise.all([
      getBook(id),
      getBookVolumes(id),
    ]);

    if (!book) {
      return NextResponse.json(
        { error: 'Book not found' },
        { status: 404 }
      );
    }

    return NextResponse.json(
      { book, volumes },
      {
        headers: {
          'Cache-Control': 'public, s-maxage=3600, stale-while-revalidate=86400',
        },
      }
    );
  } catch (error) {
    console.error('Error fetching book:', error);
    return NextResponse.json(
      { error: 'Failed to fetch book' },
      { status: 500 }
    );
  }
}
