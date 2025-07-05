// Interfaces para roles e permissões

export interface Role {
  id: string;
  name: string;
  description?: string;
  permissions?: string[];
}

export interface CreateRoleData {
  name: string;
  description?: string;
  permissions?: string[];
}

export interface UpdateRoleData {
  name?: string;
  description?: string;
  permissions?: string[];
}
