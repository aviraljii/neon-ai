'use client';

import { useState } from 'react';
import { MessageSquarePlus, PanelLeft, Sparkles } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Sheet, SheetContent, SheetTrigger } from '@/components/ui/sheet';
import { cn } from '@/lib/utils';
import { ChatSession } from '@/lib/chat-storage';

interface ChatSidebarProps {
  sessions: ChatSession[];
  activeChatId: string | null;
  onNewChat: () => void;
  onSelectChat: (chatId: string) => void;
}

interface SidebarContentProps extends ChatSidebarProps {
  onItemSelected?: () => void;
}

function SidebarContent({ sessions, activeChatId, onNewChat, onSelectChat, onItemSelected }: SidebarContentProps) {
  return (
    <div className="flex h-full flex-col bg-black/30 backdrop-blur-xl">
      <div className="border-b border-white/10 p-4">
        <Button
          type="button"
          onClick={() => {
            onNewChat();
            onItemSelected?.();
          }}
          className="w-full justify-start gap-2 rounded-xl border border-cyan-300/20 bg-gradient-to-r from-fuchsia-600/30 to-cyan-500/30 text-foreground hover:from-fuchsia-600/45 hover:to-cyan-500/45"
        >
          <MessageSquarePlus className="h-4 w-4" />
          New Chat
        </Button>
      </div>

      <ScrollArea className="flex-1 px-2 py-3">
        <div className="space-y-1">
          {sessions.length === 0 && (
            <div className="rounded-xl border border-dashed border-white/10 px-3 py-4 text-xs text-muted-foreground">
              Start a chat to build history.
            </div>
          )}
          {sessions.map((session) => (
            <button
              key={session.id}
              type="button"
              onClick={() => {
                onSelectChat(session.id);
                onItemSelected?.();
              }}
              className={cn(
                'w-full rounded-xl px-3 py-2 text-left transition-colors',
                activeChatId === session.id
                  ? 'bg-cyan-400/15 text-cyan-100 border border-cyan-300/30'
                  : 'border border-transparent text-muted-foreground hover:border-white/10 hover:bg-white/5 hover:text-foreground'
              )}
            >
              <p className="truncate text-sm font-medium">{session.title || 'New Chat'}</p>
              <p className="mt-1 text-[11px] opacity-70">
                {new Date(session.updatedAt).toLocaleDateString()}
              </p>
            </button>
          ))}
        </div>
      </ScrollArea>
    </div>
  );
}

export function ChatSidebar(props: ChatSidebarProps) {
  const [open, setOpen] = useState(false);

  return (
    <>
      <aside className="hidden w-72 shrink-0 border-r border-white/10 md:block">
        <SidebarContent {...props} />
      </aside>

      <div className="absolute left-4 top-4 z-30 md:hidden">
        <Sheet open={open} onOpenChange={setOpen}>
          <SheetTrigger asChild>
            <Button
              type="button"
              size="icon"
              variant="ghost"
              className="h-9 w-9 rounded-full border border-white/15 text-cyan-200 hover:text-white"
            >
              <PanelLeft className="h-4 w-4" />
            </Button>
          </SheetTrigger>
          <SheetContent
            side="left"
            className="w-[85vw] border-r border-white/10 bg-[#090915] p-0 sm:max-w-xs"
          >
            <div className="flex h-14 items-center gap-2 border-b border-white/10 px-4 text-cyan-200">
              <Sparkles className="h-4 w-4" />
              <span className="text-sm font-semibold">Chats</span>
            </div>
            <SidebarContent {...props} onItemSelected={() => setOpen(false)} />
          </SheetContent>
        </Sheet>
      </div>
    </>
  );
}
