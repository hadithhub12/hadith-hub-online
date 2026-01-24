import { NextResponse } from 'next/server';
import { getAllBooks } from '@/lib/db';

export const dynamic = 'force-dynamic';

export async function GET() {
  try {
    const books = getAllBooks();
    return NextResponse.json({ books, total: books.length });
  } catch (error) {
    console.error('Error fetching books:', error);
    return NextResponse.json(
      { error: 'Failed to fetch books' },
      { status: 500 }
    );
  }
}
