"use client";

import api from "@/services/api";
import {
  AdminUser,
  Company,
  Role,
  UserCompany,
} from "@/shared/interfaces/admin.interface";
import { useAuthStore } from "@/store/auth";
import {
  PencilIcon,
  PlusIcon,
  TrashIcon,
  UsersIcon,
  XMarkIcon,
} from "@heroicons/react/24/outline";
import { useRouter } from "next/navigation";
import { useEffect, useState } from "react";

export default function AdminUsersPage() {
  const { user } = useAuthStore();
  const router = useRouter();
  const [users, setUsers] = useState<AdminUser[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [editingUser, setEditingUser] = useState<AdminUser | null>(null);
  const [companies, setCompanies] = useState<Company[]>([]);
  const [roles, setRoles] = useState<Role[]>([]);
  const [showEditModal, setShowEditModal] = useState(false);

  // Verificar se é super admin
  useEffect(() => {
    if (!user) return;

    const isSuperAdmin = user.currentCompany?.role?.name === "SUPER_ADMIN";
    if (!isSuperAdmin) {
      router.push("/");
      return;
    }

    loadUsers();
    loadCompanies();
    loadRoles();
  }, [user, router]);

  const loadUsers = async () => {
    try {
      setLoading(true);
      const response = await api.adminUsers.getAllUsers({
        page: 1,
        limit: 50, // Carregar mais usuários por padrão
      });
      setUsers(response.users);
    } catch (error) {
      setError("Erro ao carregar usuários");
      console.error("Erro ao carregar usuários:", error);
    } finally {
      setLoading(false);
    }
  };

  const loadCompanies = async () => {
    try {
      const response = await api.company.getMyCompanies();
      // Mapear para extrair apenas os dados da empresa
      setCompanies(response.companies.map((item) => item.company));
    } catch (error) {
      console.error("Erro ao carregar empresas:", error);
    }
  };

  const loadRoles = async () => {
    try {
      const response = await api.roles.getRoles();
      setRoles(response);
    } catch (error) {
      console.error("Erro ao carregar roles:", error);
    }
  };

  const handleEditUser = (user: AdminUser) => {
    setEditingUser(user);
    setShowEditModal(true);
  };

  const handleDeleteUser = async (userId: string) => {
    if (!confirm("Tem certeza que deseja remover este usuário?")) {
      return;
    }

    try {
      await api.adminUsers.deleteGlobalUser(userId);
      setUsers(users.filter((u) => u.id !== userId));
    } catch (error) {
      alert("Erro ao remover usuário");
      console.error("Erro ao remover usuário:", error);
    }
  };

  const handleSaveUser = async (userData: {
    name: string;
    isActive: boolean;
    addCompanies: Array<{ companyId: string; roleId: string }>;
    removeCompanies: string[];
    updateRoles: Array<{ companyId: string; roleId: string }>;
  }) => {
    if (!editingUser) return;

    try {
      // Atualizar dados básicos do usuário
      await api.adminUsers.updateGlobalUser(editingUser.id, {
        name: userData.name,
        isActive: userData.isActive,
      });

      // Gerenciar empresas se houver mudanças
      if (
        userData.addCompanies.length > 0 ||
        userData.removeCompanies.length > 0 ||
        userData.updateRoles.length > 0
      ) {
        await api.adminUsers.manageUserCompanies(editingUser.id, {
          addCompanies: userData.addCompanies,
          removeCompanies: userData.removeCompanies,
          updateRoles: userData.updateRoles,
        });
      }

      // Recarregar lista de usuários
      await loadUsers();

      setShowEditModal(false);
      setEditingUser(null);
    } catch (error) {
      alert("Erro ao salvar usuário");
      console.error("Erro ao salvar usuário:", error);
    }
  };

  if (loading) {
    return (
      <div className="p-8">
        <div className="max-w-6xl mx-auto">
          <div className="animate-pulse">
            <div className="h-8 bg-gray-200 rounded mb-4"></div>
            <div className="h-64 bg-gray-200 rounded"></div>
          </div>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="p-8">
        <div className="max-w-6xl mx-auto">
          <div className="bg-red-50 border border-red-200 rounded-lg p-4">
            <p className="text-red-800">{error}</p>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="p-8">
      <div className="max-w-6xl mx-auto">
        {/* Header */}
        <div className="mb-8">
          <div className="flex items-center justify-between">
            <div>
              <h1 className="text-3xl font-bold text-gray-900 flex items-center">
                <UsersIcon className="w-8 h-8 mr-3 text-blue-600" />
                Administração de Usuários
              </h1>
              <p className="text-gray-600 mt-2">
                Gerencie todos os usuários do sistema
              </p>
            </div>
            <button className="bg-blue-600 text-white px-4 py-2 rounded-lg hover:bg-blue-700 transition-colors flex items-center">
              <PlusIcon className="w-5 h-5 mr-2" />
              Novo Usuário Global
            </button>
          </div>
        </div>

        {/* Estatísticas */}
        <div className="grid grid-cols-1 md:grid-cols-4 gap-6 mb-8">
          <div className="bg-white rounded-lg shadow p-6">
            <div className="flex items-center">
              <div className="w-12 h-12 bg-blue-100 rounded-lg flex items-center justify-center">
                <UsersIcon className="w-6 h-6 text-blue-600" />
              </div>
              <div className="ml-4">
                <p className="text-sm font-medium text-gray-500">
                  Total de Usuários
                </p>
                <p className="text-2xl font-semibold text-gray-900">
                  {users.length}
                </p>
              </div>
            </div>
          </div>

          <div className="bg-white rounded-lg shadow p-6">
            <div className="flex items-center">
              <div className="w-12 h-12 bg-green-100 rounded-lg flex items-center justify-center">
                <UsersIcon className="w-6 h-6 text-green-600" />
              </div>
              <div className="ml-4">
                <p className="text-sm font-medium text-gray-500">
                  Usuários Ativos
                </p>
                <p className="text-2xl font-semibold text-gray-900">
                  {users.filter((u) => u.isActive).length}
                </p>
              </div>
            </div>
          </div>

          <div className="bg-white rounded-lg shadow p-6">
            <div className="flex items-center">
              <div className="w-12 h-12 bg-yellow-100 rounded-lg flex items-center justify-center">
                <UsersIcon className="w-6 h-6 text-yellow-600" />
              </div>
              <div className="ml-4">
                <p className="text-sm font-medium text-gray-500">
                  Primeiro Login
                </p>
                <p className="text-2xl font-semibold text-gray-900">
                  {users.filter((u) => u.isFirstLogin).length}
                </p>
              </div>
            </div>
          </div>

          <div className="bg-white rounded-lg shadow p-6">
            <div className="flex items-center">
              <div className="w-12 h-12 bg-purple-100 rounded-lg flex items-center justify-center">
                <UsersIcon className="w-6 h-6 text-purple-600" />
              </div>
              <div className="ml-4">
                <p className="text-sm font-medium text-gray-500">
                  Super Admins
                </p>
                <p className="text-2xl font-semibold text-gray-900">
                  {
                    users.filter((u: AdminUser) =>
                      u.companies.some(
                        (c: any) => c.role.name === "SUPER_ADMIN"
                      )
                    ).length
                  }
                </p>
              </div>
            </div>
          </div>
        </div>

        {/* Lista de Usuários */}
        <div className="bg-white rounded-lg shadow">
          <div className="p-6">
            <h2 className="text-lg font-semibold text-gray-900 mb-4">
              Todos os Usuários ({users.length})
            </h2>

            {users.length === 0 ? (
              <div className="text-center py-8">
                <UsersIcon className="w-12 h-12 text-gray-400 mx-auto mb-4" />
                <p className="text-gray-500">Nenhum usuário encontrado</p>
              </div>
            ) : (
              <div className="overflow-x-auto">
                <table className="w-full">
                  <thead>
                    <tr className="border-b">
                      <th className="text-left py-3 px-4 font-medium text-gray-900">
                        Usuário
                      </th>
                      <th className="text-left py-3 px-4 font-medium text-gray-900">
                        Empresas
                      </th>
                      <th className="text-left py-3 px-4 font-medium text-gray-900">
                        Status
                      </th>
                      <th className="text-left py-3 px-4 font-medium text-gray-900">
                        Primeiro Login
                      </th>
                      <th className="text-left py-3 px-4 font-medium text-gray-900">
                        Criado em
                      </th>
                      <th className="text-right py-3 px-4 font-medium text-gray-900">
                        Ações
                      </th>
                    </tr>
                  </thead>
                  <tbody>
                    {users.map((user) => (
                      <tr key={user.id} className="border-b hover:bg-gray-50">
                        <td className="py-3 px-4">
                          <div className="flex items-center">
                            <div className="w-10 h-10 bg-blue-100 rounded-full flex items-center justify-center mr-3">
                              <span className="text-blue-600 font-medium text-sm">
                                {user.name.charAt(0).toUpperCase()}
                              </span>
                            </div>
                            <div>
                              <p className="font-medium text-gray-900">
                                {user.name}
                              </p>
                              <p className="text-sm text-gray-500">
                                {user.email}
                              </p>
                            </div>
                          </div>
                        </td>
                        <td className="py-3 px-4">
                          <div className="space-y-1">
                            {user.companies.map(
                              (company: any, index: number) => (
                                <div
                                  key={index}
                                  className="flex items-center space-x-2"
                                >
                                  <span className="text-sm text-gray-900">
                                    {company.company.name}
                                  </span>
                                  <span className="inline-flex px-2 py-1 rounded-full text-xs font-medium bg-blue-100 text-blue-800">
                                    {company.role.name}
                                  </span>
                                </div>
                              )
                            )}
                            {user.companies.length === 0 && (
                              <span className="text-sm text-gray-500">
                                Sem empresas
                              </span>
                            )}
                          </div>
                        </td>
                        <td className="py-3 px-4">
                          <span
                            className={`inline-flex px-2 py-1 rounded-full text-xs font-medium ${
                              user.isActive
                                ? "bg-green-100 text-green-800"
                                : "bg-red-100 text-red-800"
                            }`}
                          >
                            {user.isActive ? "Ativo" : "Inativo"}
                          </span>
                        </td>
                        <td className="py-3 px-4">
                          <span
                            className={`inline-flex px-2 py-1 rounded-full text-xs font-medium ${
                              user.isFirstLogin
                                ? "bg-yellow-100 text-yellow-800"
                                : "bg-green-100 text-green-800"
                            }`}
                          >
                            {user.isFirstLogin ? "Pendente" : "Concluído"}
                          </span>
                        </td>
                        <td className="py-3 px-4 text-sm text-gray-500">
                          {new Date(user.createdAt).toLocaleDateString()}
                        </td>
                        <td className="py-3 px-4">
                          <div className="flex items-center justify-end space-x-2">
                            <button
                              onClick={() => handleEditUser(user)}
                              className="p-2 text-blue-600 hover:bg-blue-50 rounded-lg transition-colors"
                              title="Editar usuário"
                            >
                              <PencilIcon className="w-4 h-4" />
                            </button>
                            <button
                              onClick={() => handleDeleteUser(user.id)}
                              className="p-2 text-red-600 hover:bg-red-50 rounded-lg transition-colors"
                              title="Remover usuário"
                            >
                              <TrashIcon className="w-4 h-4" />
                            </button>
                          </div>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}
          </div>
        </div>
      </div>

      {/* Modal de Edição */}
      {showEditModal && editingUser && (
        <EditUserModal
          user={editingUser}
          companies={companies}
          roles={roles}
          onSave={handleSaveUser}
          onClose={() => {
            setShowEditModal(false);
            setEditingUser(null);
          }}
        />
      )}
    </div>
  );
}

// Componente do Modal de Edição
function EditUserModal({
  user,
  companies,
  roles,
  onSave,
  onClose,
}: {
  user: AdminUser;
  companies: Company[];
  roles: Role[];
  onSave: (data: {
    name: string;
    isActive: boolean;
    addCompanies: Array<{ companyId: string; roleId: string }>;
    removeCompanies: string[];
    updateRoles: Array<{ companyId: string; roleId: string }>;
  }) => void;
  onClose: () => void;
}) {
  const [name, setName] = useState(user.name);
  const [isActive, setIsActive] = useState(user.isActive);
  const [userCompanies, setUserCompanies] = useState<UserCompany[]>(
    user.companies.map((uc: any) => ({
      companyId: uc.company.id,
      roleId: uc.role.id,
      originalCompanyId: uc.company.id,
      originalRoleId: uc.role.id,
    }))
  );

  const handleAddCompany = () => {
    setUserCompanies([
      ...userCompanies,
      {
        companyId: companies[0]?.id || "",
        roleId: roles[0]?.id || "",
        originalCompanyId: "",
        originalRoleId: "",
      },
    ]);
  };

  const handleRemoveCompany = (index: number) => {
    setUserCompanies(
      userCompanies.filter((_: UserCompany, i: number) => i !== index)
    );
  };

  const handleCompanyChange = (index: number, field: string, value: string) => {
    const updated = [...userCompanies];
    updated[index] = { ...updated[index], [field]: value };
    setUserCompanies(updated);
  };

  const handleSave = () => {
    // Calcular mudanças
    const original = user.companies.map((uc: any) => ({
      companyId: uc.company.id,
      roleId: uc.role.id,
    }));

    const current = userCompanies.map((uc: UserCompany) => ({
      companyId: uc.companyId,
      roleId: uc.roleId,
    }));

    // Empresas a adicionar (novas)
    const addCompanies = userCompanies
      .filter((uc: UserCompany) => !uc.originalCompanyId)
      .map((uc: UserCompany) => ({
        companyId: uc.companyId,
        roleId: uc.roleId,
      }));

    // Empresas a remover (removidas)
    const removeCompanies = original
      .filter(
        (orig: any) =>
          !current.some((curr: any) => curr.companyId === orig.companyId)
      )
      .map((orig: any) => orig.companyId);

    // Roles a atualizar (mudaram)
    const updateRoles = userCompanies
      .filter(
        (uc: UserCompany) =>
          uc.originalCompanyId && uc.originalRoleId !== uc.roleId
      )
      .map((uc: UserCompany) => ({
        companyId: uc.companyId,
        roleId: uc.roleId,
      }));

    onSave({
      name,
      isActive,
      addCompanies,
      removeCompanies,
      updateRoles,
    });
  };

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
      <div className="bg-white rounded-lg shadow-xl w-full max-w-2xl max-h-[90vh] overflow-y-auto">
        {/* Header */}
        <div className="p-6 border-b">
          <div className="flex items-center justify-between">
            <h2 className="text-xl font-semibold text-gray-900">
              Editar Usuário: {user.name}
            </h2>
            <button
              onClick={onClose}
              className="p-2 text-gray-400 hover:text-gray-600 rounded-lg hover:bg-gray-100"
            >
              <XMarkIcon className="w-5 h-5" />
            </button>
          </div>
        </div>

        {/* Body */}
        <div className="p-6 space-y-6">
          {/* Informações Básicas */}
          <div>
            <h3 className="text-lg font-medium text-gray-900 mb-4">
              Informações Básicas
            </h3>
            <div className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Email
                </label>
                <input
                  type="email"
                  value={user.email}
                  disabled
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg bg-gray-50 text-gray-500"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Nome
                </label>
                <input
                  type="text"
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                />
              </div>

              <div className="flex items-center">
                <input
                  type="checkbox"
                  id="isActive"
                  checked={isActive}
                  onChange={(e) => setIsActive(e.target.checked)}
                  className="h-4 w-4 text-blue-600 focus:ring-blue-500 border-gray-300 rounded"
                />
                <label
                  htmlFor="isActive"
                  className="ml-2 text-sm text-gray-700"
                >
                  Usuário ativo
                </label>
              </div>
            </div>
          </div>

          {/* Empresas e Roles */}
          <div>
            <div className="flex items-center justify-between mb-4">
              <h3 className="text-lg font-medium text-gray-900">
                Empresas e Permissões
              </h3>
              <button
                onClick={handleAddCompany}
                className="px-3 py-1 bg-blue-600 text-white rounded-lg text-sm hover:bg-blue-700"
              >
                Adicionar Empresa
              </button>
            </div>

            <div className="space-y-3">
              {userCompanies.map((userCompany: UserCompany, index: number) => {
                const company = companies.find(
                  (c: Company) => c.id === userCompany.companyId
                );
                const role = roles.find(
                  (r: Role) => r.id === userCompany.roleId
                );

                return (
                  <div
                    key={index}
                    className="flex items-center space-x-3 p-3 border border-gray-200 rounded-lg"
                  >
                    <div className="flex-1">
                      <select
                        value={userCompany.companyId}
                        onChange={(e) =>
                          handleCompanyChange(
                            index,
                            "companyId",
                            e.target.value
                          )
                        }
                        className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm"
                      >
                        {companies.map((company: Company) => (
                          <option key={company.id} value={company.id}>
                            {company.name}
                          </option>
                        ))}
                      </select>
                    </div>

                    <div className="flex-1">
                      <select
                        value={userCompany.roleId}
                        onChange={(e) =>
                          handleCompanyChange(index, "roleId", e.target.value)
                        }
                        className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm"
                      >
                        {roles.map((role: Role) => (
                          <option key={role.id} value={role.id}>
                            {role.name}
                          </option>
                        ))}
                      </select>
                    </div>

                    <button
                      onClick={() => handleRemoveCompany(index)}
                      className="p-2 text-red-600 hover:bg-red-50 rounded-lg"
                    >
                      <TrashIcon className="w-4 h-4" />
                    </button>
                  </div>
                );
              })}

              {userCompanies.length === 0 && (
                <div className="text-center py-8 text-gray-500">
                  <UsersIcon className="w-12 h-12 mx-auto mb-2 text-gray-400" />
                  <p>Usuário não pertence a nenhuma empresa</p>
                </div>
              )}
            </div>
          </div>
        </div>

        {/* Footer */}
        <div className="p-6 border-t bg-gray-50 flex items-center justify-end space-x-3">
          <button
            onClick={onClose}
            className="px-4 py-2 text-gray-700 bg-white border border-gray-300 rounded-lg hover:bg-gray-50"
          >
            Cancelar
          </button>
          <button
            onClick={handleSave}
            className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700"
          >
            Salvar Alterações
          </button>
        </div>
      </div>
    </div>
  );
}
