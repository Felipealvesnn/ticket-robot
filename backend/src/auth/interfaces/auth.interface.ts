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
