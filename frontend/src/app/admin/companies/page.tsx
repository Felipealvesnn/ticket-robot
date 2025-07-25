"use client";

import { useAdminCompaniesStore } from "@/store/admin-companies";
import { useAuthStore } from "@/store/auth";
import {
  BuildingOfficeIcon,
  ExclamationTriangleIcon,
  EyeIcon,
  PencilIcon,
  PlusIcon,
  TrashIcon,
  UserGroupIcon,
} from "@heroicons/react/24/outline";
import { useRouter } from "next/navigation";
import { useEffect, useState } from "react";
import { confirmAlert } from "react-confirm-alert";
import { ErrorMessage, LoadingSpinner, Pagination } from "../components";
import { CreateCompanyModal, EditCompanyModal } from "./components";
import { AdminCompany, planColors, planNames } from "./types";

export default function AdminCompaniesPage() {
  const { user } = useAuthStore();
  const router = useRouter();

  // Store state
  const {
    companies,
    companiesLoading,
    companiesError,
    currentPage,
    totalPages,
    totalItems,
    limit,
    loadCompanies,
    createCompany,
    updateCompany,
    deleteCompany,
    toggleCompanyStatus,
    setPage,
    setLimit,
    getActiveCompanies,
    getInactiveCompanies,
    getTotalUsers,
    getTotalSessions,
    reset,
  } = useAdminCompaniesStore();

  // Local state
  const [showCreateModal, setShowCreateModal] = useState(false);
  const [editingCompany, setEditingCompany] = useState<AdminCompany | null>(
    null
  );

  // Verificar se é super admin e carregar empresas
  useEffect(() => {
    if (!user) return;

    const isSuperAdmin = user.currentCompany?.role?.name === "SUPER_ADMIN";
    if (!isSuperAdmin) {
      router.push("/");
      return;
    }

    loadCompanies();

    // Cleanup ao desmontar
    return () => {
      reset();
    };
  }, [user, router, loadCompanies, reset]);

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
      await toggleCompanyStatus(companyId);
    } catch (error) {
      console.error("Erro ao alterar status da empresa:", error);
      alert("Erro ao alterar status da empresa");
    }
  };

  const handleDeleteCompany = async (
    companyId: string,
    companyName: string
  ) => {
    confirmAlert({
      customUI: ({ onClose }) => (
        <div className="bg-white rounded-lg shadow-xl p-6 max-w-md mx-auto">
          <div className="flex items-center space-x-4 mb-4">
            <ExclamationTriangleIcon className="w-12 h-12 text-red-500" />
            <div>
              <h3 className="text-lg font-semibold text-gray-900">
                Excluir Empresa
              </h3>
            </div>
          </div>
          <p className="text-gray-600 mb-6">
            Tem certeza que deseja excluir a empresa{" "}
            <strong>{companyName}</strong>? Esta ação não pode ser desfeita.
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
                  await deleteCompany(companyId);
                  onClose();
                } catch (error) {
                  console.error("Erro ao excluir empresa:", error);
                  alert(
                    "Erro ao excluir empresa. Verifique se a empresa não possui dados associados."
                  );
                  onClose();
                }
              }}
              className="px-4 py-2 bg-red-600 text-white rounded-lg hover:bg-red-700"
            >
              Excluir
            </button>
          </div>
        </div>
      ),
    });
  };

  const handleSaveCompany = async (companyData: {
    name: string;
    slug: string;
    plan: string;
  }): Promise<void> => {
    try {
      await createCompany({
        name: companyData.name,
        slug: companyData.slug,
        plan: companyData.plan,
      });
      setShowCreateModal(false);
    } catch (error) {
      console.error("Erro ao criar empresa:", error);
      throw new Error("Erro ao criar empresa");
    }
  };

  const handleUpdateCompany = async (companyData: {
    name: string;
    slug: string;
    plan: string;
  }) => {
    if (!editingCompany) return;

    try {
      await updateCompany(editingCompany.id, companyData);
      setEditingCompany(null);
    } catch (error) {
      console.error("Erro ao atualizar empresa:", error);
      alert("Erro ao atualizar empresa");
    }
  };

  const handlePageChange = (page: number) => {
    setPage(page);
    loadCompanies(page, limit);
  };

  const handleLimitChange = (newLimit: number) => {
    setLimit(newLimit);
    loadCompanies(1, newLimit);
  };

  if (companiesLoading) {
    return <LoadingSpinner message="Carregando empresas..." />;
  }

  if (companiesError) {
    return (
      <ErrorMessage message={companiesError} onRetry={() => loadCompanies()} />
    );
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
                {getActiveCompanies().length}
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
                {getTotalUsers()}
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
                {getTotalSessions()}
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
                        planColors[company.plan as keyof typeof planColors]
                      }`}
                    >
                      {planNames[company.plan as keyof typeof planNames]}
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
                      onClick={() =>
                        handleDeleteCompany(company.id, company.name)
                      }
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

        {/* Paginação */}
        <Pagination
          currentPage={currentPage}
          totalPages={totalPages}
          totalItems={totalItems}
          itemsPerPage={limit}
          onPageChange={handlePageChange}
          onLimitChange={handleLimitChange}
          loading={companiesLoading}
        />
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
          company={editingCompany as any}
          onSave={handleUpdateCompany}
          onClose={() => setEditingCompany(null)}
        />
      )}
    </div>
  );
}
