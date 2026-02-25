import { connectDB } from '@/lib/db';
import { Query } from '@/models/Query';
import { NextRequest, NextResponse } from 'next/server';
import { createHash } from 'crypto';

type ChatHistoryMessage = { role: string; content: string };
type FashionAudience = 'men' | 'women' | 'kids' | 'general';
type LanguageStyle = 'english' | 'hinglish' | 'hindi';
type IntentMode = 'product_link' | 'fashion_suggestion' | 'education' | 'friendly_chat';

const USER_COOLDOWN_MS = 3_000;
const CACHE_TTL_MS = 24 * 60 * 60 * 1000;
const MAX_HISTORY_MESSAGES = 6;
const MAX_MESSAGE_CHARS = 500;

const FIRST_RESPONSE_GREETING =
  "\u2728 Hey! I\u2019m Neon \u2014 your AI Shopping Assistant. Send me a fashion product link or tell me what you're looking for, and I\u2019ll help you pick the best option.";

const ICONS = {
  sparkles: '\u2728',
  search: '\ud83d\udd0d',
  style: '\ud83d\udca1',
  verdict: '\ud83c\udfaf',
  cart: '\ud83d\uded2',
  palette: '\ud83c\udfa8',
  growth: '\ud83d\udce2',
  question: '\u2753',
  point: '\ud83d\udc49',
} as const;

const responseCache = new Map<string, { response: string; expiresAt: number }>();
const userLastRequestAt = new Map<string, number>();

export async function POST(request: NextRequest) {
  try {
    const { userId, message, chatHistory = [] } = await request.json();

    if (!message || typeof message !== 'string') {
      return NextResponse.json({ error: 'Message is required', success: false }, { status: 400 });
    }

    const userMessage = message.trim();
    if (!userMessage) {
      return NextResponse.json({ error: 'Message cannot be empty', success: false }, { status: 400 });
    }

    const optimizedHistory = optimizeChatHistory(chatHistory);
    const isFirstTurn = optimizedHistory.length === 0;
    const identity = getRequestIdentity(request, userId);

    const cooldownReply = getCooldownReply(identity);
    if (cooldownReply) {
      return NextResponse.json({ response: cooldownReply, success: true, meta: { source: 'cooldown' } });
    }

    cleanupStaleMemory();

    const mode = detectIntentMode(userMessage);
    const cacheKey = hashMessage(`${isFirstTurn ? 'first' : 'next'}:${mode}:${userMessage}`);
    const cached = getCachedResponse(cacheKey);
    if (cached) {
      return NextResponse.json({ response: cached, success: true, meta: { source: 'cache' } });
    }

    const audience = detectAudience(userMessage);
    const language = detectLanguageStyle(userMessage);
    const modeResponse = buildModeResponse(mode, userMessage, audience, language);
    const finalResponse = applyFirstResponseGreeting(modeResponse, isFirstTurn);

    setCachedResponse(cacheKey, finalResponse);
    await persistQuery(userId, userMessage, finalResponse);

    return NextResponse.json({ response: finalResponse, success: true, meta: { source: mode } });
  } catch (error) {
    console.error('Chat API error:', error);
    const fallback = applyFirstResponseGreeting(buildFriendlyChatModeReply('hello', 'english'), true);
    return NextResponse.json({ response: fallback, success: true, meta: { source: 'safe-fallback' } });
  }
}

function buildModeResponse(
  mode: IntentMode,
  userMessage: string,
  audience: FashionAudience,
  language: LanguageStyle
): string {
  if (mode === 'product_link') return buildProductLinkModeReply(userMessage, audience);
  if (mode === 'fashion_suggestion') return buildFashionSuggestionModeReply(userMessage, audience);
  if (mode === 'education') return buildEducationModeReply(userMessage);
  return buildFriendlyChatModeReply(userMessage, language);
}

