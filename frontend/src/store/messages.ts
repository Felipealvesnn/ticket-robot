import api from "@/services/api";
import * as Types from "@/types";
import { create } from "zustand";
import { devtools, persist } from "zustand/middleware";

interface MessagesState {
  // Estado
  messages: Types.Message[];
  isLoading: boolean;
  error: string | null;
  currentSessionId: string | null;

  // Ações
  loadMessages: (sessionId?: string) => Promise<void>;
  sendMessage: (data: Types.SendMessageRequest) => Promise<void>;
  getMessage: (id: string) => Promise<Types.Message>;
  addMessage: (message: Types.Message) => void; // Nova função para adicionar mensagem em tempo real
  setCurrentSession: (sessionId: string | null) => void;
  setLoading: (loading: boolean) => void;
  setError: (error: string | null) => void;
  clearMessages: () => void;
}

export const useMessagesStore = create<MessagesState>()(
  devtools(
    persist(
      (set, get) => ({
        // Estado inicial
        messages: [],
        isLoading: false,
        error: null,
        currentSessionId: null,

        // Ações
        loadMessages: async (sessionId?: string) => {
          const { setLoading, setError } = get();

          setLoading(true);
          setError(null);

          try {
            const filters: Types.MessageFilters = sessionId
              ? { sessionId }
              : {};
            const response = await api.messages.getAll(filters);
            set({
              messages: response.messages,
              currentSessionId: sessionId || null,
            });
          } catch (error) {
            setError(
              error instanceof Error
                ? error.message
                : "Erro ao carregar mensagens"
            );
          } finally {
            setLoading(false);
          }
        },

        sendMessage: async (data: Types.SendMessageRequest) => {
          const { setLoading, setError, currentSessionId, loadMessages } =
            get();

          setLoading(true);
          setError(null);

          try {
            const response = await api.messages.send(data);

            // Converter SendMessageResponse para Message para adicionar na lista
            const message: Types.Message = {
              ...response,
              from: undefined,
              type: data.type || "text",
              updatedAt: response.createdAt,
            };

            // Atualizar lista local otimisticamente
            set((state) => ({
              messages: [...state.messages, message],
            }));

            // Recarregar mensagens da sessão atual se necessário
            if (currentSessionId === data.sessionId) {
              await loadMessages(currentSessionId);
            }
          } catch (error) {
            setError(
              error instanceof Error ? error.message : "Erro ao enviar mensagem"
            );
            throw error;
          } finally {
            setLoading(false);
          }
        },

        getMessage: async (id: string) => {
          const { setLoading, setError } = get();

          setLoading(true);
          setError(null);

          try {
            const message = await api.messages.getById(id);
            return message;
          } catch (error) {
            setError(
              error instanceof Error ? error.message : "Erro ao obter mensagem"
            );
            throw error;
          } finally {
            setLoading(false);
          }
        },

        addMessage: (message: Types.Message) => {
          set((state) => {
            // Verificar se a mensagem já existe para evitar duplicatas
            const messageExists = state.messages.some(
              (m) => m.id === message.id
            );
            if (messageExists) {
              return state;
            }

            // Adicionar mensagem e ordenar por data
            const updatedMessages = [...state.messages, message].sort(
              (a, b) =>
                new Date(a.createdAt).getTime() -
                new Date(b.createdAt).getTime()
            );

            return {
              messages: updatedMessages,
            };
          });
          console.log(
            `✅ Mensagem ${message.id} adicionada ao store de mensagens`
          );
        },

        setCurrentSession: (sessionId: string | null) => {
          set({ currentSessionId: sessionId });
          if (sessionId) {
            get().loadMessages(sessionId);
          } else {
            set({ messages: [] });
          }
        },

        setLoading: (loading: boolean) => set({ isLoading: loading }),
        setError: (error: string | null) => set({ error }),
        clearMessages: () => set({ messages: [], currentSessionId: null }),
      }),
      {
        name: "messages-storage",
        partialize: (state) => ({
          messages: state.messages,
          currentSessionId: state.currentSessionId,
        }),
      }
    ),
    {
      name: "messages-store",
    }
  )
);
