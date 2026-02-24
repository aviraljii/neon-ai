'use client';

import { ChangeEvent, KeyboardEvent, useEffect, useRef, useState } from 'react';
import { Image as ImageIcon, Loader2, Send, X } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from '@/components/ui/tooltip';
import { cn } from '@/lib/utils';
import { uploadImage } from '@/lib/api';

interface ChatInputProps {
  value: string;
  onValueChange: (value: string) => void;
  onSend: () => void;
  isLoading?: boolean;
  selectedImage?: string;
  onImageUploaded: (url: string) => void;
  onImageRemoved: () => void;
}

export function ChatInput({
  value,
  onValueChange,
  onSend,
  isLoading = false,
  selectedImage,
  onImageUploaded,
  onImageRemoved,
}: ChatInputProps) {
  const textareaRef = useRef<HTMLTextAreaElement>(null);
  const fileRef = useRef<HTMLInputElement>(null);
  const [isUploading, setIsUploading] = useState(false);
  const disabled = isLoading || isUploading;
  const canSend = (value.trim().length > 0 || Boolean(selectedImage)) && !disabled;

  useEffect(() => {
    if (!textareaRef.current) return;
    textareaRef.current.style.height = 'auto';
    textareaRef.current.style.height = `${Math.min(textareaRef.current.scrollHeight, 180)}px`;
  }, [value]);

  const onKeyDown = (event: KeyboardEvent<HTMLTextAreaElement>) => {
    if (event.key !== 'Enter') return;
    if (event.shiftKey) return;
    event.preventDefault();
    if (canSend) onSend();
  };

  const onFileChange = async (event: ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (!file) return;

    try {
      setIsUploading(true);
      const result = await uploadImage(file);
      if (result.success && result.url) {
        onImageUploaded(result.url);
      }
    } finally {
      setIsUploading(false);
      if (fileRef.current) {
        fileRef.current.value = '';
      }
    }
  };

  return (
    <div className="sticky bottom-0 z-20 border-t border-white/10 bg-[radial-gradient(circle_at_top,rgba(34,211,238,0.08),transparent_40%),rgba(12,12,24,0.84)] backdrop-blur-xl">
      <div className="p-3 sm:p-4">
        {selectedImage && (
          <div className="mb-3 flex items-center gap-3 rounded-xl border border-white/10 bg-black/30 px-3 py-2">
            <img src={selectedImage} alt="Selected" className="h-10 w-10 rounded-md object-cover" />
            <p className="text-xs text-muted-foreground">Image attached</p>
            <Button
              type="button"
              size="icon"
              variant="ghost"
              className="ml-auto h-7 w-7 rounded-full text-muted-foreground hover:text-foreground"
              onClick={onImageRemoved}
              disabled={disabled}
            >
              <X className="h-4 w-4" />
            </Button>
          </div>
        )}

        <div className="container mx-auto max-w-5xl">
          <div className="rounded-2xl px-4 py-3 flex items-end gap-2 min-h-[56px] border border-white/15 bg-black/35 shadow-[0_0_0_1px_rgba(255,255,255,0.04),0_8px_30px_rgba(0,0,0,0.45)] focus-within:ring-2 focus-within:ring-cyan-400/45 transition-all">
            <TooltipProvider delayDuration={100}>
              <Tooltip>
                <TooltipTrigger asChild>
                  <Button
                    type="button"
                    variant="ghost"
                    className="w-10 h-10 rounded-full border border-white/20 text-cyan-200 hover:text-white hover:border-cyan-300/50 hover:shadow-[0_0_20px_rgba(56,189,248,0.35)] shrink-0"
                    onClick={() => fileRef.current?.click()}
                    disabled={disabled}
                  >
                    {isUploading ? <Loader2 className="h-4 w-4 animate-spin" /> : <ImageIcon className="h-4 w-4" />}
                  </Button>
                </TooltipTrigger>
                <TooltipContent>Upload image</TooltipContent>
              </Tooltip>
            </TooltipProvider>

            <textarea
              ref={textareaRef}
              value={value}
              onChange={(event) => onValueChange(event.target.value)}
              onKeyDown={onKeyDown}
              disabled={disabled}
              rows={1}
              placeholder="Paste a product link or ask me something..."
              className="flex-1 max-h-[180px] resize-none overflow-y-auto bg-transparent px-1 py-2 text-sm text-foreground placeholder:text-muted-foreground/80 focus:outline-none"
            />

            <Button
              type="button"
              onClick={onSend}
              disabled={!canSend}
              className={cn(
                'w-11 h-11 rounded-full flex items-center justify-center shrink-0 text-white bg-gradient-to-r from-fuchsia-600 to-cyan-500 transition-all',
                canSend
                  ? 'hover:scale-105 hover:shadow-[0_0_24px_rgba(34,211,238,0.5)] active:scale-95'
                  : 'opacity-50 cursor-not-allowed'
              )}
            >
              <Send className="h-4 w-4" />
            </Button>
          </div>
        </div>

        <input
          ref={fileRef}
          type="file"
          accept="image/*"
          className="hidden"
          onChange={onFileChange}
          disabled={disabled}
        />
      </div>
    </div>
  );
}
