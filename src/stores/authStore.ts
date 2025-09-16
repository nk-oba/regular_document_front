import { create } from 'zustand';
import { devtools } from 'zustand/middleware';
import { logger } from '@/utils/logger';

export interface User {
  id: string;
  email: string;
  name: string;
}

export interface McpAdaAuthState {
  authenticated: boolean;
  service: string;
  scopes?: string[];
}

interface AuthState {
  user: User | null;
  isAuthenticated: boolean;
  isLoading: boolean;
  mcpAdaAuth: McpAdaAuthState | null;
  mcpAdaLoading: boolean;
}

interface AuthActions {
  login: () => Promise<void>;
  logout: () => Promise<void>;
  loginMcpAda: () => Promise<void>;
  logoutMcpAda: () => Promise<void>;
  checkAuthStatus: () => Promise<void>;
  checkMcpAdaStatus: () => Promise<void>;
  setMcpAdaLoading: (loading: boolean) => void;
  setAuthState: (state: Partial<AuthState>) => void;
}

export interface AuthStore extends AuthState, AuthActions {}

const getApiUrl = () =>
  import.meta.env.VITE_AGENTS_URL || 'http://localhost:8000';

export const useAuthStore = create<AuthStore>()(
  devtools(
    (set, get) => ({
      // Initial state
      user: null,
      isAuthenticated: false,
      isLoading: true,
      mcpAdaAuth: null,
      mcpAdaLoading: false,

      // Actions
      setAuthState: (newState) =>
        set((state) => ({ ...state, ...newState }), false, 'setAuthState'),

      setMcpAdaLoading: (loading) =>
        set({ mcpAdaLoading: loading }, false, 'setMcpAdaLoading'),

      checkAuthStatus: async () => {
        try {
          const apiUrl = getApiUrl();
          const fullUrl = `${apiUrl}/auth/status`;

          const response = await fetch(fullUrl, {
            credentials: 'include',
            method: 'GET',
            headers: {
              'Content-Type': 'application/json',
            },
          });

          if (response.ok) {
            const data = await response.json();
            if (data.authenticated) {
              set(
                {
                  user: data.user,
                  isAuthenticated: true,
                  isLoading: false,
                },
                false,
                'checkAuthStatus:success'
              );
            } else {
              set(
                {
                  user: null,
                  isAuthenticated: false,
                  isLoading: false,
                },
                false,
                'checkAuthStatus:notAuth'
              );
            }
          } else {
            set(
              {
                user: null,
                isAuthenticated: false,
                isLoading: false,
              },
              false,
              'checkAuthStatus:error'
            );
          }
        } catch (error) {
          logger.error('Auth status check failed', error, 'AuthStore');
          set(
            {
              user: null,
              isAuthenticated: false,
              isLoading: false,
            },
            false,
            'checkAuthStatus:exception'
          );
        }
      },

      login: async () => {
        try {
          const apiUrl = getApiUrl();
          window.location.href = `${apiUrl}/auth/google`;
        } catch (error) {
          logger.error('Login failed', error, 'AuthStore');
          throw error;
        }
      },

      logout: async () => {
        try {
          const apiUrl = getApiUrl();

          // バックエンドにログアウトリクエストを送信
          const response = await fetch(`${apiUrl}/auth/logout`, {
            method: 'POST',
            credentials: 'include',
            headers: {
              'Content-Type': 'application/json',
            },
          });

          if (response.ok) {
            logger.info('Logout successful', undefined, 'AuthStore');
          } else {
            logger.warn('Logout request failed, but continuing with local logout', undefined, 'AuthStore');
          }
        } catch (error) {
          logger.error('Logout request failed', error, 'AuthStore');
        } finally {
          set(
            {
              user: null,
              isAuthenticated: false,
              isLoading: false,
              mcpAdaAuth: null,
              mcpAdaLoading: false,
            },
            false,
            'logout'
          );

          try {
            localStorage.removeItem('auth-store');
          } catch (e) {
            logger.warn('Failed to clear localStorage', e, 'AuthStore');
          }

          try {
            const baseUrl = window.location.origin + window.location.pathname;
            window.history.replaceState({}, document.title, baseUrl);
          } catch (e) {
            logger.warn('Failed to clean URL', e, 'AuthStore');
          }
        }
      },

      checkMcpAdaStatus: async () => {
        try {
          const apiUrl = getApiUrl();
          const response = await fetch(`${apiUrl}/auth/mcp-ada/status`, {
            credentials: 'include',
            method: 'GET',
            headers: {
              'Content-Type': 'application/json',
            },
          });

          if (response.ok) {
            const data = await response.json();
            set({ mcpAdaAuth: data }, false, 'checkMcpAdaStatus:success');
          } else {
            set({ mcpAdaAuth: null }, false, 'checkMcpAdaStatus:error');
          }
        } catch (error) {
          logger.error('MCP Ada status check failed', error, 'AuthStore');
          set({ mcpAdaAuth: null }, false, 'checkMcpAdaStatus:exception');
        }
      },

      loginMcpAda: async () => {
        try {
          const apiUrl = getApiUrl();
          const response = await fetch(`${apiUrl}/auth/mcp-ada/start`, {
            credentials: 'include',
            method: 'GET',
            headers: {
              'Content-Type': 'application/json',
            },
          });

          if (response.ok) {
            const data = await response.json();
            if (data.auth_url) {
              window.open(data.auth_url, '_blank', 'width=500,height=600');

              // Poll for authentication completion
              const pollInterval = setInterval(async () => {
                await get().checkMcpAdaStatus();
                const currentState = get();
                if (currentState.mcpAdaAuth?.authenticated) {
                  clearInterval(pollInterval);
                }
              }, 2000);

              // Stop polling after 5 minutes
              setTimeout(() => clearInterval(pollInterval), 300000);
            }
          } else {
            throw new Error(`MCP Ada login failed: ${response.statusText}`);
          }
        } catch (error) {
          logger.error('MCP Ada login failed', error, 'AuthStore');
          throw error;
        }
      },

      logoutMcpAda: async () => {
        try {
          const apiUrl = getApiUrl();
          const response = await fetch(`${apiUrl}/auth/mcp-ada/logout`, {
            credentials: 'include',
            method: 'POST',
            headers: {
              'Content-Type': 'application/json',
            },
          });

          if (response.ok) {
            set({ mcpAdaAuth: null }, false, 'logoutMcpAda:success');
          } else {
            throw new Error(`MCP Ada logout failed: ${response.statusText}`);
          }
        } catch (error) {
          logger.error('MCP Ada logout failed', error, 'AuthStore');
          throw error;
        }
      },
    }),
    {
      name: 'auth-store',
    }
  )
);
