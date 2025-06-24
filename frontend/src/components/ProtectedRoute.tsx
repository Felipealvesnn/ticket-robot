"use client";

import { useAuthStore } from "@/store/auth";
import { useRouter } from "next/navigation";
import { useEffect } from "react";

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

  // Verificar autenticação quando o componente montar
  useEffect(() => {
    checkAuth();
  }, [checkAuth]);

  useEffect(() => {
    if (!isLoading && !isAuthenticated) {
      router.push("/login");
    }
  }, [isLoading, isAuthenticated, router]);

  // Verificar role se especificado
  useEffect(() => {
    if (
      !isLoading &&
      isAuthenticated &&
      requiredRole &&
      user &&
      !requiredRole.includes(user.role)
    ) {
      router.push("/unauthorized");
    }
  }, [isLoading, isAuthenticated, user, requiredRole, router]);

  if (isLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-50">
        <div className="flex flex-col items-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600"></div>
          <p className="mt-4 text-gray-600">Carregando...</p>
        </div>
      </div>
    );
  }

  if (!isAuthenticated) {
    return null; // O useEffect vai redirecionar
  }

  if (requiredRole && user && !requiredRole.includes(user.role)) {
    return null; // O useEffect vai redirecionar
  }

  return <>{children}</>;
}
