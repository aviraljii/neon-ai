import { connectDB } from '@/lib/db';
import { Product } from '@/models/Product';
import { NextRequest, NextResponse } from 'next/server';

function escapeRegex(input: string): string {
  return input.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
}

async function extractKeywordsFromImage(dataUrl: string): Promise<string[]> {
  const apiKey = process.env.OPENAI_API_KEY;
  if (!apiKey) {
    throw new Error('OPENAI_API_KEY is required for image search');
  }

  const response = await fetch('https://api.openai.com/v1/chat/completions', {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      Authorization: `Bearer ${apiKey}`,
    },
    body: JSON.stringify({
      model: 'gpt-4o-mini',
      messages: [
        {
          role: 'system',
          content:
            'Extract fashion search keywords from clothing images. Return only valid JSON: {"keywords":["..."]}.',
        },
        {
          role: 'user',
          content: [
            { type: 'text', text: 'Extract 5-8 short shopping keywords from this clothing image.' },
            { type: 'image_url', image_url: { url: dataUrl } },
          ],
        },
      ],
      temperature: 0.2,
      max_tokens: 120,
      response_format: { type: 'json_object' },
    }),
  });

  if (!response.ok) {
    const text = await response.text();
    throw new Error(`OpenAI vision request failed: ${response.status} ${text.slice(0, 200)}`);
  }

  const data = await response.json();
  const content = data?.choices?.[0]?.message?.content;
  if (!content) return [];

  try {
    const parsed = JSON.parse(content);
    const keywords = Array.isArray(parsed?.keywords) ? parsed.keywords : [];
    return keywords
      .map((k: unknown) => (typeof k === 'string' ? k.trim() : ''))
      .filter(Boolean)
      .slice(0, 8);
  } catch {
    return [];
  }
}

export async function POST(request: NextRequest) {
  try {
    await connectDB();
    const formData = await request.formData();
    const imageFile = formData.get('image');

    if (!(imageFile instanceof File)) {
      return NextResponse.json({ error: 'image file is required' }, { status: 400 });
    }

    if (!imageFile.type.startsWith('image/')) {
      return NextResponse.json({ error: 'Only image files are allowed' }, { status: 400 });
    }

    if (imageFile.size > 5 * 1024 * 1024) {
      return NextResponse.json({ error: 'Image size must be 5MB or less' }, { status: 400 });
    }

    const bytes = await imageFile.arrayBuffer();
    const base64 = Buffer.from(bytes).toString('base64');
    const dataUrl = `data:${imageFile.type};base64,${base64}`;

    const keywords = await extractKeywordsFromImage(dataUrl);
    if (!keywords.length) {
      return NextResponse.json({ keywords: [], products: [] });
    }

    const regexQueries = keywords.map((keyword) => new RegExp(escapeRegex(keyword), 'i'));

    const products = await Product.find({
      $or: [
        ...regexQueries.map((regex) => ({ name: regex })),
        ...regexQueries.map((regex) => ({ title: regex })),
        ...regexQueries.map((regex) => ({ description: regex })),
        ...regexQueries.map((regex) => ({ category: regex })),
        ...regexQueries.map((regex) => ({ fabric: regex })),
      ],
    })
      .sort({ createdAt: -1 })
      .limit(30);

    return NextResponse.json({
      keywords,
      products,
    });
  } catch (error) {
    console.error('Image search API error:', error);
    const message = error instanceof Error ? error.message : 'Failed image search';
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
