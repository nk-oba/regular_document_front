import { useEffect, useCallback } from 'react';
import { useAuthStore } from '@/stores/authStore';

export const useAuth = () => {
  const store = useAuthStore();

  const stableCheckMcpAdaStatus = useCallback(() => {
    return store.checkMcpAdaStatus();
  }, [store.checkMcpAdaStatus]);

  useEffect(() => {
    store.checkAuthStatus();
  }, []);

  return {
    // State
    user: store.user,
    isAuthenticated: store.isAuthenticated,
    isLoading: store.isLoading,
    mcpAdaAuth: store.mcpAdaAuth,
    mcpAdaLoading: store.mcpAdaLoading,

    // Actions
    login: store.login,
    logout: store.logout,
    loginMcpAda: store.loginMcpAda,
    logoutMcpAda: store.logoutMcpAda,
    checkAuthStatus: store.checkAuthStatus,
    checkMcpAdaStatus: stableCheckMcpAdaStatus,
    setMcpAdaLoading: store.setMcpAdaLoading,
  };
};

// Selective hooks for better performance
export const useAuthUser = () => useAuthStore((state) => state.user);
export const useIsAuthenticated = () =>
  useAuthStore((state) => state.isAuthenticated);
export const useAuthLoading = () => useAuthStore((state) => state.isLoading);
export const useMcpAdaAuth = () => useAuthStore((state) => state.mcpAdaAuth);
export const useMcpAdaLoading = () =>
  useAuthStore((state) => state.mcpAdaLoading);
