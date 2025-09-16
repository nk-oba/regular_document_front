import { ChatService } from '@/domain/services/ChatService';
import {
  ChatRepository,
  SessionRepository,
} from '@/domain/repositories/ChatRepository';
import { ChatApiRepository } from './api/ChatApiRepository';
import { LocalSessionRepository } from './storage/LocalSessionRepository';

/**
 * 依存性注入コンテナ
 * シングルトンインスタンスを管理し、依存関係を解決
 */
export class ServiceContainer {
  private static instance: ServiceContainer;
  private chatService: ChatService | null = null;
  private chatRepository: ChatRepository | null = null;
  private sessionRepository: SessionRepository | null = null;

  private constructor() {}

  static getInstance(): ServiceContainer {
    if (!ServiceContainer.instance) {
      ServiceContainer.instance = new ServiceContainer();
    }
    return ServiceContainer.instance;
  }

  getChatRepository(): ChatRepository {
    if (!this.chatRepository) {
      this.chatRepository = new ChatApiRepository();
    }
    return this.chatRepository;
  }

  getSessionRepository(): SessionRepository {
    if (!this.sessionRepository) {
      this.sessionRepository = new LocalSessionRepository();
    }
    return this.sessionRepository;
  }

  getChatService(): ChatService {
    if (!this.chatService) {
      this.chatService = new ChatService(
        this.getChatRepository(),
        this.getSessionRepository()
      );
    }
    return this.chatService;
  }

  setChatRepository(repository: ChatRepository): void {
    this.chatRepository = repository;
    this.chatService = null; // ChatServiceを再構築させる
  }

  setSessionRepository(repository: SessionRepository): void {
    this.sessionRepository = repository;
    this.chatService = null; // ChatServiceを再構築させる
  }

  reset(): void {
    this.chatService = null;
    this.chatRepository = null;
    this.sessionRepository = null;
  }
}
