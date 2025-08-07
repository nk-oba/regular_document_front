'use client'

import React from 'react'
import { Message } from '@/types/chat'
import FileDownload from './FileDownload'

interface MessageBubbleProps {
  message: Message
}

const MessageBubble: React.FC<MessageBubbleProps> = ({ message }) => {
  const isUser = message.sender === 'user'
  const isAgent = message.sender === 'agent'

  return (
    <div className={`flex ${isUser ? 'justify-end' : 'justify-start'}`}>
      <div className={`flex items-start space-x-2 max-w-2xl ${isUser ? 'flex-row-reverse space-x-reverse' : ''}`}>
        {/* Avatar */}
        <div className={`w-8 h-8 rounded-full flex items-center justify-center text-white text-sm font-semibold flex-shrink-0 ${
          isUser ? 'bg-blue-500' : 'bg-green-500'
        }`}>
          {isUser ? 'U' : 'AI'}
        </div>
        
        {/* Message Content */}
        <div className={`rounded-lg p-3 ${
          isUser 
            ? 'bg-blue-500 text-white' 
            : 'bg-white border border-gray-200 text-gray-800'
        }`}>
          <div className="whitespace-pre-wrap break-words">
            {message.content}
          </div>
          
          {/* PowerPointファイルダウンロード機能 */}
          {isAgent && <FileDownload content={message.content} />}
          
          <div className={`text-xs mt-2 ${
            isUser ? 'text-blue-100' : 'text-gray-500'
          }`}>
            {message.timestamp.toLocaleTimeString('ja-JP', {
              hour: '2-digit',
              minute: '2-digit'
            })}
          </div>
        </div>
      </div>
    </div>
  )
}

export default MessageBubble