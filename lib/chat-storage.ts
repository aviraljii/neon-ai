'use client';

export interface Message {
  id: string;
  content: string;
  isAi: boolean;
  isError?: boolean;
  imageUrl?: string;
}

export interface ChatSession {
  id: string;
  title: string;
  messages: Message[];
  createdAt: number;
  updatedAt: number;
}

export interface UserMetrics {
  totalMessages: number;
  totalChats: number;
  lastActive: number;
  averageMessageLength: number;
}

const CHAT_STORAGE_KEY = 'neon_chat_sessions';
const ACTIVE_CHAT_KEY = 'neon_active_chat_id';
const METRICS_KEY = 'neon_user_metrics';

export function createSession(): ChatSession {
  const now = Date.now();
  return {
    id: `chat_${now}_${Math.random().toString(36).slice(2, 8)}`,
    title: 'New Chat',
    messages: [],
    createdAt: now,
    updatedAt: now,
  };
}

export function getAutoTitle(messages: Message[]): string {
  const firstUserMessage = messages.find((message) => !message.isAi && message.content.trim().length > 0);
  if (!firstUserMessage) return 'New Chat';
  return firstUserMessage.content.trim().slice(0, 60);
}

function canUseStorage(): boolean {
  return typeof window !== 'undefined' && typeof window.localStorage !== 'undefined';
}

export function loadSessions(): ChatSession[] {
  if (!canUseStorage()) return [];

  try {
    const raw = window.localStorage.getItem(CHAT_STORAGE_KEY);
    if (!raw) return [];

    const parsed = JSON.parse(raw) as ChatSession[];
    if (!Array.isArray(parsed)) return [];

    return parsed
      .filter((session) => session && typeof session.id === 'string' && Array.isArray(session.messages))
      .sort((a, b) => b.updatedAt - a.updatedAt)
      .slice(0, 40);
  } catch {
    return [];
  }
}

export function saveSessions(sessions: ChatSession[]) {
  if (!canUseStorage()) return;

  const normalized = sessions
    .sort((a, b) => b.updatedAt - a.updatedAt)
    .slice(0, 40);
  window.localStorage.setItem(CHAT_STORAGE_KEY, JSON.stringify(normalized));
}

export function loadActiveChatId(): string | null {
  if (!canUseStorage()) return null;
  return window.localStorage.getItem(ACTIVE_CHAT_KEY);
}

export function saveActiveChatId(id: string) {
  if (!canUseStorage()) return;
  window.localStorage.setItem(ACTIVE_CHAT_KEY, id);
}

export function loadMetrics(): UserMetrics {
  if (!canUseStorage()) {
    return {
      totalMessages: 0,
      totalChats: 0,
      lastActive: Date.now(),
      averageMessageLength: 0,
    };
  }

  try {
    const raw = window.localStorage.getItem(METRICS_KEY);
    if (!raw) {
      return {
        totalMessages: 0,
        totalChats: 0,
        lastActive: Date.now(),
        averageMessageLength: 0,
      };
    }
    return JSON.parse(raw) as UserMetrics;
  } catch {
    return {
      totalMessages: 0,
      totalChats: 0,
      lastActive: Date.now(),
      averageMessageLength: 0,
    };
  }
}

export function saveMetrics(metrics: UserMetrics) {
  if (!canUseStorage()) return;
  window.localStorage.setItem(METRICS_KEY, JSON.stringify(metrics));
}

export function updateMetrics(messageLength: number, chatCreated: boolean) {
  const current = loadMetrics();
  const totalMessages = current.totalMessages + 1;
  const weighted = current.averageMessageLength * current.totalMessages;
  const averageMessageLength = Number(((weighted + messageLength) / totalMessages).toFixed(2));

  const next: UserMetrics = {
    totalMessages,
    totalChats: chatCreated ? current.totalChats + 1 : current.totalChats,
    lastActive: Date.now(),
    averageMessageLength,
  };

  saveMetrics(next);
}
