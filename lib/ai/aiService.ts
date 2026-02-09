/**
 * AI Service Module
 *
 * This service handles AI interactions for Neon AI shopping assistant.
 * It's designed to be modular and replaceable with different AI providers.
 *
 * Current placeholders support:
 * - OpenRouter
 * - Groq
 * - Ollama (local)
 *
 * To use:
 * 1. Set NEXT_PUBLIC_AI_PROVIDER and related API keys in environment
 * 2. Update this service with actual AI integration
 */

export interface AIServiceConfig {
  provider: 'openrouter' | 'groq' | 'ollama';
  apiKey?: string;
  baseUrl?: string;
  model?: string;
}

export interface AnalysisRequest {
  productLink?: string;
  userMessage?: string;
  budget?: number;
  fabric?: string;
  occasion?: string;
  tone?: 'hindi-english-mix' | 'english' | 'hindi';
}

export interface AnalysisResponse {
  message: string;
  productAnalysis?: {
    productName: string;
    price: number;
    fabric: string;
    comfortLevel: string;
    bestFor: string;
    budgetScore: number;
    verdict: string;
  };
  comparison?: Array<{
    productName: string;
    price: number;
    pros: string[];
    cons: string[];
  }>;
}

class AIService {
  private config: AIServiceConfig;

  constructor(config?: AIServiceConfig) {
    this.config = config || {
      provider: (process.env.NEXT_PUBLIC_AI_PROVIDER as any) || 'groq',
      apiKey: process.env.GROQ_API_KEY || process.env.OPENROUTER_API_KEY,
      baseUrl: process.env.AI_BASE_URL,
      model: process.env.AI_MODEL || 'mixtral-8x7b-32768',
    };
  }

  /**
   * Analyze a product and provide recommendations
   */
  async analyzeProduct(request: AnalysisRequest): Promise<AnalysisResponse> {
    const prompt = this.buildAnalysisPrompt(request);

    try {
      const response = await this.callAI(prompt);
      return this.parseAnalysisResponse(response);
    } catch (error) {
      console.error('AI analysis error:', error);
      throw new Error('Failed to analyze product');
    }
  }

  /**
   * Generate affiliate marketing content following Neon AI guidelines
   */
  async generateAffiliateContent(productName: string, price: number): Promise<{
    caption: string;
    hashtags: string[];
    description: string;
  }> {
    const prompt = `You are Neon AI. Create affiliate marketing content for this product.

PRODUCT:
Name: ${productName}
Price: ₹${price}

USE THIS EXACT FORMAT FOR YOUR RESPONSE:

Instagram Caption:
[Short, catchy caption with relevant emojis - max 150 characters]

Short Product Description:
[2-3 sentences highlighting key benefits]

Hashtags:
[List 10 relevant hashtags, one per line or comma-separated]

IMPORTANT:
- Keep captions short, catchy, and natural
- Highlight value for money and quality
- Use conversational, friendly English tone
- Include relevant emojis in caption
- Make it appealing to Indian shoppers
- Never use fake or made-up information`;

    try {
      const response = await this.callAI(prompt);
      // Parse the formatted response
      const captionMatch = response.match(/Instagram Caption:\s*\n?(.+?)(?:\n\n|$)/s);
      const descriptionMatch = response.match(/Short Product Description:\s*\n?(.+?)(?:\n\n|Hashtags:|$)/s);
      const hashtagsMatch = response.match(/Hashtags:\s*\n?(.+?)$/s);

      const caption = captionMatch ? captionMatch[1].trim() : '';
      const description = descriptionMatch ? descriptionMatch[1].trim() : '';
      const hashtagsText = hashtagsMatch ? hashtagsMatch[1].trim() : '';
      const hashtags = hashtagsText.split(/[,\n]/).map(h => h.trim()).filter(h => h);

      return {
        caption,
        hashtags: hashtags.slice(0, 10),
        description,
      };
    } catch (error) {
      console.error('Affiliate content generation error:', error);
      throw new Error('Failed to generate affiliate content');
    }
  }

