// ============================================================================
// 🔐 AUTH TYPES
// ============================================================================

export interface LoginRequest {
  email: string;
  password: string;
}

export interface RegisterRequest {
  name: string;
  email: string;
  password: string;
}

export interface ChangePasswordRequest {
  currentPassword: string;
  newPassword: string;
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

export interface AuthUser {
  id: string;
  email: string;
  name: string;
  avatar?: string;
  companies: UserCompany[];
  currentCompany?: UserCompany;
}

export interface AuthTokens {
  accessToken: string;
  refreshToken: string;
}

export interface LoginResponse {
  user: AuthUser;
  tokens: AuthTokens;
  isFirstLogin: boolean;
}

export interface RegisterResponse {
  user: {
    id: string;
    email: string;
    name: string;
    isFirstLogin: boolean;
    createdAt: string;
  };
  message: string;
}

export interface VerifyResponse {
  user: AuthUser;
}

export interface ChangePasswordResponse {
  message: string;
}
