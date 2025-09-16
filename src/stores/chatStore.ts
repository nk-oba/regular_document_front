import { create } from 'zustand';
import { devtools, persist } from 'zustand/middleware';
import { ChatSession } from '@/types/chat';
import { chatApi } from '@/lib/api';

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
            console.log('Backend session created:', newSessionId);
          } catch (error) {
            console.error('Failed to create backend session:', error);
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
              console.error('Failed to parse stored chat data:', error);
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