function detectIntentMode(userMessage: string): IntentMode {
  const text = userMessage.toLowerCase();
  if (isEducationIntent(text)) return 'education';
  if (isProductLinkIntent(userMessage, text)) return 'product_link';
  if (isFashionSuggestionIntent(text)) return 'fashion_suggestion';
  return 'friendly_chat';
}

function isEducationIntent(text: string): boolean {
  return /\b(affiliate|affiliate marketing|earn money|earning money|pinterest|linktree|branding|brand|promotion|promote|growth strategy|traffic|conversion|how it works|monetize|monetise)\b/.test(
    text
  );
}

function isProductLinkIntent(userMessage: string, lowered: string): boolean {
  const hasUrl = extractUrls(userMessage).length > 0;
  const hasCheckPhrase = /\b(check this|is this worth it|worth it|should i buy|review this|is this good|good option)\b/.test(
    lowered
  );
  return hasUrl || hasCheckPhrase || containsBrandAndProduct(lowered);
}

function containsBrandAndProduct(text: string): boolean {
  const brands = [
    'zara',
    'h&m',
    'hm',
    'uniqlo',
    'nike',
    'adidas',
    'puma',
    'levi',
    'levis',
    'myntra',
    'ajio',
    'roadster',
    'allen solly',
    'manyavar',
    'fabindia',
    'biba',
    'wrogn',
    'snitch',
    'rare rabbit',
    'uspolo',
    'u.s. polo',
    'louis philippe',
    'van heusen',
  ];

  const products = [
    'shirt',
    'tshirt',
    't-shirt',
    'tee',
    'jeans',
    'dress',
    'kurta',
    'kurti',
    'saree',
    'lehenga',
    'jacket',
    'hoodie',
    'top',
    'trouser',
    'pants',
    'sneaker',
    'shoes',
    'ethnic',
    'co-ord',
    'coord',
  ];

  const hasBrand = brands.some((brand) => text.includes(brand));
  const hasProduct = products.some((product) => text.includes(product));
  return hasBrand && hasProduct;
}

function isFashionSuggestionIntent(text: string): boolean {
  const hasSuggestionPhrase = /\b(show|suggest|recommend|trendy|trending|what should i wear|what to wear|outfit|style|look|for women|for men|for girls|for boys|for kids)\b/.test(
    text
  );
  const hasFashionItem = /\b(shirt|tshirt|t-shirt|tee|dress|kurta|kurti|saree|lehenga|jeans|trouser|hoodie|jacket|top|ethnic|streetwear|casual|formal|party wear)\b/.test(
    text
  );
  return hasSuggestionPhrase || hasFashionItem;
}

function buildProductLinkModeReply(userMessage: string, audience: FashionAudience): string {
  const urls = extractUrls(userMessage);
  const url = urls[0] ?? '';
  const lower = userMessage.toLowerCase();
  const platform = url ? inferPlatformFromUrl(url) : inferPlatformFromText(lower);
  const gender = inferGenderLabel(lower, audience);
  const itemType = inferProductTypeLabel(lower);
  const category = gender === 'General' ? itemType : `${gender} ${itemType}`;
  const styleType = inferStyleType(lower);
  const bestFor = inferBestFor(lower);
  const season = inferSeason(lower);
  const valueRating = inferValueRating(lower);
  const valueStars = formatValueStars(valueRating);
  const fabricNote = inferFabricNote(lower);
  const verdict = inferVerdict(valueRating, lower);

  return [
    `${ICONS.sparkles} Hello, I\u2019m Neon \u2014 your AI Shopping Assistant`,
    '',
    `${ICONS.search} Product Analysis`,
    `\u2022 Platform: ${platform}`,
    `\u2022 Category: ${category}`,
    `\u2022 Style: ${styleType}`,
    `\u2022 Best For: ${bestFor}`,
    `\u2022 Season: ${season}`,
    `\u2022 Value for Money: ${valueStars}`,
    '',
    `${ICONS.style} Styling Tip`,
    `\u2022 Pair with ${inferPairingTip(lower)}.`,
    `\u2022 Fabric check: ${fabricNote}.`,
    '',
    `${ICONS.verdict} Neon Verdict`,
    `${verdict.label} \u2014 ${verdict.reason}`,
    '',
    `${ICONS.cart} Quick Action`,
    'Check recent reviews, real-user photos, and return policy before checkout.',
    `${ICONS.point} Buy here: [affiliate link placeholder]`,
  ].join('\n');
}

