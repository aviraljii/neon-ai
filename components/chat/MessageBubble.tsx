'use client';

import { useEffect, useState } from 'react';
import { cn } from '@/lib/utils';
import { AlertCircle } from 'lucide-react';
import { ResponseFormatter } from './ResponseFormatter';
import { CopyButton } from './CopyButton';
import { hasMarkdown } from '@/lib/markdown';

interface MessageBubbleProps {
  content: string;
  isAi: boolean;
  isLoading?: boolean;
  isError?: boolean;
  imageUrl?: string;
  isTyping?: boolean;
}

export function MessageBubble({ content, isAi, isLoading, isError, imageUrl, isTyping }: MessageBubbleProps) {
  const [displayedContent, setDisplayedContent] = useState('');
  const hasMarkdownContent = !isLoading && !isError && !isTyping && hasMarkdown(content);

  useEffect(() => {
    if (!isTyping) {
      setDisplayedContent(content);
      return;
    }

    if (!content) return;

    let currentIndex = 0;
    const typingSpeed = 20; // milliseconds per character

    const timer = setInterval(() => {
      if (currentIndex < content.length) {
        setDisplayedContent(content.slice(0, currentIndex + 1));
        currentIndex++;
      } else {
        clearInterval(timer);
      }
    }, typingSpeed);

    return () => clearInterval(timer);
  }, [content, isTyping]);

  return (
    <div className={cn('flex mb-4 group message-animate', isAi ? 'justify-start' : 'justify-end')}>
      <div
        className={cn(
          'max-w-xs lg:max-w-2xl px-4 py-3 rounded-lg transition-all',
          isError
            ? 'bg-red-900/20 text-red-400 rounded-bl-none border border-red-900/40'
            : isAi
              ? 'glassmorphism text-foreground rounded-bl-none neon-glow'
              : 'bg-gradient-to-r from-purple-600 to-purple-700 text-white rounded-br-none hover:shadow-lg'
        )}
      >
        {imageUrl && !isAi && (
          <img
            src={imageUrl}
            alt="User attachment"
            className="max-w-full h-auto rounded mb-2 max-h-48"
          />
        )}
        {isLoading ? (
          <div className="flex gap-1">
            <div className="w-2 h-2 rounded-full bg-current animate-bounce" />
            <div className="w-2 h-2 rounded-full bg-current animate-bounce" style={{ animationDelay: '0.2s' }} />
            <div className="w-2 h-2 rounded-full bg-current animate-bounce" style={{ animationDelay: '0.4s' }} />
          </div>
        ) : isError ? (
          <div className="flex gap-2 items-start">
            <AlertCircle className="h-4 w-4 flex-shrink-0 mt-0.5" />
            <p className="text-sm leading-relaxed">{displayedContent}</p>
          </div>
        ) : hasMarkdownContent ? (
          <ResponseFormatter content={displayedContent} />
        ) : (
          <p className="text-sm leading-relaxed">{displayedContent}</p>
        )}
        {isTyping && displayedContent.length < content.length && (
          <span className="inline-block w-1 h-4 ml-1 bg-current animate-pulse" />
        )}
      </div>
      {isAi && !isLoading && !isError && !isTyping && (
        <div className="ml-2 opacity-0 group-hover:opacity-100 transition-opacity">
          <CopyButton text={displayedContent} />
        </div>
      )}
    </div>
  );
}
