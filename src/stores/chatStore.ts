import { create } from 'zustand';
import { devtools, persist } from 'zustand/middleware';
import { ChatSession } from '@/types/chat';
import { chatApi } from '@/lib/api';
import { logger } from '@/utils/logger';

interface ChatState {
  sessions: ChatSession[];
  currentSession: ChatSession | null;
  isLoading: boolean;
  selectedAgent: string;
}

interface ChatActions {
  setSessions: (sessions: ChatSession[]) => void;
  setCurrentSession: (session: ChatSession | null) => void;
  setLoading: (loading: boolean) => void;
  setSelectedAgent: (agent: string) => void;
  createSession: (userId: string) => Promise<void>;
  updateSession: (session: ChatSession) => void;
  clearSessions: () => void;
  loadSessionFromApi: (
    appName: string,
    userId: string,
    sessionId: string
  ) => Promise<void>;
}

export interface ChatStore extends ChatState, ChatActions {}

const generateSessionId = () =>
  `session_${Date.now()}_${Math.floor(Math.random() * 1000)}`;

export const useChatStore = create<ChatStore>()(
  devtools(
    persist(
      (set, get) => ({
        // Initial state
        sessions: [],
        currentSession: null,
        isLoading: false,
        selectedAgent: 'document_creating_agent',

        // Actions
        setSessions: (sessions) => set({ sessions }, false, 'setSessions'),

        setCurrentSession: (session) =>
          set({ currentSession: session }, false, 'setCurrentSession'),

        setLoading: (loading) =>
          set({ isLoading: loading }, false, 'setLoading'),

        setSelectedAgent: (agent) =>
          set({ selectedAgent: agent }, false, 'setSelectedAgent'),

        createSession: async (userId) => {
          const newSessionId = generateSessionId();
          const newSession: ChatSession = {
            id: newSessionId,
            messages: [],
            title: '新しいチャット',
            createdAt: new Date(),
            selectedAgent: get().selectedAgent,
          };

          try {
            // Create backend session
            await chatApi.createSession(
              get().selectedAgent,
              userId,
              newSessionId,
              {}
            );
            logger.info(
              'Backend session created',
              { sessionId: newSessionId },
              'ChatStore'
            );
          } catch (error) {
            logger.error(
              'Failed to create backend session',
              error,
              'ChatStore'
            );
          }

          // Update state
          const currentSessions = get().sessions;
          const newSessions = [newSession, ...currentSessions];

          set(
            {
              currentSession: newSession,
              sessions: newSessions,
            },
            false,
            'createSession'
          );
        },

        updateSession: (updatedSession) => {
          const currentSessions = get().sessions;
          const existingIndex = currentSessions.findIndex(
            (s) => s.id === updatedSession.id
          );

          let newSessions: ChatSession[];
          if (existingIndex >= 0) {
            newSessions = [...currentSessions];
            newSessions[existingIndex] = updatedSession;
          } else {
            newSessions = [updatedSession, ...currentSessions];
          }

          set(
            {
              sessions: newSessions,
              currentSession: updatedSession,
            },
            false,
            'updateSession'
          );
        },

        clearSessions: () => {
          set(
            {
              sessions: [],
              currentSession: null,
            },
            false,
            'clearSessions'
          );
        },

        loadSessionFromApi: async (appName, userId, sessionId) => {
          set({ isLoading: true }, false, 'loadSessionFromApi:start');

          try {
            const sessionResponse = await chatApi.getSession(
              appName,
              userId,
              sessionId
            );

            // APIレスポンスをChatSessionに変換
            const messages: any[] = [];

            // 1. events配列からメッセージを抽出（正しい構造）
            if (
              sessionResponse.events &&
              Array.isArray(sessionResponse.events)
            ) {
              sessionResponse.events.forEach((event: any) => {
                if (
                  event?.content?.parts &&
                  Array.isArray(event.content.parts)
                ) {
                  // 各イベントのpartsからテキストコンテンツを抽出
                  const textContent = event.content.parts
                    .filter((part: any) => part?.text)
                    .map((part: any) => part.text)
                    .join('\n');

                  if (textContent) {
                    // roleまたはauthorからsenderを決定
                    let sender = 'agent';
                    if (
                      event.content.role === 'user' ||
                      event.author === 'user'
                    ) {
                      sender = 'user';
                    }

                    messages.push({
                      id: event.id || crypto.randomUUID(),
                      content: textContent,
                      sender: sender as 'user' | 'agent',
                      timestamp: new Date(
                        event.timestamp
                          ? event.timestamp * 1000
                          : sessionResponse.updatedAt
                      ),
                      artifactDelta: event.actions?.artifactDelta,
                      invocationId: event.invocationId,
                    });
                  }
                }
              });
            }
            // 2. フォールバック: state.messages構造
            else if (
              sessionResponse.state?.messages &&
              Array.isArray(sessionResponse.state.messages)
            ) {
              sessionResponse.state.messages.forEach((msg: any) => {
                if (msg?.content && msg?.sender) {
                  messages.push({
                    id: msg.id || crypto.randomUUID(),
                    content: msg.content,
                    sender: msg.sender === 'user' ? 'user' : 'agent',
                    timestamp: new Date(
                      msg.timestamp || sessionResponse.updatedAt
                    ),
                    artifactDelta: msg.artifactDelta,
                    invocationId: msg.invocationId,
                  });
                }
              });
            }

            // セッションタイトルを抽出
            const title =
              sessionResponse.state?.title ||
              (messages.length > 0
                ? messages[0].content.slice(0, 50) + '...'
                : '新しいチャット');

            const loadedSession: ChatSession = {
              id: sessionResponse.id,
              messages,
              title,
              createdAt: new Date(sessionResponse.createdAt),
              selectedAgent: appName,
            };

            // 既存のセッション一覧を更新
            const currentSessions = get().sessions;
            const existingIndex = currentSessions.findIndex(
              (s) => s.id === sessionId
            );

            let updatedSessions: ChatSession[];
            if (existingIndex >= 0) {
              updatedSessions = [...currentSessions];
              updatedSessions[existingIndex] = loadedSession;
            } else {
              updatedSessions = [loadedSession, ...currentSessions];
            }

            set(
              {
                currentSession: loadedSession,
                sessions: updatedSessions,
                isLoading: false,
              },
              false,
              'loadSessionFromApi:success'
            );

            logger.info(
              'Session loaded from API',
              { sessionId, messageCount: messages.length },
              'ChatStore'
            );
          } catch (error) {
            logger.error('Failed to load session from API', error, 'ChatStore');
            set({ isLoading: false }, false, 'loadSessionFromApi:error');
          }
        },
      }),
      {
        name: 'chat-store',
        partialize: (state) => ({
          sessions: state.sessions,
          selectedAgent: state.selectedAgent,
        }),
        storage: {
          getItem: (name) => {
            const value = localStorage.getItem(name);
            if (!value) return null;

            try {
              const parsed = JSON.parse(value);
              if (parsed.state && parsed.state.sessions) {
                parsed.state.sessions = parsed.state.sessions.map(
                  (session: any) => ({
                    ...session,
                    createdAt: new Date(session.createdAt),
                    messages: session.messages.map((msg: any) => ({
                      ...msg,
                      timestamp: new Date(msg.timestamp),
                    })),
                  })
                );
              }
              return parsed;
            } catch (error) {
              logger.error(
                'Failed to parse stored chat data',
                error,
                'ChatStore'
              );
              return null;
            }
          },
          setItem: (name, value) => {
            localStorage.setItem(name, JSON.stringify(value));
          },
          removeItem: (name) => {
            localStorage.removeItem(name);
          },
        },
      }
    ),
    {
      name: 'chat-store',
    }
  )
);
