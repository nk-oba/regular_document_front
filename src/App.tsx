import React, { useState, useEffect } from "react";
import { ChatSession } from "@/types/chat";
import Chat from "@/components/Chat";
import Sidebar from "@/components/Sidebar";
import Login from "@/components/Login";
import LoadingSpinner from "@/components/ui/LoadingSpinner";
import AuthStatus from "@/components/ui/AuthStatus";
import { AuthProvider, useAuth } from "@/contexts/AuthContext";
import { chatApi } from "@/lib/api";

const MainApp: React.FC = () => {
  const {
    isAuthenticated,
    isLoading,
    logout,
    logoutMcpAda,
    loginMcpAda,
    user,
    mcpAdaAuth,
  } = useAuth();
  const [sessions, setSessions] = useState<ChatSession[]>([]);
  const [currentSession, setCurrentSession] = useState<ChatSession | null>(
    null
  );
  const [mcpAdaLoading, setMcpAdaLoading] = useState(false);

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

  const handleNewChat = async () => {
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

    try {
      // バックエンドでセッション作成
      await chatApi.createSession(
        "document_creating_agent",
        user?.id || "anonymous",
        newSessionId,
        {}
      );
      console.log("Backend session created:", newSessionId);
    } catch (error) {
      console.error("Failed to create backend session:", error);
    }

    // 新規セッションを現在のセッションに設定
    setCurrentSession(newSession);

    // セッション一覧にも追加（空のメッセージ配列で）
    setSessions((prev) => [newSession, ...prev]);
  };

  const handleSessionSelect = (session: ChatSession) => {
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

  const handleMcpAdaToggle = async () => {
    if (mcpAdaLoading) return;

    setMcpAdaLoading(true);
    try {
      if (mcpAdaAuth?.authenticated) {
        await logoutMcpAda();
      } else {
        await loginMcpAda();
      }
    } catch (error) {
      console.error("MCP Ad Analyzer authentication toggle failed:", error);
    } finally {
      setMcpAdaLoading(false);
    }
  };

  if (isLoading) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <LoadingSpinner className="mx-auto mb-4" />
          <p className="text-gray-600">認証状態を確認中...</p>
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
        user={user}
        onLogout={logout}
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
            <AuthStatus
              mcpAdaAuth={mcpAdaAuth}
              mcpAdaLoading={mcpAdaLoading}
              onMcpAdaToggle={handleMcpAdaToggle}
            />
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
