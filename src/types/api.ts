/**
 * API response and request types for agent communication
 */

export type ArtifactType = 'text' | 'code' | 'document' | 'image' | 'data';

export interface ArtifactDelta {
  type: ArtifactType;
  content: string;
  metadata?: {
    filename?: string;
    language?: string;
    encoding?: string;
    size?: number;
    version?: number;
    [key: string]: unknown;
  };
}

export interface MessagePart {
  text: string;
}

export interface MessageContent {
  parts: MessagePart[];
}

export interface ActionEvent {
  artifactDelta?: ArtifactDelta;
  [key: string]: unknown;
}

export interface AgentResponseEvent {
  content?: MessageContent;
  actions?: ActionEvent;
  invocationId?: string;
  role?: 'assistant' | 'user' | 'system';
  timestamp?: string;
  status?: 'success' | 'error' | 'processing';
}

export interface MessageResponse extends Array<AgentResponseEvent> {}

// Legacy support - will be removed in next phase
export interface LegacyMessageResponse {
  response: string;
  conversation_id: string;
}

export interface MessageRequest {
  appName: string;
  userId: string;
  sessionId: string;
  newMessage: {
    parts: MessagePart[];
    role: string;
  };
  streaming?: boolean;
}

export interface SessionCreateRequest {
  state?: Record<string, any>;
}

export interface SessionResponse {
  id: string;
  state: Record<string, any>;
  createdAt: string;
  updatedAt: string;
}

export interface HealthCheckResponse {
  status: 'ok' | 'error';
  apps?: string[];
}

export interface ApiError {
  message: string;
  code?: string;
  details?: Record<string, any>;
}