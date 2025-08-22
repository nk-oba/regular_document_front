'use client'

import React, { useState, useRef, useEffect } from 'react'
import { Message, ChatSession } from '@/types/chat'
import { WebSocketClient } from '@/lib/api'
import MessageBubble from './MessageBubble'
import ChatInput from './ChatInput'

interface ChatProps {
  session: ChatSession | null
  onSessionUpdate: (session: ChatSession) => void
}

const Chat: React.FC<ChatProps> = ({ session, onSessionUpdate }) => {
  const [messages, setMessages] = useState<Message[]>(session?.messages || [])
  const [isLoading, setIsLoading] = useState(false)
  const messagesEndRef = useRef<HTMLDivElement>(null)
  const [conversationId, setConversationId] = useState<string | undefined>(session?.id)
  const [wsClient, setWsClient] = useState<WebSocketClient | null>(null)
  const [isConnected, setIsConnected] = useState(false)

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' })
  }

  useEffect(() => {
    scrollToBottom()
  }, [messages])

  useEffect(() => {
    if (session) {
      setMessages(session.messages)
      setConversationId(session.id)
    }
  }, [session])

  useEffect(() => {
    const clientId = Math.floor(Math.random() * 10000)
    
    const client = new WebSocketClient(
      clientId,
      (message) => {
        const agentMessage: Message = {
          id: Date.now().toString(),
          content: message.message,
          sender: 'agent',
          timestamp: new Date()
        }
        setMessages(prev => [...prev, agentMessage])
        setIsLoading(false)
      },
      (error) => {
        console.error('WebSocket error:', error)
        setIsConnected(false)
      },
      () => {
        setIsConnected(false)
      }
    )

    client.connect()
      .then(() => {
        setIsConnected(true)
        setWsClient(client)
      })
      .catch((error) => {
        console.error('Failed to connect WebSocket:', error)
      })

    return () => {
      client.disconnect()
    }
  }, [])

  const handleSendMessage = async (content: string) => {
    if (!content.trim() || !wsClient || !isConnected) return

    const userMessage: Message = {
      id: Date.now().toString(),
      content: content.trim(),
      sender: 'user',
      timestamp: new Date()
    }

    setMessages(prev => [...prev, userMessage])
    setIsLoading(true)

    try {
      wsClient.sendMessage(content.trim())
      
      const sessionId = conversationId || Date.now().toString()
      if (!conversationId) {
        setConversationId(sessionId)
      }

      const updatedSession: ChatSession = {
        id: sessionId,
        messages: [...messages, userMessage],
        title: content.slice(0, 50) + (content.length > 50 ? '...' : ''),
        createdAt: session?.createdAt || new Date()
      }
      
      onSessionUpdate(updatedSession)

    } catch (error) {
      console.error('Failed to send message:', error)
      const errorMessage: Message = {
        id: (Date.now() + 1).toString(),
        content: 'エラーが発生しました。WebSocket接続を確認してください。',
        sender: 'agent',
        timestamp: new Date()
      }
      setMessages(prev => [...prev, errorMessage])
      setIsLoading(false)
    }
  }

  return (
    <div className="flex flex-col h-full">
      <div className="p-2 bg-gray-50 border-b">
        <div className="flex items-center justify-between">
          <span className="text-sm font-medium">PowerPoint資料作成AI</span>
          <div className="flex items-center">
            <div className={`w-2 h-2 rounded-full mr-2 ${isConnected ? 'bg-green-500' : 'bg-red-500'}`} />
            <span className="text-xs text-gray-600">
              {isConnected ? '接続済み' : '未接続'}
            </span>
          </div>
        </div>
      </div>
      <div className="flex-1 overflow-y-auto p-4 space-y-4">
        {messages.length === 0 && (
          <div className="flex items-center justify-center h-full">
            <div className="text-center text-gray-500">
              <h2 className="text-2xl font-bold mb-4">PowerPoint資料作成AI</h2>
              <p>メッセージを送信して会話を開始してください</p>
              <p className="text-sm mt-2">例: 「売上分析のプレゼン資料を作成してください」</p>
            </div>
          </div>
        )}
        
        {messages.map(message => (
          <MessageBubble key={message.id} message={message} />
        ))}
        
        {isLoading && (
          <div className="flex justify-start">
            <div className="bg-gray-100 rounded-lg p-3 max-w-xs">
              <div className="flex space-x-1">
                <div className="w-2 h-2 bg-gray-400 rounded-full animate-bounce"></div>
                <div className="w-2 h-2 bg-gray-400 rounded-full animate-bounce" style={{ animationDelay: '0.1s' }}></div>
                <div className="w-2 h-2 bg-gray-400 rounded-full animate-bounce" style={{ animationDelay: '0.2s' }}></div>
              </div>
            </div>
          </div>
        )}
        
        <div ref={messagesEndRef} />
      </div>
      
      <ChatInput onSendMessage={handleSendMessage} disabled={isLoading || !isConnected} />
    </div>
  )
}

export default Chat