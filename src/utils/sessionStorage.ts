import { ChatSession } from '@/types/chat';

export const saveSessionsToStorage = (sessions: ChatSession[]) => {
  try {
    localStorage.setItem('chatSessions', JSON.stringify(sessions));
  } catch (error) {
    console.error('Failed to save sessions to localStorage:', error);
  }
};

export const loadSessionsFromStorage = (): ChatSession[] => {
  try {
    const savedSessions = localStorage.getItem('chatSessions');
    if (savedSessions) {
      return JSON.parse(savedSessions).map((session: any) => ({
        ...session,
        createdAt: new Date(session.createdAt),
        messages: session.messages.map((msg: any) => ({
          ...msg,
          timestamp: new Date(msg.timestamp),
        })),
      }));
    }
    return [];
  } catch (error) {
    console.error('Failed to load sessions from localStorage:', error);
    return [];
  }
};

export const clearSessionsFromStorage = () => {
  try {
    localStorage.removeItem('chatSessions');
  } catch (error) {
    console.error('Failed to clear sessions from localStorage:', error);
  }
};