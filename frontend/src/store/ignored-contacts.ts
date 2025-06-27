import api from "@/services/api";
import * as Types from "@/types";
import { create } from "zustand";
import { devtools, persist } from "zustand/middleware";

interface IgnoredContactsState {
  // Estado
  ignoredContacts: Types.IgnoredContact[];
  stats: Types.IgnoredContactsStats | null;
  isLoading: boolean;
  error: string | null;
  searchQuery: string;
  selectedFilters: {
    isGlobal?: boolean;
    sessionId?: string;
  };

  // Ações
  loadIgnoredContacts: (filters?: Types.IgnoredContactFilters) => Promise<void>;
  createIgnoredContact: (
    data: Types.CreateIgnoredContactRequest
  ) => Promise<void>;
  updateIgnoredContact: (
    id: string,
    data: Types.UpdateIgnoredContactRequest
  ) => Promise<void>;
  deleteIgnoredContact: (id: string) => Promise<void>;
  getIgnoredContact: (id: string) => Promise<Types.IgnoredContact>;
  loadStats: () => Promise<void>;
  searchIgnoredContacts: (query: string) => void;
  setFilters: (filters: { isGlobal?: boolean; sessionId?: string }) => void;
  setLoading: (loading: boolean) => void;
  setError: (error: string | null) => void;
  clearFilters: () => void;
  isPhoneIgnored: (phoneNumber: string, sessionId?: string) => boolean;
}

export const useIgnoredContactsStore = create<IgnoredContactsState>()(
  devtools(
    persist(
      (set, get) => ({
        // Estado inicial
        ignoredContacts: [],
        stats: null,
        isLoading: false,
        error: null,
        searchQuery: "",
        selectedFilters: {},

        // Ações
        loadIgnoredContacts: async (filters?: Types.IgnoredContactFilters) => {
          const { setLoading, setError, searchQuery, selectedFilters } = get();

          setLoading(true);
          setError(null);

          try {
            // Combinar filtros com search e filtros selecionados
            const combinedFilters: Types.IgnoredContactFilters = {
              ...filters,
              search: searchQuery || filters?.search,
              ...selectedFilters,
            };

            const response = await api.ignoredContacts.getAll(combinedFilters);
            set({ ignoredContacts: response.ignoredContacts });
          } catch (error) {
            setError(
              error instanceof Error
                ? error.message
                : "Erro ao carregar contatos ignorados"
            );
          } finally {
            setLoading(false);
          }
        },

        createIgnoredContact: async (
          data: Types.CreateIgnoredContactRequest
        ) => {
          const { setLoading, setError, loadIgnoredContacts, loadStats } =
            get();

          setLoading(true);
          setError(null);

          try {
            await api.ignoredContacts.create(data);
            await Promise.all([
              loadIgnoredContacts(), // Recarregar lista após criar
              loadStats(), // Atualizar estatísticas
            ]);
          } catch (error) {
            setError(
              error instanceof Error
                ? error.message
                : "Erro ao adicionar contato ignorado"
            );
            throw error;
          } finally {
            setLoading(false);
          }
        },

        updateIgnoredContact: async (
          id: string,
          data: Types.UpdateIgnoredContactRequest
        ) => {
          const { setLoading, setError, loadIgnoredContacts, loadStats } =
            get();

          setLoading(true);
          setError(null);

          try {
            await api.ignoredContacts.update(id, data);
            await Promise.all([
              loadIgnoredContacts(), // Recarregar lista após atualizar
              loadStats(), // Atualizar estatísticas
            ]);
          } catch (error) {
            setError(
              error instanceof Error
                ? error.message
                : "Erro ao atualizar contato ignorado"
            );
            throw error;
          } finally {
            setLoading(false);
          }
        },

        deleteIgnoredContact: async (id: string) => {
          const { setLoading, setError, loadIgnoredContacts, loadStats } =
            get();

          setLoading(true);
          setError(null);

          try {
            await api.ignoredContacts.delete(id);
            await Promise.all([
              loadIgnoredContacts(), // Recarregar lista após deletar
              loadStats(), // Atualizar estatísticas
            ]);
          } catch (error) {
            setError(
              error instanceof Error
                ? error.message
                : "Erro ao remover contato ignorado"
            );
            throw error;
          } finally {
            setLoading(false);
          }
        },

        getIgnoredContact: async (id: string) => {
          const { setLoading, setError } = get();

          setLoading(true);
          setError(null);

          try {
            const ignoredContact = await api.ignoredContacts.getById(id);
            return ignoredContact;
          } catch (error) {
            setError(
              error instanceof Error
                ? error.message
                : "Erro ao obter contato ignorado"
            );
            throw error;
          } finally {
            setLoading(false);
          }
        },

        loadStats: async () => {
          const { setError } = get();

          try {
            const stats = await api.ignoredContacts.getStats();
            set({ stats });
          } catch (error) {
            setError(
              error instanceof Error
                ? error.message
                : "Erro ao carregar estatísticas"
            );
          }
        },

        searchIgnoredContacts: (query: string) => {
          set({ searchQuery: query });
          // Trigger reload with new search
          get().loadIgnoredContacts();
        },

        setFilters: (filters: { isGlobal?: boolean; sessionId?: string }) => {
          set({ selectedFilters: filters });
          // Trigger reload with new filters
          get().loadIgnoredContacts();
        },

        setLoading: (loading: boolean) => set({ isLoading: loading }),
        setError: (error: string | null) => set({ error }),

        clearFilters: () => {
          set({ searchQuery: "", selectedFilters: {} });
          get().loadIgnoredContacts();
        },

        isPhoneIgnored: (phoneNumber: string, sessionId?: string) => {
          const { ignoredContacts } = get();

          // Verificar se existe um contato ignorado global ou para a sessão específica
          return ignoredContacts.some(
            (contact) =>
              contact.phoneNumber === phoneNumber &&
              (contact.isGlobal || contact.sessionId === sessionId)
          );
        },
      }),
      {
        name: "ignored-contacts-storage",
        partialize: (state) => ({
          ignoredContacts: state.ignoredContacts,
          stats: state.stats,
          searchQuery: state.searchQuery,
          selectedFilters: state.selectedFilters,
        }),
      }
    ),
    {
      name: "ignored-contacts-store",
    }
  )
);
