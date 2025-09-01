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
  private reconnectAttempts: number = 0;
  private maxReconnectAttempts: number = 5;
  private reconnectInterval: number = 2000;

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
      let wsURL = baseURL?.replace('http://', 'ws://').replace('https://', 'wss://') || 'ws://localhost:8000';
      
      // ブラウザからのアクセスの場合、agentsまたは127.0.0.1をlocalhostに変換
      if (typeof window !== 'undefined') {
        wsURL = wsURL
          .replace('agents:8000', 'localhost:8000')
          .replace('127.0.0.1:8000', 'localhost:8000');
      }
      
      const fullURL = `${wsURL}/ws/${this.clientId}`;
      console.log('WebSocket connecting to:', fullURL);
      
      // 既存の接続があれば閉じる
      if (this.socket) {
        this.socket.close();
      }
      
      try {
        this.socket = new WebSocket(fullURL);
      } catch (error) {
        console.error('Failed to create WebSocket:', error);
        reject(new Error(`Failed to create WebSocket: ${error}`));
        return;
      }

      const connectTimeout = setTimeout(() => {
        if (this.socket && this.socket.readyState === WebSocket.CONNECTING) {
          console.error('WebSocket connection timeout');
          this.socket.close();
          reject(new Error(`WebSocket connection timeout to ${fullURL}`));
        }
      }, 10000);

      this.socket.onopen = () => {
        clearTimeout(connectTimeout);
        console.log('WebSocket connected successfully to:', fullURL);
        this.reconnectAttempts = 0;
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
        clearTimeout(connectTimeout);
        console.error('WebSocket error details:', {
          url: fullURL,
          readyState: this.socket?.readyState,
          readyStateText: this.getReadyStateText(this.socket?.readyState),
          error: error,
          timestamp: new Date().toISOString()
        });
        this.onError(error);
        reject(new Error(`WebSocket connection failed to ${fullURL}`));
      };

      this.socket.onclose = (event) => {
        clearTimeout(connectTimeout);
        console.log('WebSocket closed:', {
          url: fullURL,
          code: event.code,
          reason: event.reason,
          wasClean: event.wasClean
        });
        
        // 自動再接続の試行
        if (!event.wasClean && this.reconnectAttempts < this.maxReconnectAttempts) {
          this.reconnectAttempts++;
          console.log(`Attempting to reconnect (${this.reconnectAttempts}/${this.maxReconnectAttempts})...`);
          setTimeout(() => {
            this.connect().catch(console.error);
          }, this.reconnectInterval);
        } else {
          this.onClose();
        }
      };
    });
  }

  private getReadyStateText(readyState?: number): string {
    switch (readyState) {
      case WebSocket.CONNECTING: return 'CONNECTING';
      case WebSocket.OPEN: return 'OPEN';
      case WebSocket.CLOSING: return 'CLOSING';
      case WebSocket.CLOSED: return 'CLOSED';
      default: return 'UNDEFINED';
    }
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
