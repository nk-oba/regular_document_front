import React, { useEffect, useState } from 'react';
import { ChatSession } from '@/domain/models/ChatSession';
import { Message } from '@/domain/models/Message';
import { ChatService } from '@/domain/services/ChatService';
import { ChatApiRepository } from '@/infrastructure/api/ChatApiRepository';
import { LocalSessionRepository } from '@/infrastructure/storage/LocalSessionRepository';
import { useAuth } from '@/hooks/useAuth';
import ChatPresenter from '../presenters/ChatPresenter';

interface ChatContainerProps {
  session: ChatSession | null;
  onSessionUpdate: (session: ChatSession) => void;
}

const ChatContainer: React.FC<ChatContainerProps> = ({ session, onSessionUpdate }) => {
  const { user } = useAuth();
  const [messages, setMessages] = useState<Message[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [conversationId, setConversationId] = useState<string | undefined>();
  const [isApiReady, setIsApiReady] = useState(true);
  const [selectedAgent, setSelectedAgent] = useState<string>(
    session?.selectedAgent || 'document_creating_agent'
  );

  // ChatServiceのインスタンス化
  const chatService = new ChatService(
    new ChatApiRepository(),
    new LocalSessionRepository()
  );

  const userId = user?.id || 'anonymous';

  useEffect(() => {
    if (session) {
      setMessages(session.messages);
      setConversationId(session.id);
      setSelectedAgent(session.selectedAgent || 'document_creating_agent');
      setIsLoading(false);
    } else {
      setMessages([]);
      setConversationId(undefined);
      setSelectedAgent('document_creating_agent');
      setIsLoading(false);
    }
  }, [session]);

  useEffect(() => {
    // APIの健康状態をチェック
    chatService
      .checkApiHealth()
      .then(setIsApiReady)
      .catch(() => setIsApiReady(false));
  }, []);

  const handleSendMessage = async (content: string) => {
    if (!content.trim() || !isApiReady) return;

    // ユーザーメッセージを即座に表示
    const userMessage = Message.createUser(content);
    const messagesWithUser = [...messages, userMessage];
    setMessages(messagesWithUser);
    setIsLoading(true);

    try {
      const result = await chatService.sendMessage(
        content,
        session,
        selectedAgent,
        userId,
        userMessage
      );

      // エージェントメッセージを追加
      const allMessages = [...messagesWithUser, ...result.agentMessages];
      setMessages(allMessages);

      // セッション更新
      onSessionUpdate(result.updatedSession);
      setConversationId(result.updatedSession.id);
      setIsLoading(false);
    } catch (error) {
      const errorMessage = Message.createError(error);
      const messagesWithError = [...messagesWithUser, errorMessage];
      setMessages(messagesWithError);

      // エラーメッセージもセッションに保存
      if (session) {
        const updatedSession = session.addMessages([userMessage, errorMessage]);
        onSessionUpdate(updatedSession);
      }

      setIsLoading(false);
    }
  };

  const handleAgentChange = (agentId: string) => {
    setSelectedAgent(agentId);

    if (session) {
      const updatedSession = session.changeAgent(agentId);
      onSessionUpdate(updatedSession);
    }
  };


  return (
    <ChatPresenter
      messages={messages}
      isLoading={isLoading}
      isApiReady={isApiReady}
      selectedAgent={selectedAgent}
      session={session}
      user={user}
      conversationId={conversationId}
      onSendMessage={handleSendMessage}
      onAgentChange={handleAgentChange}
    />
  );
};

export default ChatContainer;