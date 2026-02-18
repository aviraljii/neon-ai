import { connectDB } from '@/lib/db';
import { Product, IProductPlatform } from '@/models/Product';
import { NextRequest, NextResponse } from 'next/server';

interface RecommendationInput {
  query: string;
}

function buildSearchRegex(query: string): RegExp {
  return new RegExp(query.trim().replace(/[.*+?^${}()|[\]\\]/g, '\\$&'), 'i');
}

function pickBestPlatform(platforms: IProductPlatform[]) {
  const cheapest = platforms.reduce((best, p) => (p.price < best.price ? p : best));
  const bestRated = platforms.reduce((best, p) => {
    if (p.rating > best.rating) return p;
    if (p.rating === best.rating && p.price < best.price) return p;
    return best;
  });

  const weighted = platforms.reduce((best, p) => {
    const score = p.rating * 20 - p.price / 100;
    const bestScore = best.rating * 20 - best.price / 100;
    return score > bestScore ? p : best;
  });

  return { cheapest, bestRated, weighted };
}

async function getOpenAiExplanation(
  productName: string,
  platform: IProductPlatform,
  cheapest: IProductPlatform,
  bestRated: IProductPlatform
): Promise<string | null> {
  const apiKey = process.env.OPENAI_API_KEY;
  if (!apiKey) return null;

  const prompt = `You are a shopping assistant. Give a short recommendation in 2-3 sentences.
Product: ${productName}
Selected platform: ${platform.platformName} | price ${platform.price} | rating ${platform.rating}
Cheapest platform: ${cheapest.platformName} | price ${cheapest.price} | rating ${cheapest.rating}
Best rated platform: ${bestRated.platformName} | price ${bestRated.price} | rating ${bestRated.rating}
Explain price vs rating tradeoff in plain language.`;

  const response = await fetch('https://api.openai.com/v1/chat/completions', {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      Authorization: `Bearer ${apiKey}`,
    },
    body: JSON.stringify({
      model: 'gpt-4o-mini',
      messages: [
        { role: 'system', content: 'You recommend products based on value and trust.' },
        { role: 'user', content: prompt },
      ],
      temperature: 0.4,
      max_tokens: 140,
    }),
  });

  if (!response.ok) {
    const errorText = await response.text();
    throw new Error(`OpenAI request failed: ${response.status} ${errorText.slice(0, 200)}`);
  }

  const data = await response.json();
  return data?.choices?.[0]?.message?.content?.trim() || null;
}

export async function POST(request: NextRequest) {
  try {
    await connectDB();
    const body = (await request.json()) as RecommendationInput;
    const query = body.query?.trim();

    if (!query) {
      return NextResponse.json({ error: 'query is required' }, { status: 400 });
    }

    const regex = buildSearchRegex(query);
    const products = await Product.find({
      $or: [
        { name: regex },
        { title: regex },
        { description: regex },
        { category: regex },
        { fabric: regex },
      ],
    })
      .sort({ createdAt: -1 })
      .limit(20);

    const withPlatforms = products.filter((p) => (p.platforms || []).length > 0);
    if (!withPlatforms.length) {
      return NextResponse.json(
        { error: 'No matching products with platform prices found' },
        { status: 404 }
      );
    }

    const evaluated = withPlatforms.map((p) => {
      const platforms = p.platforms as IProductPlatform[];
      const best = pickBestPlatform(platforms);
      const score = best.weighted.rating * 20 - best.weighted.price / 100;

      return {
        productId: String(p._id),
        productName: p.name || p.title || 'Unnamed Product',
        category: p.category,
        cheapestPlatform: best.cheapest,
        bestRatedPlatform: best.bestRated,
        recommendedPlatform: best.weighted,
        score,
      };
    });

    evaluated.sort((a, b) => b.score - a.score);
    const top = evaluated[0];

    let explanation =
      `${top.recommendedPlatform.platformName} looks like the best overall value for ` +
      `${top.productName} because it balances price (${top.recommendedPlatform.price}) ` +
      `with strong rating (${top.recommendedPlatform.rating}/5).`;

    try {
      const aiText = await getOpenAiExplanation(
        top.productName,
        top.recommendedPlatform,
        top.cheapestPlatform,
        top.bestRatedPlatform
      );
      if (aiText) explanation = aiText;
    } catch (e) {
      console.error('OpenAI recommendation fallback:', e);
    }

    return NextResponse.json({
      query,
      recommendation: top,
      explanation,
      alternatives: evaluated.slice(1, 4),
    });
  } catch (error) {
    console.error('Recommendation API error:', error);
    return NextResponse.json({ error: 'Failed to generate recommendation' }, { status: 500 });
  }
}
