import React, { useEffect, useRef, memo } from 'react';
import { Message } from '@/domain/models/Message';
import { ChatSession } from '@/domain/models/ChatSession';
import { User } from '@/stores/authStore';
import MessageBubble from '@/components/MessageBubble';
import ChatInput from '@/components/ChatInput';
import AgentSelector from '@/components/AgentSelector';
import VirtualizedMessageList from '@/components/ui/VirtualizedMessageList';

interface ChatPresenterProps {
  messages: Message[];
  isLoading: boolean;
  isApiReady: boolean;
  selectedAgent: string;
  session: ChatSession | null;
  user: User | null;
  conversationId?: string;
  onSendMessage: (content: string) => void;
  onAgentChange: (agentId: string) => void;
}

const ChatPresenter: React.FC<ChatPresenterProps> = ({
  messages,
  isLoading,
  isApiReady,
  selectedAgent,
  session,
  user,
  conversationId,
  onSendMessage,
  onAgentChange,
}) => {
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const userId = user?.id || 'anonymous';

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  };

  useEffect(() => {
    scrollToBottom();
  }, [messages]);

  return (
    <div className="flex flex-col h-full">
      <div className="p-2 bg-gray-50 border-b">
        <div className="flex items-center justify-between">
          <span className="text-sm font-medium"></span>
          <div className="flex items-center">
            <div
              className={`w-2 h-2 rounded-full mr-2 ${
                isApiReady ? 'bg-green-500' : 'bg-red-500'
              }`}
            />
            <span className="text-xs text-gray-600">
              {isApiReady ? 'API準備完了' : 'API未接続'}
            </span>
          </div>
        </div>
      </div>

      <AgentSelector
        selectedAgent={selectedAgent}
        onAgentChange={onAgentChange}
        isConnected={isApiReady}
      />

      {/* 大量メッセージの場合は仮想化リストを使用、そうでなければ通常のレンダリング */}
      {messages.length > 50 ? (
        <VirtualizedMessageList
          messages={messages}
          user={user}
          conversationId={conversationId}
          selectedAgent={selectedAgent}
          isLoading={isLoading}
        />
      ) : (
        <div className="flex-1 overflow-y-auto p-4 space-y-4">
          {messages.length === 0 && (
            <div className="flex items-center justify-center h-full">
              <div className="text-center text-gray-500">
                <h2 className="text-2xl font-bold mb-4">
                  {session ? '新しいチャット' : 'AIエージェント'}
                </h2>
                <p>メッセージを送信して会話を開始してください</p>
                <p className="text-sm mt-2">
                  例: 「売上分析のプレゼン資料を作成してください」
                </p>
                {session?.selectedAgent && (
                  <p className="text-sm mt-2 text-blue-600">
                    使用中エージェント: {session.selectedAgent}
                  </p>
                )}
              </div>
            </div>
          )}

          {messages.map((message) => (
            <MessageBubble
              key={message.id}
              message={message.toPlainObject()}
              userName={user?.name}
              userId={userId}
              sessionId={conversationId}
              selectedAgent={selectedAgent}
            />
          ))}

          {isLoading && (
            <div className="flex justify-start">
              <div className="bg-gray-100 rounded-lg p-3 max-w-xs">
                <div className="flex space-x-1">
                  <div className="w-2 h-2 bg-gray-400 rounded-full animate-bounce"></div>
                  <div
                    className="w-2 h-2 bg-gray-400 rounded-full animate-bounce"
                    style={{ animationDelay: '0.1s' }}
                  ></div>
                  <div
                    className="w-2 h-2 bg-gray-400 rounded-full animate-bounce"
                    style={{ animationDelay: '0.2s' }}
                  ></div>
                </div>
              </div>
            </div>
          )}

          <div ref={messagesEndRef} />
        </div>
      )}

      <ChatInput
        onSendMessage={onSendMessage}
        disabled={isLoading || !isApiReady}
      />
    </div>
  );
};

export default memo(ChatPresenter);