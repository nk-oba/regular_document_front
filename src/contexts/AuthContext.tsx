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
      const apiUrl = import.meta.env.VITE_AGENTS_URL || "http://127.0.0.1:8000";
      const fullUrl = `${apiUrl}/auth/status`;
      console.log("Checking auth status...");
      console.log("API URL:", apiUrl);
      console.log("Full URL:", fullUrl);

      const response = await fetch(fullUrl, {
        credentials: "include",
        method: "GET",
        headers: {
          "Content-Type": "application/json",
        },
      });

      console.log(
        "Auth status response:",
        response.status,
        response.statusText
      );

      if (response.ok) {
        const data = await response.json();
        console.log("Auth status data:", data);
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
        console.log("Auth status check failed with status:", response.status);
        setAuthState((prev) => ({
          ...prev,
          user: null,
          isAuthenticated: false,
          isLoading: false,
        }));
      }
    } catch (error) {
      console.error("Auth status check failed:", error);

      const errorDetails =
        error instanceof Error
          ? {
              name: error.name,
              message: error.message,
              stack: error.stack,
            }
          : {
              name: "Unknown",
              message: String(error),
              stack: undefined,
            };

      console.error("Error details:", errorDetails);

      // ネットワークエラーの場合は、認証状態をリセットせずにローディングを停止
      if (
        error instanceof Error &&
        error.name === "TypeError" &&
        error.message.includes("Failed to fetch")
      ) {
        console.warn("Network error detected, keeping current auth state");
        setAuthState((prev) => ({
          ...prev,
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
    }
  };

  const checkMcpAdaStatus = async () => {
    try {
      const apiUrl = import.meta.env.VITE_AGENTS_URL || "http://127.0.0.1:8000";
      const fullUrl = `${apiUrl}/auth/mcp-ada/status`;

      const response = await fetch(fullUrl, {
        credentials: "include",
      });

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
      // 認証プロセス開始
      setAuthState((prev) => ({
        ...prev,
        isLoading: true,
      }));

      const url = `${import.meta.env.VITE_AGENTS_URL}/auth/start`;
      console.log("Fetching:", url);

      const response = await fetch(url, {
        credentials: "include",
      });

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
      // エラー時は認証プロセスを終了
      setAuthState((prev) => ({
        ...prev,
        isLoading: false,
      }));
      throw error;
    }
  };

  const loginMcpAda = async () => {
    try {
      const apiUrl = import.meta.env.VITE_AGENTS_URL || "http://127.0.0.1:8000";
      const fullUrl = `${apiUrl}/auth/mcp-ada/start`;
      console.log("Starting MCP ADA login process...");
      console.log("API URL:", apiUrl);
      console.log("Full URL:", fullUrl);

      const response = await fetch(fullUrl, {
        credentials: "include",
      });

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
              // 認証完了を検知するための複数の方法を組み合わせ
              let authCompleted = false;

              const cleanup = () => {
                window.removeEventListener("message", handleMessage);
                window.removeEventListener("focus", handleFocus);
                window.removeEventListener("beforeunload", handleBeforeUnload);
                if (checkInterval) clearInterval(checkInterval);
                if (timeoutId) clearTimeout(timeoutId);
                if (cleanupTimeoutId) clearTimeout(cleanupTimeoutId);
              };

              // postMessageを使用したクロスドメイン通信
              const handleMessage = (event: MessageEvent) => {
                // セキュリティのため、オリジンをチェック
                if (event.origin !== window.location.origin) {
                  return;
                }

                if (event.data && event.data.type === "MCP_ADA_AUTH_COMPLETE") {
                  console.log(
                    "MCP ADA authentication completed via postMessage"
                  );
                  authCompleted = true;
                  cleanup();
                  // 認証完了後、複数回認証状態をチェックして確実に更新
                  checkMcpAdaStatus();
                  setTimeout(() => checkMcpAdaStatus(), 1000);
                  setTimeout(() => checkMcpAdaStatus(), 3000);
                }
              };

              // フォーカスが戻ってきた時の処理
              const handleFocus = () => {
                if (!authCompleted) {
                  console.log("Window focus returned, checking auth status");
                  setTimeout(() => {
                    checkMcpAdaStatus();
                  }, 1000);
                  // 追加のチェックで確実に更新
                  setTimeout(() => {
                    checkMcpAdaStatus();
                  }, 3000);
                }
              };

              // ページがアンロードされる前の処理
              const handleBeforeUnload = () => {
                if (!authCompleted) {
                  console.log("Page unloading, checking auth status");
                  checkMcpAdaStatus();
                }
              };

              // イベントリスナーを追加
              window.addEventListener("message", handleMessage);
              window.addEventListener("focus", handleFocus);
              window.addEventListener("beforeunload", handleBeforeUnload);

              // 定期的な認証状態チェック（クロスドメイン制限を回避）
              const checkInterval = setInterval(() => {
                if (!authCompleted) {
                  console.log("Periodic auth status check");
                  checkMcpAdaStatus();
                }
              }, 3000); // 3秒ごとにチェック

              // タイムアウト処理（5分）
              const timeoutId = setTimeout(() => {
                if (!authCompleted) {
                  console.log("Auth timeout, cleaning up");
                  cleanup();
                  try {
                    authWindow.close();
                  } catch (e) {
                    console.log("Could not close auth window:", e);
                  }
                }
              }, 300000);

              // クリーンアップのタイムアウト（10分）
              const cleanupTimeoutId = setTimeout(() => {
                console.log("Cleanup timeout reached");
                cleanup();
              }, 600000);
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
      const apiUrl = import.meta.env.VITE_AGENTS_URL || "http://127.0.0.1:8000";
      const fullUrl = `${apiUrl}/auth/mcp-ada/logout`;
      console.log("MCP ADA logout URL:", fullUrl);

      await fetch(fullUrl, {
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
  // 未認証状態では定期的チェックを行わない
  useEffect(() => {
    // 認証プロセス中のみ定期的チェックを実行
    if (authState.isLoading) {
      const interval = setInterval(() => {
        checkAuthStatus();
      }, 2000); // 2秒ごとにチェック

      return () => clearInterval(interval);
    }
  }, [authState.isLoading]);

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
