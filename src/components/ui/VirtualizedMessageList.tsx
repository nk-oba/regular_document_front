import React, { memo, useEffect, useRef } from 'react';
import { Message } from '@/domain/models/Message';
import { User } from '@/stores/authStore';
import MessageBubble from '@/components/MessageBubble';

interface VirtualizedMessageListProps {
  messages: Message[];
  user: User | null;
  conversationId?: string;
  selectedAgent: string;
  isLoading: boolean;
}

const ITEM_HEIGHT = 100;
const BUFFER_SIZE = 5;

const VirtualizedMessageList: React.FC<VirtualizedMessageListProps> = ({
  messages,
  user,
  conversationId,
  selectedAgent,
  isLoading,
}) => {
  const containerRef = useRef<HTMLDivElement>(null);
  const scrollRef = useRef<HTMLDivElement>(null);
  const [visibleRange, setVisibleRange] = React.useState({
    start: 0,
    end: Math.min(20, messages.length),
  });

  const userId = user?.id || 'anonymous';

  const scrollToBottom = () => {
    if (scrollRef.current) {
      scrollRef.current.scrollTop = scrollRef.current.scrollHeight;
    }
  };

  useEffect(() => {
    scrollToBottom();
  }, [messages.length]);

  const shouldVirtualize = messages.length > 50;

  if (!shouldVirtualize) {
    return (
      <div ref={scrollRef} className="flex-1 overflow-y-auto p-4 space-y-4">
        {messages.length === 0 && !isLoading && (
          <div className="flex items-center justify-center h-full">
            <div className="text-center text-gray-500">
              <h2 className="text-2xl font-bold mb-4">AIエージェント</h2>
              <p>メッセージを送信して会話を開始してください</p>
              <p className="text-sm mt-2">
                例: 「売上分析のプレゼン資料を作成してください」
              </p>
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
      </div>
    );
  }

  // 仮想化レンダリング
  const handleScroll = () => {
    if (!containerRef.current) return;

    const scrollTop = containerRef.current.scrollTop;
    const containerHeight = containerRef.current.clientHeight;

    const start = Math.max(
      0,
      Math.floor(scrollTop / ITEM_HEIGHT) - BUFFER_SIZE
    );
    const end = Math.min(
      messages.length,
      Math.ceil((scrollTop + containerHeight) / ITEM_HEIGHT) + BUFFER_SIZE
    );

    setVisibleRange({ start, end });
  };

  const visibleMessages = messages.slice(visibleRange.start, visibleRange.end);
  const offsetY = visibleRange.start * ITEM_HEIGHT;

  return (
    <div
      ref={containerRef}
      className="flex-1 overflow-y-auto p-4"
      onScroll={handleScroll}
    >
      <div
        style={{ height: messages.length * ITEM_HEIGHT, position: 'relative' }}
      >
        <div
          style={{
            transform: `translateY(${offsetY}px)`,
            position: 'absolute',
            top: 0,
            left: 0,
            right: 0,
          }}
          className="space-y-4"
        >
          {visibleMessages.map((message) => (
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
        </div>
      </div>
    </div>
  );
};

export default memo(VirtualizedMessageList);
