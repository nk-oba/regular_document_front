import { useChatStore } from '@/stores/chatStore';

export const useChat = () => {
  const store = useChatStore();

  return {
    // State
    sessions: store.sessions,
    currentSession: store.currentSession,
    isLoading: store.isLoading,
    selectedAgent: store.selectedAgent,

    // Actions
    setSessions: store.setSessions,
    setCurrentSession: store.setCurrentSession,
    setLoading: store.setLoading,
    setSelectedAgent: store.setSelectedAgent,
    createSession: store.createSession,
    updateSession: store.updateSession,
    clearSessions: store.clearSessions,
    loadSessionFromApi: store.loadSessionFromApi,
  };
};

// Selective hooks for better performance
export const useChatSessions = () => useChatStore((state) => state.sessions);
export const useCurrentSession = () =>
  useChatStore((state) => state.currentSession);
export const useChatLoading = () => useChatStore((state) => state.isLoading);
export const useSelectedAgent = () =>
  useChatStore((state) => state.selectedAgent);

// Actions only
export const useChatActions = () => {
  const store = useChatStore();
  return {
    setSessions: store.setSessions,
    setCurrentSession: store.setCurrentSession,
    setLoading: store.setLoading,
    setSelectedAgent: store.setSelectedAgent,
    createSession: store.createSession,
    updateSession: store.updateSession,
    clearSessions: store.clearSessions,
    loadSessionFromApi: store.loadSessionFromApi,
  };
};
