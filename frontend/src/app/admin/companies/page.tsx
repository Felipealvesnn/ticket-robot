"use client";

import api from "@/services/api";
import { useAuthStore } from "@/store/auth";
import {
  BuildingOfficeIcon,
  EyeIcon,
  PencilIcon,
  PlusIcon,
  TrashIcon,
  UserGroupIcon,
} from "@heroicons/react/24/outline";
import { useRouter } from "next/navigation";
import { useEffect, useState } from "react";
import { ErrorMessage, LoadingSpinner } from "../components";
import { CreateCompanyModal, EditCompanyModal } from "./components";
import { Company, planColors, planNames } from "./types";

export default function AdminCompaniesPage() {
  const { user } = useAuthStore();
  const router = useRouter();
  const [companies, setCompanies] = useState<Company[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [showCreateModal, setShowCreateModal] = useState(false);
  const [editingCompany, setEditingCompany] = useState<Company | null>(null);

  // Verificar se é super admin e carregar empresas
  useEffect(() => {
    if (!user) return;

    const isSuperAdmin = user.currentCompany?.role?.name === "SUPER_ADMIN";
    if (!isSuperAdmin) {
      router.push("/");
      return;
    }

    loadCompanies();
  }, [user, router]);

  const loadCompanies = async () => {
    try {
      setLoading(true);
      setError(null);
      const response = await api.adminCompanies.getAllCompanies({
        page: 1,
        limit: 100, // Carregar todas de uma vez para simplicidade
      });
      setCompanies(response.companies as Company[]);
    } catch (error) {
      console.error("Erro ao carregar empresas:", error);
      setError("Erro ao carregar empresas");
    } finally {
      setLoading(false);
    }
  };

  const handleCreateCompany = () => {
    setShowCreateModal(true);
  };

  const handleEditCompany = (companyId: string) => {
    const company = companies.find((c) => c.id === companyId);
    if (company) {
      setEditingCompany(company);
    }
  };

  const handleViewUsers = (companyId: string) => {
    router.push(`/admin/companies/${companyId}/users`);
  };

  const handleToggleStatus = async (companyId: string) => {
    try {
      await api.adminCompanies.toggleCompanyStatus(companyId);
      await loadCompanies(); // Recarregar lista
    } catch (error) {
      console.error("Erro ao alterar status da empresa:", error);
      alert("Erro ao alterar status da empresa");
    }
  };

  const handleDeleteCompany = async (companyId: string) => {
    if (confirm("Tem certeza que deseja excluir esta empresa?")) {
      // Implementar API call
      setCompanies((prev) =>
        prev.filter((company) => company.id !== companyId)
      );
    }
  };

  const handleSaveCompany = async (companyData: {
    name: string;
    slug: string;
    plan: string;
    userEmail: string;
    userName: string;
    userPassword: string;
  }) => {
    try {
      await api.adminCompanies.createCompanyWithOwner({
        companyName: companyData.name,
        companySlug: companyData.slug,
        plan: companyData.plan,
        userEmail: companyData.userEmail,
        userName: companyData.userName,
        userPassword: companyData.userPassword,
      });
      await loadCompanies(); // Recarregar lista
      setShowCreateModal(false);
    } catch (error) {
      console.error("Erro ao criar empresa:", error);
      alert("Erro ao criar empresa");
    }
  };

  const handleUpdateCompany = async (companyData: {
    name: string;
    slug: string;
    plan: string;
  }) => {
    if (!editingCompany) return;

    try {
      await api.adminCompanies.updateCompany(editingCompany.id, companyData);
      await loadCompanies(); // Recarregar lista
      setEditingCompany(null);
    } catch (error) {
      console.error("Erro ao atualizar empresa:", error);
      alert("Erro ao atualizar empresa");
    }
  };

  if (loading) {
    return <LoadingSpinner message="Carregando empresas..." />;
  }

  if (error) {
    return <ErrorMessage message={error} onRetry={loadCompanies} />;
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Empresas</h1>
          <p className="text-gray-600">Gerencie todas as empresas do sistema</p>
        </div>
        <button
          onClick={handleCreateCompany}
          className="flex items-center px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors"
        >
          <PlusIcon className="w-5 h-5 mr-2" />
          Nova Empresa
        </button>
      </div>

      {/* Stats Cards */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
        <div className="bg-white p-6 rounded-lg shadow-sm border border-gray-200">
          <div className="flex items-center">
            <BuildingOfficeIcon className="w-8 h-8 text-blue-600" />
            <div className="ml-3">
              <p className="text-sm font-medium text-gray-600">
                Total Empresas
              </p>
              <p className="text-2xl font-bold text-gray-900">
                {companies.length}
              </p>
            </div>
          </div>
        </div>

        <div className="bg-white p-6 rounded-lg shadow-sm border border-gray-200">
          <div className="flex items-center">
            <div className="w-8 h-8 bg-green-100 rounded-lg flex items-center justify-center">
              <div className="w-3 h-3 bg-green-600 rounded-full"></div>
            </div>
            <div className="ml-3">
              <p className="text-sm font-medium text-gray-600">Ativas</p>
              <p className="text-2xl font-bold text-gray-900">
                {companies.filter((c) => c.isActive).length}
              </p>
            </div>
          </div>
        </div>

        <div className="bg-white p-6 rounded-lg shadow-sm border border-gray-200">
          <div className="flex items-center">
            <UserGroupIcon className="w-8 h-8 text-purple-600" />
            <div className="ml-3">
              <p className="text-sm font-medium text-gray-600">
                Total Usuários
              </p>
              <p className="text-2xl font-bold text-gray-900">
                {companies.reduce((acc, c) => acc + c._count.users, 0)}
              </p>
            </div>
          </div>
        </div>

        <div className="bg-white p-6 rounded-lg shadow-sm border border-gray-200">
          <div className="flex items-center">
            <div className="w-8 h-8 bg-yellow-100 rounded-lg flex items-center justify-center">
              <span className="text-yellow-600 font-bold">S</span>
            </div>
            <div className="ml-3">
              <p className="text-sm font-medium text-gray-600">Total Sessões</p>
              <p className="text-2xl font-bold text-gray-900">
                {companies.reduce((acc, c) => acc + c._count.sessions, 0)}
              </p>
            </div>
          </div>
        </div>
      </div>

      {/* Companies Table */}
      <div className="bg-white shadow-sm border border-gray-200 rounded-lg overflow-hidden">
        <div className="px-6 py-4 border-b border-gray-200">
          <h2 className="text-lg font-medium text-gray-900">
            Lista de Empresas
          </h2>
        </div>

        <div className="overflow-x-auto">
          <table className="min-w-full divide-y divide-gray-200">
            <thead className="bg-gray-50">
              <tr>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Empresa
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Plano
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Usuários
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Sessões
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Status
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Ações
                </th>
              </tr>
            </thead>
            <tbody className="bg-white divide-y divide-gray-200">
              {companies.map((company) => (
                <tr key={company.id} className="hover:bg-gray-50">
                  <td className="px-6 py-4 whitespace-nowrap">
                    <div className="flex items-center">
                      <div className="w-10 h-10 bg-blue-100 rounded-lg flex items-center justify-center">
                        <BuildingOfficeIcon className="w-6 h-6 text-blue-600" />
                      </div>
                      <div className="ml-3">
                        <div className="text-sm font-medium text-gray-900">
                          {company.name}
                        </div>
                        <div className="text-sm text-gray-500">
                          @{company.slug}
                        </div>
                      </div>
                    </div>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap">
                    <span
                      className={`inline-flex px-2 py-1 text-xs font-semibold rounded-full ${
                        planColors[company.plan]
                      }`}
                    >
                      {planNames[company.plan]}
                    </span>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                    <span className="font-medium">{company._count.users}</span>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                    <span className="font-medium">
                      {company._count.sessions}
                    </span>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap">
                    <button
                      onClick={() => handleToggleStatus(company.id)}
                      className={`inline-flex px-2 py-1 text-xs font-semibold rounded-full transition-colors ${
                        company.isActive
                          ? "bg-green-100 text-green-800 hover:bg-green-200"
                          : "bg-red-100 text-red-800 hover:bg-red-200"
                      }`}
                    >
                      {company.isActive ? "Ativa" : "Inativa"}
                    </button>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm font-medium space-x-2">
                    <button
                      onClick={() => handleViewUsers(company.id)}
                      className="text-blue-600 hover:text-blue-900 transition-colors"
                      title="Ver usuários"
                    >
                      <EyeIcon className="w-5 h-5" />
                    </button>
                    <button
                      onClick={() => handleEditCompany(company.id)}
                      className="text-yellow-600 hover:text-yellow-900 transition-colors"
                      title="Editar empresa"
                    >
                      <PencilIcon className="w-5 h-5" />
                    </button>
                    <button
                      onClick={() => handleDeleteCompany(company.id)}
                      className="text-red-600 hover:text-red-900 transition-colors"
                      title="Excluir empresa"
                    >
                      <TrashIcon className="w-5 h-5" />
                    </button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

      {/* Modal de Criação */}
      {showCreateModal && (
        <CreateCompanyModal
          onSave={handleSaveCompany}
          onClose={() => setShowCreateModal(false)}
        />
      )}

      {/* Modal de Edição */}
      {editingCompany && (
        <EditCompanyModal
          company={editingCompany}
          onSave={handleUpdateCompany}
          onClose={() => setEditingCompany(null)}
        />
      )}
    </div>
  );
}
