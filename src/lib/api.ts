import axios from 'axios'
import { MessageRequest, MessageResponse } from '@/types/chat'

const api = axios.create({
  baseURL: process.env.NODE_ENV === 'development' 
    ? 'http://localhost:8000' 
    : '/api',
  timeout: 30000,
})

export const chatApi = {
  sendMessage: async (request: MessageRequest): Promise<MessageResponse> => {
    const response = await api.post<MessageResponse>('/chat', request)
    return response.data
  },

  healthCheck: async (): Promise<{ status: string }> => {
    const response = await api.get('/health')
    return response.data
  }
}

export default api