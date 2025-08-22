"use client";

import React, { useState, useEffect } from "react";
import { ChatSession, Message } from "@/types/chat";
import Chat from "@/components/Chat";
import Sidebar from "@/components/Sidebar";

const HomePage: React.FC = () => {
  const [sessions, setSessions] = useState<ChatSession[]>([]);
  const [currentSession, setCurrentSession] = useState<ChatSession | null>(
    null
  );

  useEffect(() => {
    const savedSessions = localStorage.getItem("chatSessions");
    if (savedSessions) {
      const parsed = JSON.parse(savedSessions).map((session: any) => ({
        ...session,
        createdAt: new Date(session.createdAt),
        messages: session.messages.map((msg: any) => ({
          ...msg,
          timestamp: new Date(msg.timestamp),
        })),
      }));
      setSessions(parsed);
    }
  }, []);

  useEffect(() => {
    if (sessions.length > 0) {
      localStorage.setItem("chatSessions", JSON.stringify(sessions));
    }
  }, [sessions]);

  const handleNewChat = () => {
    // 新規セッションを作成
    const newSessionId = `session_${Date.now()}_${Math.floor(Math.random() * 1000)}`;
    const newSession: ChatSession = {
      id: newSessionId,
      messages: [],
      title: '新しいチャット',
      createdAt: new Date(),
      selectedAgent: 'document_creating_agent'
    };
    
    // 新規セッションを現在のセッションに設定
    setCurrentSession(newSession);
    
    // セッション一覧にも追加（空のメッセージ配列で）
    setSessions(prev => [newSession, ...prev]);
  };

  const handleSessionSelect = (session: ChatSession) => {
    setCurrentSession(session);
  };

  const handleSessionUpdate = (updatedSession: ChatSession) => {
    setSessions((prev) => {
      const existingIndex = prev.findIndex((s) => s.id === updatedSession.id);
      if (existingIndex >= 0) {
        const newSessions = [...prev];
        newSessions[existingIndex] = updatedSession;
        return newSessions;
      } else {
        return [updatedSession, ...prev];
      }
    });
    setCurrentSession(updatedSession);
  };

  return (
    <div className="flex h-screen bg-gray-50">
      <Sidebar
        sessions={sessions}
        currentSessionId={currentSession?.id || null}
        onSessionSelect={handleSessionSelect}
        onNewChat={handleNewChat}
      />

      <div className="flex-1 flex flex-col">
        <header className="bg-white border-b border-gray-200 px-6 py-4">
          <h1 className="text-xl font-bold text-gray-800">AIエージェント</h1>
          <p className="text-sm text-gray-600 mt-1">
            Vertex AIを活用したエージェントシステム
          </p>
        </header>

        <main className="flex-1 overflow-hidden">
          <Chat
            session={currentSession}
            onSessionUpdate={handleSessionUpdate}
          />
        </main>
      </div>
    </div>
  );
};

export default HomePage;
