'use client';

import { useEffect, useRef, useState } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { MessageBubble } from './MessageBubble';
import { Send, Sparkles, AlertCircle } from 'lucide-react';
import { ScrollArea } from '@/components/ui/scroll-area';

export interface ChatMessage {
  id: string;
  content: string;
  isAi: boolean;
  isError?: boolean;
}

export function ChatWindow() {
  const [messages, setMessages] = useState<ChatMessage[]>([
    {
      id: '1',
      content:
        'Hello! I\'m Neon AI, your shopping assistant. I can help you analyze clothing products, compare options, suggest items based on your budget, and generate social media content. Share a product link or ask me anything about fashion and clothing!',
      isAi: true,
    },
  ]);
  const [input, setInput] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const scrollRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (scrollRef.current) {
      scrollRef.current.scrollTop = scrollRef.current.scrollHeight;
    }
  }, [messages]);

  const handleSend = async () => {
    if (!input.trim() || isLoading) return;

    const userMessage: ChatMessage = {
      id: Date.now().toString(),
      content: input,
      isAi: false,
    };

    setMessages((prev) => [...prev, userMessage]);
    setInput('');
    setIsLoading(true);

    try {
      // Prepare chat history for context
      const chatHistory = messages
        .filter((msg) => msg.content.length > 0 && !msg.isError)
        .map((msg) => ({
          role: msg.isAi ? 'assistant' : 'user',
          content: msg.content,
        }));

      // Call the real AI API
      const response = await fetch('/api/chat', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          message: userMessage.content,
          chatHistory,
        }),
      });

      const contentType = response.headers.get('content-type') || '';
      let data: any = null;
      if (contentType.includes('application/json')) {
        data = await response.json();
      } else {
        const errorText = await response.text();
        throw new Error(
          response.ok
            ? 'Neon AI returned an unexpected response format.'
            : `Neon AI request failed (${response.status}): ${errorText.slice(0, 200)}`
        );
      }

      if (!response.ok || !data.success) {
        throw new Error(data.error || 'Failed to get response from Neon AI');
      }

      const aiMessage: ChatMessage = {
        id: (Date.now() + 1).toString(),
        content: data.response || 'No response received. Please try again.',
        isAi: true,
      };

      setMessages((prev) => [...prev, aiMessage]);
    } catch (error) {
      const errorMessage =
        error instanceof Error ? error.message : 'An unexpected error occurred';

      const errorChatMessage: ChatMessage = {
        id: (Date.now() + 1).toString(),
        content: errorMessage.includes('AI service is temporarily unavailable')
          ? 'Neon AI is temporarily unavailable. Please try again in a moment.'
          : errorMessage,
        isAi: true,
        isError: true,
      };

      setMessages((prev) => [...prev, errorChatMessage]);
      console.error('Chat error:', error);
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="flex flex-col h-full">
      {/* Header */}
      <div className="border-b border-border p-4 sm:p-6">
        <div className="flex items-center gap-2">
          <Sparkles className="h-6 w-6 text-accent" />
          <div>
            <h1 className="font-semibold text-foreground">Neon AI Chat</h1>
            <p className="text-xs sm:text-sm text-muted-foreground">Your Shopping Assistant</p>
          </div>
        </div>
      </div>

      {/* Messages */}
      <ScrollArea className="flex-1 p-4 sm:p-6" ref={scrollRef}>
        <div className="space-y-4">
          {messages.map((message) => (
            <MessageBubble
              key={message.id}
              content={message.content}
              isAi={message.isAi}
              isError={message.isError}
            />
          ))}
          {isLoading && <MessageBubble content="" isAi={true} isLoading={true} />}
        </div>
      </ScrollArea>

      {/* Input */}
      <div className="border-t border-border p-4 sm:p-6 bg-card">
        <div className="flex gap-2">
          <Input
            placeholder="Paste a product link or ask me something..."
            value={input}
            onChange={(e) => setInput(e.target.value)}
            onKeyPress={(e) => e.key === 'Enter' && handleSend()}
            disabled={isLoading}
            className="bg-background border-border"
          />
          <Button
            onClick={handleSend}
            disabled={!input.trim() || isLoading}
            size="icon"
            className="bg-accent text-accent-foreground hover:bg-accent/90"
          >
            <Send className="h-4 w-4" />
          </Button>
        </div>
      </div>
    </div>
  );
}
