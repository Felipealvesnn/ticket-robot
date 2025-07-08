import api from '@/services/api';
import * as Types from '@/types';
import { create } from 'zustand';
import { devtools } from 'zustand/middleware';

interface ManagementCompanyState {
  // Company data
  company: Types.CompanyWithUsers | null;
  companyLoading: boolean;
  companyError: string | null;
  
  // Edit state
  isEditing: boolean;
  saving: boolean;
  
  // Current company
  currentCompanyId: string | null;
  
  // Actions
  loadCompany: (companyId: string) => Promise<void>;
  updateCompany: (companyId: string, data: {
    name: string;
    slug: string;
    plan: "FREE" | "BASIC" | "PRO" | "ENTERPRISE";
  }) => Promise<void>;
  
  // Edit actions
  setIsEditing: (isEditing: boolean) => void;
  
  // Utility
  reset: () => void;
  setCurrentCompanyId: (companyId: string | null) => void;
  
  // Computed getters
  getActiveUsersCount: () => number;
  getTotalUsersCount: () => number;
}

const initialState = {
  company: null,
  companyLoading: false,
  companyError: null,
  isEditing: false,
  saving: false,
  currentCompanyId: null,
};

export const useManagementCompanyStore = create<ManagementCompanyState>()(
  devtools(
    (set, get) => ({
      ...initialState,

      loadCompany: async (companyId: string) => {
        try {
          set({ companyLoading: true, companyError: null });
          
          const response = await api.company.getMyCompany(companyId);
          
          set({
            company: response,
            currentCompanyId: companyId,
            companyLoading: false,
          });
        } catch (error) {
          console.error('Erro ao carregar empresa:', error);
          set({
            companyError: 'Erro ao carregar dados da empresa',
            companyLoading: false,
          });
        }
      },

      updateCompany: async (companyId: string, data) => {
        try {
          set({ saving: true });
          
          const response = await api.company.updateCompany(companyId, data);
          
          // Atualizar os dados da empresa no estado
          set((state) => ({
            company: state.company ? { ...state.company, ...response } : null,
            isEditing: false,
            saving: false,
          }));
        } catch (error) {
          console.error('Erro ao atualizar empresa:', error);
          set({ saving: false });
          throw new Error('Erro ao salvar alterações');
        }
      },

      setIsEditing: (isEditing: boolean) => {
        set({ isEditing });
      },

      setCurrentCompanyId: (companyId: string | null) => {
        set({ currentCompanyId: companyId });
      },

      reset: () => {
        set(initialState);
      },

      // Computed getters
      getActiveUsersCount: () => {
        const { company } = get();
        return company?.companyUsers?.filter((u) => u.isActive).length || 0;
      },

      getTotalUsersCount: () => {
        const { company } = get();
        return company?.companyUsers?.length || 0;
      },
    }),
    {
      name: 'management-company-store',
    }
  )
);
