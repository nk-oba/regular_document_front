"use client";

import React from "react";
import { ChatSession } from "@/types/chat";

interface SidebarProps {
  sessions: ChatSession[];
  currentSessionId: string | null;
  onSessionSelect: (session: ChatSession) => void;
  onNewChat: () => void;
}

const Sidebar: React.FC<SidebarProps> = ({
  sessions,
  currentSessionId,
  onSessionSelect,
  onNewChat,
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
                      ? "bg-blue-100 border border-blue-300"
                      : "hover:bg-gray-200"
                  }`}
                >
                  <div className="truncate font-medium text-sm">
                    {session.title}
                  </div>
                  <div className="text-xs text-gray-500 mt-1">
                    {session.createdAt.toLocaleDateString("ja-JP")}
                  </div>
                </button>
              ))}
            </div>
          )}
        </div>
      </div>

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
