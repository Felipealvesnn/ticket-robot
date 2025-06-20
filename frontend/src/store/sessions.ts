import { create } from "zustand";
import { devtools, persist } from "zustand/middleware";

export interface Session {
  id: string;
  name: string;
  status: "connected" | "disconnected" | "connecting" | "error";
  createdAt: string;
  lastActivity: string;
  messagesCount: number;
  qrCode?: string;
}

interface SessionsState {
  // Estado
  sessions: Session[];
  isLoading: boolean;
  error: string | null;

  // Ações
  addSession: (name: string) => Promise<void>;
  removeSession: (id: string) => void;
  updateSession: (id: string, updates: Partial<Session>) => void;
  connectSession: (id: string) => Promise<void>;
  disconnectSession: (id: string) => Promise<void>;
  refreshSessions: () => Promise<void>;
  setLoading: (loading: boolean) => void;
  setError: (error: string | null) => void;
}

export const useSessionsStore = create<SessionsState>()(
  devtools(
    persist(
      (set, get) => ({
        // Estado inicial
        sessions: [
          {
            id: "1",
            name: "sessao-principal",
            status: "connected",
            createdAt: "2025-06-19T10:00:00Z",
            lastActivity: "2 min atrás",
            messagesCount: 45,
          },
          {
            id: "2",
            name: "sessao-vendas",
            status: "connected",
            createdAt: "2025-06-19T09:30:00Z",
            lastActivity: "5 min atrás",
            messagesCount: 23,
          },
          {
            id: "3",
            name: "sessao-suporte",
            status: "disconnected",
            createdAt: "2025-06-19T08:00:00Z",
            lastActivity: "1h atrás",
            messagesCount: 12,
          },
        ],
        isLoading: false,
        error: null,

        // Ações
        addSession: async (name: string) => {
          const { setLoading, setError } = get();

          setLoading(true);
          setError(null);

          try {
            // Simular chamada à API
            await new Promise((resolve) => setTimeout(resolve, 2000));

            const newSession: Session = {
              id: Date.now().toString(),
              name: name.toLowerCase().replace(/\s+/g, "-"),
              status: "connecting",
              createdAt: new Date().toISOString(),
              lastActivity: "agora",
              messagesCount: 0,
              qrCode:
                "data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAYAAAAfFcSJAAAADUlEQVR42mNkYPhfDwAChwGA60e6kgAAAABJRU5ErkJggg==", // QR Code simulado
            };

            set((state) => ({
              sessions: [newSession, ...state.sessions],
            }));

            // Simular conexão após 3 segundos
            setTimeout(() => {
              get().updateSession(newSession.id, {
                status: "connected",
                qrCode: undefined,
              });
            }, 3000);
          } catch (error) {
            setError("Erro ao criar sessão. Tente novamente.");
            console.error("Erro ao criar sessão:", error);
          } finally {
            setLoading(false);
          }
        },

        removeSession: (id: string) => {
          set((state) => ({
            sessions: state.sessions.filter((session) => session.id !== id),
          }));
        },

        updateSession: (id: string, updates: Partial<Session>) => {
          set((state) => ({
            sessions: state.sessions.map((session) =>
              session.id === id ? { ...session, ...updates } : session
            ),
          }));
        },

        connectSession: async (id: string) => {
          const { updateSession, setError } = get();

          try {
            updateSession(id, { status: "connecting" });

            // Simular conexão
            await new Promise((resolve) => setTimeout(resolve, 2000));

            updateSession(id, {
              status: "connected",
              lastActivity: "agora",
            });
          } catch (error) {
            updateSession(id, { status: "error" });
            setError("Erro ao conectar sessão. Tente novamente.");
            console.error("Erro ao conectar sessão:", error);
          }
        },

        disconnectSession: async (id: string) => {
          const { updateSession, setError } = get();

          try {
            updateSession(id, { status: "disconnected" });

            // Simular desconexão
            await new Promise((resolve) => setTimeout(resolve, 1000));
          } catch (error) {
            setError("Erro ao desconectar sessão. Tente novamente.");
            console.error("Erro ao desconectar sessão:", error);
          }
        },

        refreshSessions: async () => {
          const { setLoading, setError } = get();

          setLoading(true);
          setError(null);

          try {
            // Simular atualização das sessões
            await new Promise((resolve) => setTimeout(resolve, 1000));

            // Atualizar atividade das sessões conectadas
            set((state) => ({
              sessions: state.sessions.map((session) =>
                session.status === "connected"
                  ? { ...session, lastActivity: "agora" }
                  : session
              ),
            }));
          } catch (error) {
            setError("Erro ao atualizar sessões. Tente novamente.");
            console.error("Erro ao atualizar sessões:", error);
          } finally {
            setLoading(false);
          }
        },

        setLoading: (loading: boolean) => {
          set({ isLoading: loading });
        },

        setError: (error: string | null) => {
          set({ error });
        },
      }),
      {
        name: "sessions-storage",
        partialize: (state) => ({ sessions: state.sessions }),
      }
    ),
    {
      name: "sessions-store",
    }
  )
);
