import React, { useState, useEffect } from "react";
import { ChatSession } from "@/types/chat";
import Chat from "@/components/Chat";
import Sidebar from "@/components/Sidebar";
import Login from "@/components/Login";
import { AuthProvider, useAuth } from "@/contexts/AuthContext";

const MainApp: React.FC = () => {
  const { isAuthenticated, isLoading, logout, user } = useAuth();
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
    const newSessionId = `session_${Date.now()}_${Math.floor(
      Math.random() * 1000
    )}`;
    const newSession: ChatSession = {
      id: newSessionId,
      messages: [],
      title: "新しいチャット",
      createdAt: new Date(),
      selectedAgent: "document_creating_agent",
    };

    // 新規セッションを現在のセッションに設定
    setCurrentSession(newSession);

    // セッション一覧にも追加（空のメッセージ配列で）
    setSessions((prev) => [newSession, ...prev]);
  };

  const handleSessionSelect = (session: ChatSession) => {
    // セッションを選択して、チャット履歴を復元
    console.log('Selecting session:', session.id, 'with', session.messages.length, 'messages');
    setCurrentSession({ ...session });
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

  if (isLoading) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <svg
            className="animate-spin -ml-1 mr-3 h-8 w-8 text-blue-600 mx-auto"
            xmlns="http://www.w3.org/2000/svg"
            fill="none"
            viewBox="0 0 24 24"
          >
            <circle
              className="opacity-25"
              cx="12"
              cy="12"
              r="10"
              stroke="currentColor"
              strokeWidth="4"
            ></circle>
            <path
              className="opacity-75"
              fill="currentColor"
              d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"
            ></path>
          </svg>
          <p className="mt-2 text-gray-600">認証状態を確認中...</p>
        </div>
      </div>
    );
  }

  if (!isAuthenticated) {
    return <Login />;
  }

  return (
    <div className="flex h-screen bg-gray-50">
      <Sidebar
        sessions={sessions}
        currentSessionId={currentSession?.id || null}
        onSessionSelect={handleSessionSelect}
        onNewChat={handleNewChat}
      />

      <div className="flex-1 flex flex-col">
        <header className="bg-white border-b border-gray-200 px-6 py-4 flex justify-between items-center">
          <div>
            <h1 className="text-xl font-bold text-gray-800">AIエージェント</h1>
            <p className="text-sm text-gray-600 mt-1">
              Vertex AIを活用したエージェントシステム
            </p>
          </div>
          <div className="flex items-center space-x-4">
            {user && (
              <div className="flex items-center space-x-3">
                <div className="flex items-center space-x-2">
                  <div className="w-8 h-8 bg-blue-500 text-white rounded-full flex items-center justify-center text-sm font-medium">
                    {user.name.charAt(0).toUpperCase()}
                  </div>
                  <span className="text-sm text-gray-600">ようこそ、{user.name}さん</span>
                </div>
                <button
                  onClick={logout}
                  className="text-sm text-red-600 hover:text-red-800 underline"
                >
                  ログアウト
                </button>
              </div>
            )}
          </div>
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

const App: React.FC = () => {
  return (
    <AuthProvider>
      <MainApp />
    </AuthProvider>
  );
};

export default App;
