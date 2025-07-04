import api from "@/services/api";
import { socketService } from "@/services/socket";
import * as Types from "@/types";
import { create } from "zustand";
import { devtools, persist } from "zustand/middleware";

interface SessionsState {
  // Estado principal das sessões
  sessions: Types.Session[];
  isLoading: boolean;
  error: string | null;

  // Estados em tempo real das sessões (via Socket)
  sessionStatuses: Record<
    string,
    {
      status: "connecting" | "connected" | "disconnected" | "error";
      lastActivity?: string;
      error?: string;
    }
  >;
  sessionQrCodes: Record<
    string,
    {
      qrCode: string;
      timestamp: string;
    }
  >;

  // CRUD de sessões
  loadSessions: () => Promise<void>;
  createSession: (data: Types.CreateSessionRequest) => Promise<void>;
  deleteSession: (id: string) => Promise<void>;
  restartSession: (id: string) => Promise<void>;

  // Aliases para compatibilidade
  addSession: (name: string) => Promise<void>;
  removeSession: (id: string) => Promise<void>;

  // Gerenciamento de Socket para sessões
  joinSession: (sessionId: string) => void;
  leaveSession: (sessionId: string) => void;
  joinAllSessions: () => void;

  // Gerenciamento de QR Codes e Status
  updateSessionStatus: (
    sessionId: string,
    status: string,
    error?: string
  ) => void;
  setSessionQrCode: (
    sessionId: string,
    qrCode: string,
    timestamp?: string
  ) => void;
  getSessionQrCode: (sessionId: string) => string | null;
  clearSessionQrCode: (sessionId: string) => void;
  getSessionStatus: (sessionId: string) => string | null;

  // Socket integration
  setupSocketListeners: () => void;
  cleanupSocketListeners: () => void;

  // Utilitários
  setLoading: (loading: boolean) => void;
  setError: (error: string | null) => void;
  transformSession: (session: any) => Types.Session;
  normalizeQrCode: (qrCode: string) => string;
}

