export type ProductAnalysis = {
  platform: string | null;
  category: string | null;
  style: string | null;
  bestFor: string | null;
  season: string | null;
  valueForMoney: string; 
  stylingTips: string[]; 
  verdict: string; 
  quickAction: string; 
  notes?: string; 
};

export async function analyzeProductLink(url: string, productPageText?: string): Promise<ProductAnalysis> {
  const lower = url.toLowerCase();
  let platform: string | null = null;
  if (lower.includes("myntra")) platform = "Myntra";
  else if (lower.includes("flipkart")) platform = "Flipkart";
  else if (lower.includes("amazon")) platform = "Amazon";
  else if (lower.includes("meesho")) platform = "Meesho";
  else platform = null;

  let category: string | null = null;
  let style: string | null = null;
  let bestFor: string | null = null;
  let season: string | null = null;
  let valueForMoney = "Insufficient data";
  const stylingTips: string[] = [];
  let verdict = "Insufficient data — need product details";
  const quickAction = "Check product images, read recent reviews, compare prices across platforms.";

  if (productPageText) {
    const t = productPageText.toLowerCase();
    if (/\b(t-shirt|tee|shirt|kurta|dress|jeans|trouser|sneaker|shoe|sandal|top|blouse|lehenga|saree|jacket)\b/.test(t)) {
      const m = t.match(/\b(t-shirt|tee|shirt|kurta|dress|jeans|trouser|sneaker|shoe|sandal|top|blouse|lehenga|saree|jacket)\b/);
      category = m ? m[0] : null;
    }
    if (/\b(casual|formal|party|athleisure|ethnic|western|boho|minimalist)\b/.test(t)) {
      const m = t.match(/\b(casual|formal|party|athleisure|ethnic|western|boho|minimalist)\b/);
      style = m ? m[0] : null;
    }
    if (/\b(cotton|linen|polyester|silk|denim)\b/.test(t)) {
      season = t.includes("linen") || t.includes("cotton") ? "Summer / All-season (breathable)" : "Depends on fabric";
    }
    const priceMatch = t.match(/(?:rs\.|inr|₹)\s?([\d,]+)/);
    if (priceMatch) {
      const raw = priceMatch[1].replace(/,/g, "");
      const price = Number(raw);
      if (!isNaN(price)) {
        valueForMoney = price < 1000 ? "★★★★☆" : price < 3000 ? "★★★☆☆" : "★★☆☆☆";
      }
    }

    if (category) {
      if (category.includes("kurta") || category.includes("saree") || style === "ethnic") {
        stylingTips.push("Pair with light juttis or kolhapuris and minimal oxidized jewellery.");
      } else if (category.includes("jeans") || style === "casual") {
        stylingTips.push("Tuck in a crisp cotton tee and add clean white sneakers for daily wear.");
      } else {
        stylingTips.push("Keep accessories minimal; prefer breathable cotton/linen for Indian climate.");
      }
    }

    if (category && style && valueForMoney !== "Insufficient data") {
      verdict = "Good option — Looks suitable for the described use and price bracket. Verify fit and recent user reviews.";
    } else {
      verdict = "Insufficient data — provide product title/price/specs or allow metadata extraction.";
    }
  } else {
    return {
      platform,
      category: null,
      style: null,
      bestFor: null,
      season: null,
      valueForMoney,
      stylingTips: [
        "I don't have product details yet. Please paste the product title/price/specs or allow me to access product page metadata.",
      ],
      verdict,
      quickAction,
      notes:
        "No product metadata provided. To produce a full Product Analysis I need either structured product metadata, product title + price, or scraped product page text.",
    };
  }

  return {
    platform,
    category,
    style,
    bestFor: bestFor ?? null,
    season,
    valueForMoney,
    stylingTips: stylingTips.slice(0, 2),
    verdict,
    quickAction,
    notes: undefined,
  };
}
