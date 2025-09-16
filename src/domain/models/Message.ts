import { ArtifactDelta } from '@/types/api';

export class Message {
  constructor(
    public readonly id: string,
    public readonly content: string,
    public readonly sender: 'user' | 'agent',
    public readonly timestamp: Date,
    public readonly artifactDelta?: ArtifactDelta,
    public readonly invocationId?: string
  ) {}

  static createUser(content: string): Message {
    return new Message(
      Date.now().toString(),
      content.trim(),
      'user',
      new Date()
    );
  }

  static createAgent(
    content: string,
    artifactDelta?: ArtifactDelta,
    invocationId?: string
  ): Message {
    return new Message(
      Date.now().toString(),
      content,
      'agent',
      new Date(),
      artifactDelta,
      invocationId
    );
  }

  static createFallback(): Message {
    return new Message(
      Date.now().toString(),
      'エージェントからの応答を処理中...',
      'agent',
      new Date()
    );
  }

  static createError(error?: Error | unknown): Message {
    const errorMessage = error instanceof Error
      ? error.message
      : typeof error === 'string'
        ? error
        : 'エラーが発生しました。API接続を確認してください。';

    return new Message(
      (Date.now() + 1).toString(),
      errorMessage,
      'agent',
      new Date()
    );
  }

  // Legacy互換性のためのプロパティ
  toPlainObject() {
    return {
      id: this.id,
      content: this.content,
      sender: this.sender,
      timestamp: this.timestamp,
      artifactDelta: this.artifactDelta,
      invocationId: this.invocationId,
    };
  }
}