"use client";

import { useAuthStore } from "@/store/auth";
import { useRouter } from "next/navigation";
import { useEffect } from "react";
import SocketProvider from "./SocketProvider";

interface AuthProviderProps {
  children: React.ReactNode;
}

/**
 * 🔐 AUTH PROVIDER SIMPLIFICADO
 * Responsabilidade: APENAS autenticação e redirecionamento
 * Socket/Sessões: Delegado para SocketProvider
 */
export default function AuthProvider({ children }: AuthProviderProps) {
  const { checkAuth, isLoading, hasCheckedAuth, user } = useAuthStore();
  const router = useRouter();

  // 1. Verificar autenticação na inicialização
  useEffect(() => {
    const token =
      typeof window !== "undefined" ? localStorage.getItem("auth_token") : null;

    if (!hasCheckedAuth || (!user && token)) {
      console.log("🔍 AuthProvider: Verificando autenticação...");
      checkAuth();
    }
  }, [checkAuth, hasCheckedAuth, user]);

  // 2. Redirecionar para login se não autenticado
  useEffect(() => {
    const token =
      typeof window !== "undefined" ? localStorage.getItem("auth_token") : null;

    if (hasCheckedAuth && !user && !token) {
      console.log("🔄 AuthProvider: Redirecionando para login");
      router.replace("/login");
    }
  }, [hasCheckedAuth, user, router]);

  // 3. Loading state
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

  // 4. Não renderizar se não há usuário
  if (!user && hasCheckedAuth) {
    return null;
  }

  // 5. Usuário autenticado: Envolver com SocketProvider
  return <SocketProvider>{children}</SocketProvider>;
}
