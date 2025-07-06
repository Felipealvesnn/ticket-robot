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
  permissions: string[];
}

export interface UserCompany {
  companyId: string;
  roleId: string;
  originalCompanyId: string;
  originalRoleId: string;
}
