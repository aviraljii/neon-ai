import { connectDB } from '@/lib/db';
import { Query } from '@/models/Query';
import { NextRequest, NextResponse } from 'next/server';
import { getDynamicPrompt, getSystemPrompt } from '@/lib/ai/promptTemplates';
import { GoogleGenerativeAI, Part } from '@google/generative-ai';

export async function POST(request: NextRequest) {
  try {
    const { userId, message, chatHistory = [] } = await request.json();

    if (!message || typeof message !== 'string') {
      return NextResponse.json({ error: 'Message is required' }, { status: 400 });
    }

    const trimmedMessage = message.trim();
    if (!trimmedMessage) {
      return NextResponse.json({ error: 'Message cannot be empty' }, { status: 400 });
    }

    // Call AI service with message history
    const aiResponse = await callAIWithSDK(trimmedMessage, chatHistory);

    // Save query to database when a user id is provided.
    // Chat responses should still work even if DB is not configured.
    if (userId) {
      try {
        await connectDB();
        const queryRecord = new Query({
          userId,
          queryText: trimmedMessage,
          result: aiResponse,
        });
        await queryRecord.save();
      } catch (dbError) {
        console.error('Database save error:', dbError);
        // We continue even if DB save fails, so user gets their response
      }
    }

    return NextResponse.json({
      response: aiResponse,
      success: true,
    });
  } catch (error) {
    console.error('Chat API error:', error);
    const errorMessage = error instanceof Error ? error.message : 'Unknown error';

    if (errorMessage.includes('API key') || errorMessage.includes('configured')) {
      return NextResponse.json(
        { error: 'AI service is not properly configured. Please set up your API keys.', success: false },
        { status: 500 }
      );
    }

    const lowerMessage = errorMessage.toLowerCase();
    const isRateLimited =
      errorMessage.includes('429') ||
      lowerMessage.includes('too many requests') ||
      lowerMessage.includes('quota exceeded');

    if (isRateLimited) {
      const retryMatch =
        errorMessage.match(/retry in\s+([\d.]+)s/i) ||
        errorMessage.match(/"retryDelay":"(\d+)s"/i);
      const retryAfterSeconds = retryMatch
        ? Math.max(1, Math.ceil(Number(retryMatch[1])))
        : 60;

      return NextResponse.json(
        {
          error: `Rate limit reached on Gemini free tier. Please retry in about ${retryAfterSeconds} seconds.`,
          code: 'AI_RATE_LIMITED',
          retryAfterSeconds,
          success: false,
        },
        {
          status: 429,
          headers: { 'Retry-After': String(retryAfterSeconds) },
        }
      );
    }

    return NextResponse.json(
      { error: `Neon AI Error: ${errorMessage}`, details: String(error), success: false },
      { status: 500 }
    );
  }
}

async function callAIWithSDK(
  userMessage: string,
  chatHistory: Array<{ role: string; content: string }>
): Promise<string> {
  const apiKey = process.env.GEMINI_API_KEY;

  if (!apiKey) {
    throw new Error('GEMINI_API_KEY is not configured. Please get a free API key from https://aistudio.google.com');
  }

  const genAI = new GoogleGenerativeAI(apiKey);
  
  // Use a currently supported Gemini model; allow override via env.
  // gemini-1.5-flash was shut down in 2025, so default to a newer model.
  const modelName = process.env.GEMINI_MODEL || 'gemini-2.5-flash';
  const model = genAI.getGenerativeModel({ model: modelName });

  // Map history to Gemini SDK format
  // Note: Gemini SDK expects 'user' and 'model' roles
  const history = chatHistory.map(msg => ({
    role: msg.role === 'assistant' ? 'model' : 'user',
    parts: [{ text: msg.content } as Part],
  }));

  // Standard safe approach: Prep the system prompt as a special instruction
  // For gemini-pro, we prepend it to the history or the first message
  const systemPrompt = getSystemPrompt();
  const dynamicPrompt = getDynamicPrompt(userMessage);
  
  const chat = model.startChat({
    history: history.length > 0 
      ? [
          { role: 'user', parts: [{ text: `INSTRUCTIONS: ${systemPrompt}\n\nPlease keep these instructions in mind for our entire conversation.` }] },
          { role: 'model', parts: [{ text: "Understood. I will act as Neon AI, your friendly shopping assistant, and follow all the rules provided." }] },
          ...history
        ]
      : [
          { role: 'user', parts: [{ text: `INSTRUCTIONS: ${systemPrompt}\n\nPlease keep these instructions in mind for our entire conversation.` }] },
          { role: 'model', parts: [{ text: "Understood. I will act as Neon AI, your friendly shopping assistant, and follow all the rules provided." }] }
        ],
  });

  const scopedMessage = `CONTEXT RULES FOR THIS TURN:
${dynamicPrompt}

USER MESSAGE:
${userMessage}`;

  const result = await chat.sendMessage(scopedMessage);
  const response = await result.response;
  return response.text();
}
