import { authApi } from "@/services/api";
import { create } from "zustand";
import { devtools, persist } from "zustand/middleware";

export interface User {
  id: string;
  email: string;
  name: string;
  role: string;
  companyId: string;
}

interface AuthState {
  // Estado
  user: User | null;
  isLoading: boolean;
  isAuthenticated: boolean;

  // Ações
  setUser: (user: User | null) => void;
  setLoading: (loading: boolean) => void;
  login: (email: string, password: string) => Promise<boolean>;
  logout: () => Promise<void>;
  checkAuth: () => Promise<void>;
}

export const useAuthStore = create<AuthState>()(
  devtools(
    persist(
      (set, get) => ({
        // Estado inicial
        user: null,
        isLoading: true,
        isAuthenticated: false,

        // Ações
        setUser: (user) => {
          set({
            user,
            isAuthenticated: !!user,
            isLoading: false,
          });
        },

        setLoading: (isLoading) => {
          set({ isLoading });
        },
        login: async (email: string, password: string): Promise<boolean> => {
          try {
            set({ isLoading: true });

            const data = await authApi.login({ email, password });

            // Armazenar token no localStorage
            localStorage.setItem("auth_token", data.access_token);

            // Definir usuário no estado
            set({
              user: data.user,
              isAuthenticated: true,
              isLoading: false,
            });

            return true;
          } catch (error) {
            console.error("Erro no login:", error);
            set({ isLoading: false });
            return false;
          }
        },
        logout: async () => {
          try {
            // Chamar API de logout para limpar sessão no backend
            await authApi.logout();
          } catch (error) {
            console.error("Erro no logout:", error);
          } finally {
            // Limpar estado local
            localStorage.removeItem("auth_token");
            set({
              user: null,
              isAuthenticated: false,
              isLoading: false,
            });
          }
        },
        checkAuth: async () => {
          try {
            const token = localStorage.getItem("auth_token");
            if (token) {
              // Verificar se o token é válido usando o serviço
              const userData = await authApi.verify();
              set({
                user: userData.user,
                isAuthenticated: true,
                isLoading: false,
              });
            } else {
              // Sem token
              set({
                user: null,
                isAuthenticated: false,
                isLoading: false,
              });
            }
          } catch (error) {
            console.error("Erro ao verificar autenticação:", error);
            localStorage.removeItem("auth_token");
            set({
              user: null,
              isAuthenticated: false,
              isLoading: false,
            });
          }
        },
      }),
      {
        name: "auth-storage", // nome da chave no localStorage
        partialize: (state) => ({
          user: state.user,
          isAuthenticated: state.isAuthenticated,
        }), // apenas persistir user e isAuthenticated
      }
    ),
    {
      name: "auth-store",
    }
  )
);
