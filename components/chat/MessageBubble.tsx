import { cn } from '@/lib/utils';
import { AlertCircle } from 'lucide-react';

interface MessageBubbleProps {
  content: string;
  isAi: boolean;
  isLoading?: boolean;
  isError?: boolean;
}

export function MessageBubble({ content, isAi, isLoading, isError }: MessageBubbleProps) {
  return (
    <div className={cn('flex mb-4', isAi ? 'justify-start' : 'justify-end')}>
      <div
        className={cn(
          'max-w-xs lg:max-w-md px-4 py-3 rounded-lg',
          isError
            ? 'bg-red-900/20 text-red-400 rounded-bl-none border border-red-900/40'
            : isAi
              ? 'bg-muted text-foreground rounded-bl-none'
              : 'bg-accent text-accent-foreground rounded-br-none'
        )}
      >
        {isLoading ? (
          <div className="flex gap-1">
            <div className="w-2 h-2 rounded-full bg-current animate-bounce" />
            <div className="w-2 h-2 rounded-full bg-current animate-bounce" style={{ animationDelay: '0.2s' }} />
            <div className="w-2 h-2 rounded-full bg-current animate-bounce" style={{ animationDelay: '0.4s' }} />
          </div>
        ) : isError ? (
          <div className="flex gap-2 items-start">
            <AlertCircle className="h-4 w-4 flex-shrink-0 mt-0.5" />
            <p className="text-sm leading-relaxed">{content}</p>
          </div>
        ) : (
          <p className="text-sm leading-relaxed">{content}</p>
        )}
      </div>
    </div>
  );
}
