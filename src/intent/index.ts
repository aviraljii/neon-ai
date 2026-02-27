export enum IntentMode {
  PRODUCT_LINK_MODE = "PRODUCT_LINK_MODE",
  FASHION_SUGGESTION_MODE = "FASHION_SUGGESTION_MODE",
  EDUCATION_MODE = "EDUCATION_MODE",
  FRIENDLY_CHAT_MODE = "FRIENDLY_CHAT_MODE",
  UNKNOWN = "UNKNOWN",
}

export enum Audience {
  Women = "Women",
  Men = "Men",
  Kids = "Kids",
  General = "General",
}

export function detectIntent(text: string): IntentMode {
  const t = text.toLowerCase();

  const urlRegex = /(https?:\/\/[^\s]+)/i;
  if (urlRegex.test(text)) return IntentMode.PRODUCT_LINK_MODE;
  if (/\b(worth it|should i buy|is this worth|should i get|buy this)\b/.test(t))
    return IntentMode.PRODUCT_LINK_MODE;
  if (/\b(myntra|flipkart|amazon|meesho|ajio|limeroad|tata cliq)\b/.test(t) && /\b(shirt|jeans|dress|kurta|sneaker|shoe|top|lehenga|sari|saree)\b/.test(t))
    return IntentMode.PRODUCT_LINK_MODE;

  if (/\b(what to wear|outfit|what should i wear|dress for|styling|outfit ideas|pairing)\b/.test(t))
    return IntentMode.FASHION_SUGGESTION_MODE;
  if (/\b(trend|trending|style|looks|outfits for)\b/.test(t) && !/affiliate|earn|pinterest/.test(t))
    return IntentMode.FASHION_SUGGESTION_MODE;

  if (/\b(affiliate|affiliate marketing|pinterest|earn money|earnings|traffic|grow on pinterest|brand strategy)\b/.test(t))
    return IntentMode.EDUCATION_MODE;

  if (/\b(hi|hello|hey|how are you|good morning|good evening|gm|hi neon)\b/.test(t))
    return IntentMode.FRIENDLY_CHAT_MODE;

  return IntentMode.UNKNOWN;
}

export function detectAudience(text: string): Audience {
  const t = text.toLowerCase();
  if (/\b(girl|women|ladies|woman|female)\b/.test(t)) return Audience.Women;
  if (/\b(boy|men|man|male|gentleman)\b/.test(t)) return Audience.Men;
  if (/\b(kid|kids|baby|children|child)\b/.test(t)) return Audience.Kids;
  return Audience.General;
}
