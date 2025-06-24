import { authApi, AuthUser } from "@/services/api";
import { create } from "zustand";
import { devtools, persist } from "zustand/middleware";

interface AuthState {
  // Estado
  user: AuthUser | null;
  isLoading: boolean;
  isAuthenticated: boolean;

  // Ações
  setUser: (user: AuthUser | null) => void;
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
        isLoading: false, // Começar como false para evitar loading desnecessário
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
            localStorage.setItem("auth_token", data.tokens.accessToken);

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
          set({ isLoading: true });

          try {
            const token = localStorage.getItem("auth_token");
            if (!token) {
              // Sem token - usuário não autenticado
              set({
                user: null,
                isAuthenticated: false,
                isLoading: false,
              });
              return;
            }

            // Verificar se o token é válido usando o serviço
            const userData = await authApi.verify();
            set({
              user: userData.user,
              isAuthenticated: true,
              isLoading: false,
            });
          } catch (error) {
            console.error("Erro ao verificar autenticação:", error);
            // Token inválido - limpar dados
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
