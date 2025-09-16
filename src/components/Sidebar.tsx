'use client';

import React from 'react';
import { ChatSession } from '@/types/chat';

interface User {
  id: string;
  email: string;
  name: string;
}

interface SidebarProps {
  sessions: ChatSession[];
  currentSessionId: string | null;
  onSessionSelect: (session: ChatSession) => void;
  onNewChat: () => void;
  user?: User | null;
  onLogout?: () => Promise<void> | void;
}

const formatDate = (date: Date | string | undefined): string => {
  try {
    if (!date) return '日付不明';
    const dateObj = date instanceof Date ? date : new Date(date);
    if (isNaN(dateObj.getTime())) return '日付不明';
    return dateObj.toLocaleDateString('ja-JP');
  } catch (error) {
    console.error('Date formatting error:', error);
    return '日付不明';
  }
};

const Sidebar: React.FC<SidebarProps> = ({
  sessions,
  currentSessionId,
  onSessionSelect,
  onNewChat,
  user,
  onLogout,
}) => {
  return (
    <div className="w-64 bg-gray-100 border-r border-gray-300 flex flex-col h-full">
      <div className="p-4 border-b border-gray-300">
        <button
          onClick={onNewChat}
          className="w-full bg-blue-500 hover:bg-blue-600 text-white px-4 py-2 rounded-lg font-medium transition-colors duration-200"
        >
          + 新しいチャット
        </button>
      </div>

      <div className="flex-1 overflow-y-auto">
        <div className="p-2">
          <h3 className="text-sm font-semibold text-gray-600 mb-2 px-2">
            チャット履歴
          </h3>
          {sessions.length === 0 ? (
            <div className="text-center text-gray-500 mt-8 text-sm">
              チャット履歴がありません
            </div>
          ) : (
            <div className="space-y-1">
              {sessions.map((session) => (
                <button
                  key={session.id}
                  onClick={() => onSessionSelect(session)}
                  className={`w-full text-left p-2 rounded-lg transition-colors duration-150 ${
                    currentSessionId === session.id
                      ? 'bg-blue-100 border border-blue-300'
                      : 'hover:bg-gray-200'
                  }`}
                >
                  <div className="truncate font-medium text-sm">
                    {session.title}
                  </div>
                  <div className="text-xs text-gray-500 mt-1">
                    {formatDate(session.createdAt)}
                  </div>
                </button>
              ))}
            </div>
          )}
        </div>
      </div>

      {/* アカウント情報 */}
      {user && onLogout && (
        <div className="p-4 border-t border-gray-300">
          <div className="flex items-center space-x-3 mb-3">
            <div className="flex items-center space-x-2">
              <div className="w-8 h-8 bg-blue-500 text-white rounded-full flex items-center justify-center text-sm font-medium">
                {user.name.charAt(0).toUpperCase()}
              </div>
              <span className="text-sm text-gray-600">{user.name}</span>
            </div>
          </div>
          <button
            onClick={onLogout}
            className="w-full bg-red-500 hover:bg-red-600 text-white px-3 py-2 rounded-md text-sm font-medium transition-colors duration-200 flex items-center justify-center space-x-2"
          >
            <svg
              className="w-4 h-4"
              fill="none"
              stroke="currentColor"
              viewBox="0 0 24 24"
              xmlns="http://www.w3.org/2000/svg"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={2}
                d="M17 16l4-4m0 0l-4-4m4 4H7m6 4v1a3 3 0 01-3 3H6a3 3 0 01-3-3V7a3 3 0 013-3h4a3 3 0 013 3v1"
              />
            </svg>
            <span>ログアウト</span>
          </button>
        </div>
      )}

      <div className="p-4 border-t border-gray-300">
        <div className="text-xs text-gray-500 text-center">
          AIエージェント
          <br />
          Powered by Vertex AI
        </div>
      </div>
    </div>
  );
};

export default Sidebar;
