import React from 'react';
import { ChatSession } from '@/types/chat';
import Chat from '@/components/Chat';
import Sidebar from '@/components/Sidebar';
import Login from '@/components/Login';
import LoadingSpinner from '@/components/ui/LoadingSpinner';
import AuthStatus from '@/components/ui/AuthStatus';
import AgentSelector from '@/components/AgentSelector';
import ErrorBoundary from '@/components/ui/ErrorBoundary';
import { useAuth } from '@/hooks/useAuth';
import { useChat } from '@/hooks/useChat';
import { useApiHealth } from '@/hooks/useChatService';

const MainApp = () => {
  const {
    isAuthenticated,
    isLoading: authLoading,
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
    if (!authLoading) {
      checkMcpAdaStatus();
    }
  }, [authLoading, checkMcpAdaStatus]);

  const {
    sessions,
    currentSession,
    isLoading: chatLoading,
    createSession,
    updateSession,
    setCurrentSession,
    loadSessionFromApi,
  } = useChat();

  const { checkHealth } = useApiHealth();
  const [isApiReady, setIsApiReady] = React.useState(true);
  const [selectedAgent, setSelectedAgent] = React.useState<string>(
    currentSession?.selectedAgent || 'document_creating_agent'
  );

  React.useEffect(() => {
    checkHealth()
      .then(setIsApiReady)
      .catch(() => setIsApiReady(false));
  }, [checkHealth]);

  React.useEffect(() => {
    setSelectedAgent(
      currentSession?.selectedAgent || 'document_creating_agent'
    );
  }, [currentSession]);

  const handleNewChat = async () => {
    if (user?.id) {
      await createSession(user.id);
    }
  };

  const handleSessionSelect = async (session: ChatSession) => {
    if (!user?.id) {
      console.warn('User ID not available for session loading');
      setCurrentSession({ ...session });
      return;
    }

    try {
      // APIからセッション詳細を取得
      await loadSessionFromApi(
        session.selectedAgent || selectedAgent,
        user.id,
        session.id
      );
    } catch (error) {
      console.error(
        'Failed to load session from API, using local data:',
        error
      );
      // API取得に失敗した場合はローカルデータを使用
      setCurrentSession({ ...session });
    }
  };

  const handleSessionUpdate = (updatedSession: ChatSession) => {
    updateSession(updatedSession);
  };

  const handleAgentChange = (agentId: string) => {
    setSelectedAgent(agentId);
    if (currentSession) {
      const updatedSession = { ...currentSession, selectedAgent: agentId };
      updateSession(updatedSession);
    }
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

  if (authLoading) {
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
        isLoading={chatLoading}
      />

      <div className="flex-1 flex flex-col">
        <header className="bg-white border-b border-gray-200 px-6 py-4 flex justify-between items-center">
          <div className="flex-1">
            <AgentSelector
              selectedAgent={selectedAgent}
              onAgentChange={handleAgentChange}
              isConnected={isApiReady}
              compact={true}
            />
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
  return (
    <ErrorBoundary>
      <MainApp />
    </ErrorBoundary>
  );
};

export default App;
