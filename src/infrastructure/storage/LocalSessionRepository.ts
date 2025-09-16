import { SessionRepository } from '@/domain/repositories/ChatRepository';
import { ChatSession } from '@/domain/models/ChatSession';
import { Message } from '@/domain/models/Message';
import { logger } from '@/utils/logger';

export class LocalSessionRepository implements SessionRepository {
  private readonly SESSIONS_KEY = 'chat-sessions';
  private readonly CURRENT_SESSION_KEY = 'current-session';

  saveSessions(sessions: ChatSession[]): void {
    try {
      const plainSessions = sessions.map(session => session.toPlainObject());
      localStorage.setItem(this.SESSIONS_KEY, JSON.stringify(plainSessions));
    } catch (error) {
      logger.error('Failed to save sessions', error, 'LocalSessionRepository');
    }
  }

  loadSessions(): ChatSession[] {
    try {
      const data = localStorage.getItem(this.SESSIONS_KEY);
      if (!data) return [];

      const plainSessions = JSON.parse(data);
      return plainSessions.map(this.deserializeChatSession);
    } catch (error) {
      logger.error('Failed to load sessions', error, 'LocalSessionRepository');
      return [];
    }
  }

  saveCurrentSession(session: ChatSession | null): void {
    try {
      if (session) {
        const plainSession = session.toPlainObject();
        localStorage.setItem(this.CURRENT_SESSION_KEY, JSON.stringify(plainSession));
      } else {
        localStorage.removeItem(this.CURRENT_SESSION_KEY);
      }
    } catch (error) {
      logger.error('Failed to save current session', error, 'LocalSessionRepository');
    }
  }

  loadCurrentSession(): ChatSession | null {
    try {
      const data = localStorage.getItem(this.CURRENT_SESSION_KEY);
      if (!data) return null;

      const plainSession = JSON.parse(data);
      return this.deserializeChatSession(plainSession);
    } catch (error) {
      logger.error('Failed to load current session', error, 'LocalSessionRepository');
      return null;
    }
  }

  clearSessions(): void {
    try {
      localStorage.removeItem(this.SESSIONS_KEY);
      localStorage.removeItem(this.CURRENT_SESSION_KEY);
    } catch (error) {
      logger.error('Failed to clear sessions', error, 'LocalSessionRepository');
    }
  }

  private deserializeChatSession(plain: any): ChatSession {
    const messages = plain.messages?.map((msgData: any) =>
      new Message(
        msgData.id,
        msgData.content,
        msgData.sender,
        new Date(msgData.timestamp),
        msgData.artifactDelta,
        msgData.invocationId
      )
    ) || [];

    return new ChatSession(
      plain.id,
      messages,
      plain.title,
      new Date(plain.createdAt),
      plain.selectedAgent
    );
  }
}