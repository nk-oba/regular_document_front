import React, {
  createContext,
  useContext,
  useState,
  useEffect,
  ReactNode,
} from "react";

interface User {
  id: string;
  email: string;
  name: string;
}

interface McpAdaAuthState {
  authenticated: boolean;
  service: string;
  scopes?: string[];
}

interface AuthState {
  user: User | null;
  isAuthenticated: boolean;
  isLoading: boolean;
  mcpAdaAuth: McpAdaAuthState | null;
}

interface AuthContextType extends AuthState {
  login: () => Promise<void>;
  loginMcpAda: () => Promise<void>;
  logout: () => void;
  logoutMcpAda: () => Promise<void>;
  checkAuthStatus: () => Promise<void>;
  checkMcpAdaStatus: () => Promise<void>;
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
    mcpAdaAuth: null,
  });

  const checkAuthStatus = async () => {
    try {
      const response = await fetch(
        `${import.meta.env.VITE_AGENTS_URL}/auth/status`,
        {
          credentials: "include",
        }
      );

      if (response.ok) {
        const data = await response.json();
        if (data.authenticated) {
          setAuthState((prev) => ({
            ...prev,
            user: data.user,
            isAuthenticated: true,
            isLoading: false,
          }));
        } else {
          setAuthState((prev) => ({
            ...prev,
            user: null,
            isAuthenticated: false,
            isLoading: false,
          }));
        }
      } else {
        setAuthState((prev) => ({
          ...prev,
          user: null,
          isAuthenticated: false,
          isLoading: false,
        }));
      }
    } catch (error) {
      console.error("Auth status check failed:", error);
      setAuthState((prev) => ({
        ...prev,
        user: null,
        isAuthenticated: false,
        isLoading: false,
      }));
    }
  };

  const checkMcpAdaStatus = async () => {
    try {
      const response = await fetch(
        `${import.meta.env.VITE_AGENTS_URL}/auth/mcp-ada/status`,
        {
          credentials: "include",
        }
      );

      if (response.ok) {
        const data = await response.json();
        setAuthState((prev) => ({
          ...prev,
          mcpAdaAuth: data,
        }));
      } else {
        setAuthState((prev) => ({
          ...prev,
          mcpAdaAuth: { authenticated: false, service: "MCP ADA" },
        }));
      }
    } catch (error) {
      console.error("MCP ADA auth status check failed:", error);
      setAuthState((prev) => ({
        ...prev,
        mcpAdaAuth: { authenticated: false, service: "MCP ADA" },
      }));
    }
  };

  const login = async () => {
    try {
      console.log("Starting login process...");
      console.log("VITE_AGENTS_URL:", import.meta.env.VITE_AGENTS_URL);

      const url = `${import.meta.env.VITE_AGENTS_URL}/auth/start`;
      console.log("Fetching:", url);

      const response = await fetch(url, {
        credentials: "include",
      });

      console.log("Response status:", response.status);
      console.log("Response ok:", response.ok);

      if (response.ok) {
        const data = await response.json();
        console.log("Response data:", data);

        if (data.success && data.auth_url) {
          console.log("Redirecting to auth URL:", data.auth_url);
          window.location.href = data.auth_url;
        } else if (data.authenticated) {
          console.log("Already authenticated, checking status...");
          await checkAuthStatus();
        } else {
          throw new Error(data.message || "Authentication failed");
        }
      } else {
        const errorText = await response.text();
        console.error(
          "Authentication request failed:",
          response.status,
          errorText
        );
        throw new Error(`Failed to start authentication: ${response.status}`);
      }
    } catch (error) {
      console.error("Login failed:", error);
      throw error;
    }
  };

  const loginMcpAda = async () => {
    try {
      console.log("Starting MCP ADA login process...");

      const response = await fetch(
        `${import.meta.env.VITE_AGENTS_URL}/auth/mcp-ada/start`,
        {
          credentials: "include",
        }
      );

      if (response.ok) {
        const data = await response.json();
        console.log("MCP ADA Response data:", data);

        if (data.success) {
          if (data.authenticated) {
            // 既に認証済み
            console.log("Already authenticated with MCP ADA");
            await checkMcpAdaStatus();
          } else if (data.auth_url) {
            // 認証URLを新しいウィンドウで開く
            console.log("Opening MCP ADA auth URL:", data.auth_url);
            const authWindow = window.open(
              data.auth_url,
              "mcp_ada_auth",
              "width=500,height=600,scrollbars=yes,resizable=yes"
            );

            if (authWindow) {
              // ポップアップが閉じられるのを監視
              const checkClosed = setInterval(() => {
                if (authWindow.closed) {
                  clearInterval(checkClosed);
                  // ポップアップが閉じられたら認証状態を確認
                  setTimeout(() => {
                    checkMcpAdaStatus();
                  }, 1000);
                }
              }, 1000);

              // タイムアウト処理（5分）
              setTimeout(() => {
                if (!authWindow.closed) {
                  authWindow.close();
                  clearInterval(checkClosed);
                }
              }, 300000);
            } else {
              // ポップアップがブロックされた場合
              window.location.href = data.auth_url;
            }
          }
        } else {
          throw new Error(data.message || "MCP ADA Authentication failed");
        }
      } else {
        const errorText = await response.text();
        console.error(
          "MCP ADA Authentication request failed:",
          response.status,
          errorText
        );
        throw new Error(
          `Failed to start MCP ADA authentication: ${response.status}`
        );
      }
    } catch (error) {
      console.error("MCP ADA Login failed:", error);
      throw error;
    }
  };

  const logout = async () => {
    try {
      await fetch(`${import.meta.env.VITE_AGENTS_URL}/auth/logout`, {
        method: "POST",
        credentials: "include",
      });

      setAuthState((prev) => ({
        ...prev,
        user: null,
        isAuthenticated: false,
        isLoading: false,
      }));
    } catch (error) {
      console.error("Logout failed:", error);
      setAuthState((prev) => ({
        ...prev,
        user: null,
        isAuthenticated: false,
        isLoading: false,
      }));
    }
  };

  const logoutMcpAda = async () => {
    try {
      await fetch(`${import.meta.env.VITE_AGENTS_URL}/auth/mcp-ada/logout`, {
        method: "POST",
        credentials: "include",
      });

      setAuthState((prev) => ({
        ...prev,
        mcpAdaAuth: { authenticated: false, service: "MCP ADA" },
      }));
    } catch (error) {
      console.error("MCP ADA Logout failed:", error);
      setAuthState((prev) => ({
        ...prev,
        mcpAdaAuth: { authenticated: false, service: "MCP ADA" },
      }));
    }
  };

  useEffect(() => {
    checkAuthStatus();
    checkMcpAdaStatus();
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
        loginMcpAda,
        logout,
        logoutMcpAda,
        checkAuthStatus,
        checkMcpAdaStatus,
      }}
    >
      {children}
    </AuthContext.Provider>
  );
};

export const useAuth = (): AuthContextType => {
  const context = useContext(AuthContext);
  if (context === undefined) {
    throw new Error("useAuth must be used within an AuthProvider");
  }
  return context;
};
