// Interfaces para gestão de empresas administrativas

export interface AdminCompany {
  id: string;
  name: string;
  slug: string;
  plan: string;
  isActive: boolean;
  createdAt: string;
  _count?: {
    users: number;
    tickets: number;
    sessions: number;
  };
}

export interface CreateCompanyWithUserData {
  companyName: string;
  companySlug: string;
  companyPlan?: string;
  userName: string;
  userEmail: string;
  userPassword: string;
}

export interface UpdateCompanyData {
  name?: string;
  slug?: string;
  plan?: string;
  isActive?: boolean;
}

export interface CompanyStats {
  totalUsers: number;
  totalTickets: number;
  activeSessions: number;
  totalContacts: number;
}

export interface CompanyDetails extends AdminCompany {
  users: Array<{
    id: string;
    email: string;
    name: string;
    isActive: boolean;
    role: {
      id: string;
      name: string;
    };
    createdAt: string;
  }>;
  stats: CompanyStats;
}
