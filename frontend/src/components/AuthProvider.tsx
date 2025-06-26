"use client";

import { useSocketInitializer } from "@/hooks/useSocketInitializer";
import { useAuthStore } from "@/store/auth";
import { useRouter } from "next/navigation";
import { useEffect } from "react";

interface AuthProviderProps {
  children: React.ReactNode;
}

export default function AuthProvider({ children }: AuthProviderProps) {
  const { checkAuth, isLoading, isAuthenticated, hasCheckedAuth, user } =
    useAuthStore();
  const router = useRouter();

  // Inicializar Socket.IO automaticamente
  useSocketInitializer(); // Verificar autenticação quando a aplicação iniciar (apenas se não foi hidratado corretamente)
  useEffect(() => {
    // Se não verificou ainda, ou se verificou mas não tem usuário e tem token, re-verificar
    const token =
      typeof window !== "undefined" ? localStorage.getItem("auth_token") : null;

    if (!hasCheckedAuth || (!user && token)) {
      console.log("🔍 Iniciando verificação de auth...");
      checkAuth();
    }
  }, [checkAuth, hasCheckedAuth, user]); // Redirecionar para login se não autenticado (APENAS APÓS VERIFICAÇÃO)
  useEffect(() => {
    // Só redirecionar se já verificou E não tem usuário salvo E não tem token
    const token =
      typeof window !== "undefined" ? localStorage.getItem("auth_token") : null;

    if (hasCheckedAuth && !user && !token) {
      console.log("🔄 Redirecionando para login - sem usuário e sem token");
      router.replace("/login");
    }
  }, [hasCheckedAuth, user, router]);
  // Mostrar loading enquanto verifica autenticação inicial
  if (!hasCheckedAuth || isLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-50">
        <div className="flex flex-col items-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600"></div>
          <p className="mt-4 text-gray-600">Verificando autenticação...</p>
        </div>
      </div>
    );
  }
  // Se não tem usuário após verificação, não renderizar nada (vai redirecionar)
  if (!user && hasCheckedAuth) {
    return null;
  }

  return <>{children}</>;
}
