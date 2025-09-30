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
  loadSessionsFromApi: (appName: string, userId: string) => Promise<void>;
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
              // まず、invocationIdごとのartifactDeltaマップを作成
              const artifactDeltaByInvocation = new Map<string, any>();
              sessionResponse.events.forEach((event: any) => {
                if (event.invocationId && event.actions?.artifactDelta) {
                  const existingDelta =
                    artifactDeltaByInvocation.get(event.invocationId) || {};
                  artifactDeltaByInvocation.set(event.invocationId, {
                    ...existingDelta,
                    ...event.actions.artifactDelta,
                  });
                }
              });

              console.log(
                'chatStore - ArtifactDelta by invocation:',
                Object.fromEntries(artifactDeltaByInvocation)
              );

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

                    // invocationIdに基づいてartifactDeltaを取得
                    const artifactDelta = event.invocationId
                      ? artifactDeltaByInvocation.get(event.invocationId) ||
                        event.actions?.artifactDelta
                      : event.actions?.artifactDelta;

                    const message = {
                      id: event.id || crypto.randomUUID(),
                      content: textContent,
                      sender: sender as 'user' | 'agent',
                      timestamp: new Date(
                        event.timestamp
                          ? event.timestamp * 1000
                          : sessionResponse.updatedAt
                      ),
                      artifactDelta,
                      invocationId: event.invocationId,
                    };

                    // デバッグ用: artifactDelta を含むメッセージをログ出力
                    if (
                      artifactDelta &&
                      Object.keys(artifactDelta).length > 0
                    ) {
                      console.log('chatStore - Message with artifactDelta:', {
                        eventId: event.id,
                        artifactDelta,
                        invocationId: event.invocationId,
                        sender,
                        content: textContent.slice(0, 100) + '...',
                      });
                    }

                    messages.push(message);
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

            // セッションタイトルを抽出（既存セッション一覧のタイトルを優先）
            const allSessions = get().sessions;
            const existingSession = allSessions.find((s) => s.id === sessionId);

            console.log('🔍 Session title resolution:', {
              sessionId,
              stateTitle: sessionResponse.state?.title,
              existingTitle: existingSession?.title,
              firstMessage:
                messages.length > 0
                  ? messages[0].content.slice(0, 50)
                  : 'no messages',
            });

            const title =
              sessionResponse.state?.title ||
              existingSession?.title ||
              (messages.length > 0
                ? messages[0].content.slice(0, 50) + '...'
                : '新しいチャット');

            const loadedSession: ChatSession = {
              id: sessionResponse.id,
              messages,
              title,
              createdAt:
                existingSession?.createdAt ||
                new Date(sessionResponse.createdAt),
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

        loadSessionsFromApi: async (appName, userId) => {
          set({ isLoading: true }, false, 'loadSessionsFromApi:start');

          console.log('🔍 loadSessionsFromApi called with:', {
            appName,
            userId,
          });

          // localStorage清掃（API統合のため）
          try {
            localStorage.removeItem('chat-store');
            console.log('✅ localStorage cleared');
          } catch (e) {
            logger.warn('Failed to clear localStorage:', e, 'ChatStore');
          }

          try {
            console.log('📡 Calling API: listSessions...');
            const response = await chatApi.listSessions(appName, userId);
            console.log('📥 API Response received:', response);

            // listSessions は既に sessions 配列を返す
            const sessionResponses = response;
            logger.info(
              'API sessions loaded',
              { count: sessionResponses.length },
              'ChatStore'
            );

            // APIレスポンスをChatSessionの配列に変換
            const apiSessions: ChatSession[] = sessionResponses.map(
              (sessionResponse: any) => {
                const messages: any[] = [];

                // API レスポンスからメッセージを構築（一覧では詳細は取得せず、簡略版のみ）
                if (sessionResponse.firstMessage) {
                  messages.push({
                    id: 'first-' + sessionResponse.id,
                    content: sessionResponse.firstMessage.content,
                    sender:
                      sessionResponse.firstMessage.role === 'user'
                        ? 'user'
                        : 'agent',
                    timestamp: new Date(
                      sessionResponse.firstMessage.timestamp ||
                        sessionResponse.createdAt
                    ),
                    artifactDelta: undefined,
                    invocationId: undefined,
                  });
                }

                if (
                  sessionResponse.lastMessage &&
                  sessionResponse.lastMessage !== sessionResponse.firstMessage
                ) {
                  messages.push({
                    id: 'last-' + sessionResponse.id,
                    content: sessionResponse.lastMessage.content,
                    sender:
                      sessionResponse.lastMessage.role === 'user'
                        ? 'user'
                        : 'agent',
                    timestamp: new Date(
                      sessionResponse.lastMessage.timestamp ||
                        sessionResponse.updatedAt
                    ),
                    artifactDelta: undefined,
                    invocationId: undefined,
                  });
                }

                // セッションタイトルを抽出（APIで提供される title を優先）
                const title =
                  sessionResponse.title ||
                  (sessionResponse.firstMessage?.content
                    ? sessionResponse.firstMessage.content.slice(0, 50) + '...'
                    : '新しいチャット');
                // デバッグ用（必要に応じて削除）
                if (
                  !sessionResponse.title &&
                  !sessionResponse.firstMessage?.content
                ) {
                  logger.warn(
                    'Session without title or first message',
                    {
                      sessionId: sessionResponse.id,
                    },
                    'ChatStore'
                  );
                }

                return {
                  id: sessionResponse.id,
                  messages,
                  title,
                  createdAt: new Date(sessionResponse.createdAt),
                  selectedAgent: sessionResponse.selectedAgent || appName,
                };
              }
            );

            // 作成日時でソート（新しい順）
            const sortedSessions = apiSessions.sort(
              (a, b) => b.createdAt.getTime() - a.createdAt.getTime()
            );

            set(
              {
                sessions: sortedSessions,
                isLoading: false,
              },
              false,
              'loadSessionsFromApi:success'
            );

            logger.info(
              'Sessions loaded from API',
              {
                sessionCount: sortedSessions.length,
                firstSession: sortedSessions[0],
              },
              'ChatStore'
            );
          } catch (error) {
            logger.error(
              'Failed to load sessions from API',
              error,
              'ChatStore'
            );

            // エラー時はlocalStorageからフォールバック
            logger.info(
              'Falling back to localStorage sessions',
              undefined,
              'ChatStore'
            );
            set({ isLoading: false }, false, 'loadSessionsFromApi:error');

            // 既存のlocalStorageデータを保持
          }
        },
      }),
      {
        name: 'chat-store',
        partialize: (state) => ({
          // API統合のため、sessionsの永続化は一時的に削除
          // sessions: state.sessions,
          selectedAgent: state.selectedAgent,
        }),
        storage: {
          getItem: (name) => {
            const value = localStorage.getItem(name);
            if (!value) return null;

            try {
              const parsed = JSON.parse(value);
              // API統合後はsessionsデータの復元をスキップ
              if (parsed.state && parsed.state.sessions) {
                delete parsed.state.sessions;
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