function buildFashionSuggestionModeReply(userMessage: string, audience: FashionAudience): string {
  const lower = userMessage.toLowerCase();
  const gender = inferGenderLabel(lower, audience);
  const budget = inferBudget(userMessage);
  const trendIdeas = inferTrendingIdeas(lower, gender, budget);
  const pairingTips = inferPairingIdeas(lower, gender);
  const weatherFit = inferWeatherFit(lower);
  const followUp = inferSuggestionFollowUp(lower, budget);

  return [
    `${ICONS.sparkles} Hello, I\u2019m Neon \u2014 your AI Shopping Assistant`,
    '',
    `${ICONS.palette} Fashion Suggestions`,
    `\u2022 Audience: ${gender}`,
    `\u2022 Weather Fit: ${weatherFit}`,
    `\u2022 Budget Focus: ${budget ? `Around INR ${budget}` : 'Budget can be tailored to your range'}`,
    '\u2022 Trending Styles:',
    ...trendIdeas.map((idea) => `\u2022 ${idea}`),
    '',
    `${ICONS.style} Pairing Tips`,
    ...pairingTips.map((tip) => `\u2022 ${tip}`),
    '',
    `${ICONS.cart} Quick Action`,
    'Want to grab this look?',
    `${ICONS.point} Buy here: [affiliate link placeholder]`,
    '',
    `${ICONS.question} One Smart Question`,
    followUp,
  ].join('\n');
}

function buildEducationModeReply(userMessage: string): string {
  const lower = userMessage.toLowerCase();
  const wantsPinterest = lower.includes('pinterest');
  const wantsLinktree = lower.includes('linktree');
  const wantsAffiliateBasics =
    /affiliate|earn money|earning money|how it works|promotion|growth strategy|branding/.test(lower);

  const lines: string[] = [
    `${ICONS.growth} Fashion Affiliate Growth Plan`,
    '1. Pick one fashion niche and audience (Women, Men, or Kids) so your content stays focused.',
    '2. Build trust-first branding: clear bio, consistent colors, and practical styling content before hard selling.',
    '3. Create offer buckets: premium picks, budget deals, and seasonal edits with clear value messaging.',
  ];

  if (wantsLinktree || wantsAffiliateBasics) {
    lines.push(
      '4. Set up Linktree for conversion: top links should be best outfit, under-999 deals, and your strongest platform picks.'
    );
    lines.push('5. Use affiliate-safe CTA style: compare options first, then share one clear buy link.');
  }

  if (wantsPinterest || wantsAffiliateBasics) {
    lines.push('6. Pinterest system for fashion growth:');
    lines.push('\u2022 Create niche boards (e.g., Men Summer Looks, Women Ethnic Under INR 999).');
    lines.push('\u2022 Use vertical pins in 2:3 ratio with a strong hook title.');
    lines.push('\u2022 Route clicks to Linktree affiliate links, not random deep links.');
    lines.push('\u2022 Post consistently: 5-10 pins per day and test multiple hooks weekly.');
  }

  lines.push('7. Track what converts: saves, outbound clicks, Linktree CTR, and purchases by platform.');

  return lines.join('\n');
}

