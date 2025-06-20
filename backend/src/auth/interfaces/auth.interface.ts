/* eslint-disable prettier/prettier */
export interface JwtPayload {
  sub: string; // User ID
  email: string;
  companyId?: string;
  roleId?: string;
  permissions?: string[];
  iat?: number;
  exp?: number;
}

export interface AuthTokens {
  accessToken: string;
  refreshToken: string;
}

export interface AuthUser {
  id: string;
  email: string;
  name: string;
  avatar?: string;
  companies: UserCompany[];
  currentCompany?: UserCompany;
}

export interface UserCompany {
  id: string;
  name: string;
  slug: string;
  role: {
    id: string;
    name: string;
    permissions: string[];
  };
}

export interface LoginResponse {
  user: AuthUser;
  tokens: AuthTokens;
  isFirstLogin?: boolean;
}

export interface CurrentUserPayload {
  userId: string;
  email: string;
  companyId?: string;
  roleId?: string;
  roleName?: string;
  permissions: string[];
  user: {
    id: string;
    email: string;
    name: string;
    avatar?: string;
  };
  company?: {
    id: string;
    name: string;
    slug: string;
  } | null;
}

export interface AuthenticatedRequest extends Request {
  headers: {
    authorization?: string;
  } & Request['headers'];
}

export interface RegisterResponse {
  user: {
    id: string;
    email: string;
    name: string;
    isFirstLogin: boolean;
    createdAt: Date;
  };
  message: string;
}

export interface PrismaCompanyUser {
  companyId: string;
  roleId: string;
  role: {
    id: string;
    name: string;
    permissions: string;
  };
  company: {
    id: string;
    name: string;
    slug: string;
  };
}

export interface PrismaUserWithCompanies {
  id: string;
  email: string;
  name: string;
  avatar: string | null;
  password: string;
  isFirstLogin: boolean;
  companyUsers: PrismaCompanyUser[];
}

export interface JwtDecoded {
  sub?: string;
  email?: string;
  companyId?: string;
  iat?: number;
  exp?: number;
}
