import { ArtifactDelta } from './api';

export interface Message {
  id: string
  content: string
  sender: 'user' | 'agent'
  timestamp: Date
  artifactDelta?: ArtifactDelta
  invocationId?: string
}

export interface ChatSession {
  id: string
  messages: Message[]
  title: string
  createdAt: Date
  selectedAgent?: string
}

// Re-export API types for backward compatibility
export type {
  MessageRequest,
  MessageResponse,
  ArtifactDelta
} from './api';