function buildFriendlyChatModeReply(userMessage: string, language: LanguageStyle): string {
  const text = userMessage.trim().toLowerCase();

  if (/\b(joke|funny)\b/.test(text)) {
    return 'Style joke: my fashion advice is instant, but your cart still needs your final approval.';
  }

  if (/^(hi|hello|hey|namaste|yo)\b/.test(text)) {
    if (language === 'hinglish') {
      return 'Hi! Main Neon hoon. Fashion picks, outfit styling, ya affiliate growth help chahiye?';
    }
    return 'Hi! I\u2019m Neon. Want fashion picks, outfit ideas, or affiliate growth help?';
  }

  if (/\bhow are you|kaise ho|kaisa hai\b/.test(text)) {
    return language === 'hinglish'
      ? 'Main great hoon. Tum batao, style advice chahiye ya casual chat?'
      : "I'm doing well. Want style advice or a quick chat?";
  }

  return language === 'hinglish'
    ? 'Main fashion shopping, styling, aur affiliate growth mein help karta hoon. Batao kis cheez se start karein?'
    : "I can help with fashion shopping, styling, and affiliate growth. Tell me what you're looking for.";
}

function applyFirstResponseGreeting(response: string, isFirstTurn: boolean): string {
  const trimmed = response.trim();
  if (!isFirstTurn) return trimmed;
  if (trimmed.startsWith(FIRST_RESPONSE_GREETING)) return trimmed;

  const shortHeader = `${ICONS.sparkles} Hello, I\u2019m Neon \u2014 your AI Shopping Assistant`;
  const withoutShortHeader = trimmed.startsWith(shortHeader)
    ? trimmed.slice(shortHeader.length).trimStart()
    : trimmed;

  if (!withoutShortHeader) return FIRST_RESPONSE_GREETING;
  return `${FIRST_RESPONSE_GREETING}\n\n${withoutShortHeader}`;
}

function inferGenderLabel(text: string, audience: FashionAudience): 'Women' | 'Men' | 'Kids' | 'General' {
  if (/\bkids?\b/.test(text)) return 'Kids';
  if (/\bgirls?|women|womens|ladies|female\b/.test(text)) return 'Women';
  if (/\bboys?|men|mens|male\b/.test(text)) return 'Men';
  if (audience === 'women') return 'Women';
  if (audience === 'men') return 'Men';
  if (audience === 'kids') return 'Kids';
  return 'General';
}

function inferProductTypeLabel(text: string): string {
  if (/\bt-?shirt|tee|tshirt\b/.test(text)) return 'T-Shirt';
  if (/\bshirt\b/.test(text)) return 'Shirt';
  if (/\bjeans?|trouser|trousers|pants\b/.test(text)) return 'Bottomwear';
  if (/\bdress\b/.test(text)) return 'Dress';
  if (/\bkurti|kurta|saree|lehenga|ethnic\b/.test(text)) return 'Ethnic Wear';
  if (/\bhoodie\b/.test(text)) return 'Hoodie';
  if (/\bjacket\b/.test(text)) return 'Jacket';
  return 'Fashion Apparel';
}

function inferStyleType(text: string): string {
  if (/\bethnic|kurta|saree|lehenga\b/.test(text)) return 'Ethnic';
  if (/\bformal|office|blazer\b/.test(text)) return 'Formal';
  if (/\bstreet|oversized|cargo|sneaker\b/.test(text)) return 'Streetwear';
  if (/\bparty|wedding|festive\b/.test(text)) return 'Occasion';
  return 'Casual';
}

function inferBestFor(text: string): string {
  if (/\boffice|work|formal\b/.test(text)) return 'Office and smart-casual looks';
  if (/\bparty|wedding|festive\b/.test(text)) return 'Events and occasion wear';
  if (/\bgym|sports|run\b/.test(text)) return 'Active use';
  return 'Daily wear and easy styling';
}

function inferSeason(text: string): string {
  if (/\bwinter|fleece|wool|sweatshirt|hoodie\b/.test(text)) return 'Winter';
  if (/\bmonsoon|rain|waterproof\b/.test(text)) return 'Monsoon';
  if (/\bsummer|linen|cotton\b/.test(text)) return 'Summer';
  return 'Summer-friendly for Indian weather';
}

