import { NextResponse } from 'next/server';
import { getAllBooks } from '@/lib/db';

// Books list rarely changes - cache for 1 hour
export const revalidate = 3600;

export async function GET() {
  try {
    const books = await getAllBooks();
    return NextResponse.json(
      { books, total: books.length },
      {
        headers: {
          'Cache-Control': 'public, s-maxage=3600, stale-while-revalidate=86400',
        },
      }
    );
  } catch (error) {
    console.error('Error fetching books:', error);
    return NextResponse.json(
      { error: 'Failed to fetch books' },
      { status: 500 }
    );
  }
}
