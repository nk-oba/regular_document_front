import { Message } from './Message';

export class ChatSession {
  constructor(
    public readonly id: string,
    public readonly messages: Message[],
    public readonly title: string,
    public readonly createdAt: Date,
    public readonly selectedAgent?: string
  ) {}

  static create(_userId: string, selectedAgent: string): ChatSession {
    const sessionId = `session_${Date.now()}_${Math.floor(Math.random() * 1000)}`;
    return new ChatSession(
      sessionId,
      [],
      '新しいチャット',
      new Date(),
      selectedAgent
    );
  }

  addMessage(message: Message): ChatSession {
    return new ChatSession(
      this.id,
      [...this.messages, message],
      this.title,
      this.createdAt,
      this.selectedAgent
    );
  }

  addMessages(messages: Message[]): ChatSession {
    return new ChatSession(
      this.id,
      [...this.messages, ...messages],
      this.title,
      this.createdAt,
      this.selectedAgent
    );
  }

  updateTitle(newTitle: string): ChatSession {
    return new ChatSession(
      this.id,
      this.messages,
      newTitle,
      this.createdAt,
      this.selectedAgent
    );
  }

  changeAgent(agentId: string): ChatSession {
    return new ChatSession(
      this.id,
      this.messages,
      this.title,
      this.createdAt,
      agentId
    );
  }

  generateTitleFromFirstMessage(): string {
    if (this.messages.length === 0) return '新しいチャット';

    const firstUserMessage = this.messages.find(m => m.sender === 'user');
    if (!firstUserMessage) return '新しいチャット';

    const content = firstUserMessage.content;
    return content.slice(0, 50) + (content.length > 50 ? '...' : '');
  }

  // Legacy互換性のためのプロパティ
  toPlainObject() {
    return {
      id: this.id,
      messages: this.messages.map(m => m.toPlainObject()),
      title: this.title,
      createdAt: this.createdAt,
      selectedAgent: this.selectedAgent,
    };
  }
}