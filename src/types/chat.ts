export interface Message {
  id: string
  content: string
  sender: 'user' | 'agent'
  timestamp: Date
}

export interface ChatSession {
  id: string
  messages: Message[]
  title: string
  createdAt: Date
}

export interface MessageRequest {
  message: string
  conversation_id?: string
}

export interface MessageResponse {
  response: string
  conversation_id: string
}