import { connectDB } from '@/lib/db';
import { Post } from '@/models/Post';
import { NextRequest, NextResponse } from 'next/server';

type Params = { params: Promise<{ id: string }> };

export async function DELETE(request: NextRequest, { params }: Params) {
  try {
    await connectDB();
    const { id } = await params;
    const userId = request.nextUrl.searchParams.get('userId') || undefined;

    const post = await Post.findById(id);
    if (!post) {
      return NextResponse.json({ error: 'Post not found' }, { status: 404 });
    }

    // Integrates with existing userId-style auth flow when available.
    if (post.userId && userId && post.userId !== userId) {
      return NextResponse.json({ error: 'Not authorized to delete this post' }, { status: 403 });
    }

    await Post.findByIdAndDelete(id);
    return NextResponse.json({ message: 'Post deleted' });
  } catch (error) {
    console.error('Post DELETE error:', error);
    return NextResponse.json({ error: 'Failed to delete post' }, { status: 500 });
  }
}
