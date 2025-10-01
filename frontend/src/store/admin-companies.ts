import api from "@/services/api";
import { create } from "zustand";
import { devtools } from "zustand/middleware";

export interface AdminCompany {
  id: string;
  name: string;
  slug: string;
  plan: string;
  isActive: boolean;
  createdAt: string;
  _count: {
    users: number;
    sessions: number;
  };
}

export interface CreateCompanyData {
  name: string;
  slug: string;
  plan: string;
}

export interface UpdateCompanyData {
  name: string;
  slug: string;
  plan: string;
}

interface AdminCompaniesState {
  // Companies
  companies: AdminCompany[];
  companiesLoading: boolean;
  companiesError: string | null;

  // Pagination
  currentPage: number;
  totalPages: number;
  totalItems: number;
  limit: number;

  // Actions
  loadCompanies: (page?: number, limit?: number) => Promise<void>;
  createCompany: (data: CreateCompanyData) => Promise<void>;
  updateCompany: (companyId: string, data: UpdateCompanyData) => Promise<void>;
  deleteCompany: (companyId: string) => Promise<void>;
  toggleCompanyStatus: (companyId: string) => Promise<void>;

  // Utility
  reset: () => void;
  setPage: (page: number) => void;
  setLimit: (limit: number) => void;

  // Computed getters
  getActiveCompanies: () => AdminCompany[];
  getInactiveCompanies: () => AdminCompany[];
  getTotalUsers: () => number;
  getTotalSessions: () => number;
}

const initialState = {
  companies: [],
  companiesLoading: false,
  companiesError: null,
  currentPage: 1,
  totalPages: 1,
  totalItems: 0,
  limit: 25,
};

export const useAdminCompaniesStore = create<AdminCompaniesState>()(
  devtools(
    (set, get) => ({
      ...initialState,

      loadCompanies: async (page = 1, limit = 25) => {
        try {
          set({ companiesLoading: true, companiesError: null });

          const response = await api.adminCompanies.getAllCompanies({
            page,
            limit,
          });

          set({
            companies: response.companies as AdminCompany[],
            currentPage: response.pagination.page,
            totalPages: response.pagination.totalPages,
            totalItems: response.pagination.total,
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

      createCompany: async (data: CreateCompanyData) => {
        try {
          await api.adminCompanies.createCompany({
            name: data.name,
            slug: data.slug,
            plan: data.plan,
          });
          // Recarregar lista de empresas
          await get().loadCompanies(get().currentPage, get().limit);
        } catch (error) {
          console.error("Erro ao criar empresa:", error);
          throw new Error("Erro ao criar empresa");
        }
      },

      updateCompany: async (companyId: string, data: UpdateCompanyData) => {
        try {
          await api.adminCompanies.updateCompany(companyId, data);
          // Recarregar lista de empresas
          await get().loadCompanies(get().currentPage, get().limit);
        } catch (error) {
          console.error("Erro ao atualizar empresa:", error);
          throw new Error("Erro ao atualizar empresa");
        }
      },

      deleteCompany: async (companyId: string) => {
        try {
          await api.adminCompanies.deleteCompany(companyId);
          // Recarregar lista de empresas
          await get().loadCompanies(get().currentPage, get().limit);
        } catch (error) {
          console.error("Erro ao deletar empresa:", error);
          throw new Error("Erro ao deletar empresa");
        }
      },

      toggleCompanyStatus: async (companyId: string) => {
        try {
          await api.adminCompanies.toggleCompanyStatus(companyId);
          // Atualizar o status na lista local
          set((state) => ({
            companies: state.companies.map((company) =>
              company.id === companyId
                ? { ...company, isActive: !company.isActive }
                : company
            ),
          }));
        } catch (error) {
          console.error("Erro ao alterar status da empresa:", error);
          throw new Error("Erro ao alterar status da empresa");
        }
      },

      setPage: (page: number) => {
        set({ currentPage: page });
      },

      setLimit: (limit: number) => {
        set({ limit, currentPage: 1 });
      },

      reset: () => {
        set(initialState);
      },

      // Computed getters
      getActiveCompanies: () => {
        return get().companies.filter((company) => company.isActive);
      },

      getInactiveCompanies: () => {
        return get().companies.filter((company) => !company.isActive);
      },

      getTotalUsers: () => {
        return get().companies.reduce(
          (acc, company) => acc + company._count.users,
          0
        );
      },

      getTotalSessions: () => {
        return get().companies.reduce(
          (acc, company) => acc + company._count.sessions,
          0
        );
      },
    }),
    {
      name: "admin-companies-store",
    }
  )
);
