import { connectDB } from '@/lib/db';
import { Product } from '@/models/Product';
import { NextRequest, NextResponse } from 'next/server';

export async function POST(request: NextRequest) {
  try {
    await connectDB();

    const { productLink, budget, fabric, occasion } = await request.json();

    if (!productLink) {
      return NextResponse.json({ error: 'Product link is required' }, { status: 400 });
    }

    // Placeholder: In production, scrape product data and analyze with AI
    const analysisResult = {
      productName: 'Premium Cotton Shirt',
      price: 1299,
      fabric: fabric || 'Cotton',
      category: 'Shirts',
      sourceLink: productLink,
      comfortLevel: 'High',
      bestFor: occasion || 'Casual',
      budgetScore: budget ? Math.min(100, (budget / 1299) * 100) : 85,
      verdict: 'Excellent choice! Great quality and comfortable fit.',
      recommendation: 'This product is perfect for your needs. Consider comparing with similar items.',
    };

    // Optionally save to database
    const product = new Product({
      title: analysisResult.productName,
      price: analysisResult.price,
      fabric: analysisResult.fabric,
      category: analysisResult.category,
      sourceLink: productLink,
    });

    await product.save();

    return NextResponse.json(analysisResult);
  } catch (error) {
    console.error('Analyze API error:', error);
    const message =
      error instanceof Error ? error.message : 'Failed to analyze product';
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
