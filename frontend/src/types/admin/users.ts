// Interfaces para gestão de usuários administrativos

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
      slug?: string;
      plan?: string;
    };
    role: {
      id: string;
      name: string;
    };
  }>;
}

export interface UserCompany {
  companyId: string;
  roleId: string;
  originalCompanyId?: string;
  originalRoleId?: string;
}

export interface CreateUserData {
  email: string;
  name: string;
  roleId?: string;
  password?: string;
}

export interface UpdateUserData {
  name?: string;
  isActive?: boolean;
  password?: string;
}

export interface ManageUserCompaniesData {
  addCompanies?: Array<{ companyId: string; roleId: string }>;
  removeCompanies?: string[];
  updateRoles?: Array<{ companyId: string; roleId: string }>;
}

export interface UserManagementResults {
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
}
