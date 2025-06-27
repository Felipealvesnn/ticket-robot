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
  qrCodes: Map<string, { qrCode: string; timestamp: string }>; // QR Codes por sessão

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
  clearQrCode: (sessionId?: string) => void; // Agora por sessão
  updateQrCode: (sessionId: string, qrCode: string, timestamp?: string) => void; // Agora por sessão
  updateSessionStatus: (sessionId: string, status: string) => void;
  setupSocketListeners: () => void;
  cleanupSocketListeners: () => void;
  transformSession: (session: any) => Types.Session;
  testSocketConnection: () => boolean;
  forceJoinAllSessions: () => boolean;
  getSessionQrCode: (sessionId: string) => string | null; // Nova função
}

export const useSessionsStore = create<SessionsState>()(
  devtools(
    persist(
      (set, get) => ({
        // Estado inicial
        sessions: [],
        isLoading: false,
        error: null,
        qrCodes: new Map(),

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

            // 🔥 NOVO: Entrar automaticamente nas salas de cada sessão para receber QR codes
            if (socketService.isConnected()) {
              sessions.forEach((session) => {
                socketService.joinSession(session.id);
                console.log(
                  `📱 Auto-join na sessão: ${session.id} (${session.name}) - Status: ${session.status}`
                );
              });
              console.log(
                `✅ Auto-join realizado em ${sessions.length} sessões`
              );
            } else {
              console.warn("⚠️ Socket não conectado durante loadSessions");
            }
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
            // Atualizar QR Code específico da sessão
            set((state) => {
              const newQrCodes = new Map(state.qrCodes);
              newQrCodes.set(id, {
                qrCode: response.qrCode,
                timestamp: new Date().toISOString(),
              });
              return { qrCodes: newQrCodes };
            });
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

        clearQrCode: (sessionId?: string) => {
          if (sessionId) {
            // Limpar QR Code de uma sessão específica
            set((state) => {
              const newQrCodes = new Map(state.qrCodes);
              newQrCodes.delete(sessionId);
              return { qrCodes: newQrCodes };
            });
          } else {
            // Limpar todos os QR Codes
            set({ qrCodes: new Map() });
          }
        },

        // 🔥 Função para atualizar QR Code de uma sessão específica
        updateQrCode: (
          sessionId: string,
          qrCode: string,
          timestamp?: string
        ) => {
          set((state) => {
            const newQrCodes = new Map(state.qrCodes);
            newQrCodes.set(sessionId, {
              qrCode,
              timestamp: timestamp || new Date().toISOString(),
            });
            return { qrCodes: newQrCodes };
          });
        },

        // 🔥 Função para obter QR Code de uma sessão específica
        getSessionQrCode: (sessionId: string) => {
          const qrData = get().qrCodes.get(sessionId);
          return qrData?.qrCode || null;
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
          // socketService.on(
          //   "qr-code",
          //   (data: {
          //     sessionId: string;
          //     qrCode: string;
          //     timestamp: string;
          //   }) => {
          //     console.log("🔥 QR Code recebido via Socket.IO:", data);
          //     updateQrCode(data.sessionId, data.qrCode, data.timestamp);
          //   }
          // );

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
                data.sessionId,
                `data:image/png;base64,${data.qrCodeBase64}`,
                data.timestamp
              );
            }
          );

          // Listener para mudanças de status de sessão
          socketService.on(
            "session-status",
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

          // Listener para mudanças globais de status de sessão
          socketService.on(
            "session-status-global",
            (data: {
              sessionId: string;
              status: string;
              timestamp: string;
            }) => {
              console.log(
                "🔥 Status global de sessão atualizado via Socket.IO:",
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
          socketService.off("session-status");
          socketService.off("session-status-global");
          console.log("🧹 Socket listeners removidos");
        },

        // Função para testar Socket.IO
        testSocketConnection: () => {
          const isConnected = socketService.isConnected();
          console.log("🔍 Teste de conexão Socket.IO:", {
            connected: isConnected,
            socket: socketService.getSocket()?.id,
            currentSessions: get().sessions.length,
          });
          return isConnected;
        },

        // Função para forçar join em todas as sessões
        forceJoinAllSessions: () => {
          const { sessions } = get();
          if (!socketService.isConnected()) {
            console.warn("⚠️ Socket não conectado para forceJoinAllSessions");
            return false;
          }

          sessions.forEach((session) => {
            socketService.joinSession(session.id);
            console.log(
              `🔄 Force join: ${session.id} (${session.name}) - Status: ${session.status}`
            );
          });

          console.log(`✅ Force join realizado em ${sessions.length} sessões`);
          return true;
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
