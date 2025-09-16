import { Message } from '@/types/chat';
import { MessageResponse } from '@/types/api';

export class MessageService {
  /**
   * エージェントレスポンスからメッセージを抽出
   */
  static extractMessagesFromResponse(response: MessageResponse): Message[] {
    const agentMessages: Message[] = [];
    let messageIdCounter = Date.now() + 1;

    for (const event of response) {
      if (event?.content?.parts) {
        for (const part of event.content.parts) {
          if (part?.text) {
            const agentMessage: Message = {
              id: (messageIdCounter++).toString(),
              content: part.text,
              sender: 'agent',
              timestamp: new Date(),
              artifactDelta: event?.actions?.artifactDelta,
              invocationId: event?.invocationId,
            };
            agentMessages.push(agentMessage);
          }
        }
      }
    }

    return agentMessages;
  }

  /**
   * フォールバックメッセージを作成
   */
  static createFallbackMessage(): Message {
    return {
      id: Date.now().toString(),
      content: 'エージェントからの応答を処理中...',
      sender: 'agent',
      timestamp: new Date(),
    };
  }

  /**
   * エラーメッセージを作成
   */
  static createErrorMessage(error?: Error | unknown): Message {
    const errorMessage = error instanceof Error
      ? error.message
      : typeof error === 'string'
        ? error
        : 'エラーが発生しました。API接続を確認してください。';

    return {
      id: (Date.now() + 1).toString(),
      content: errorMessage,
      sender: 'agent',
      timestamp: new Date(),
    };
  }

  /**
   * ユーザーメッセージを作成
   */
  static createUserMessage(content: string): Message {
    return {
      id: Date.now().toString(),
      content: content.trim(),
      sender: 'user',
      timestamp: new Date(),
    };
  }
}