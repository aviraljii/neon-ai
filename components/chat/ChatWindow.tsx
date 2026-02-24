'use client';

import { useEffect, useMemo, useRef, useState } from 'react';
import { Sparkles } from 'lucide-react';
import { ScrollArea } from '@/components/ui/scroll-area';
import { sendChatMessage } from '@/lib/api';
import {
  ChatSession,
  Message,
  createSession,
  getAutoTitle,
  loadActiveChatId,
  loadSessions,
  saveActiveChatId,
  saveSessions,
  updateMetrics,
} from '@/lib/chat-storage';
import { MessageBubble } from './MessageBubble';
import { ChatInput } from './ChatInput';
import { ChatSidebar } from './ChatSidebar';

const WELCOME_MESSAGE =
  'Hello! I\'m Neon AI, your shopping assistant. I can help you analyze clothing products, compare options, suggest items based on your budget, and generate social media content. Share a product link or ask me anything about fashion and clothing!';

function sortSessions(sessions: ChatSession[]) {
  return [...sessions].sort((a, b) => b.updatedAt - a.updatedAt);
}

export function ChatWindow() {
  const [sessions, setSessions] = useState<ChatSession[]>([]);
  const [activeChatId, setActiveChatId] = useState<string | null>(null);
  const [input, setInput] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [selectedImage, setSelectedImage] = useState('');
  const scrollBottomRef = useRef<HTMLDivElement>(null);

  const activeSession = useMemo(
    () => sessions.find((session) => session.id === activeChatId) ?? null,
    [sessions, activeChatId]
  );
  const messages = activeSession?.messages ?? [];

  useEffect(() => {
    const stored = loadSessions();
    const storedActiveId = loadActiveChatId();
    setSessions(stored);

    if (storedActiveId && stored.some((session) => session.id === storedActiveId)) {
      setActiveChatId(storedActiveId);
      return;
    }

    setActiveChatId(stored[0]?.id ?? null);
  }, []);

  useEffect(() => {
    saveSessions(sessions);
  }, [sessions]);

  useEffect(() => {
    if (activeChatId) saveActiveChatId(activeChatId);
  }, [activeChatId]);

  useEffect(() => {
    scrollBottomRef.current?.scrollIntoView({ behavior: 'smooth', block: 'end' });
  }, [messages, isLoading, activeChatId]);

  const updateSessionMessages = (chatId: string, nextMessages: Message[]) => {
    setSessions((prevSessions) =>
      sortSessions(
        prevSessions.map((session) =>
          session.id === chatId
            ? {
                ...session,
                messages: nextMessages,
                title: getAutoTitle(nextMessages),
                updatedAt: Date.now(),
              }
            : session
        )
      )
    );
  };

  const handleSend = async () => {
    if ((!input.trim() && !selectedImage) || isLoading) return;

    const userText = input.trim();
    const userMessage: Message = {
      id: Date.now().toString(),
      content: userText || '[Image attached]',
      isAi: false,
      imageUrl: selectedImage,
    };

    const previousMessages = activeSession?.messages ?? [];
    const chatHistory = previousMessages
      .filter((msg) => msg.content.length > 0 && !msg.isError)
      .map((msg) => ({
        role: msg.isAi ? 'assistant' : 'user',
        content: msg.content,
      })) as { role: 'user' | 'assistant'; content: string }[];

    let targetChatId = activeChatId;
    let nextMessageSnapshot: Message[] = [];
    let isNewChat = false;

    if (!targetChatId) {
      isNewChat = true;
      const newSession = createSession();
      nextMessageSnapshot = [
        { id: `${Date.now()}_intro`, content: WELCOME_MESSAGE, isAi: true },
        userMessage,
      ];
      const preparedSession: ChatSession = {
        ...newSession,
        messages: nextMessageSnapshot,
        title: getAutoTitle(nextMessageSnapshot),
        updatedAt: Date.now(),
      };
      targetChatId = preparedSession.id;
      setActiveChatId(preparedSession.id);
      setSessions((prev) => sortSessions([preparedSession, ...prev]));
    } else {
      nextMessageSnapshot = [...previousMessages, userMessage];
      updateSessionMessages(targetChatId, nextMessageSnapshot);
    }

    setInput('');
    setSelectedImage('');
    updateMetrics(userText.length || userMessage.content.length, isNewChat);
    setIsLoading(true);

    try {
      const result = await sendChatMessage({
        message: userMessage.content,
        chatHistory,
        imageUrl: selectedImage,
      });

      if (!result.success || result.error) {
        throw new Error(result.error || 'Failed to get response from Neon AI');
      }

      const aiMessage: Message = {
        id: (Date.now() + 1).toString(),
        content: result.response,
        isAi: true,
      };

      if (targetChatId) {
        const updatedMessages = [...nextMessageSnapshot, aiMessage];
        nextMessageSnapshot = updatedMessages;
        updateSessionMessages(targetChatId, updatedMessages);
      }
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : 'An unexpected error occurred';
      const isRateLimited =
        /AI_RATE_LIMITED|429|too many requests|quota exceeded/i.test(errorMessage);

      let displayError = errorMessage;
      if (isRateLimited) {
        const retryMatch = errorMessage.match(/(\d+)\s*seconds?/i);
        displayError = retryMatch
          ? `Rate limit reached. Please try again in about ${retryMatch[1]} seconds.`
          : 'Rate limit reached. Please wait a moment and try again.';
      } else if (errorMessage.includes('AI service is temporarily unavailable')) {
        displayError = 'Neon AI is temporarily unavailable. Please try again in a moment.';
      }

      const errorChatMessage: Message = {
        id: (Date.now() + 1).toString(),
        content: displayError,
        isAi: true,
        isError: true,
      };

      if (targetChatId) {
        const updatedMessages = [...nextMessageSnapshot, errorChatMessage];
        nextMessageSnapshot = updatedMessages;
        updateSessionMessages(targetChatId, updatedMessages);
      }

      console.error('Chat error:', error);
    } finally {
      setIsLoading(false);
    }
  };

  const handleCreateNewChat = () => {
    setActiveChatId(null);
    setInput('');
    setSelectedImage('');
  };

  const handleSelectChat = (chatId: string) => {
    setActiveChatId(chatId);
    setInput('');
    setSelectedImage('');
  };

  return (
    <div className="relative flex h-full overflow-hidden">
      <ChatSidebar
        sessions={sessions}
        activeChatId={activeChatId}
        onNewChat={handleCreateNewChat}
        onSelectChat={handleSelectChat}
      />

      <div className="flex min-w-0 flex-1 flex-col bg-[radial-gradient(circle_at_top,rgba(147,51,234,0.12),transparent_38%),rgba(4,6,18,0.7)]">
        <div className="border-b border-white/10 p-4 sm:px-6">
          <div className="ml-12 flex items-center gap-3 md:ml-0">
            <div className="rounded-lg bg-gradient-to-r from-purple-600 to-cyan-500 p-2 neon-glow-pulse">
              <Sparkles className="h-5 w-5 text-white" />
            </div>
            <div>
              <h1 className="bg-gradient-to-r from-purple-400 to-cyan-300 bg-clip-text text-lg font-bold text-transparent">
                Neon AI Chat
              </h1>
              <p className="text-xs text-muted-foreground sm:text-sm">
                {activeSession ? activeSession.title : 'Start a new conversation'}
              </p>
            </div>
          </div>
        </div>

        <ScrollArea className="flex-1 px-4 py-4 sm:px-6">
          <div className="mx-auto w-full max-w-5xl space-y-4">
            {messages.length === 0 && (
              <div className="rounded-2xl border border-dashed border-white/15 bg-black/25 px-6 py-8 text-center">
                <h2 className="text-base font-semibold text-foreground">New Chat</h2>
                <p className="mt-2 text-sm text-muted-foreground">
                  Ask Neon AI about products, comparisons, and recommendations.
                </p>
              </div>
            )}
            {messages.map((message) => (
              <MessageBubble
                key={message.id}
                content={message.content}
                isAi={message.isAi}
                isError={message.isError}
                imageUrl={message.imageUrl}
                isTyping={false}
              />
            ))}
            {isLoading && <MessageBubble content="" isAi={true} isLoading={true} />}
            <div ref={scrollBottomRef} />
          </div>
        </ScrollArea>

        <ChatInput
          value={input}
          onValueChange={setInput}
          onSend={handleSend}
          isLoading={isLoading}
          selectedImage={selectedImage}
          onImageUploaded={setSelectedImage}
          onImageRemoved={() => setSelectedImage('')}
        />
      </div>
    </div>
  );
}
