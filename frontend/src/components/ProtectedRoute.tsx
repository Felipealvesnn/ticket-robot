"use client";

import { useAuthStore } from "@/store/auth";
import { useRouter } from "next/navigation";
import { useEffect, useState } from "react";

interface ProtectedRouteProps {
  children: React.ReactNode;
  requiredRole?: string[];
}

export default function ProtectedRoute({
  children,
  requiredRole,
}: ProtectedRouteProps) {
  const { user, isLoading, isAuthenticated, checkAuth } = useAuthStore();
  const router = useRouter();
  const [hasCheckedAuth, setHasCheckedAuth] = useState(false);

  // Verificar autenticação apenas uma vez quando o componente montar
  useEffect(() => {
    if (!hasCheckedAuth) {
      checkAuth().finally(() => {
        setHasCheckedAuth(true);
      });
    }
  }, [checkAuth, hasCheckedAuth]);

  // Redirecionar para login se não autenticado
  useEffect(() => {
    if (hasCheckedAuth && !isLoading && !isAuthenticated) {
      router.replace("/login");
    }
  }, [hasCheckedAuth, isLoading, isAuthenticated, router]);

  // Verificar role se especificado
  useEffect(() => {
    if (
      hasCheckedAuth &&
      !isLoading &&
      isAuthenticated &&
      requiredRole &&
      user?.currentCompany &&
      !requiredRole.includes(user.currentCompany.role.name)
    ) {
      router.replace("/unauthorized");
    }
  }, [hasCheckedAuth, isLoading, isAuthenticated, user, requiredRole, router]);

  // Mostrar loading enquanto verifica autenticação
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

  // Se chegou aqui mas não está autenticado, não renderizar nada
  if (!isAuthenticated) {
    return null;
  }

  // Se chegou aqui mas não tem a role necessária, não renderizar nada
  if (
    requiredRole &&
    user?.currentCompany &&
    !requiredRole.includes(user.currentCompany.role.name)
  ) {
    return null;
  }

  return <>{children}</>;
}
