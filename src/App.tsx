import React from 'react';
import { ChatSession } from '@/types/chat';
import Chat from '@/components/Chat';
import Sidebar from '@/components/Sidebar';
import Login from '@/components/Login';
import LoadingSpinner from '@/components/ui/LoadingSpinner';
import AuthStatus from '@/components/ui/AuthStatus';
import { useAuth } from '@/hooks/useAuth';
import { useChat } from '@/hooks/useChat';

const MainApp = () => {
  const {
    isAuthenticated,
    isLoading,
    logout,
    logoutMcpAda,
    loginMcpAda,
    user,
    mcpAdaAuth,
    mcpAdaLoading,
    setMcpAdaLoading,
    checkMcpAdaStatus,
  } = useAuth();

  React.useEffect(() => {
    if (!isLoading) {
      checkMcpAdaStatus();
    }
  }, [isLoading, checkMcpAdaStatus]);

  const {
    sessions,
    currentSession,
    createSession,
    updateSession,
    setCurrentSession,
  } = useChat();

  const handleNewChat = async () => {
    if (user?.id) {
      await createSession(user.id);
    }
  };

  const handleSessionSelect = (session: ChatSession) => {
    setCurrentSession({ ...session });
  };

  const handleSessionUpdate = (updatedSession: ChatSession) => {
    updateSession(updatedSession);
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
      console.error('MCP Ad Analyzer authentication toggle failed:', error);
    } finally {
      setMcpAdaLoading(false);
    }
  };

  const handleLogout = async () => {
    try {
      setCurrentSession(null);
      await logout();
    } catch (error) {
      console.error('Logout failed:', error);
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
        onLogout={handleLogout}
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

const App = () => {
  return <MainApp />;
};

export default App;