function inferWeatherFit(text: string): string {
  if (/\bwinter|cold\b/.test(text)) return 'Layer-friendly for cooler weather';
  if (/\bmonsoon|rain\b/.test(text)) return 'Quick-dry and easy-maintenance pieces';
  return 'Breathable picks for warm and humid Indian weather';
}

function inferValueRating(text: string): number {
  if (/\boverpriced|too expensive|high price\b/.test(text)) return 2;
  if (/\bsale|discount|offer|deal|cashback|under\s*[0-9]{2,6}\b/.test(text)) return 4;
  if (/\bpremium|luxury\b/.test(text)) return 3;
  return 3;
}

function inferFabricNote(text: string): string {
  if (/\b100%\s*cotton|cotton\b/.test(text)) return 'cotton-rich fabric is great for comfort';
  if (/\blinen\b/.test(text)) return 'linen blend is breathable for Indian summer';
  if (/\bpolyester\b/.test(text)) return 'polyester blend can feel warm, check blend ratio';
  if (/\bviscose|rayon\b/.test(text)) return 'viscose or rayon drape well but check durability';
  return 'prefer cotton-rich fabrics for better comfort';
}

function inferVerdict(
  valueRating: number,
  text: string
): { label: 'Worth it' | 'Good option' | 'Skip'; reason: string } {
  if (valueRating <= 2 || /\bpoor quality|bad quality|skip\b/.test(text)) {
    return { label: 'Skip', reason: 'price-to-quality balance looks weak for this pick.' };
  }
  if (valueRating >= 4) {
    return { label: 'Worth it', reason: 'value looks strong for the style and likely daily usability.' };
  }
  return { label: 'Good option', reason: 'decent choice if the fit, reviews, and fabric blend check out.' };
}

function inferPairingTip(text: string): string {
  if (/\bshirt\b/.test(text)) return 'straight-fit jeans or chinos with clean sneakers';
  if (/\bt-?shirt|tee|tshirt\b/.test(text)) return 'blue denim or cargos with minimal sneakers';
  if (/\bkurta|ethnic\b/.test(text)) return 'solid bottoms and loafers for a polished ethnic look';
  if (/\bdress\b/.test(text)) return 'a light shrug and neutral footwear';
  return 'neutral bottoms and simple footwear for repeat styling';
}

function inferPairingIdeas(text: string, gender: string): string[] {
  if (/\bshirt|t-?shirt|tee|top\b/.test(text)) {
    return [
      'Pair with straight-fit denim and white sneakers for a clean daily look.',
      'Add a lightweight overshirt for evenings without losing comfort.',
    ];
  }

  if (/\bdress\b/.test(text)) {
    return [
      'Use neutral sandals and a compact sling bag for balanced styling.',
      'Add subtle jewelry and a light layer for day-to-evening transition.',
    ];
  }

  if (/\bkurta|ethnic|saree|lehenga\b/.test(text)) {
    return [
      'Pair with comfortable footwear first, then build accessories around one accent color.',
      'Use breathable inner layers to stay comfortable in humid weather.',
    ];
  }

  if (gender === 'Men') {
    return [
      'Build with a breathable top, dark denim, and clean sneakers.',
      'Use one statement piece only, then keep the rest neutral for a sharper look.',
    ];
  }

  if (gender === 'Women') {
    return [
      'Start with breathable fabrics and add one trend-forward layer like an overshirt.',
      'Balance colors: one pop shade with neutral base tones for a premium look.',
    ];
  }

  return [
    'Choose breathable cotton or linen first, then style with neutral bottoms.',
    'Keep footwear simple and repeatable to maximize wardrobe value.',
  ];
}

