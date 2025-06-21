/* eslint-disable prettier/prettier */

/**
 * Interface que representa o usuário autenticado no sistema
 * Contém as informações básicas necessárias para autorização
 */
export interface CurrentUserData {
  /** ID único do usuário */
  userId: string;

  /** Email do usuário */
  email: string;

  /** Nome do usuário */
  name: string;

  /** ID da empresa ativa do usuário */
  companyId: string;

  /** ID do role/papel do usuário na empresa */
  roleId: string;

  /** Se é o primeiro login do usuário */
  isFirstLogin: boolean;

  /** Timestamp de quando o token foi emitido */
  iat?: number;

  /** Timestamp de quando o token expira */
  exp?: number;
}

/**
 * Interface para dados de filtragem de tickets
 */
export interface TicketFilters {
  companyId: string;
  status?: string;
  assignedAgentId?: string;
}

/**
 * Interface para dados de consulta Prisma mais específicos
 */
export interface PrismaWhereClause {
  companyId: string;
  [key: string]: any;
}

/**
 * Interface para dados de atualização Prisma
 */
export interface PrismaUpdateData {
  [key: string]: any;
}
