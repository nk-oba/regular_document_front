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

export class WebSocketClient {
  private socket: WebSocket | null = null;
  private clientId: number;
  private onMessage: (message: any) => void;
  private onError: (error: Event) => void;
  private onClose: () => void;

  constructor(
    clientId: number, 
    onMessage: (message: any) => void,
    onError: (error: Event) => void = () => {},
    onClose: () => void = () => {}
  ) {
    this.clientId = clientId;
    this.onMessage = onMessage;
    this.onError = onError;
    this.onClose = onClose;
  }

  connect(): Promise<void> {
    return new Promise((resolve, reject) => {
      let wsURL = baseURL?.replace('http', 'ws') || 'ws://localhost:8000';
      
      // ブラウザからのアクセスの場合はlocalhostに変換
      if (typeof window !== 'undefined') {
        wsURL = wsURL.replace('agents:8000', 'localhost:8000');
      }
      
      this.socket = new WebSocket(`${wsURL}/ws/${this.clientId}`);

      this.socket.onopen = () => {
        resolve();
      };

      this.socket.onmessage = (event) => {
        try {
          const data = JSON.parse(event.data);
          this.onMessage(data);
        } catch (error) {
          console.error('Error parsing WebSocket message:', error);
        }
      };

      this.socket.onerror = (error) => {
        this.onError(error);
        reject(error);
      };

      this.socket.onclose = () => {
        this.onClose();
      };
    });
  }

  sendMessage(message: string, selectedAgent?: string, sessionId?: string): void {
    if (this.socket && this.socket.readyState === WebSocket.OPEN) {
      const data = {
        message,
        timestamp: new Date().toISOString(),
        selectedAgent: selectedAgent || 'document_creating_agent',
        sessionId: sessionId
      };
      this.socket.send(JSON.stringify(data));
    } else {
      throw new Error('WebSocket is not connected');
    }
  }

  disconnect(): void {
    if (this.socket) {
      this.socket.close();
      this.socket = null;
    }
  }

  isConnected(): boolean {
    return this.socket?.readyState === WebSocket.OPEN;
  }
}

export const chatApi = {
  sendMessage: async (request: MessageRequest): Promise<MessageResponse> => {
    const response = await api.post<MessageResponse>("/", request);
    return response.data;
  },

  healthCheck: async (): Promise<{ status: string }> => {
    const response = await api.get("/health");
    return response.data;
  },
};

export default api;