export const useSessionsStore = create<SessionsState>()(
  devtools(
    persist(
      (set, get) => ({
        // Estado inicial
        sessions: [],
        isLoading: false,
        error: null,
        sessionStatuses: {},
        sessionQrCodes: {},

        // Função helper para transformar dados do backend
        transformSession: (session: any): Types.Session => ({
          ...session,
          status:
            session.currentStatus === "connected"
              ? "connected"
              : session.currentStatus === "connecting"
              ? "connecting"
              : "disconnected",
          lastActivity: session.lastSeen
            ? new Date(session.lastSeen).toLocaleString("pt-BR")
            : "Nunca",
          messagesCount: session.messagesCount || 0,
          qrCode: session.qrCode, // Garantir que o QR Code seja mapeado
        }),

        // Função helper para normalizar formato do QR Code
        normalizeQrCode: (qrCode: string): string => {
          // Se já é um data URL, retorna como está
          if (qrCode.startsWith("data:image/")) {
            return qrCode;
          }

          // Se é apenas base64, adiciona o prefixo data URL
          return `data:image/png;base64,${qrCode}`;
        },

        // Carregar sessões
        loadSessions: async () => {
          const {
            setLoading,
            setError,
            joinAllSessions,
            setSessionQrCode,
            normalizeQrCode,
          } = get();

          setLoading(true);
          setError(null);

          try {
            const rawSessions = await api.sessions.getAll();
            const sessions = rawSessions.map(get().transformSession);
            set({ sessions });

            // Carregar QR Codes existentes das sessões
            sessions.forEach((session) => {
              if (session.qrCode) {
                console.log(
                  "📱 QR Code encontrado para sessão existente:",
                  session.id
                );
                setSessionQrCode(session.id, normalizeQrCode(session.qrCode));
              }
            });

            // Auto-join nas sessões
            joinAllSessions();
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

        // Criar nova sessão
        createSession: async (data: Types.CreateSessionRequest) => {
          const {
            setLoading,
            setError,
            loadSessions,
            setSessionQrCode,
            joinSession,
            normalizeQrCode,
            transformSession,
          } = get();

          setLoading(true);
          setError(null);

          try {
            // Criar a sessão e capturar a resposta
            const response = await api.sessions.create(data);

            console.log("🔥 Resposta completa da criação da sessão:", response);

            // 🚀 IMEDIATAMENTE adicionar a sessão ao store local
            const newSession = transformSession(response);
            set((state) => ({
              sessions: [...state.sessions, newSession],
            }));

            // Se a resposta contém QR Code, armazenar imediatamente
            if (response.qrCode) {
              console.log(
                "🚀 QR Code inicial recebido na criação da sessão:",
                response.id,
                "QR Code:",
                response.qrCode?.substring(0, 50) + "..."
              );
              setSessionQrCode(response.id, normalizeQrCode(response.qrCode));
            } else {
              console.warn(
                "⚠️ Resposta da criação não contém QR Code:",
                response
              );
            }

            // Fazer join na sessão criada para receber atualizações em tempo real
            joinSession(response.id);

            // Recarregar todas as sessões (para sincronizar com backend)
            await loadSessions();
          } catch (error) {
            setError(
              error instanceof Error ? error.message : "Erro ao criar sessão"
            );
            throw error;
          } finally {
            setLoading(false);
          }
        },

        // Deletar sessão
        deleteSession: async (id: string) => {
          const { setLoading, setError, loadSessions, leaveSession } = get();

          setLoading(true);
          setError(null);

          try {
            // Leave session antes de deletar
            leaveSession(id);

            await api.sessions.delete(id);
            await loadSessions();
          } catch (error) {
            setError(
              error instanceof Error ? error.message : "Erro ao deletar sessão"
            );
            throw error;
          } finally {
            setLoading(false);
          }
        },

        // Reiniciar sessão
        restartSession: async (id: string) => {
          const { setLoading, setError, loadSessions } = get();

          setLoading(true);
          setError(null);

          try {
            await api.sessions.restart(id);
            await loadSessions();
          } catch (error) {
            setError(
              error instanceof Error
                ? error.message
                : "Erro ao reiniciar sessão"
            );
            throw error;
          } finally {
            setLoading(false);
          }
        },

        // Aliases para compatibilidade
        addSession: async (name: string) => {
          await get().createSession({ name });
        },

        removeSession: async (id: string) => {
          await get().deleteSession(id);
        },

        // Socket Management para Sessões
        joinSession: (sessionId: string) => {
          if (!socketService.isConnected()) {
            console.warn("⚠️ Socket não conectado para joinSession");
            return;
          }

          // Verificar se já está na sessão para evitar joins duplicados
          const { sessionStatuses } = get();
          if (sessionStatuses[sessionId]) {
            console.log(`📱 Sessão ${sessionId} já está sendo monitorada`);
            return;
          }

          socketService.joinSession(sessionId);
          console.log(`📱 Joined session: ${sessionId}`);
        },

        leaveSession: (sessionId: string) => {
          if (!socketService.isConnected()) {
            return;
          }

          const { sessionStatuses, sessionQrCodes } = get();

          // Limpar dados da sessão
          const newStatuses = { ...sessionStatuses };
          const newQrCodes = { ...sessionQrCodes };
          delete newStatuses[sessionId];
          delete newQrCodes[sessionId];

          set({
            sessionStatuses: newStatuses,
            sessionQrCodes: newQrCodes,
          });

          socketService.leaveSession(sessionId);
          console.log(`📱 Left session: ${sessionId}`);
        },

        joinAllSessions: () => {
          const { sessions, joinSession, sessionStatuses } = get();

          if (!socketService.isConnected()) {
            console.warn("⚠️ Socket não conectado para joinAllSessions");
            return;
          }

          // Apenas fazer join em sessões que ainda não estão sendo monitoradas
          const sessionsToJoin = sessions.filter(
            (session) => !sessionStatuses[session.id]
          );

          sessionsToJoin.forEach((session) => {
            joinSession(session.id);
          });

          console.log(
            `✅ Auto-join realizado em ${sessionsToJoin.length}/${sessions.length} sessões`
          );
        },

        // Gerenciamento de Status de Sessões
        updateSessionStatus: (
          sessionId: string,
          status: string,
          error?: string
        ) => {
          const { sessionStatuses } = get();
          set({
            sessionStatuses: {
              ...sessionStatuses,
              [sessionId]: {
                status: status as any,
                lastActivity: new Date().toLocaleString("pt-BR"),
                error,
              },
            },
          });
        },

        // Gerenciamento de QR Codes
        setSessionQrCode: (
          sessionId: string,
          qrCode: string,
          timestamp?: string
        ) => {
          const { sessionQrCodes } = get();
          set({
            sessionQrCodes: {
              ...sessionQrCodes,
              [sessionId]: {
                qrCode,
                timestamp: timestamp || new Date().toISOString(),
              },
            },
          });
        },

        getSessionQrCode: (sessionId: string) => {
          const { sessionQrCodes } = get();
          return sessionQrCodes[sessionId]?.qrCode || null;
        },

        clearSessionQrCode: (sessionId: string) => {
          const { sessionQrCodes } = get();
          const newQrCodes = { ...sessionQrCodes };
          delete newQrCodes[sessionId];
          set({ sessionQrCodes: newQrCodes });
        },

        getSessionStatus: (sessionId: string) => {
          const { sessionStatuses } = get();
          return sessionStatuses[sessionId]?.status || null;
        },

        // Socket Event Listeners
        setupSocketListeners: () => {
          const { updateSessionStatus, setSessionQrCode, normalizeQrCode } =
            get();

          socketService.on(
            "qr-code-image",
            (data: {
              sessionId: string;
              qrCodeBase64: string;
              timestamp: string;
            }) => {
              console.log("🔥 QR Code Base64 recebido via Socket:", data);
              setSessionQrCode(
                data.sessionId,
                normalizeQrCode(data.qrCodeBase64),
                data.timestamp
              );
            }
          );

          // Eventos de Status
          socketService.on(
            "session-status",
            (data: { sessionId: string; status: string; error?: string }) => {
              console.log("🔥 Status de sessão atualizado:", data);
              updateSessionStatus(data.sessionId, data.status, data.error);
            }
          );

          socketService.on(
            "session-status-global",
            (data: { sessionId: string; status: string; error?: string }) => {
              console.log("🔥 Status global de sessão:", data);
              updateSessionStatus(data.sessionId, data.status, data.error);
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

        // Utilitários
        setLoading: (loading: boolean) => set({ isLoading: loading }),
        setError: (error: string | null) => set({ error }),
      }),
      {
        name: "sessions-storage",
        partialize: (state) => ({
          sessions: state.sessions,
          sessionStatuses: state.sessionStatuses,
          sessionQrCodes: state.sessionQrCodes,
        }),
      }
    ),
    {
      name: "sessions-store",
    }
  )
);
