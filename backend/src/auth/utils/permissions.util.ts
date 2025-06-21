/* eslint-disable prettier/prettier */

/**
 * Utilitário para fazer parse seguro de permissões JSON
 * Evita problemas de tipagem com JSON.parse() retornando 'any'
 */

/**
 * Faz parse seguro de permissões JSON, retornando array de strings
 * @param permissionsJson - String JSON contendo array de permissões
 * @returns Array de strings com as permissões ou array vazio em caso de erro
 */
export function parsePermissions(permissionsJson: string | null): string[] {
  if (!permissionsJson) {
    return [];
  }

  try {
    const parsed: unknown = JSON.parse(permissionsJson);
    if (
      Array.isArray(parsed) &&
      parsed.every((item) => typeof item === 'string')
    ) {
      return parsed;
    }
    return [];
  } catch {
    return [];
  }
}

/**
 * Converte array de permissões para string JSON
 * @param permissions - Array de strings com as permissões
 * @returns String JSON ou null se array vazio
 */
export function stringifyPermissions(permissions: string[]): string | null {
  if (!Array.isArray(permissions) || permissions.length === 0) {
    return null;
  }

  return JSON.stringify(permissions);
}

/**
 * Verifica se o usuário tem uma permissão específica
 * @param userPermissions - Array de permissões do usuário
 * @param requiredPermission - Permissão requerida
 * @returns true se o usuário tem a permissão
 */
export function hasPermission(
  userPermissions: string[],
  requiredPermission: string,
): boolean {
  return (
    userPermissions.includes(requiredPermission) ||
    userPermissions.includes('*')
  );
}

/**
 * Verifica se o usuário tem pelo menos uma das permissões especificadas
 * @param userPermissions - Array de permissões do usuário
 * @param requiredPermissions - Array de permissões requeridas
 * @returns true se o usuário tem pelo menos uma das permissões
 */
export function hasAnyPermission(
  userPermissions: string[],
  requiredPermissions: string[],
): boolean {
  return requiredPermissions.some((permission) =>
    hasPermission(userPermissions, permission),
  );
}

/**
 * Verifica se o usuário tem todas as permissões especificadas
 * @param userPermissions - Array de permissões do usuário
 * @param requiredPermissions - Array de permissões requeridas
 * @returns true se o usuário tem todas as permissões
 */
export function hasAllPermissions(
  userPermissions: string[],
  requiredPermissions: string[],
): boolean {
  return requiredPermissions.every((permission) =>
    hasPermission(userPermissions, permission),
  );
}
