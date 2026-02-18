import { connectDB } from '@/lib/db';
import { Product } from '@/models/Product';
import { NextRequest, NextResponse } from 'next/server';

export async function GET(request: NextRequest) {
  try {
    await connectDB();

    const category = request.nextUrl.searchParams.get('category');
    const query = category ? { category } : {};

    const products = await Product.find(query).sort({ createdAt: -1 });

    return NextResponse.json(products);
  } catch (error) {
    console.error('Products GET error:', error);
    return NextResponse.json({ error: 'Failed to fetch products' }, { status: 500 });
  }
}
