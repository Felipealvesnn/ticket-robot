import { authApi } from "@/services/api";
import { socketService } from "@/services/socket";
import { AuthUser } from "@/types";
import { create } from "zustand";
import { devtools, persist } from "zustand/middleware";

// Função para obter localização do usuário (opcional)
async function getCurrentLocation(): Promise<{
  latitude: number;
  longitude: number;
  accuracy: number;
} | null> {
  return new Promise((resolve) => {
    if (!navigator.geolocation) {
      console.log("📍 Geolocalização não suportada pelo navegador");
      resolve(null);
      return;
    }

    navigator.geolocation.getCurrentPosition(
      (position) => {
        console.log("📍 Localização obtida com sucesso");
        resolve({
          latitude: position.coords.latitude,
          longitude: position.coords.longitude,
          accuracy: position.coords.accuracy,
        });
      },
      (error) => {
        console.log(
          "📍 Usuário negou permissão de localização:",
          error.message
        );
        resolve(null); // Não força localização
      },
      {
        enableHighAccuracy: true,
        timeout: 10000, // 10 segundos
        maximumAge: 300000, // 5 minutos de cache
      }
    );
  });
}

interface AuthState {
  // Estado
  user: AuthUser | null;
  isLoading: boolean;
  isAuthenticated: boolean;
  hasCheckedAuth: boolean; // Novo flag para controlar se já verificou a autenticação
  currentCompanyId: string | null; // Empresa atual do usuário
  showFirstLoginModal: boolean; // Controlar modal de primeira senha
  hasHandledFirstLogin: boolean; // Flag para controlar se já lidou com primeiro login nesta sessão

  // Ações
  setUser: (user: AuthUser | null) => void;
  setLoading: (loading: boolean) => void;
  setCurrentCompany: (companyId: string) => Promise<void>;
  setShowFirstLoginModal: (show: boolean) => void;
  login: (email: string, password: string) => Promise<boolean>;
  logout: () => Promise<void>;
  checkAuth: () => Promise<void>;
  changeFirstLoginPassword: (
    currentPassword: string,
    newPassword: string
  ) => Promise<void>;
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
        showFirstLoginModal: false, // Modal de primeira senha fechado inicialmente
        hasHandledFirstLogin: false, // Não lidou com primeiro login ainda

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

