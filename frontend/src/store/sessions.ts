import api from "@/services/api";
import socketService from "@/services/socket";
import * as Types from "@/types";
import { create } from "zustand";
import { devtools, persist } from "zustand/middleware";

interface SessionsState {
  // Estado
  sessions: Types.Session[];
  isLoading: boolean;
  error: string | null;
  currentQrCode: string | null;
  qrCodeTimestamp: string | null;

  // Ações
  loadSessions: () => Promise<void>;
  createSession: (data: Types.CreateSessionRequest) => Promise<void>;
  addSession: (name: string) => Promise<void>; // Alias para createSession
  deleteSession: (id: string) => Promise<void>;
  removeSession: (id: string) => Promise<void>; // Alias para deleteSession
  connectSession: (id: string) => Promise<void>;
  disconnectSession: (id: string) => Promise<void>;
  getQrCode: (id: string) => Promise<void>;
  setLoading: (loading: boolean) => void;
  setError: (error: string | null) => void;
  clearQrCode: () => void;
  updateQrCode: (qrCode: string, timestamp?: string) => void; // 🔥 Nova função
  updateSessionStatus: (sessionId: string, status: string) => void; // 🔥 Nova função
  setupSocketListeners: () => void; // 🔥 Nova função
  cleanupSocketListeners: () => void; // 🔥 Nova função
  transformSession: (session: any) => Types.Session; // 🔥 Função helper
}

export const useSessionsStore = create<SessionsState>()(
  devtools(
    persist(
      (set, get) => ({
        // Estado inicial
        sessions: [],
        isLoading: false,
        error: null,
        currentQrCode: null,
        qrCodeTimestamp: null,

        // Função helper para transformar dados do backend
        transformSession: (session: any): Types.Session => ({
          ...session,
          // Mapear status para formato UI
          status:
            session.currentStatus === "connected"
              ? "connected"
              : session.currentStatus === "connecting"
              ? "connecting"
              : "disconnected",
          // Garantir lastActivity existe
          lastActivity: session.lastSeen
            ? new Date(session.lastSeen).toLocaleString("pt-BR")
            : "Nunca",
          // Adicionar contagem padrão de mensagens
          messagesCount: session.messagesCount || 0,
        }),

        // Ações
        loadSessions: async () => {
          const { setLoading, setError } = get();

          setLoading(true);
          setError(null);

          try {
            const rawSessions = await api.sessions.getAll();
            const sessions = rawSessions.map(get().transformSession);
            set({ sessions });
          } catch (error) {
            setError(
              error instanceof Error
                ? error.message
                : "Erro ao carregar sessões"
            );
          } finally {
            setLoading(false);
          }
        },

        createSession: async (data: Types.CreateSessionRequest) => {
          const { setLoading, setError, loadSessions } = get();

          setLoading(true);
          setError(null);

          try {
            await api.sessions.create(data);
            await loadSessions(); // Recarregar lista após criar
          } catch (error) {
            setError(
              error instanceof Error ? error.message : "Erro ao criar sessão"
            );
            throw error;
          } finally {
            setLoading(false);
          }
        },

        deleteSession: async (id: string) => {
          const { setLoading, setError, loadSessions } = get();

          setLoading(true);
          setError(null);

          try {
            await api.sessions.delete(id);
            await loadSessions(); // Recarregar lista após deletar
          } catch (error) {
            setError(
              error instanceof Error ? error.message : "Erro ao deletar sessão"
            );
            throw error;
          } finally {
            setLoading(false);
          }
        },

        connectSession: async (id: string) => {
          const { setLoading, setError, loadSessions } = get();

          setLoading(true);
          setError(null);

          try {
            await api.sessions.connect(id);
            await loadSessions(); // Recarregar para atualizar status
          } catch (error) {
            setError(
              error instanceof Error ? error.message : "Erro ao conectar sessão"
            );
            throw error;
          } finally {
            setLoading(false);
          }
        },

        disconnectSession: async (id: string) => {
          const { setLoading, setError, loadSessions } = get();

          setLoading(true);
          setError(null);

          try {
            await api.sessions.disconnect(id);
            await loadSessions(); // Recarregar para atualizar status
          } catch (error) {
            setError(
              error instanceof Error
                ? error.message
                : "Erro ao desconectar sessão"
            );
            throw error;
          } finally {
            setLoading(false);
          }
        },

        getQrCode: async (id: string) => {
          const { setLoading, setError } = get();

          setLoading(true);
          setError(null);

          try {
            const response = await api.sessions.getQrCode(id);
            set({ currentQrCode: response.qrCode });
          } catch (error) {
            setError(
              error instanceof Error ? error.message : "Erro ao obter QR Code"
            );
            throw error;
          } finally {
            setLoading(false);
          }
        },

        // Aliases para compatibilidade com a UI
        addSession: async (name: string) => {
          await get().createSession({ name });
        },

        removeSession: async (id: string) => {
          await get().deleteSession(id);
        },

        setLoading: (loading: boolean) => set({ isLoading: loading }),
        setError: (error: string | null) => set({ error }),
        clearQrCode: () => set({ currentQrCode: null, qrCodeTimestamp: null }),

        // 🔥 Novas funções para Socket.IO
        updateQrCode: (qrCode: string, timestamp?: string) => {
          set({
            currentQrCode: qrCode,
            qrCodeTimestamp: timestamp || new Date().toISOString(),
          });
        },

        updateSessionStatus: (sessionId: string, status: string) => {
          set((state) => ({
            sessions: state.sessions.map((session) =>
              session.id === sessionId
                ? {
                    ...session,
                    status: status as Types.Session["status"],
                    lastActivity: new Date().toLocaleString("pt-BR"),
                  }
                : session
            ),
          }));
        },

        setupSocketListeners: () => {
          const { updateQrCode, updateSessionStatus } = get();

          // Listener para QR Code (string)
          socketService.on(
            "qr-code",
            (data: {
              sessionId: string;
              qrCode: string;
              timestamp: string;
            }) => {
              console.log("🔥 QR Code recebido via Socket.IO:", data);
              updateQrCode(data.qrCode, data.timestamp);
            }
          );

          // Listener para QR Code (base64 image)
          socketService.on(
            "qr-code-image",
            (data: {
              sessionId: string;
              qrCodeBase64: string;
              timestamp: string;
            }) => {
              console.log("🔥 QR Code Image recebido via Socket.IO:", data);
              updateQrCode(
                `data:image/png;base64,${data.qrCodeBase64}`,
                data.timestamp
              );
            }
          );

          // Listener para mudanças de status de sessão
          socketService.on(
            "session-status-change",
            (data: {
              sessionId: string;
              status: string;
              timestamp: string;
            }) => {
              console.log(
                "🔥 Status de sessão atualizado via Socket.IO:",
                data
              );
              updateSessionStatus(data.sessionId, data.status);
            }
          );

          console.log("✅ Socket listeners configurados para sessões");
        },

        cleanupSocketListeners: () => {
          socketService.off("qr-code");
          socketService.off("qr-code-image");
          socketService.off("session-status-change");
          console.log("🧹 Socket listeners removidos");
        },
      }),
      {
        name: "sessions-storage",
        partialize: (state) => ({
          sessions: state.sessions,
        }),
      }
    ),
    {
      name: "sessions-store",
    }
  )
);
