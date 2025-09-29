import { ChatRepository } from '@/domain/repositories/ChatRepository';
import { MessageRequest, MessageResponse, SessionResponse } from '@/types/api';
import { chatApi } from '@/lib/api';

export class ChatApiRepository implements ChatRepository {
  async createSession(
    appName: string,
    userId: string,
    sessionId: string
  ): Promise<void> {
    await chatApi.createSession(appName, userId, sessionId, {});
  }

  async getSession(
    appName: string,
    userId: string,
    sessionId: string
  ): Promise<SessionResponse> {
    return await chatApi.getSession(appName, userId, sessionId);
  }

  async sendMessage(request: MessageRequest): Promise<MessageResponse> {
    return await chatApi.sendMessage(request);
  }

  async getAvailableApps(): Promise<string[]> {
    return await chatApi.listApps();
  }

  async checkHealth(): Promise<boolean> {
    try {
      const result = await chatApi.healthCheck();
      return result.status === 'ok';
    } catch {
      return false;
    }
  }
}
