import api from "@/services/api";
import * as Types from "@/types";
import { create } from "zustand";
import { devtools, persist } from "zustand/middleware";

interface ContactsState {
  // Estado
  contacts: Types.Contact[];
  isLoading: boolean;
  error: string | null;
  searchQuery: string;
  selectedTags: string[];

  // Ações
  loadContacts: (filters?: Types.ContactFilters) => Promise<void>;
  createContact: (data: Types.CreateContactRequest) => Promise<void>;
  updateContact: (
    id: string,
    data: Types.UpdateContactRequest
  ) => Promise<void>;
  deleteContact: (id: string) => Promise<void>;
  getContact: (id: string) => Promise<Types.Contact>;
  searchContacts: (query: string) => void;
  setSelectedTags: (tags: string[]) => void;
  toggleBlock: (contactId: string) => Promise<void>;
  setLoading: (loading: boolean) => void;
  setError: (error: string | null) => void;
  clearFilters: () => void;
}

export const useContactsStore = create<ContactsState>()(
  devtools(
    persist(
      (set, get) => ({
        // Estado inicial
        contacts: [],
        isLoading: false,
        error: null,
        searchQuery: "",
        selectedTags: [],

        // Ações
        loadContacts: async (filters?: Types.ContactFilters) => {
          const { setLoading, setError, searchQuery, selectedTags } = get();

          setLoading(true);
          setError(null);

          try {
            // Combinar filtros com search e tags
            const combinedFilters: Types.ContactFilters = {
              ...filters,
              search: searchQuery || filters?.search,
              tags: selectedTags.length > 0 ? selectedTags : filters?.tags,
            };

            const response = await api.contacts.getAll(combinedFilters);
            set({ contacts: response.contacts });
          } catch (error) {
            setError(
              error instanceof Error
                ? error.message
                : "Erro ao carregar contatos"
            );
          } finally {
            setLoading(false);
          }
        },

        createContact: async (data: Types.CreateContactRequest) => {
          const { setLoading, setError, loadContacts } = get();

          setLoading(true);
          setError(null);

          try {
            await api.contacts.create(data);
            await loadContacts(); // Recarregar lista após criar
          } catch (error) {
            setError(
              error instanceof Error ? error.message : "Erro ao criar contato"
            );
            throw error;
          } finally {
            setLoading(false);
          }
        },

        updateContact: async (id: string, data: Types.UpdateContactRequest) => {
          const { setLoading, setError, loadContacts } = get();

          setLoading(true);
          setError(null);

          try {
            await api.contacts.update(id, data);
            await loadContacts(); // Recarregar lista após atualizar
          } catch (error) {
            setError(
              error instanceof Error
                ? error.message
                : "Erro ao atualizar contato"
            );
            throw error;
          } finally {
            setLoading(false);
          }
        },

        deleteContact: async (id: string) => {
          const { setLoading, setError, loadContacts } = get();

          setLoading(true);
          setError(null);

          try {
            await api.contacts.delete(id);
            await loadContacts(); // Recarregar lista após deletar
          } catch (error) {
            setError(
              error instanceof Error ? error.message : "Erro ao deletar contato"
            );
            throw error;
          } finally {
            setLoading(false);
          }
        },
        getContact: async (id: string) => {
          const { setLoading, setError } = get();

          setLoading(true);
          setError(null);

          try {
            const contact = await api.contacts.getById(id);
            return contact; // ContactResponse é idêntico a Contact
          } catch (error) {
            setError(
              error instanceof Error ? error.message : "Erro ao obter contato"
            );
            throw error;
          } finally {
            setLoading(false);
          }
        },

        searchContacts: (query: string) => {
          set({ searchQuery: query });
          // Trigger reload with new search
          get().loadContacts();
        },
        setSelectedTags: (tags: string[]) => {
          set({ selectedTags: tags });
          // Trigger reload with new tags
          get().loadContacts();
        },

        toggleBlock: async (contactId: string) => {
          const { setLoading, setError, loadContacts } = get();

          setLoading(true);
          setError(null);

          try {
            await api.contacts.toggleBlock(contactId);
            await loadContacts(); // Recarregar lista após alterar status
          } catch (error) {
            setError(
              error instanceof Error
                ? error.message
                : "Erro ao alterar status do contato"
            );
            throw error;
          } finally {
            setLoading(false);
          }
        },

        setLoading: (loading: boolean) => set({ isLoading: loading }),
        setError: (error: string | null) => set({ error }),
        clearFilters: () => {
          set({ searchQuery: "", selectedTags: [] });
          get().loadContacts();
        },
      }),
      {
        name: "contacts-storage",
        partialize: (state) => ({
          contacts: state.contacts,
          searchQuery: state.searchQuery,
          selectedTags: state.selectedTags,
        }),
      }
    ),
    {
      name: "contacts-store",
    }
  )
);