        setShowFirstLoginModal: (show) => {
          set({ showFirstLoginModal: show });
        },
        setCurrentCompany: async (companyId: string) => {
          const { user, isAuthenticated } = get();

          if (!user || !isAuthenticated) {
            console.error(
              "🏢 Erro: usuário não autenticado para trocar empresa"
            );
            return;
          }

          // Verificar se o usuário tem acesso à empresa
          const targetCompany = user.companies?.find((c) => c.id === companyId);
          if (!targetCompany) {
            console.error(
              "🏢 Erro: usuário não tem acesso à empresa:",
              companyId
            );
            return;
          }

          console.log("🏢 Salvando empresa selecionada:", targetCompany.name);

          // Salvar empresa desejada no localStorage
          localStorage.setItem("selected_company_id", companyId);

          // Atualizar estado local temporariamente
          set({ currentCompanyId: companyId });

          // O próximo checkAuth() ou refresh vai pegar a empresa salva automaticamente
          // Forçar uma re-verificação para aplicar a mudança imediatamente
          await get().checkAuth();

          console.log(
            "✅ Empresa alterada com sucesso para:",
            targetCompany.name
          );
        },
        login: async (email: string, password: string): Promise<boolean> => {
          try {
            set({ isLoading: true });

            // Tentar obter localização do usuário (opcional)
            const location = await getCurrentLocation();

            const loginData = {
              email,
              password,
              // Adicionar coordenadas se disponíveis
              ...(location && {
                latitude: location.latitude,
                longitude: location.longitude,
                accuracy: location.accuracy,
              }),
            };

            const data = await authApi.login(loginData);

            // Armazenar tokens no localStorage
            localStorage.setItem("auth_token", data.tokens.accessToken);
            localStorage.setItem("refresh_token", data.tokens.refreshToken);

            // Verificar se existe uma empresa pré-selecionada no localStorage
            const savedCompanyId = localStorage.getItem("selected_company_id");
            let targetCompanyId = data.user.currentCompany?.id || null;
            let needsRefresh = false;

            if (savedCompanyId) {
              // Verificar se o usuário tem acesso à empresa salva
              const savedCompany = data.user.companies?.find(
                (c) => c.id === savedCompanyId
              );
              if (savedCompany) {
                console.log(
                  "🏢 [LOGIN] Usando empresa pré-selecionada:",
                  savedCompany.name
                );
                targetCompanyId = savedCompanyId;

                // Se a empresa salva é diferente da empresa padrão, precisa refresh
                if (savedCompanyId !== data.user.currentCompany?.id) {
                  needsRefresh = true;
                }
              } else {
                console.log(
                  "🏢 [LOGIN] Empresa pré-selecionada não encontrada, usando empresa padrão"
                );
                // Limpar empresa inválida do localStorage
                localStorage.removeItem("selected_company_id");
              }
            }

            // Definir usuário no estado
            console.log("👤 [LOGIN] Dados do usuário recebidos:", data.user);
            set({
              user: data.user,
              isAuthenticated: true,
              isLoading: false,
              hasCheckedAuth: true, // Marcar como verificado após login
              currentCompanyId: targetCompanyId,
            });

            // Se usamos uma empresa diferente da padrão, salvar no localStorage
            if (
              targetCompanyId &&
              targetCompanyId !== data.user.currentCompany?.id
            ) {
              localStorage.setItem("selected_company_id", targetCompanyId);
            }

            // Se precisar de refresh para aplicar a empresa correta no backend
            if (needsRefresh) {
              console.log(
                "🔄 [LOGIN] Fazendo refresh para aplicar empresa selecionada"
              );
              try {
                const refreshData = await authApi.refresh(
                  data.tokens.refreshToken,
                  targetCompanyId || undefined
                );

                // Atualizar tokens
                localStorage.setItem("auth_token", refreshData.accessToken);
                localStorage.setItem("refresh_token", refreshData.refreshToken);

                console.log("✅ [LOGIN] Token atualizado com empresa correta");
              } catch (refreshError) {
                console.error("❌ [LOGIN] Erro no refresh:", refreshError);
                // Em caso de erro, manter o estado atual
              }
            }

            // Verificar se é primeiro login e mostrar modal
            if (data.user.isFirstLogin || data.isFirstLogin) {
              console.log(
                "🔒 Primeiro login detectado - abrindo modal de troca de senha"
              );
              set({
                showFirstLoginModal: true,
                hasHandledFirstLogin: true, // Marcar que já lidou com primeiro login nesta sessão
              });
            }

            // Log das informações de device capturadas
            if (data.deviceInfo) {
              console.log("📱 Device Info capturado:", data.deviceInfo);
              if (data.deviceInfo.latitude && data.deviceInfo.longitude) {
                console.log(
                  `📍 Localização: ${data.deviceInfo.city || "N/A"}, ${
                    data.deviceInfo.country || "N/A"
                  }`
                );
                console.log(
                  `🎯 Coordenadas: ${data.deviceInfo.latitude}, ${
                    data.deviceInfo.longitude
                  } (±${data.deviceInfo.accuracy || "N/A"}m)`
                );
              }
            }

            // Conectar ao Socket.IO após login bem-sucedido
            try {
              await socketService.connect(data.tokens.accessToken);
              console.log("✅ Socket.IO conectado após login");
            } catch (socketError) {
              console.error("⚠️ Erro ao conectar Socket.IO:", socketError);
              // Não falhamos o login por erro de socket
            }

            // Usar toast notification se disponível
            if (typeof window !== "undefined") {
              setTimeout(() => {
                window.dispatchEvent(
                  new CustomEvent("showToast", {
                    detail: {
                      type: "success",
                      title: "Login realizado com sucesso!",
                      message: `Bem-vindo(a), ${data.user.name}!`,
                    },
                  })
                );
              }, 100);
            }

            return true;
          } catch (error) {
            console.error("Erro no login:", error);
            set({ isLoading: false });

            // Mostrar erro via toast
            if (typeof window !== "undefined") {
              setTimeout(() => {
                window.dispatchEvent(
                  new CustomEvent("showToast", {
                    detail: {
                      type: "error",
                      title: "Erro no login",
                      message:
                        error instanceof Error
                          ? error.message
                          : "Verifique suas credenciais",
                    },
                  })
                );
              }, 100);
            }

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
            console.log("🔌 Socket.IO desconectado no logout");

            // Limpar tokens do localStorage
            localStorage.removeItem("auth_token");
            localStorage.removeItem("refresh_token");

            set({
              user: null,
              isAuthenticated: false,
              isLoading: false,
              hasCheckedAuth: true, // Manter como verificado após logout
              currentCompanyId: null,
              showFirstLoginModal: false, // Fechar modal se estiver aberto
              hasHandledFirstLogin: false, // Resetar flag para próximo login
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

            const userData = await authApi.verify();

            // Verificar se existe uma empresa pré-selecionada no localStorage
            const savedCompanyId = localStorage.getItem("selected_company_id");
            let targetCompanyId = userData.user.currentCompany?.id || null;
            let needsRefresh = false;

            if (savedCompanyId) {
              // Verificar se o usuário tem acesso à empresa salva
              const savedCompany = userData.user.companies?.find(
                (c) => c.id === savedCompanyId
              );
              if (savedCompany) {
                targetCompanyId = savedCompanyId;

                // Se a empresa salva é diferente da empresa atual do token, precisa refresh
                if (savedCompanyId !== userData.user.currentCompany?.id) {
                  needsRefresh = true;
                }
              } else {
                // Limpar empresa inválida do localStorage
                localStorage.removeItem("selected_company_id");
              }
            }

            const { hasHandledFirstLogin } = get();


            set({
              user: userData.user,
              isAuthenticated: true,
              isLoading: false,
              hasCheckedAuth: true, // Marcar como verificado
              currentCompanyId: targetCompanyId,
              // Só abrir modal de primeiro login se ainda não foi tratado nesta sessão
              showFirstLoginModal:
                !hasHandledFirstLogin && (userData.user.isFirstLogin || false),
            });

            // Se usamos uma empresa diferente da padrão, salvar no localStorage
            if (
              targetCompanyId &&
              targetCompanyId !== userData.user.currentCompany?.id
            ) {
              localStorage.setItem("selected_company_id", targetCompanyId);
            }

            // Se precisar de refresh para aplicar a empresa correta no backend
            if (needsRefresh) {
              console.log(
                "🔄 [CHECK_AUTH] Fazendo refresh para aplicar empresa selecionada"
              );
              try {
                const refreshToken = localStorage.getItem("refresh_token");
                if (refreshToken) {
                  const refreshData = await authApi.refresh(
                    refreshToken,
                    targetCompanyId || undefined
                  );

                  // Atualizar tokens
                  localStorage.setItem("auth_token", refreshData.accessToken);
                  localStorage.setItem(
                    "refresh_token",
                    refreshData.refreshToken
                  );

                  console.log(
                    "✅ [CHECK_AUTH] Token atualizado com empresa correta"
                  );
                }
              } catch (refreshError) {
                console.error("❌ [CHECK_AUTH] Erro no refresh:", refreshError);

                // Se o refresh token é inválido, limpar dados e forçar novo login
                if (
                  (refreshError as any).message?.includes(
                    "Refresh token inválido"
                  )
                ) {
                  console.log(
                    "🧹 [CHECK_AUTH] Limpando tokens inválidos e forçando logout"
                  );
                  localStorage.removeItem("auth_token");
                  localStorage.removeItem("refresh_token");
                  localStorage.removeItem("selected_company_id");

                  set({
                    user: null,
                    isAuthenticated: false,
                    isLoading: false,
                    hasCheckedAuth: true,
                    currentCompanyId: null,
                    showFirstLoginModal: false,
                    hasHandledFirstLogin: false,
                  });

                  // Desconectar socket
                  socketService.disconnect();
                  return; // Sair da função para evitar continuar com dados inválidos
                }
                // Em outros casos de erro, manter o estado atual
              }
            }

            // Conectar ao Socket.IO se ainda não estiver conectado
            if (!socketService.isConnected() && token) {
              try {
                await socketService.connect(token);
                console.log("✅ Socket.IO reconectado na verificação de auth");
              } catch (socketError) {
                console.error("⚠️ Erro ao reconectar Socket.IO:", socketError);
              }
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

        changeFirstLoginPassword: async (
          currentPassword: string,
          newPassword: string
        ) => {
          try {
            console.log("🔑 Alterando senha do primeiro login...");

            const response = await authApi.changeFirstLoginPassword(
              currentPassword,
              newPassword
            );

            // Atualizar dados do usuário e tokens
            const { user: updatedUser, tokens } = response;

            // Salvar novos tokens
            localStorage.setItem("auth_token", tokens.accessToken);
            localStorage.setItem("refresh_token", tokens.refreshToken);

            // Atualizar estado do usuário
            set({
              user: updatedUser,
              showFirstLoginModal: false, // Fechar modal
            });

            console.log("✅ Senha alterada com sucesso!");

            // Emitir evento personalizado para toast
            window.dispatchEvent(
              new CustomEvent("auth-success", {
                detail: { message: "Senha alterada com sucesso!" },
              })
            );
          } catch (error: any) {
            console.error("❌ Erro ao alterar senha:", error);

            // Emitir evento de erro
            window.dispatchEvent(
              new CustomEvent("auth-error", {
                detail: { message: error.message || "Erro ao alterar senha" },
              })
            );

            throw error;
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
