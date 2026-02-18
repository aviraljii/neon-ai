import { connectDB } from '@/lib/db';
import { Click } from '@/models/Click';
import { Product } from '@/models/Product';
import type { IProductPlatform } from '@/models/Product';
import { NextRequest, NextResponse } from 'next/server';

export async function GET(request: NextRequest) {
  try {
    const productId = request.nextUrl.searchParams.get('productId');
    const platform = request.nextUrl.searchParams.get('platform');
    const affiliateLinkParam = request.nextUrl.searchParams.get('affiliateLink');

    if (!productId || !platform) {
      return NextResponse.json(
        { error: 'productId and platform are required' },
        { status: 400 }
      );
    }

    await connectDB();

    let redirectUrl = affiliateLinkParam;

    // If frontend does not pass affiliate link, derive it from product platform data.
    if (!redirectUrl) {
      try {
        const product = await Product.findById(productId).select('platforms sourceLink');
        if (product) {
          const match = ((product.platforms || []) as IProductPlatform[]).find(
            (p: IProductPlatform) => p.platformName.toLowerCase() === platform.toLowerCase()
          );
          redirectUrl = match?.affiliateLink || product.sourceLink || null;
        }
      } catch {
        // Ignore cast errors and rely on provided affiliateLink.
      }
    }

    if (!redirectUrl) {
      return NextResponse.json(
        { error: 'Affiliate link not found for selected platform' },
        { status: 404 }
      );
    }

    let destination: URL;
    try {
      destination = new URL(redirectUrl);
    } catch {
      return NextResponse.json({ error: 'Invalid affiliate link' }, { status: 400 });
    }

    await Click.create({
      productId,
      platform,
      timestamp: new Date(),
    });

    return NextResponse.redirect(destination);
  } catch (error) {
    console.error('Affiliate click tracking error:', error);
    return NextResponse.json(
      { error: 'Failed to track click and redirect' },
      { status: 500 }
    );
  }
}
