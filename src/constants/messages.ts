export const UI_MESSAGES = {
  LOADING: {
    AUTH_CHECK: '認証状態を確認中...',
    MCP_PROCESSING: '処理中...',
  },
  AUTH: {
    LOGIN_TITLE: 'AIエージェントシステム',
    LOGIN_SUBTITLE: 'Google アカウントでログインしてください',
    LOGIN_FAILED: 'ログインに失敗しました',
    MCP_CONNECT_TOOLTIP: 'クリックして認証',
    MCP_DISCONNECT_TOOLTIP: 'クリックして認証を解除',
  },
  CHAT: {
    NEW_CHAT: '新しいチャット',
    DEFAULT_AGENT: 'document_creating_agent',
  },
  ERROR: {
    SESSION_CREATE_FAILED: 'Failed to create backend session:',
    MCP_AUTH_FAILED: 'MCP Ad Analyzer authentication toggle failed:',
  },
} as const;