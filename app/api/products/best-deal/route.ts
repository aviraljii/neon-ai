import { connectDB } from '@/lib/db';
import { Product } from '@/models/Product';
import type { IProductPlatform } from '@/models/Product';
import { NextRequest, NextResponse } from 'next/server';

export async function GET(request: NextRequest) {
  try {
    await connectDB();

    const productId = request.nextUrl.searchParams.get('productId');

    if (!productId) {
      return NextResponse.json({ error: 'productId is required' }, { status: 400 });
    }

    const product = await Product.findById(productId);
    if (!product) {
      return NextResponse.json({ error: 'Product not found' }, { status: 404 });
    }

    const platforms = (product.platforms || []) as IProductPlatform[];
    if (!platforms.length) {
      return NextResponse.json(
        { error: 'No platform pricing available for this product' },
        { status: 404 }
      );
    }

    const cheapestPlatform = platforms.reduce((best: IProductPlatform, current: IProductPlatform) =>
      current.price < best.price ? current : best
    );

    const bestRatedPlatform = platforms.reduce((best: IProductPlatform, current: IProductPlatform) => {
      if (current.rating > best.rating) {
        return current;
      }

      // Tie-breaker: lower price wins if ratings are equal.
      if (current.rating === best.rating && current.price < best.price) {
        return current;
      }

      return best;
    });

    return NextResponse.json({
      productId: product._id,
      productName: product.name || product.title || null,
      cheapestPlatform,
      bestRatedPlatform,
    });
  } catch (error) {
    console.error('Best deal GET error:', error);
    return NextResponse.json({ error: 'Failed to fetch best deal' }, { status: 500 });
  }
}
