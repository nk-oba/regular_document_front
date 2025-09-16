import { useMemo } from 'react';
import { ChatService } from '@/domain/services/ChatService';
import { ServiceContainer } from '@/infrastructure/ServiceContainer';

/**
 * ChatServiceのカスタムhook
 * サービスのインスタンス化を最適化し、不要な再レンダリングを防ぐ
 */
export const useChatService = (): ChatService => {
  return useMemo(() => {
    return ServiceContainer.getInstance().getChatService();
  }, []);
};

/**
 * API健康状態チェック用のhook
 */
export const useApiHealth = () => {
  const chatService = useChatService();

  const checkHealth = useMemo(() => {
    return async (): Promise<boolean> => {
      try {
        return await chatService.checkApiHealth();
      } catch (error) {
        return false;
      }
    };
  }, [chatService]);

  return { checkHealth };
};
