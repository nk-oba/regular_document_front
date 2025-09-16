'use client';

import React, { useState, useEffect } from 'react';

export interface AgentOption {
  id: string;
  name: string;
  description: string;
  isEnabled: boolean;
}

interface AgentSelectorProps {
  selectedAgent: string;
  onAgentChange: (agentId: string) => void;
  isConnected: boolean;
  compact?: boolean;
}

const AgentSelector: React.FC<AgentSelectorProps> = ({
  selectedAgent,
  onAgentChange,
  isConnected,
  compact = false,
}) => {
  const [agents, setAgents] = useState<AgentOption[]>([]);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    const fetchAvailableAgents = async () => {
      if (!isConnected) return;

      setLoading(true);
      try {
        const baseURL =
          import.meta.env.VITE_AGENTS_URL?.replace(
            'agents:8000',
            'localhost:8000'
          ) || 'http://localhost:8000';
        const response = await fetch(`${baseURL}/list-apps`, {
          headers: {
            accept: 'application/json',
          },
        });

        if (response.ok) {
          const data = await response.json();
          const agentOptions = (data.apps || []).map(
            (
              app: { id?: string; name?: string; description?: string } | string
            ) => {
              const appId =
                typeof app === 'string' ? app : app.name || app.id || '';
              return {
                id: appId,
                name: getAgentDisplayName(appId),
                description:
                  typeof app === 'string'
                    ? getAgentDescription(appId)
                    : app.description || getAgentDescription(appId),
                isEnabled: true,
              };
            }
          );
          setAgents(agentOptions);
        } else {
          console.error('Failed to fetch apps:', response.statusText);
          setAgents(getDefaultAgents());
        }
      } catch (error) {
        console.error('Error fetching available agents:', error);
        setAgents(getDefaultAgents());
      } finally {
        setLoading(false);
      }
    };

    fetchAvailableAgents();
  }, [isConnected]);

  const getDefaultAgents = (): AgentOption[] => [
    {
      id: 'document_creating_agent',
      name: '定例資作成エージェント',
      description: '広告運用の報告資料を作成するメインエージェント',
      isEnabled: true,
    },
  ];

  // TODO: Wrap this function to get the agent name from the agent id
  const getAgentDisplayName = (agentId: string): string => {
    const displayNames: { [key: string]: string } = {
      document_creating_agent: '定例資作成エージェント',
    };
    return displayNames[agentId] || agentId;
  };

  const getAgentDescription = (agentId: string): string => {
    const descriptions: { [key: string]: string } = {
      document_creating_agent: '広告運用の報告資料を作成するメインエージェント',
    };
    return descriptions[agentId] || `${agentId}エージェント`;
  };

  if (compact) {
    const selectedAgentData = agents.find(
      (agent) => agent.id === selectedAgent
    );

    return (
      <div className="flex flex-col space-y-2">
        <div className="flex items-center space-x-2">
          <select
            value={selectedAgent}
            onChange={(e) => onAgentChange(e.target.value)}
            disabled={!isConnected || loading}
            className="px-3 py-2 border border-gray-300 rounded-lg shadow-sm focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500 disabled:bg-gray-100 disabled:cursor-not-allowed text-sm font-medium bg-white hover:border-gray-400 transition-colors min-w-[280px]"
          >
            {loading ? (
              <option value="">読み込み中...</option>
            ) : (
              agents
                .filter((agent) => agent.isEnabled)
                .map((agent) => (
                  <option key={agent.id} value={agent.id}>
                    {agent.name}
                  </option>
                ))
            )}
          </select>
          {!isConnected && (
            <span className="text-xs text-orange-600 bg-orange-50 px-2 py-1 rounded">
              未接続
            </span>
          )}
        </div>

        {selectedAgentData && (
          <div className="text-xs text-gray-500 max-w-md">
            {selectedAgentData.description}
          </div>
        )}
      </div>
    );
  }

  return (
    <div className="p-4 bg-white border-b border-gray-200">
      <div className="mb-3">
        <label className="block text-sm font-medium text-gray-700 mb-2">
          使用するエージェント
        </label>
        <select
          value={selectedAgent}
          onChange={(e) => onAgentChange(e.target.value)}
          disabled={!isConnected || loading}
          className="w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500 disabled:bg-gray-100 disabled:cursor-not-allowed"
        >
          {loading ? (
            <option value="">エージェント一覧を読み込み中...</option>
          ) : (
            agents
              .filter((agent) => agent.isEnabled)
              .map((agent) => (
                <option key={agent.id} value={agent.id}>
                  {agent.name}
                </option>
              ))
          )}
        </select>
      </div>

      <div className="text-xs text-gray-600">
        {loading
          ? 'エージェント情報を読み込み中...'
          : agents.find((agent) => agent.id === selectedAgent)?.description ||
            `${selectedAgent}エージェント`}
      </div>

      {!isConnected && (
        <div className="mt-2 text-xs text-orange-600 bg-orange-50 px-2 py-1 rounded">
          接続していない間はエージェントを変更できません
        </div>
      )}
    </div>
  );
};

export default AgentSelector;
