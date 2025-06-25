"use client";

import { useSocketInitializer } from "@/hooks/useSocketInitializer";
import { useAuthStore } from "@/store/auth";
import { useRouter } from "next/navigation";
import { useEffect } from "react";

interface AuthProviderProps {
  children: React.ReactNode;
}

export default function AuthProvider({ children }: AuthProviderProps) {
  const { checkAuth, isLoading, isAuthenticated } = useAuthStore();
  const router = useRouter();

  // Inicializar Socket.IO automaticamente
  useSocketInitializer();

  // Verificar autenticação quando a aplicação iniciar
  useEffect(() => {
    checkAuth();
  }, [checkAuth]);

  // Redirecionar para login se não autenticado (APENAS AQUI)
  useEffect(() => {
    "debugger";
    if (!isLoading && !isAuthenticated) {
      router.replace("/login");
    }
  }, [isLoading, isAuthenticated, router]);

  // Mostrar loading enquanto verifica autenticação
  if (isLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-50">
        <div className="flex flex-col items-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600"></div>
          <p className="mt-4 text-gray-600">Verificando autenticação...</p>
        </div>
      </div>
    );
  }
  // Se não está autenticado, não renderizar nada (vai redirecionar)
  if (!isAuthenticated) {
    return null;
  }

  return <>{children}</>;
}