function inferTrendingIdeas(text: string, gender: string, budget: number | null): string[] {
  const budgetSuffix = budget ? `under INR ${budget}` : 'in budget-friendly ranges';

  if (/\bshirt\b/.test(text)) {
    return [
      `Oversized cotton shirts ${budgetSuffix}`,
      `Pastel striped shirts ${budgetSuffix}`,
      `Solid relaxed-fit shirts ${budgetSuffix}`,
    ];
  }

  if (/\bt-?shirt|tee|tshirt\b/.test(text)) {
    return [
      `Minimal logo tees ${budgetSuffix}`,
      `Graphic tees ${budgetSuffix}`,
      `Textured basics ${budgetSuffix}`,
    ];
  }

  if (/\bdress\b/.test(text)) {
    return [
      `Floral midi dresses ${budgetSuffix}`,
      `Solid A-line dresses ${budgetSuffix}`,
      `Co-ord dress sets ${budgetSuffix}`,
    ];
  }

  if (/\bkurta|ethnic|saree|lehenga\b/.test(text)) {
    return [
      `Cotton kurta sets ${budgetSuffix}`,
      `Printed ethnic sets ${budgetSuffix}`,
      `Festive-ready lightweight options ${budgetSuffix}`,
    ];
  }

  if (gender === 'Men') {
    return [
      `Smart-casual shirts ${budgetSuffix}`,
      `Cargo and clean tee combinations ${budgetSuffix}`,
      `Breathable summer polos ${budgetSuffix}`,
    ];
  }

  if (gender === 'Women') {
    return [
      `Co-ord sets ${budgetSuffix}`,
      `Relaxed shirts with straight jeans ${budgetSuffix}`,
      `Soft pastel everyday outfits ${budgetSuffix}`,
    ];
  }

  if (gender === 'Kids') {
    return [
      `Soft cotton playwear ${budgetSuffix}`,
      `Easy-wash daily sets ${budgetSuffix}`,
      `Lightweight festive kidswear ${budgetSuffix}`,
    ];
  }

  return [
    `Breathable basics ${budgetSuffix}`,
    `Trend-led casual outfits ${budgetSuffix}`,
    `Daily repeat-friendly styles ${budgetSuffix}`,
  ];
}

function inferSuggestionFollowUp(text: string, budget: number | null): string {
  if (!budget) return 'What budget should I optimize for?';
  if (!/\boccasion|office|party|wedding|daily\b/.test(text)) {
    return 'Which occasion should I optimize this for: daily wear, office, or outing?';
  }
  if (!/\bcolor|colour\b/.test(text)) {
    return 'Which color direction do you prefer: neutrals, earthy tones, or bright shades?';
  }
  return 'Do you want a regular fit, slim fit, or oversized fit?';
}

function inferPlatformFromText(text: string): string {
  if (text.includes('amazon')) return 'Amazon';
  if (text.includes('flipkart')) return 'Flipkart';
  if (text.includes('myntra')) return 'Myntra';
  if (text.includes('meesho')) return 'Meesho';
  return 'Other';
}

function inferPlatformFromUrl(url: string): string {
  const lower = url.toLowerCase();
  if (lower.includes('amazon')) return 'Amazon';
  if (lower.includes('flipkart')) return 'Flipkart';
  if (lower.includes('myntra')) return 'Myntra';
  if (lower.includes('meesho')) return 'Meesho';
  return 'Other';
}

function inferBudget(userMessage: string): number | null {
  const match =
    userMessage.match(/\bunder\s*([0-9]{2,6})\b/i) ??
    userMessage.match(/(?:rs\.?|inr)\s*([0-9]{2,6})/i);
  if (!match) return null;
  const value = Number(match[1]);
  return Number.isFinite(value) ? value : null;
}

function extractUrls(text: string): string[] {
  return text.match(/https?:\/\/[^\s)]+/gi) ?? [];
}

