import { connectDB } from '@/lib/db';
import { Query } from '@/models/Query';
import { NextRequest, NextResponse } from 'next/server';

export async function GET(request: NextRequest) {
  try {
    await connectDB();

    const userId = request.nextUrl.searchParams.get('userId');

    if (!userId) {
      return NextResponse.json({ error: 'User ID is required' }, { status: 400 });
    }

    const queries = await Query.find({ userId })
      .sort({ createdAt: -1 })
      .limit(50);

    return NextResponse.json(queries);
  } catch (error) {
    console.error('History API error:', error);
    return NextResponse.json({ error: 'Failed to fetch history' }, { status: 500 });
  }
}

export async function DELETE(request: NextRequest) {
  try {
    await connectDB();

    const { queryId } = await request.json();

    if (!queryId) {
      return NextResponse.json({ error: 'Query ID is required' }, { status: 400 });
    }

    await Query.findByIdAndDelete(queryId);

    return NextResponse.json({ message: 'Query deleted successfully' });
  } catch (error) {
    console.error('History delete error:', error);
    return NextResponse.json({ error: 'Failed to delete query' }, { status: 500 });
  }
}
