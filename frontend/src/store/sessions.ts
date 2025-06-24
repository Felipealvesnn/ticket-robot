import api from "@/services/api";
import * as Types from "@/types";
import { create } from "zustand";
import { devtools, persist } from "zustand/middleware";

interface SessionsState {
  // Estado
  sessions: Types.Session[];
  isLoading: boolean;
  error: string | null;
  currentQrCode: string | null;

  // Ações
  loadSessions: () => Promise<void>;
  createSession: (data: Types.CreateSessionRequest) => Promise<void>;
  deleteSession: (id: string) => Promise<void>;
  connectSession: (id: string) => Promise<void>;
  disconnectSession: (id: string) => Promise<void>;
  getQrCode: (id: string) => Promise<void>;
  setLoading: (loading: boolean) => void;
  setError: (error: string | null) => void;
  clearQrCode: () => void;
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

        // Ações
        loadSessions: async () => {
          const { setLoading, setError } = get();

          setLoading(true);
          setError(null);

          try {
            const sessions = await api.sessions.getAll();
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

        setLoading: (loading: boolean) => set({ isLoading: loading }),
        setError: (error: string | null) => set({ error }),
        clearQrCode: () => set({ currentQrCode: null }),
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
