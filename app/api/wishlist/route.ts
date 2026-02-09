import { connectDB } from '@/lib/db';
import { Wishlist } from '@/models/Wishlist';
import { NextRequest, NextResponse } from 'next/server';

export async function GET(request: NextRequest) {
  try {
    await connectDB();

    const userId = request.nextUrl.searchParams.get('userId');

    if (!userId) {
      return NextResponse.json({ error: 'User ID is required' }, { status: 400 });
    }

    const wishlistItems = await Wishlist.find({ userId })
      .populate('productId')
      .sort({ createdAt: -1 });

    return NextResponse.json(wishlistItems);
  } catch (error) {
    console.error('Wishlist GET error:', error);
    return NextResponse.json({ error: 'Failed to fetch wishlist' }, { status: 500 });
  }
}

export async function POST(request: NextRequest) {
  try {
    await connectDB();

    const { userId, productId } = await request.json();

    if (!userId || !productId) {
      return NextResponse.json({ error: 'User ID and Product ID are required' }, { status: 400 });
    }

    // Check if item already in wishlist
    const existing = await Wishlist.findOne({ userId, productId });
    if (existing) {
      return NextResponse.json({ error: 'Item already in wishlist' }, { status: 400 });
    }

    const wishlistItem = new Wishlist({ userId, productId });
    await wishlistItem.save();

    return NextResponse.json(wishlistItem, { status: 201 });
  } catch (error) {
    console.error('Wishlist POST error:', error);
    return NextResponse.json({ error: 'Failed to add to wishlist' }, { status: 500 });
  }
}

export async function DELETE(request: NextRequest) {
  try {
    await connectDB();

    const { wishlistId } = await request.json();

    if (!wishlistId) {
      return NextResponse.json({ error: 'Wishlist ID is required' }, { status: 400 });
    }

    await Wishlist.findByIdAndDelete(wishlistId);

    return NextResponse.json({ message: 'Item removed from wishlist' });
  } catch (error) {
    console.error('Wishlist DELETE error:', error);
    return NextResponse.json({ error: 'Failed to remove from wishlist' }, { status: 500 });
  }
}
