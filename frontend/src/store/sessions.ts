import api from "@/services/api";
import { socketManager } from "@/services/socketManager";
import * as Types from "@/types";
import { create } from "zustand";
import { devtools, persist } from "zustand/middleware";

interface SessionsState {
  // Estado principal das sessões
  sessions: Types.Session[];
  isLoading: boolean;
  error: string | null;

  // Estado para controle de recarregamento por empresa
  isReloadingForCompany: boolean;

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

  // Gerenciamento de mudança de empresa
  handleCompanyChange: () => Promise<void>;

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
        isReloadingForCompany: false,
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

        // Reiniciar sessão (apenas cliente WhatsApp - dados preservados)
        restartSession: async (id: string) => {
          const { setLoading, setError, loadSessions } = get();

          setLoading(true);
          setError(null);

          try {
            await api.sessions.restart(id);
            await loadSessions();
            // Opcional: Adicionar notificação de sucesso
            console.log(
              "✅ Cliente WhatsApp reiniciado com sucesso. Dados preservados."
            );
          } catch (error) {
            setError(
              error instanceof Error
                ? error.message
                : "Erro ao reiniciar cliente WhatsApp"
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

        // Gerenciamento de mudança de empresa
        handleCompanyChange: async () => {
          const { setError, loadSessions } = get();

          console.log("🏢 Empresa alterada, recarregando sessões...");

          set({ isReloadingForCompany: true });
          setError(null);

          try {
            // Recarregar sessões para a nova empresa
            await loadSessions();
          } catch (error) {
            setError(
              error instanceof Error
                ? error.message
                : "Erro ao recarregar sessões para a empresa"
            );
          } finally {
            set({ isReloadingForCompany: false });
          }
        },

        // Socket Management para Sessões
        joinSession: (sessionId: string) => {
          if (!socketManager.isConnected()) {
            console.warn("⚠️ Socket não conectado para joinSession");
            return;
          }

          // Verificar se já está na sessão para evitar joins duplicados
          const { sessionStatuses } = get();
          if (sessionStatuses[sessionId]) {
            console.log(`📱 Sessão ${sessionId} já está sendo monitorada`);
            return;
          }

          socketManager.joinSession(sessionId);
          console.log(`📱 Joined session: ${sessionId}`);
        },

        leaveSession: (sessionId: string) => {
          if (!socketManager.isConnected()) {
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

          socketManager.leaveSession(sessionId);
          console.log(`📱 Left session: ${sessionId}`);
        },

        joinAllSessions: () => {
          const { sessions, joinSession, sessionStatuses } = get();

          if (!socketManager.isConnected()) {
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
          const { sessionStatuses, sessions } = get();

          // Atualizar sessionStatuses (para uso interno via Socket)
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

          // 🎯 TAMBÉM atualizar o status no array sessions (para uso na página principal)
          const updatedSessions = sessions.map((session) =>
            session.id === sessionId ? { ...session, status } : session
          );

          if (updatedSessions.length > 0) {
            // metodo set ai para persistir o estado
            // Atualizar o estado com o novo array de sessões
            set({ sessions: updatedSessions });
            console.log(
              `📊 Status da sessão ${sessionId} atualizado no array sessions: ${status}`
            );
          }
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
          // NOTA: Esta função está deprecated
          // Use o hook useSocket() em vez de listeners no store
          console.warn("⚠️ setupSocketListeners está deprecated. Use useSocket() hook em components.");
        },

        cleanupSocketListeners: () => {
          // NOTA: Esta função está deprecated
          // Use o hook useSocket() em vez de listeners no store
          console.warn("⚠️ cleanupSocketListeners está deprecated. Use useSocket() hook em components.");
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
