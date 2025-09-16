import { ChatSession } from '../models/ChatSession';
import { MessageRequest, MessageResponse } from '@/types/api';

export interface ChatRepository {
  // セッション管理
  createSession(
    appName: string,
    userId: string,
    sessionId: string
  ): Promise<void>;

  // メッセージ送信
  sendMessage(request: MessageRequest): Promise<MessageResponse>;

  // アプリ一覧取得
  getAvailableApps(): Promise<string[]>;

  // ヘルスチェック
  checkHealth(): Promise<boolean>;
}

export interface SessionRepository {
  // ローカルセッション管理
  saveSessions(sessions: ChatSession[]): void;
  loadSessions(): ChatSession[];
  saveCurrentSession(session: ChatSession | null): void;
  loadCurrentSession(): ChatSession | null;
  clearSessions(): void;
}