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
  selectedAgent?: string
}

export interface MessageRequest {
  appName: string
  userId: string
  sessionId: string
  newMessage: {
    parts: { text: string }[]
    role: string
  }
  streaming?: boolean
}

export interface MessageResponse {
  response: string
  conversation_id: string
}