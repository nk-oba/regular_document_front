import { ChatRepository, SessionRepository } from '../repositories/ChatRepository';
import { ChatSession } from '../models/ChatSession';
import { Message } from '../models/Message';
import { MessageResponse } from '@/types/api';
import { logger } from '@/utils/logger';

export class ChatService {
  constructor(
    private chatRepository: ChatRepository,
    private sessionRepository: SessionRepository
  ) {}

  async sendMessage(
    content: string,
    session: ChatSession | null,
    selectedAgent: string,
    userId: string,
    userMessage: Message
  ): Promise<{ updatedSession: ChatSession; agentMessages: Message[] }> {
    // セッションの準備
    let currentSession = session;
    if (!currentSession) {
      currentSession = ChatSession.create(userId, selectedAgent);
      try {
        await this.chatRepository.createSession(selectedAgent, userId, currentSession.id);
        logger.info('Backend session created', { sessionId: currentSession.id }, 'ChatService');
      } catch (error) {
        logger.error('Failed to create backend session', error, 'ChatService');
      }
    }

    // メッセージを送信
    try {
      const request = {
        appName: selectedAgent,
        userId: userId,
        sessionId: currentSession.id,
        newMessage: {
          parts: [{ text: content.trim() }],
          role: 'user',
        },
        streaming: false,
      };

      const response: MessageResponse = await this.chatRepository.sendMessage(request);

      // レスポンスからメッセージを抽出
      const agentMessages = this.extractMessagesFromResponse(response);

      // セッションを更新（ユーザーメッセージとエージェントメッセージを追加）
      let updatedSession = currentSession.addMessage(userMessage);
      updatedSession = updatedSession.addMessages(agentMessages);

      // タイトル更新が必要な場合
      if (updatedSession.title === '新しいチャット') {
        const newTitle = updatedSession.generateTitleFromFirstMessage();
        updatedSession = updatedSession.updateTitle(newTitle);
      }

      return { updatedSession, agentMessages };
    } catch (error) {
      logger.error('Failed to send message', error, 'ChatService');
      const errorMessage = Message.createError(error);
      const updatedSession = currentSession.addMessages([userMessage, errorMessage]);
      return { updatedSession, agentMessages: [errorMessage] };
    }
  }

  private extractMessagesFromResponse(response: MessageResponse): Message[] {
    const agentMessages: Message[] = [];

    for (const event of response) {
      if (event?.content?.parts) {
        for (const part of event.content.parts) {
          if (part?.text) {
            const agentMessage = Message.createAgent(
              part.text,
              event?.actions?.artifactDelta,
              event?.invocationId
            );
            agentMessages.push(agentMessage);
          }
        }
      }
    }

    // フォールバックメッセージ
    if (agentMessages.length === 0) {
      agentMessages.push(Message.createFallback());
    }

    return agentMessages;
  }

  async checkApiHealth(): Promise<boolean> {
    try {
      return await this.chatRepository.checkHealth();
    } catch (error) {
      logger.error('Health check failed', error, 'ChatService');
      return false;
    }
  }

  async getAvailableApps(): Promise<string[]> {
    try {
      return await this.chatRepository.getAvailableApps();
    } catch (error) {
      logger.error('Failed to get available apps', error, 'ChatService');
      return [];
    }
  }

  // セッション管理
  saveSessions(sessions: ChatSession[]): void {
    this.sessionRepository.saveSessions(sessions);
  }

  loadSessions(): ChatSession[] {
    return this.sessionRepository.loadSessions();
  }

  saveCurrentSession(session: ChatSession | null): void {
    this.sessionRepository.saveCurrentSession(session);
  }

  loadCurrentSession(): ChatSession | null {
    return this.sessionRepository.loadCurrentSession();
  }

  createSession(userId: string, selectedAgent: string): ChatSession {
    return ChatSession.create(userId, selectedAgent);
  }
}