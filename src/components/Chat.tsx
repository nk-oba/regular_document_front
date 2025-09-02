"use client";

import React, { useState, useRef, useEffect } from "react";
import { Message, ChatSession } from "@/types/chat";
import { chatApi } from "@/lib/api";
import MessageBubble from "./MessageBubble";
import ChatInput from "./ChatInput";
import AgentSelector from "./AgentSelector";

interface ChatProps {
  session: ChatSession | null;
  onSessionUpdate: (session: ChatSession) => void;
}

const Chat: React.FC<ChatProps> = ({ session, onSessionUpdate }) => {
  const [messages, setMessages] = useState<Message[]>(session?.messages || []);
  const [isLoading, setIsLoading] = useState(false);
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const [conversationId, setConversationId] = useState<string | undefined>(
    session?.id
  );
  const [isApiReady, setIsApiReady] = useState(true);
  const [selectedAgent, setSelectedAgent] = useState<string>(
    session?.selectedAgent || "document_creating_agent"
  );
  // userId を一度生成したら保持する
  const [userId, setUserId] = useState<string>(() => 
    "user_" + Math.floor(Math.random() * 10000)
  );

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  };

  useEffect(() => {
    scrollToBottom();
  }, [messages]);

  useEffect(() => {
    if (session) {
      setMessages(session.messages);
      setConversationId(session.id);
      setSelectedAgent(session.selectedAgent || "document_creating_agent");

      setIsLoading(false);
    } else {
      setMessages([]);
      setConversationId(undefined);
      setSelectedAgent("document_creating_agent");
      setIsLoading(false);
    }
  }, [session]);

  useEffect(() => {
    // APIの健康状態をチェック
    chatApi.healthCheck()
      .then(() => {
        setIsApiReady(true);
      })
      .catch(() => {
        setIsApiReady(false);
      });
  }, []);

  const handleSendMessage = async (content: string) => {
    if (!content.trim() || !isApiReady) return;

    const userMessage: Message = {
      id: Date.now().toString(),
      content: content.trim(),
      sender: "user",
      timestamp: new Date(),
    };

    setMessages((prev) => [...prev, userMessage]);
    setIsLoading(true);

    try {
      const sessionId = conversationId || session?.id || Date.now().toString();
      
      // セッションが存在しない場合は作成
      if (!conversationId) {
        try {
          await chatApi.createSession(selectedAgent, userId, sessionId, {});
          setConversationId(sessionId);
        } catch (error) {
          // セッションが既に存在する場合は無視
          console.log("Session already exists or creation failed:", error);
          setConversationId(sessionId);
        }
      }

      // メッセージを送信
      const request = {
        appName: selectedAgent,
        userId: userId,
        sessionId: sessionId,
        newMessage: {
          parts: [{ text: content.trim() }],
          role: "user"
        },
        streaming: false
      };

      const response = await chatApi.sendMessage(request);
      
      // レスポンスから応答メッセージを抽出
      let agentResponseText = "エージェントからの応答を処理中...";
      
      if (Array.isArray(response)) {
        for (const event of response) {
          if (event?.content?.parts) {
            for (const part of event.content.parts) {
              if (part?.text) {
                agentResponseText = part.text;
                break;
              }
            }
          }
          if (agentResponseText !== "エージェントからの応答を処理中...") break;
        }
      }

      const agentMessage: Message = {
        id: (Date.now() + 1).toString(),
        content: agentResponseText,
        sender: "agent",
        timestamp: new Date(),
      };

      setMessages((prev) => {
        const newMessages = [...prev, agentMessage];
        if (session) {
          const updatedSession: ChatSession = {
            ...session,
            messages: newMessages,
          };
          onSessionUpdate(updatedSession);
        }
        return newMessages;
      });

      const updatedSession: ChatSession = {
        id: sessionId,
        messages: [...messages, userMessage, agentMessage],
        title:
          session?.title === "新しいチャット" || !session?.title
            ? content.slice(0, 50) + (content.length > 50 ? "..." : "")
            : session.title,
        createdAt: session?.createdAt || new Date(),
        selectedAgent,
      };

      onSessionUpdate(updatedSession);
      setIsLoading(false);
      
    } catch (error) {
      console.error("Failed to send message:", error);
      const errorMessage: Message = {
        id: (Date.now() + 1).toString(),
        content: "エラーが発生しました。API接続を確認してください。",
        sender: "agent",
        timestamp: new Date(),
      };
      setMessages((prev) => {
        const newMessages = [...prev, errorMessage];

        // エラーメッセージもセッションに保存
        if (session) {
          const updatedSession: ChatSession = {
            ...session,
            messages: newMessages,
          };
          onSessionUpdate(updatedSession);
        }

        return newMessages;
      });
      setIsLoading(false);
    }
  };

  const handleAgentChange = (agentId: string) => {
    setSelectedAgent(agentId);

    if (session) {
      const updatedSession: ChatSession = {
        ...session,
        selectedAgent: agentId,
      };
      onSessionUpdate(updatedSession);
    }
  };

  return (
    <div className="flex flex-col h-full">
      <div className="p-2 bg-gray-50 border-b">
        <div className="flex items-center justify-between">
          <span className="text-sm font-medium"></span>
          <div className="flex items-center">
            <div
              className={`w-2 h-2 rounded-full mr-2 ${
                isApiReady ? "bg-green-500" : "bg-red-500"
              }`}
            />
            <span className="text-xs text-gray-600">
              {isApiReady ? "API準備完了" : "API未接続"}
            </span>
          </div>
        </div>
      </div>

      <AgentSelector
        selectedAgent={selectedAgent}
        onAgentChange={handleAgentChange}
        isConnected={isApiReady}
      />
      <div className="flex-1 overflow-y-auto p-4 space-y-4">
        {messages.length === 0 && (
          <div className="flex items-center justify-center h-full">
            <div className="text-center text-gray-500">
              <h2 className="text-2xl font-bold mb-4">
                {session ? "新しいチャット" : "AIエージェント"}
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
          <MessageBubble key={message.id} message={message} />
        ))}

        {isLoading && (
          <div className="flex justify-start">
            <div className="bg-gray-100 rounded-lg p-3 max-w-xs">
              <div className="flex space-x-1">
                <div className="w-2 h-2 bg-gray-400 rounded-full animate-bounce"></div>
                <div
                  className="w-2 h-2 bg-gray-400 rounded-full animate-bounce"
                  style={{ animationDelay: "0.1s" }}
                ></div>
                <div
                  className="w-2 h-2 bg-gray-400 rounded-full animate-bounce"
                  style={{ animationDelay: "0.2s" }}
                ></div>
              </div>
            </div>
          </div>
        )}

        <div ref={messagesEndRef} />
      </div>

      <ChatInput
        onSendMessage={handleSendMessage}
        disabled={isLoading || !isApiReady}
      />
    </div>
  );
};

export default Chat;
