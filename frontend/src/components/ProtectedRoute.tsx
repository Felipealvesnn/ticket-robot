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
  const { user, isAuthenticated } = useAuthStore();
  const router = useRouter();

  // APENAS verificar role se especificado (não verificar autenticação geral)
  useEffect(() => {
    if (
      isAuthenticated &&
      requiredRole &&
      user?.currentCompany &&
      !requiredRole.includes(user.currentCompany.role.name)
    ) {
      router.replace("/unauthorized");
    }
  }, [isAuthenticated, user, requiredRole, router]);

  // Se tem role requerida mas usuário não tem a role necessária
  if (
    requiredRole &&
    isAuthenticated &&
    user?.currentCompany &&
    !requiredRole.includes(user.currentCompany.role.name)
  ) {
    return null; // Vai redirecionar
  }

  return <>{children}</>;
}
