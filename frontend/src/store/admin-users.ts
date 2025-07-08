import api from "@/services/api";
import { AdminUser, Company, Role } from "@/shared/interfaces/admin.interface";
import { create } from "zustand";
import { devtools } from "zustand/middleware";

interface AdminUsersState {
  // Users
  users: AdminUser[];
  usersLoading: boolean;
  usersError: string | null;

  // Companies
  companies: Company[];
  companiesLoading: boolean;
  companiesError: string | null;

  // Roles
  roles: Role[];
  rolesLoading: boolean;
  rolesError: string | null;

  // Pagination
  currentPage: number;
  totalPages: number;
  totalItems: number;
  limit: number;

  // Actions
  loadUsers: (page?: number, limit?: number) => Promise<void>;
  loadCompanies: () => Promise<void>;
  loadRoles: () => Promise<void>;
  createUser: (userData: {
    email: string;
    name: string;
    password?: string;
  }) => Promise<void>;
  updateUser: (
    userId: string,
    userData: { name: string; isActive: boolean }
  ) => Promise<void>;
  deleteUser: (userId: string) => Promise<void>;
  manageUserCompanies: (
    userId: string,
    data: {
      addCompanies: Array<{ companyId: string; roleId: string }>;
      removeCompanies: string[];
      updateRoles: Array<{ companyId: string; roleId: string }>;
    }
  ) => Promise<void>;

  // Utility
  reset: () => void;
  setPage: (page: number) => void;
  setLimit: (limit: number) => void;
}

const initialState = {
  users: [],
  usersLoading: false,
  usersError: null,
  companies: [],
  companiesLoading: false,
  companiesError: null,
  roles: [],
  rolesLoading: false,
  rolesError: null,
  currentPage: 1,
  totalPages: 1,
  totalItems: 0,
  limit: 50,
};

export const useAdminUsersStore = create<AdminUsersState>()(
  devtools(
    (set, get) => ({
      ...initialState,

      loadUsers: async (page = 1, limit = 50) => {
        try {
          set({ usersLoading: true, usersError: null });

          const response = await api.adminUsers.getAllUsers({
            page,
            limit,
          });

          set({
            users: response.users,
            currentPage: response.pagination?.page || page,
            totalPages: response.pagination?.totalPages || 1,
            totalItems: response.pagination?.total || response.users.length,
            usersLoading: false,
          });
        } catch (error) {
          console.error("Erro ao carregar usuários:", error);
          set({
            usersError: "Erro ao carregar usuários",
            usersLoading: false,
          });
        }
      },

      loadCompanies: async () => {
        try {
          set({ companiesLoading: true, companiesError: null });

          // Usar a API de admin para buscar todas as empresas do sistema
          const response = await api.adminCompanies.getAllCompanies();

          // Mapear para extrair apenas os dados necessários
          const companies = response.companies.map((company) => ({
            id: company.id,
            name: company.name,
            slug: company.slug,
            plan: company.plan || "FREE",
            isActive: company.isActive,
            createdAt: company.createdAt,
          }));

          console.log("Companies loaded:", companies);

          set({
            companies,
            companiesLoading: false,
          });
        } catch (error) {
          console.error("Erro ao carregar empresas:", error);
          set({
            companiesError: "Erro ao carregar empresas",
            companiesLoading: false,
          });
        }
      },

      loadRoles: async () => {
        try {
          set({ rolesLoading: true, rolesError: null });

          const response = await api.roles.getRoles();

          // Adaptar resposta para nosso tipo
          const roles = response.map((role) => ({
            id: role.id,
            name: role.name,
            description: role.description,
          }));

          console.log("Roles loaded:", roles);

          set({
            roles,
            rolesLoading: false,
          });
        } catch (error) {
          console.error("Erro ao carregar roles:", error);
          set({
            rolesError: "Erro ao carregar roles",
            rolesLoading: false,
          });
        }
      },

      createUser: async (userData) => {
        try {
          await api.adminUsers.createGlobalUser(userData);
          // Recarregar lista de usuários
          await get().loadUsers(get().currentPage, get().limit);
        } catch (error) {
          console.error("Erro ao criar usuário:", error);
          throw new Error("Erro ao criar usuário");
        }
      },

      updateUser: async (userId, userData) => {
        try {
          await api.adminUsers.updateGlobalUser(userId, userData);
          // Recarregar lista de usuários
          await get().loadUsers(get().currentPage, get().limit);
        } catch (error) {
          console.error("Erro ao atualizar usuário:", error);
          throw new Error("Erro ao atualizar usuário");
        }
      },

      deleteUser: async (userId) => {
        try {
          await api.adminUsers.deleteGlobalUser(userId);
          // Remover da lista local
          set((state) => ({
            users: state.users.filter((u) => u.id !== userId),
          }));
        } catch (error) {
          console.error("Erro ao deletar usuário:", error);
          throw new Error("Erro ao deletar usuário");
        }
      },

      manageUserCompanies: async (userId, data) => {
        try {
          await api.adminUsers.manageUserCompanies(userId, data);
          // Recarregar lista de usuários
          await get().loadUsers(get().currentPage, get().limit);
        } catch (error) {
          console.error("Erro ao gerenciar empresas do usuário:", error);
          throw new Error("Erro ao gerenciar empresas do usuário");
        }
      },

      setPage: (page) => {
        set({ currentPage: page });
      },

      setLimit: (limit) => {
        set({ limit, currentPage: 1 });
      },

      reset: () => {
        set(initialState);
      },
    }),
    {
      name: "admin-users-store",
    }
  )
);
