// ============================================================================
// 🏢 COMPANY TYPES
// ============================================================================

// Base Company Interface
export interface Company {
  id: string;
  name: string;
  slug: string;
  plan: "FREE" | "BASIC" | "PRO" | "ENTERPRISE";
  isActive: boolean;
  createdAt: string;
  updatedAt: string;
}

// Company with User Counts
export interface CompanyWithCounts extends Company {
  _count: {
    companyUsers: number;
    tickets?: number;
    sessions?: number;
  };
}

// Company User Relationship
export interface CompanyUser {
  id: string;
  companyId: string;
  userId: string;
  roleId: string;
  isActive: boolean;
  createdAt: string;
  user: {
    id: string;
    email: string;
    name: string;
    avatar?: string;
    isFirstLogin: boolean;
  };
  role: {
    id: string;
    name: string;
    description?: string;
  };
}

// Company with Users
export interface CompanyWithUsers extends Company {
  companyUsers: CompanyUser[];
}

// ============================================================================
// 📝 REQUEST TYPES
// ============================================================================

// Create Company Request
export interface CreateCompanyRequest {
  name: string;
  slug?: string;
  plan?: "FREE" | "BASIC" | "PRO" | "ENTERPRISE";
}

// Update Company Request
export interface UpdateCompanyRequest {
  name?: string;
  slug?: string;
  plan?: "FREE" | "BASIC" | "PRO" | "ENTERPRISE";
  isActive?: boolean;
}

// Add User to Company Request
export interface AddUserToCompanyRequest {
  userId: string;
  roleId: string;
}

// Create Company User Request
export interface CreateCompanyUserRequest {
  email: string;
  name: string;
  roleId: string;
  sendWelcomeEmail?: boolean;
}

// Update Company User Request
export interface UpdateCompanyUserRequest {
  name?: string;
  roleId?: string;
  isActive?: boolean;
}

// ============================================================================
// 📤 RESPONSE TYPES
// ============================================================================

// Get Company Response
export interface GetCompanyResponse extends CompanyWithUsers {}

// Get Companies Response
export interface GetCompaniesResponse {
  companies: CompanyWithCounts[];
  total: number;
  page: number;
  limit: number;
}

// Create Company Response
export interface CreateCompanyResponse extends Company {}

// Update Company Response
export interface UpdateCompanyResponse extends Company {}

// Get Company Users Response
export interface GetCompanyUsersResponse {
  users: CompanyUser[];
  total: number;
}

// Create Company User Response
export interface CreateCompanyUserResponse {
  user: {
    id: string;
    email: string;
    name: string;
    isFirstLogin: boolean;
  };
  tempPassword: string;
  message: string;
}

// Update Company User Response
export interface UpdateCompanyUserResponse {
  user: CompanyUser;
  message: string;
}

// Add User Response
export interface AddUserResponse {
  message: string;
  companyUser: CompanyUser;
}

// Remove User Response
export interface RemoveUserResponse {
  message: string;
}

// Get User Companies Response
export interface GetUserCompaniesResponse {
  companies: Array<{
    company: Company;
    role: {
      id: string;
      name: string;
    };
  }>;
}

// ============================================================================
// 🔧 UTILITY TYPES
// ============================================================================

// Company Query Parameters
export interface CompanyQueryParams {
  page?: number;
  limit?: number;
  search?: string;
  plan?: "FREE" | "BASIC" | "PRO" | "ENTERPRISE";
  isActive?: boolean;
}

// Company User Query Parameters
export interface CompanyUserQueryParams {
  page?: number;
  limit?: number;
  search?: string;
  roleId?: string;
  isActive?: boolean;
}
