// ============================================================================
// 👥 USER TYPES
// ============================================================================

export interface User {
  id: string;
  email: string;
  name: string;
  avatar?: string | null;
  phone?: string | null;
  address?: string | null;
  isActive: boolean;
  createdAt: string;
  updatedAt: string;
  currentCompany?: {
    id: string;
    name: string;
    role?: {
      id: string;
      name: string;
    };
  };
}

export interface UpdateProfileRequest {
  name?: string;
  email?: string;
  avatar?: string;
  phone?: string;
  address?: string;
}

export interface UpdateProfileResponse {
  id: string;
  email: string;
  name: string;
  avatar?: string | null;
  phone?: string | null;
  address?: string | null;
  isActive: boolean;
  createdAt: string;
  updatedAt: string;
}

export interface GetProfileResponse {
  id: string;
  email: string;
  name: string;
  avatar?: string | null;
  phone?: string | null;
  address?: string | null;
  isActive: boolean;
  createdAt: string;
  updatedAt: string;
}
