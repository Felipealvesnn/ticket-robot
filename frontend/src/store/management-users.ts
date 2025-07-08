import api from "@/services/api";
import * as Types from "@/types";
import { create } from "zustand";
import { devtools } from "zustand/middleware";

interface ManagementUsersState {
  // Users
  users: Types.CompanyUser[];
  usersLoading: boolean;
  usersError: string | null;

  // Roles
  roles: Array<{ id: string; name: string; description?: string }>;
  rolesLoading: boolean;
  rolesError: string | null;

  // Current company
  currentCompanyId: string | null;

  // Actions
  loadUsers: (companyId: string) => Promise<void>;
  loadRoles: () => Promise<void>;
  createUser: (
    companyId: string,
    userData: {
      email: string;
      name: string;
      roleId: string;
      sendWelcomeEmail?: boolean;
    }
  ) => Promise<void>;
  updateUser: (
    companyId: string,
    userId: string,
    userData: {
      name: string;
      roleId: string;
      isActive: boolean;
    }
  ) => Promise<void>;
  deleteUser: (companyId: string, userId: string) => Promise<void>;

  // Utility
  reset: () => void;
  setCurrentCompanyId: (companyId: string | null) => void;
}

const initialState = {
  users: [],
  usersLoading: false,
  usersError: null,
  roles: [],
  rolesLoading: false,
  rolesError: null,
  currentCompanyId: null,
};

export const useManagementUsersStore = create<ManagementUsersState>()(
  devtools(
    (set, get) => ({
      ...initialState,

      loadUsers: async (companyId: string) => {
        try {
          set({ usersLoading: true, usersError: null });

          const response = await api.company.getCompanyUsers(companyId);

          set({
            users: response.users,
            currentCompanyId: companyId,
            usersLoading: false,
          });
        } catch (error) {
          console.error("Erro ao carregar usuários da empresa:", error);
          set({
            usersError: "Erro ao carregar usuários",
            usersLoading: false,
          });
        }
      },

      loadRoles: async () => {
        try {
          set({ rolesLoading: true, rolesError: null });

          const rolesData = await api.roles.getRoles();

          set({
            roles: rolesData,
            rolesLoading: false,
          });
        } catch (error) {
          console.error("Erro ao carregar roles:", error);
          // Fallback para roles hardcoded se API falhar
          set({
            roles: [
              {
                id: "COMPANY_ADMIN",
                name: "COMPANY_ADMIN",
                description: "Administrador da Empresa",
              },
              { id: "MANAGER", name: "MANAGER", description: "Gerente" },
              { id: "EMPLOYEE", name: "EMPLOYEE", description: "Funcionário" },
            ],
            rolesLoading: false,
          });
        }
      },

      createUser: async (companyId, userData) => {
        try {
          await api.company.createCompanyUser(companyId, userData);
          // Recarregar lista de usuários
          await get().loadUsers(companyId);
        } catch (error) {
          console.error("Erro ao criar usuário:", error);
          throw new Error("Erro ao criar usuário");
        }
      },

      updateUser: async (companyId, userId, userData) => {
        try {
          await api.company.updateCompanyUser(companyId, userId, userData);
          // Recarregar lista de usuários
          await get().loadUsers(companyId);
        } catch (error) {
          console.error("Erro ao atualizar usuário:", error);
          throw new Error("Erro ao atualizar usuário");
        }
      },

      deleteUser: async (companyId, userId) => {
        try {
          await api.company.removeCompanyUser(companyId, userId);
          // Remover da lista local
          set((state) => ({
            users: state.users.filter((u) => u.userId !== userId),
          }));
        } catch (error) {
          console.error("Erro ao deletar usuário:", error);
          throw new Error("Erro ao deletar usuário");
        }
      },

      setCurrentCompanyId: (companyId) => {
        set({ currentCompanyId: companyId });
      },

      reset: () => {
        set(initialState);
      },
    }),
    {
      name: "management-users-store",
    }
  )
);
