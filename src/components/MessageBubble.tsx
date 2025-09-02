'use client'

import React from 'react'
import ReactMarkdown from 'react-markdown'
import remarkGfm from 'remark-gfm'
import rehypeHighlight from 'rehype-highlight'
import { Message } from '@/types/chat'
import FileDownload from './FileDownload'

interface MessageBubbleProps {
  message: Message
  userName?: string
}

const MessageBubble: React.FC<MessageBubbleProps> = ({ message, userName }) => {
  const isUser = message.sender === 'user'
  const isAgent = message.sender === 'agent'

  return (
    <div className={`flex ${isUser ? 'justify-end' : 'justify-start'}`}>
      <div className={`flex items-start space-x-2 max-w-2xl ${isUser ? 'flex-row-reverse space-x-reverse' : ''}`}>
        {/* Avatar */}
        <div className={`w-8 h-8 rounded-full flex items-center justify-center text-white text-sm font-semibold flex-shrink-0 ${
          isUser ? 'bg-blue-500' : 'bg-green-500'
        }`}>
          {isUser ? (userName ? userName.charAt(0).toUpperCase() : 'U') : 'AI'}
        </div>
        
        {/* Message Content */}
        <div className={`rounded-lg p-3 ${
          isUser 
            ? 'bg-blue-500 text-white' 
            : 'bg-white border border-gray-200 text-gray-800'
        }`}>
          <div className="break-words">
            {isAgent ? (
              <div className="prose prose-sm max-w-none">
                <ReactMarkdown
                  remarkPlugins={[remarkGfm]}
                  rehypePlugins={[rehypeHighlight]}
                  components={{
                    // カスタムスタイリング
                    h1: ({ ...props }) => <h1 className="text-lg font-bold mb-2" {...props} />,
                    h2: ({ ...props }) => <h2 className="text-base font-bold mb-2" {...props} />,
                    h3: ({ ...props }) => <h3 className="text-sm font-bold mb-1" {...props} />,
                    p: ({ ...props }) => <p className="mb-2 last:mb-0" {...props} />,
                    ul: ({ ...props }) => <ul className="list-disc pl-4 mb-2" {...props} />,
                    ol: ({ ...props }) => <ol className="list-decimal pl-4 mb-2" {...props} />,
                    li: ({ ...props }) => <li className="mb-1" {...props} />,
                    code: ({ node, inline, className, children, ...props }: any) => 
                      inline ? (
                        <code className="bg-gray-100 px-1 py-0.5 rounded text-sm font-mono" {...props}>
                          {children}
                        </code>
                      ) : (
                        <code className="block bg-gray-100 p-2 rounded text-sm font-mono overflow-x-auto" {...props}>
                          {children}
                        </code>
                      ),
                    pre: ({ ...props }) => <pre className="bg-gray-100 p-2 rounded mb-2 overflow-x-auto" {...props} />,
                    blockquote: ({ ...props }) => <blockquote className="border-l-4 border-gray-300 pl-3 italic mb-2" {...props} />,
                    table: ({ ...props }) => <table className="min-w-full border-collapse border border-gray-300 mb-2" {...props} />,
                    th: ({ ...props }) => <th className="border border-gray-300 px-2 py-1 bg-gray-50 font-semibold" {...props} />,
                    td: ({ ...props }) => <td className="border border-gray-300 px-2 py-1" {...props} />,
                    a: ({ ...props }) => <a className="text-blue-600 hover:underline" {...props} />,
                    strong: ({ ...props }) => <strong className="font-bold" {...props} />,
                    em: ({ ...props }) => <em className="italic" {...props} />
                  }}
                >
                  {message.content}
                </ReactMarkdown>
              </div>
            ) : (
              <div className="whitespace-pre-wrap">
                {message.content}
              </div>
            )}
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