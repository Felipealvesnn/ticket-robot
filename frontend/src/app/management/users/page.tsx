"use client";

import { useAuthStore } from "@/store/auth";
import { useManagementUsersStore } from "@/store/management-users";
import * as Types from "@/types";
import {
  ExclamationTriangleIcon,
  PencilIcon,
  PlusIcon,
  TrashIcon,
  UsersIcon,
} from "@heroicons/react/24/outline";
import { useRouter } from "next/navigation";
import { useEffect, useState } from "react";
import { confirmAlert } from "react-confirm-alert";

export default function ManagementUsersPage() {
  const { user } = useAuthStore();
  const router = useRouter();

  // Store state
  const {
    users,
    usersLoading,
    usersError,
    roles,
    rolesLoading,
    currentCompanyId,
    loadUsers,
    loadRoles,
    createUser,
    updateUser,
    deleteUser,
    setCurrentCompanyId,
    reset,
  } = useManagementUsersStore();

  // Local state
  const [showCreateModal, setShowCreateModal] = useState(false);
  const [editingUser, setEditingUser] = useState<Types.CompanyUser | null>(
    null
  );

  // Form states
  const [createForm, setCreateForm] = useState({
    email: "",
    name: "",
    roleId: "",
  });

  const [editForm, setEditForm] = useState({
    name: "",
    roleId: "",
    isActive: true,
  });

  // Verificar se tem permissão para gerenciar usuários
  useEffect(() => {
    if (!user) return;

    const hasPermission =
      user.currentCompany?.role?.name === "COMPANY_OWNER" ||
      user.currentCompany?.role?.name === "COMPANY_ADMIN" ||
      user.currentCompany?.role?.name === "SUPER_ADMIN";

    if (!hasPermission) {
      router.push("/");
      return;
    }

    const companyId = user.currentCompany?.id;
    if (companyId) {
      setCurrentCompanyId(companyId);
      loadUsers(companyId);
    }

    loadRoles();

    // Cleanup ao desmontar
    return () => {
      reset();
    };
  }, [user, router, loadUsers, loadRoles, setCurrentCompanyId, reset]);

  const handleCreateUser = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!currentCompanyId) return;

    try {
      await createUser(currentCompanyId, {
        ...createForm,
        sendWelcomeEmail: true,
      });

      setShowCreateModal(false);
      setCreateForm({ email: "", name: "", roleId: "" });
    } catch (error) {
      console.error("Erro ao criar usuário:", error);
    }
  };

  const handleUpdateUser = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!editingUser || !currentCompanyId) return;

    try {
      await updateUser(currentCompanyId, editingUser.userId, editForm);

      setEditingUser(null);
      setEditForm({ name: "", roleId: "", isActive: true });
    } catch (error) {
      console.error("Erro ao atualizar usuário:", error);
    }
  };

  const handleDeleteUser = async (userId: string, userName: string) => {
    if (!currentCompanyId) return;

    confirmAlert({
      customUI: ({ onClose }) => (
        <div className="bg-white rounded-lg shadow-xl p-6 max-w-md mx-auto">
          <div className="flex items-center space-x-4 mb-4">
            <ExclamationTriangleIcon className="w-12 h-12 text-red-500" />
            <div>
              <h3 className="text-lg font-semibold text-gray-900">
                Remover Usuário
              </h3>
            </div>
          </div>
          <p className="text-gray-600 mb-6">
            Tem certeza que deseja remover o usuário <strong>{userName}</strong>
            ? Esta ação não pode ser desfeita.
          </p>
          <div className="flex space-x-3 justify-end">
            <button
              onClick={onClose}
              className="px-4 py-2 bg-gray-200 text-gray-800 rounded-lg hover:bg-gray-300"
            >
              Cancelar
            </button>
            <button
              onClick={async () => {
                try {
                  await deleteUser(currentCompanyId, userId);
                  onClose();
                } catch (error) {
                  console.error("Erro ao remover usuário:", error);
                  onClose();
                }
              }}
              className="px-4 py-2 bg-red-600 text-white rounded-lg hover:bg-red-700"
            >
              Remover
            </button>
          </div>
        </div>
      ),
    });
  };

  const startEditUser = (user: Types.CompanyUser) => {
    setEditingUser(user);
    setEditForm({
      name: user.user.name,
      roleId: user.roleId,
      isActive: user.isActive,
    });
  };

  const getRoleBadgeColor = (roleName: string) => {
    switch (roleName) {
      case "COMPANY_OWNER":
        return "bg-purple-100 text-purple-800";
      case "COMPANY_ADMIN":
        return "bg-blue-100 text-blue-800";
      case "MANAGER":
        return "bg-green-100 text-green-800";
      default:
        return "bg-gray-100 text-gray-800";
    }
  };

  const getRoleDisplayName = (roleName: string) => {
    const role = roles.find((r) => r.name === roleName);
    return role?.description || roleName;
  };

  if (usersLoading) {
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

  if (usersError) {
    return (
      <div className="p-8">
        <div className="max-w-6xl mx-auto">
          <div className="bg-red-50 border border-red-200 rounded-lg p-4">
            <p className="text-red-800">{usersError}</p>
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
                Gestão de Usuários
              </h1>
              <p className="text-gray-600 mt-2">
                Gerencie os usuários da sua empresa
              </p>
            </div>
            <button
              onClick={() => setShowCreateModal(true)}
              className="bg-blue-600 text-white px-4 py-2 rounded-lg hover:bg-blue-700 transition-colors flex items-center"
            >
              <PlusIcon className="w-5 h-5 mr-2" />
              Novo Usuário
            </button>
          </div>
        </div>

        {/* Lista de Usuários */}
        <div className="bg-white rounded-lg shadow">
          <div className="p-6">
            <h2 className="text-lg font-semibold text-gray-900 mb-4">
              Usuários da Empresa ({users.length})
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
                        Cargo
                      </th>
                      <th className="text-left py-3 px-4 font-medium text-gray-900">
                        Status
                      </th>
                      <th className="text-left py-3 px-4 font-medium text-gray-900">
                        Adicionado em
                      </th>
                      <th className="text-right py-3 px-4 font-medium text-gray-900">
                        Ações
                      </th>
                    </tr>
                  </thead>
                  <tbody>
                    {users.map((companyUser) => (
                      <tr
                        key={companyUser.id}
                        className="border-b hover:bg-gray-50"
                      >
                        <td className="py-3 px-4">
                          <div className="flex items-center">
                            <div className="w-10 h-10 bg-blue-100 rounded-full flex items-center justify-center mr-3">
                              <span className="text-blue-600 font-medium text-sm">
                                {companyUser.user.name.charAt(0).toUpperCase()}
                              </span>
                            </div>
                            <div>
                              <p className="font-medium text-gray-900">
                                {companyUser.user.name}
                              </p>
                              <p className="text-sm text-gray-500">
                                {companyUser.user.email}
                              </p>
                            </div>
                          </div>
                        </td>
                        <td className="py-3 px-4">
                          <span
                            className={`inline-flex px-2 py-1 rounded-full text-xs font-medium ${getRoleBadgeColor(
                              companyUser.role.name
                            )}`}
                          >
                            {getRoleDisplayName(companyUser.role.name)}
                          </span>
                        </td>
                        <td className="py-3 px-4">
                          <span
                            className={`inline-flex px-2 py-1 rounded-full text-xs font-medium ${
                              companyUser.isActive
                                ? "bg-green-100 text-green-800"
                                : "bg-red-100 text-red-800"
                            }`}
                          >
                            {companyUser.isActive ? "Ativo" : "Inativo"}
                          </span>
                        </td>
                        <td className="py-3 px-4 text-sm text-gray-500">
                          {new Date(companyUser.createdAt).toLocaleDateString()}
                        </td>
                        <td className="py-3 px-4">
                          <div className="flex items-center justify-end space-x-2">
                            <button
                              onClick={() => startEditUser(companyUser)}
                              className="p-2 text-blue-600 hover:bg-blue-50 rounded-lg transition-colors"
                              title="Editar usuário"
                            >
                              <PencilIcon className="w-4 h-4" />
                            </button>
                            <button
                              onClick={() =>
                                handleDeleteUser(
                                  companyUser.userId,
                                  companyUser.user.name
                                )
                              }
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

        {/* Modal Criar Usuário */}
        {showCreateModal && (
          <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
            <div className="bg-white rounded-lg p-6 w-full max-w-md">
              <h3 className="text-lg font-semibold text-gray-900 mb-4">
                Criar Novo Usuário
              </h3>
              <form onSubmit={handleCreateUser}>
                <div className="space-y-4">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                      Nome
                    </label>
                    <input
                      type="text"
                      value={createForm.name}
                      onChange={(e) =>
                        setCreateForm({ ...createForm, name: e.target.value })
                      }
                      className="w-full border border-gray-300 rounded-lg px-3 py-2 focus:outline-none focus:ring-2 focus:ring-blue-500"
                      required
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                      Email
                    </label>
                    <input
                      type="email"
                      value={createForm.email}
                      onChange={(e) =>
                        setCreateForm({ ...createForm, email: e.target.value })
                      }
                      className="w-full border border-gray-300 rounded-lg px-3 py-2 focus:outline-none focus:ring-2 focus:ring-blue-500"
                      required
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                      Cargo
                    </label>
                    <select
                      value={createForm.roleId}
                      onChange={(e) =>
                        setCreateForm({ ...createForm, roleId: e.target.value })
                      }
                      className="w-full border border-gray-300 rounded-lg px-3 py-2 focus:outline-none focus:ring-2 focus:ring-blue-500"
                      required
                      disabled={rolesLoading}
                    >
                      <option value="">
                        {rolesLoading ? "Carregando..." : "Selecione um cargo"}
                      </option>
                      {roles
                        .filter(
                          (role) =>
                            !["SUPER_ADMIN", "COMPANY_OWNER"].includes(
                              role.name
                            )
                        )
                        .map((role) => (
                          <option key={role.id} value={role.id}>
                            {role.description || role.name}
                          </option>
                        ))}
                    </select>
                  </div>
                </div>
                <div className="flex justify-end space-x-3 mt-6">
                  <button
                    type="button"
                    onClick={() => setShowCreateModal(false)}
                    className="px-4 py-2 text-gray-700 border border-gray-300 rounded-lg hover:bg-gray-50 transition-colors"
                  >
                    Cancelar
                  </button>
                  <button
                    type="submit"
                    className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors"
                  >
                    Criar Usuário
                  </button>
                </div>
              </form>
            </div>
          </div>
        )}

        {/* Modal Editar Usuário */}
        {editingUser && (
          <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
            <div className="bg-white rounded-lg p-6 w-full max-w-md">
              <h3 className="text-lg font-semibold text-gray-900 mb-4">
                Editar Usuário
              </h3>
              <form onSubmit={handleUpdateUser}>
                <div className="space-y-4">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                      Nome
                    </label>
                    <input
                      type="text"
                      value={editForm.name}
                      onChange={(e) =>
                        setEditForm({ ...editForm, name: e.target.value })
                      }
                      className="w-full border border-gray-300 rounded-lg px-3 py-2 focus:outline-none focus:ring-2 focus:ring-blue-500"
                      required
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                      Status
                    </label>
                    <select
                      value={editForm.isActive ? "true" : "false"}
                      onChange={(e) =>
                        setEditForm({
                          ...editForm,
                          isActive: e.target.value === "true",
                        })
                      }
                      className="w-full border border-gray-300 rounded-lg px-3 py-2 focus:outline-none focus:ring-2 focus:ring-blue-500"
                    >
                      <option value="true">Ativo</option>
                      <option value="false">Inativo</option>
                    </select>
                  </div>
                </div>
                <div className="flex justify-end space-x-3 mt-6">
                  <button
                    type="button"
                    onClick={() => setEditingUser(null)}
                    className="px-4 py-2 text-gray-700 border border-gray-300 rounded-lg hover:bg-gray-50 transition-colors"
                  >
                    Cancelar
                  </button>
                  <button
                    type="submit"
                    className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors"
                  >
                    Salvar Alterações
                  </button>
                </div>
              </form>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
