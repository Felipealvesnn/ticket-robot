import { authApi, sessionsApi } from "@/services/api";
import { socketService } from "@/services/socket";
import { AuthUser } from "@/types";
import { create } from "zustand";
import { devtools, persist } from "zustand/middleware";

interface AuthState {
  // Estado
  user: AuthUser | null;
  isLoading: boolean;
  isAuthenticated: boolean;
  hasCheckedAuth: boolean; // Novo flag para controlar se já verificou a autenticação
  currentCompanyId: string | null; // Empresa atual do usuário

  // Ações
  setUser: (user: AuthUser | null) => void;
  setLoading: (loading: boolean) => void;
  setCurrentCompany: (companyId: string) => Promise<void>;
  login: (email: string, password: string) => Promise<boolean>;
  logout: () => Promise<void>;
  checkAuth: () => Promise<void>;
  joinActiveSessions: () => Promise<void>; // 🔥 NOVA: Auto-join nas sessões ativas
}

export const useAuthStore = create<AuthState>()(
  devtools(
    persist(
      (set, get) => ({
        // Estado inicial
        user: null,
        isLoading: false,
        isAuthenticated: false,
        hasCheckedAuth: false, // Inicialmente não verificou
        currentCompanyId: null, // Empresa atual

        // Ações
        setUser: (user) => {
          console.log("👤 Definindo usuário:", user?.name || "null");
          set({
            user,
            isAuthenticated: !!user,
            isLoading: false,
            hasCheckedAuth: true, // Marcar como verificado quando seta o usuário
            currentCompanyId: user?.currentCompany?.id || null,
          });
        },

        setLoading: (isLoading) => {
          set({ isLoading });
        },
        setCurrentCompany: async (companyId: string) => {
          // TODO: Implementar troca de empresa completa
          console.log("🏢 Trocando para empresa:", companyId);

          // Futuramente aqui vai:
          // 1. Chamar API para trocar empresa
          // 2. Obter novo token JWT com novo companyId
          // 3. Reconectar Socket.IO com novo token
          // 4. Limpar salas antigas e entrar nas novas

          set({ currentCompanyId: companyId });

          // Por enquanto, se o socket estiver conectado, reconectar às sessões
          // (isso será melhorado quando implementarmos a troca completa de empresa)
          if (socketService.isConnected()) {
            console.log("🔄 Reconectando às sessões da nova empresa...");
            await get().joinActiveSessions();
          }
        },
        login: async (email: string, password: string): Promise<boolean> => {
          try {
            set({ isLoading: true });
            const data = await authApi.login({ email, password });

            // Armazenar token no localStorage
            localStorage.setItem("auth_token", data.tokens.accessToken); // Definir usuário no estado
            set({
              user: data.user,
              isAuthenticated: true,
              isLoading: false,
              hasCheckedAuth: true, // Marcar como verificado após login
              currentCompanyId: data.user.currentCompany?.id || null,
            });

            // Conectar ao Socket.IO após login bem-sucedido
            try {
              await socketService.connect(data.tokens.accessToken);
              console.log("✅ Socket.IO conectado após login");

              // 🔥 AUTO-JOIN: Entrar automaticamente nas sessões ativas após login
              await get().joinActiveSessions();
            } catch (socketError) {
              console.error("⚠️ Erro ao conectar Socket.IO:", socketError);
              // Não falhamos o login por erro de socket
            }

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
            // 🔥 LEAVE: Sair de todas as sessões antes de desconectar
            if (socketService.isConnected()) {
              console.log("📱 Saindo de todas as sessões ativas...");
              // Nota: Como não sabemos quais sessões o usuário estava,
              // o backend vai limpar automaticamente ao desconectar
            }

            // Desconectar Socket.IO
            socketService.disconnect();
            console.log("🔌 Socket.IO desconectado no logout"); // Limpar estado local
            localStorage.removeItem("auth_token");
            set({
              user: null,
              isAuthenticated: false,
              isLoading: false,
              hasCheckedAuth: true, // Manter como verificado após logout
              currentCompanyId: null,
            });
          }
        },
        checkAuth: async () => {
          console.log("🔍 Iniciando checkAuth...");
          set({ isLoading: true });

          try {
            const token = localStorage.getItem("auth_token");
            console.log("🎫 Token presente:", !!token);

            if (!token) {
              // Sem token - usuário não autenticado
              console.log("❌ Sem token - definindo como não autenticado");
              set({
                user: null,
                isAuthenticated: false,
                isLoading: false,
                hasCheckedAuth: true, // Marcar como verificado
              });
              return;
            }

            // Verificar se o token é válido usando o serviço
            console.log("🔍 Verificando token com backend...");
            const userData = await authApi.verify();
            console.log("✅ Token válido - usuário:", userData.user.name);

            set({
              user: userData.user,
              isAuthenticated: true,
              isLoading: false,
              hasCheckedAuth: true, // Marcar como verificado
              currentCompanyId: userData.user.currentCompany?.id || null,
            });

            // Conectar ao Socket.IO se ainda não estiver conectado
            if (!socketService.isConnected() && token) {
              try {
                await socketService.connect(token);
                console.log("✅ Socket.IO reconectado na verificação de auth");

                // 🔥 AUTO-JOIN: Entrar automaticamente nas sessões ativas da empresa
                await get().joinActiveSessions();
              } catch (socketError) {
                console.error("⚠️ Erro ao reconectar Socket.IO:", socketError);
              }
            } else if (socketService.isConnected()) {
              // Se já conectado, apenas fazer auto-join nas sessões
              await get().joinActiveSessions();
            }
          } catch (error) {
            console.error("❌ Erro ao verificar autenticação:", error);
            // Token inválido - limpar dados
            localStorage.removeItem("auth_token");
            socketService.disconnect(); // Desconectar socket em caso de erro
            set({
              user: null,
              isAuthenticated: false,
              isLoading: false,
              hasCheckedAuth: true, // Marcar como verificado mesmo em caso de erro
            });
          }
        },

        // 🔥 NOVA FUNÇÃO: Auto-join nas sessões ativas da empresa
        joinActiveSessions: async () => {
          try {
            const { user } = get();
            if (!user || !socketService.isConnected()) {
              console.log("⚠️ Usuário não autenticado ou socket desconectado");
              return;
            }

            console.log("🔍 Buscando sessões ativas da empresa...");
            const sessions = await sessionsApi.getAll();

            // Filtrar apenas sessões conectadas/ativas
            const activeSessions = sessions.filter(
              (session) =>
                session.status === "connected" ||
                session.status === "connecting"
            );

            console.log(
              `📱 Entrando automaticamente em ${activeSessions.length} sessões ativas`
            );

            // Entrar em cada sessão ativa
            for (const session of activeSessions) {
              socketService.joinSession(session.id);
              console.log(
                `✅ Auto-join na sessão: ${session.name} (${session.id})`
              );
            }

            if (activeSessions.length > 0) {
              console.log(
                `🎉 Conectado automaticamente a ${activeSessions.length} sessões ativas!`
              );
            } else {
              console.log("📭 Nenhuma sessão ativa encontrada");
            }
          } catch (error) {
            console.error("❌ Erro ao fazer auto-join nas sessões:", error);
          }
        },
      }),
      {
        name: "auth-storage",
        partialize: (state) => ({
          user: state.user,
          isAuthenticated: state.isAuthenticated,
          hasCheckedAuth: state.hasCheckedAuth,
          currentCompanyId: state.currentCompanyId,
        }), // Configurar como o estado é hidratado do localStorage
        onRehydrateStorage: () => (state) => {
          console.log("🔄 Hidratando store de auth...", state);

          // Se temos um usuário persistido, já devemos ter verificado a auth
          if (state && state.user && state.isAuthenticated) {
            console.log(
              "🔄 Hidratando estado de auth com usuário logado:",
              state.user.name
            );
            // Mas vamos re-verificar para garantir que o token ainda é válido
            setTimeout(() => {
              console.log("🔍 Re-verificando token após hidratação...");
              state.checkAuth();
            }, 100); // Pequeno delay para evitar problemas de timing
          } else if (state) {
            // Se não temos usuário, marcar como verificado para evitar loading infinito
            state.hasCheckedAuth = true;
            console.log("🔄 Hidratando estado de auth sem usuário");
          }
        },
      }
    ),
    {
      name: "auth-store",
    }
  )
);
