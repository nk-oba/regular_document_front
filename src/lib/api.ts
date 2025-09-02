import axios from "axios";
import { MessageRequest, MessageResponse } from "@/types/chat";

const baseURL = import.meta.env.VITE_AGENTS_URL || 'http://127.0.0.1:8000';
console.log("BASE_URL");
console.log(baseURL);

const api = axios.create({
  baseURL: `${baseURL}`,
  timeout: 30000,
  headers: {
    "Content-Type": "application/json",
  },
  withCredentials: false,
});

// WebSocketClientクラスを削除してREST APIクライアントに置き換え

export const chatApi = {
  // エージェント実行API (POST /run)
  sendMessage: async (request: MessageRequest): Promise<MessageResponse> => {
    const response = await api.post<MessageResponse>("/run", request);
    return response.data;
  },

  // アプリ一覧取得API (GET /list-apps)
  listApps: async (): Promise<string[]> => {
    const response = await api.get<string[]>("/list-apps");
    return response.data;
  },

  // セッション作成API (POST /apps/{app_name}/users/{user_id}/sessions/{session_id})
  createSession: async (appName: string, userId: string, sessionId: string, state?: any): Promise<any> => {
    const response = await api.post(`/apps/${appName}/users/${userId}/sessions/${sessionId}`, state || {});
    return response.data;
  },

  // セッション取得API (GET /apps/{app_name}/users/{user_id}/sessions/{session_id})
  getSession: async (appName: string, userId: string, sessionId: string): Promise<any> => {
    const response = await api.get(`/apps/${appName}/users/${userId}/sessions/${sessionId}`);
    return response.data;
  },

  // セッション一覧取得API (GET /apps/{app_name}/users/{user_id}/sessions)
  listSessions: async (appName: string, userId: string): Promise<any[]> => {
    const response = await api.get(`/apps/${appName}/users/${userId}/sessions`);
    return response.data;
  },

  // セッション削除API (DELETE /apps/{app_name}/users/{user_id}/sessions/{session_id})
  deleteSession: async (appName: string, userId: string, sessionId: string): Promise<void> => {
    await api.delete(`/apps/${appName}/users/${userId}/sessions/${sessionId}`);
  },

  // アーティファクト一覧取得API (GET /apps/{app_name}/users/{user_id}/sessions/{session_id}/artifacts)
  listArtifacts: async (appName: string, userId: string, sessionId: string): Promise<string[]> => {
    const response = await api.get(`/apps/${appName}/users/${userId}/sessions/${sessionId}/artifacts`);
    return response.data;
  },

  // アーティファクト取得API (GET /apps/{app_name}/users/{user_id}/sessions/{session_id}/artifacts/{artifact_name})
  getArtifact: async (appName: string, userId: string, sessionId: string, artifactName: string, version?: number): Promise<any> => {
    const url = `/apps/${appName}/users/${userId}/sessions/${sessionId}/artifacts/${artifactName}`;
    const params = version ? { version } : {};
    const response = await api.get(url, { params });
    return response.data;
  },

  // ヘルスチェック (アプリ一覧を利用)
  healthCheck: async (): Promise<{ status: string, apps?: string[] }> => {
    try {
      const apps = await chatApi.listApps();
      return { status: "ok", apps };
    } catch (error) {
      return { status: "error" };
    }
  },
};

export default api;
