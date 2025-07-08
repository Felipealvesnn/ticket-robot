// Re-exportar os tipos da interface compartilhada
export type {
  AdminUser,
  Company,
  Role,
} from "@/shared/interfaces/admin.interface";

export interface UserCompany {
  companyId: string;
  roleId: string;
  originalCompanyId: string;
  originalRoleId: string;
}
