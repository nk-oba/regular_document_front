import React, { createContext, useContext, useState, useEffect, ReactNode } from 'react';

interface User {
  id: string;
  email: string;
  name: string;
}

interface AuthState {
  user: User | null;
  isAuthenticated: boolean;
  isLoading: boolean;
}

interface AuthContextType extends AuthState {
  login: () => Promise<void>;
  logout: () => void;
  checkAuthStatus: () => Promise<void>;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

interface AuthProviderProps {
  children: ReactNode;
}

export const AuthProvider: React.FC<AuthProviderProps> = ({ children }) => {
  const [authState, setAuthState] = useState<AuthState>({
    user: null,
    isAuthenticated: false,
    isLoading: true,
  });

  const checkAuthStatus = async () => {
    try {
      const response = await fetch(`${import.meta.env.VITE_AGENTS_URL}/auth/status`, {
        credentials: 'include',
      });
      
      if (response.ok) {
        const data = await response.json();
        if (data.authenticated) {
          setAuthState({
            user: data.user,
            isAuthenticated: true,
            isLoading: false,
          });
        } else {
          setAuthState({
            user: null,
            isAuthenticated: false,
            isLoading: false,
          });
        }
      } else {
        setAuthState({
          user: null,
          isAuthenticated: false,
          isLoading: false,
        });
      }
    } catch (error) {
      console.error('Auth status check failed:', error);
      setAuthState({
        user: null,
        isAuthenticated: false,
        isLoading: false,
      });
    }
  };

  const login = async () => {
    try {
      console.log('Starting login process...');
      console.log('VITE_AGENTS_URL:', import.meta.env.VITE_AGENTS_URL);
      
      const url = `${import.meta.env.VITE_AGENTS_URL}/auth/start`;
      console.log('Fetching:', url);
      
      const response = await fetch(url, {
        credentials: 'include',
      });
      
      console.log('Response status:', response.status);
      console.log('Response ok:', response.ok);
      
      if (response.ok) {
        const data = await response.json();
        console.log('Response data:', data);
        
        if (data.success && data.auth_url) {
          console.log('Redirecting to auth URL:', data.auth_url);
          window.location.href = data.auth_url;
        } else if (data.authenticated) {
          console.log('Already authenticated, checking status...');
          await checkAuthStatus();
        } else {
          throw new Error(data.message || 'Authentication failed');
        }
      } else {
        const errorText = await response.text();
        console.error('Authentication request failed:', response.status, errorText);
        throw new Error(`Failed to start authentication: ${response.status}`);
      }
    } catch (error) {
      console.error('Login failed:', error);
      throw error;
    }
  };

  const logout = async () => {
    try {
      const response = await fetch(`${import.meta.env.VITE_AGENTS_URL}/auth/logout`, {
        method: 'POST',
        credentials: 'include',
      });
      
      setAuthState({
        user: null,
        isAuthenticated: false,
        isLoading: false,
      });
    } catch (error) {
      console.error('Logout failed:', error);
      setAuthState({
        user: null,
        isAuthenticated: false,
        isLoading: false,
      });
    }
  };

  useEffect(() => {
    checkAuthStatus();
  }, []);

  // 認証状態の変更を定期的にチェック（認証完了後の自動更新用）
  useEffect(() => {
    if (!authState.isAuthenticated && !authState.isLoading) {
      const interval = setInterval(() => {
        checkAuthStatus();
      }, 2000); // 2秒ごとにチェック

      return () => clearInterval(interval);
    }
  }, [authState.isAuthenticated, authState.isLoading]);

  return (
    <AuthContext.Provider
      value={{
        ...authState,
        login,
        logout,
        checkAuthStatus,
      }}
    >
      {children}
    </AuthContext.Provider>
  );
};

export const useAuth = (): AuthContextType => {
  const context = useContext(AuthContext);
  if (context === undefined) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
};