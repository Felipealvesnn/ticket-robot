export interface CreateUserDto {
  email: string;
  name: string;
  roleId?: string;
  password?: string;
}

export interface UpdateUserDto {
  name?: string;
  isActive?: boolean;
  roleId?: string;
  password?: string;
}

export interface AdminUser {
  id: string;
  email: string;
  name: string;
  isActive: boolean;
  isFirstLogin: boolean;
  createdAt: string;
  companies: Array<{
    company: {
      id: string;
      name: string;
      slug: string;
      plan: string;
    };
    role: {
      id: string;
      name: string;
    };
  }>;
}

export interface Company {
  id: string;
  name: string;
  slug: string;
  plan: string;
  isActive: boolean;
  createdAt: string;
}

export interface Role {
  id: string;
  name: string;
  description?: string;
}

export interface ManageUserCompaniesDto {
  addCompanies?: Array<{ companyId: string; roleId: string }>;
  removeCompanies?: string[];
  updateRoles?: Array<{ companyId: string; roleId: string }>;
}

export interface PaginationResult {
  total: number;
  page: number;
  limit: number;
  totalPages: number;
}

export interface GetAllUsersResponse {
  users: AdminUser[];
  pagination: PaginationResult;
}

export interface CreateGlobalUserResponse {
  user: {
    id: string;
    email: string;
    name: string;
    isActive: boolean;
    isFirstLogin: boolean;
    createdAt: string;
  };
  generatedPassword?: string;
  message: string;
}

export interface UpdateGlobalUserResponse {
  user: {
    id: string;
    email: string;
    name: string;
    isActive: boolean;
    isFirstLogin: boolean;
    createdAt: string;
    updatedAt: string;
  };
  message: string;
}

export interface ManageUserCompaniesResponse {
  results: {
    added: Array<{
      company: { id: string; name: string };
      role: { id: string; name: string };
    }>;
    removed: Array<{ company: { id: string; name: string } }>;
    updated: Array<{
      company: { id: string; name: string };
      oldRole: { id: string; name: string };
      newRole: { id: string; name: string };
    }>;
    errors: string[];
  };
  message: string;
}
