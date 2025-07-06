// ============================================================================
// 🔐 PERMISSIONS UTILS
// ============================================================================

import { AuthUser } from "@/types";

/**
 * Lista de permissões do sistema
 */
export const PERMISSIONS = {
  // Configurações da empresa
  SETTINGS_MANAGE: "settings:manage",
  SETTINGS_VIEW: "settings:view",

  // Empresa
  COMPANY_MANAGE: "company:manage",

  // Usuários
  USERS_INVITE: "users:invite",
  USERS_MANAGE: "users:manage",
  USERS_VIEW: "users:view",

  // WhatsApp
  WHATSAPP_MANAGE: "whatsapp:manage",

  // Tickets
  TICKETS_MANAGE: "tickets:manage",
  TICKETS_VIEW: "tickets:view",
  TICKETS_UPDATE: "tickets:update",
  TICKETS_RESPOND: "tickets:respond",

  // Fluxos
  FLOWS_MANAGE: "flows:manage",
  FLOWS_VIEW: "flows:view",

  // Contatos
  CONTACTS_VIEW: "contacts:view",

  // Dashboard
  DASHBOARD_VIEW: "dashboard:view",

  // Relatórios
  REPORTS_VIEW: "reports:view",

  // Billing
  BILLING_VIEW: "billing:view",
  BILLING_MANAGE: "billing:manage",

  // Sistema/Plataforma
  PLATFORM_MANAGE: "platform:manage",
  SYSTEM_CONFIGURE: "system:configure",
} as const;

/**
 * Lista de roles do sistema
 */
export const ROLES = {
  SUPER_ADMIN: "SUPER_ADMIN",
  COMPANY_OWNER: "COMPANY_OWNER",
  COMPANY_ADMIN: "COMPANY_ADMIN",
  COMPANY_AGENT: "COMPANY_AGENT",
  COMPANY_VIEWER: "COMPANY_VIEWER",
} as const;

/**
 * Verifica se o usuário tem uma permissão específica
 */
export function hasPermission(
  user: AuthUser | null,
  permission: string
): boolean {
  if (!user || !user.currentCompany?.role) {
    return false;
  }

  const userPermissions = user.currentCompany.role.permissions || [];
  return userPermissions.includes(permission);
}

/**
 * Verifica se o usuário tem uma das permissões da lista
 */
export function hasAnyPermission(
  user: AuthUser | null,
  permissions: string[]
): boolean {
  if (!user || !user.currentCompany?.role) {
    return false;
  }

  const userPermissions = user.currentCompany.role.permissions || [];
  return permissions.some((permission) => userPermissions.includes(permission));
}

/**
 * Verifica se o usuário tem uma role específica
 */
export function hasRole(user: AuthUser | null, role: string): boolean {
  if (!user || !user.currentCompany?.role) {
    return false;
  }

  return user.currentCompany.role.name === role;
}

/**
 * Verifica se o usuário tem uma das roles da lista
 */
export function hasAnyRole(user: AuthUser | null, roles: string[]): boolean {
  if (!user || !user.currentCompany?.role) {
    return false;
  }

  return roles.includes(user.currentCompany.role.name);
}

/**
 * Verifica se o usuário é Super Admin
 */
export function isSuperAdmin(user: AuthUser | null): boolean {
  return hasRole(user, ROLES.SUPER_ADMIN);
}

/**
 * Verifica se o usuário é Owner da empresa
 */
export function isCompanyOwner(user: AuthUser | null): boolean {
  return hasRole(user, ROLES.COMPANY_OWNER);
}

/**
 * Verifica se o usuário é Admin da empresa
 */
export function isCompanyAdmin(user: AuthUser | null): boolean {
  return hasRole(user, ROLES.COMPANY_ADMIN);
}

/**
 * Verifica se o usuário pode gerenciar configurações (Owner ou Admin)
 */
export function canManageSettings(user: AuthUser | null): boolean {
  return (
    hasAnyRole(user, [ROLES.COMPANY_OWNER, ROLES.COMPANY_ADMIN]) ||
    hasPermission(user, PERMISSIONS.SETTINGS_MANAGE)
  );
}

/**
 * Verifica se o usuário pode apenas visualizar configurações
 */
export function canViewSettings(user: AuthUser | null): boolean {
  return (
    canManageSettings(user) || hasPermission(user, PERMISSIONS.SETTINGS_VIEW)
  );
}

/**
 * Verifica se o usuário pode gerenciar horários de funcionamento
 */
export function canManageBusinessHours(user: AuthUser | null): boolean {
  return canManageSettings(user);
}

/**
 * Verifica se o usuário pode gerenciar usuários
 */
export function canManageUsers(user: AuthUser | null): boolean {
  return (
    hasAnyRole(user, [
      ROLES.SUPER_ADMIN,
      ROLES.COMPANY_OWNER,
      ROLES.COMPANY_ADMIN,
    ]) ||
    hasAnyPermission(user, [PERMISSIONS.USERS_MANAGE, PERMISSIONS.USERS_INVITE])
  );
}

/**
 * Verifica se o usuário pode gerenciar a empresa
 */
export function canManageCompany(user: AuthUser | null): boolean {
  return (
    isSuperAdmin(user) ||
    isCompanyOwner(user) ||
    hasPermission(user, PERMISSIONS.COMPANY_MANAGE)
  );
}