  /**
   * Build analysis prompt based on request
   * Uses simplified format based on Neon AI guidelines
   */
  private buildAnalysisPrompt(request: AnalysisRequest): string {
    let prompt = `You are Neon AI, a friendly and helpful shopping assistant.

Your job:
Help users analyze clothing products and recommend the best option.

Rules:
- Always reply in simple English.
- Be friendly and helpful.
- Always consider budget in Indian Rupees.
- Explain fabric quality and comfort.
- Give honest verdict.
- Keep answers structured.

`;

    if (request.productLink) {
      prompt += `ANALYZE THIS PRODUCT:\n`;
      prompt += `Link: ${request.productLink}\n`;
      
      if (request.budget) {
        prompt += `Budget: ₹${request.budget}\n`;
      }
      if (request.fabric) {
        prompt += `Preferred Fabric: ${request.fabric}\n`;
      }
      if (request.occasion) {
        prompt += `Occasion: ${request.occasion}\n`;
      }

      prompt += `\nUSE THIS EXACT FORMAT:

Product Analysis:
Price:
Fabric Quality:
Comfort Level:
Best For:
Value Score (out of 10):

Pros:
-
-

Cons:
-
-

Verdict:
Give a helpful recommendation in simple English.
`;
    }

    if (request.userMessage) {
      prompt += `\n\nUser Question: ${request.userMessage}`;
      prompt += `\n\nRespond in simple English. Be friendly and helpful.`;
    }

    return prompt;
  }

  /**
   * Call AI provider with the prompt
   */
  private async callAI(prompt: string): Promise<string> {
    switch (this.config.provider) {
      case 'groq':
        return this.callGroq(prompt);
      case 'openrouter':
        return this.callOpenRouter(prompt);
      case 'ollama':
        return this.callOllama(prompt);
      default:
        throw new Error(`Unsupported AI provider: ${this.config.provider}`);
    }
  }

  /**
   * Call Groq API
   */
  private async callGroq(prompt: string): Promise<string> {
    if (!this.config.apiKey) {
      throw new Error('GROQ_API_KEY not configured');
    }

    const response = await fetch('https://api.groq.com/openai/v1/chat/completions', {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${this.config.apiKey}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        model: this.config.model || 'mixtral-8x7b-32768',
        messages: [{ role: 'user', content: prompt }],
        temperature: 0.7,
        max_tokens: 500,
      }),
    });

    const data = await response.json();
    if (!response.ok) {
      throw new Error(`Groq API error: ${data.error?.message}`);
    }

    return data.choices[0]?.message?.content || '';
  }

  /**
   * Call OpenRouter API
   */
  private async callOpenRouter(prompt: string): Promise<string> {
    if (!this.config.apiKey) {
      throw new Error('OPENROUTER_API_KEY not configured');
    }

    const response = await fetch('https://openrouter.ai/api/v1/chat/completions', {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${this.config.apiKey}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        model: this.config.model || 'mixtral-8x7b',
        messages: [{ role: 'user', content: prompt }],
      }),
    });

    const data = await response.json();
    if (!response.ok) {
      throw new Error(`OpenRouter API error: ${data.error?.message}`);
    }

    return data.choices[0]?.message?.content || '';
  }

  /**
   * Call Ollama API (local)
   */
  private async callOllama(prompt: string): Promise<string> {
    const baseUrl = this.config.baseUrl || 'http://localhost:11434';

    const response = await fetch(`${baseUrl}/api/generate`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        model: this.config.model || 'mistral',
        prompt: prompt,
        stream: false,
      }),
    });

    const data = await response.json();
    if (!response.ok) {
      throw new Error(`Ollama API error: ${data.error}`);
    }

    return data.response || '';
  }

  /**
   * Parse AI response into structured format
   */
  private parseAnalysisResponse(response: string): AnalysisResponse {
    try {
      // Try to extract JSON from response
      const jsonMatch = response.match(/\{[\s\S]*\}/);
      if (jsonMatch) {
        const parsed = JSON.parse(jsonMatch[0]);
        return { message: response, productAnalysis: parsed };
      }
    } catch (error) {
      // If parsing fails, return as plain text
    }

    return { message: response };
  }
}

// Export singleton instance
export const aiService = new AIService();
export default AIService;