function formatValueStars(rating: number): string {
  const safe = Math.max(1, Math.min(5, Math.round(rating)));
  return `${'\u2605'.repeat(safe)}${'\u2606'.repeat(5 - safe)}`;
}

function optimizeChatHistory(chatHistory: unknown): ChatHistoryMessage[] {
  if (!Array.isArray(chatHistory)) return [];

  return chatHistory
    .filter(
      (item): item is ChatHistoryMessage =>
        Boolean(item) &&
        typeof item === 'object' &&
        typeof (item as ChatHistoryMessage).role === 'string' &&
        typeof (item as ChatHistoryMessage).content === 'string'
    )
    .slice(-MAX_HISTORY_MESSAGES)
    .map((msg) => ({
      role: msg.role === 'assistant' ? 'assistant' : 'user',
      content: msg.content.trim().slice(0, MAX_MESSAGE_CHARS),
    }))
    .filter((msg) => msg.content.length > 0);
}

function detectAudience(userMessage: string): FashionAudience {
  const text = userMessage.toLowerCase();
  if (/\bkid|kids|child|children|toddler|baby\b/.test(text)) return 'kids';
  if (/\bwomen|womens|woman|female|ladies|girls\b/.test(text)) return 'women';
  if (/\bmen|mens|man|male|boys\b/.test(text)) return 'men';
  return 'general';
}

function detectLanguageStyle(userMessage: string): LanguageStyle {
  if (/[\u0900-\u097F]/.test(userMessage)) return 'hindi';
  const text = userMessage.toLowerCase();
  const hindiRomanSignals = /\b(bhai|yaar|acha|accha|kya|kaise|sahi|kapda|kapde|achha|chahiye|mere|mujhe|aap|aur|kyu)\b/;
  const englishSignals = /\b(shirt|dress|fit|style|color|fabric|link|buy|product|under)\b/;
  if (hindiRomanSignals.test(text) && englishSignals.test(text)) return 'hinglish';
  if (hindiRomanSignals.test(text)) return 'hinglish';
  return 'english';
}

function getRequestIdentity(request: NextRequest, userId?: string): string {
  if (typeof userId === 'string' && userId.trim()) return `user:${userId.trim()}`;
  const forwarded = request.headers.get('x-forwarded-for');
  const ip = forwarded?.split(',')[0]?.trim() || request.headers.get('x-real-ip') || 'anonymous';
  return `ip:${ip}`;
}

function getCooldownReply(identity: string): string | null {
  const now = Date.now();
  const lastSeen = userLastRequestAt.get(identity);
  userLastRequestAt.set(identity, now);

  if (!lastSeen || now - lastSeen >= USER_COOLDOWN_MS) return null;
  return "Easy there! Give me a second and I'll style your next look.";
}

function hashMessage(userMessage: string): string {
  return createHash('sha256').update(userMessage.trim().toLowerCase()).digest('hex');
}

function getCachedResponse(cacheKey: string): string | null {
  const entry = responseCache.get(cacheKey);
  if (!entry) return null;
  if (Date.now() > entry.expiresAt) {
    responseCache.delete(cacheKey);
    return null;
  }
  return entry.response;
}

function setCachedResponse(cacheKey: string, response: string): void {
  responseCache.set(cacheKey, { response, expiresAt: Date.now() + CACHE_TTL_MS });
}

function cleanupStaleMemory(): void {
  const now = Date.now();
  for (const [key, value] of responseCache.entries()) {
    if (value.expiresAt <= now) responseCache.delete(key);
  }
  for (const [identity, lastSeen] of userLastRequestAt.entries()) {
    if (now - lastSeen > 60 * 60 * 1000) userLastRequestAt.delete(identity);
  }
}

async function persistQuery(userId: unknown, queryText: string, result: string): Promise<void> {
  if (!userId) return;
  try {
    await connectDB();
    await new Query({ userId, queryText, result }).save();
  } catch (dbError) {
    console.error('Database save error:', dbError);
  }
}
