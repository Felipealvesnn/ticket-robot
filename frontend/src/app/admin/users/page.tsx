"use client";

import api from "@/services/api";
import { useAuthStore } from "@/store/auth";
import {
  PencilIcon,
  PlusIcon,
  TrashIcon,
  UsersIcon,
} from "@heroicons/react/24/outline";
import { useRouter } from "next/navigation";
import { useEffect, useState } from "react";
import { ErrorMessage, LoadingSpinner } from "../components";
import { CreateUserModal, EditUserModal } from "./components";
import { AdminUser, Company, Role } from "./types";

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
  const [showCreateModal, setShowCreateModal] = useState(false);

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
      // Mapear para extrair apenas os dados da empresa com campos necessários
      setCompanies(
        response.companies.map((item) => ({
          id: item.company.id,
          name: item.company.name,
          slug: item.company.slug,
          plan: item.company.plan || "FREE",
          isActive: item.company.isActive,
          createdAt: item.company.createdAt,
        }))
      );
    } catch (error) {
      console.error("Erro ao carregar empresas:", error);
    }
  };

  const loadRoles = async () => {
    try {
      const response = await api.roles.getRoles();
      // Adaptar resposta para nosso tipo
      setRoles(
        response.map((role) => ({
          id: role.id,
          name: role.name,
          description: role.description,
          permissions: [],
        }))
      );
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

  const handleCreateUser = async (userData: {
    email: string;
    name: string;
    password?: string;
  }) => {
    try {
      await api.adminUsers.createGlobalUser(userData);
      await loadUsers(); // Recarregar lista
      setShowCreateModal(false);
    } catch (error) {
      alert("Erro ao criar usuário");
      console.error("Erro ao criar usuário:", error);
    }
  };

  if (loading) {
    return <LoadingSpinner message="Carregando usuários..." />;
  }

  if (error) {
    return <ErrorMessage message={error} onRetry={loadUsers} />;
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
            <button
              onClick={() => setShowCreateModal(true)}
              className="bg-blue-600 text-white px-4 py-2 rounded-lg hover:bg-blue-700 transition-colors flex items-center"
            >
              <PlusIcon className="w-5 h-5 mr-2" />
              Novo Usuário Global
            </button>
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

      {/* Modal de Criação */}
      {showCreateModal && (
        <CreateUserModal
          onSave={handleCreateUser}
          onClose={() => setShowCreateModal(false)}
        />
      )}
    </div>
  );
}

// Componente do Modal de Criação
