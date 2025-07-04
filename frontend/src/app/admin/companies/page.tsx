"use client";

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

// Mock data - substituir por API real
type Plan = "FREE" | "BASIC" | "PRO" | "ENTERPRISE";

interface Company {
  id: string;
  name: string;
  slug: string;
  domain: string | null;
  plan: Plan;
  isActive: boolean;
  maxUsers: number;
  maxSessions: number;
  currentUsers: number;
  currentSessions: number;
  createdAt: string;
  updatedAt: string;
}

const mockCompanies: Company[] = [
  {
    id: "1",
    name: "Ticket Robot HQ",
    slug: "ticket-robot-hq",
    domain: "ticketrobot.com",
    plan: "ENTERPRISE",
    isActive: true,
    maxUsers: 100,
    maxSessions: 50,
    currentUsers: 12,
    currentSessions: 8,
    createdAt: "2024-01-15",
    updatedAt: "2024-12-20",
  },
  {
    id: "2",
    name: "Empresa Demo LTDA",
    slug: "empresa-demo",
    domain: null,
    plan: "PRO",
    isActive: true,
    maxUsers: 25,
    maxSessions: 15,
    currentUsers: 8,
    currentSessions: 3,
    createdAt: "2024-03-10",
    updatedAt: "2024-12-18",
  },
  {
    id: "3",
    name: "StartUp XYZ",
    slug: "startup-xyz",
    domain: "startup.xyz",
    plan: "BASIC",
    isActive: false,
    maxUsers: 10,
    maxSessions: 5,
    currentUsers: 2,
    currentSessions: 0,
    createdAt: "2024-11-01",
    updatedAt: "2024-12-10",
  },
];

const planColors: Record<Plan, string> = {
  FREE: "bg-gray-100 text-gray-800",
  BASIC: "bg-blue-100 text-blue-800",
  PRO: "bg-purple-100 text-purple-800",
  ENTERPRISE: "bg-yellow-100 text-yellow-800",
};

const planNames: Record<Plan, string> = {
  FREE: "Gratuito",
  BASIC: "Básico",
  PRO: "Profissional",
  ENTERPRISE: "Empresarial",
};

export default function AdminCompaniesPage() {
  const { user } = useAuthStore();
  const router = useRouter();
  const [companies, setCompanies] = useState<Company[]>(mockCompanies);
  const [loading, setLoading] = useState(false);

  // Verificar se é super admin
  useEffect(() => {
    if (!user) return;

    const isSuperAdmin = user.currentCompany?.role?.name === "SUPER_ADMIN";
    if (!isSuperAdmin) {
      router.push("/");
      return;
    }
  }, [user, router]);

  const handleCreateCompany = () => {
    router.push("/admin/companies/create");
  };

  const handleEditCompany = (companyId: string) => {
    router.push(`/admin/companies/${companyId}/edit`);
  };

  const handleViewUsers = (companyId: string) => {
    router.push(`/admin/companies/${companyId}/users`);
  };

  const handleToggleStatus = async (companyId: string) => {
    // Implementar API call
    setCompanies((prev) =>
      prev.map((company) =>
        company.id === companyId
          ? { ...company, isActive: !company.isActive }
          : company
      )
    );
  };

  const handleDeleteCompany = async (companyId: string) => {
    if (confirm("Tem certeza que deseja excluir esta empresa?")) {
      // Implementar API call
      setCompanies((prev) =>
        prev.filter((company) => company.id !== companyId)
      );
    }
  };

  if (!user || user.currentCompany?.role?.name !== "SUPER_ADMIN") {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="text-center">
          <div className="w-16 h-16 border-4 border-blue-600 border-t-transparent rounded-full animate-spin mx-auto mb-4"></div>
          <p className="text-gray-600">Verificando permissões...</p>
        </div>
      </div>
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
                {companies.reduce((acc, c) => acc + c.currentUsers, 0)}
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
              <p className="text-sm font-medium text-gray-600">
                Sessões Ativas
              </p>
              <p className="text-2xl font-bold text-gray-900">
                {companies.reduce((acc, c) => acc + c.currentSessions, 0)}
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
                          {company.domain || `${company.slug}.ticketrobot.com`}
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
                    <div className="flex items-center">
                      <span className="font-medium">
                        {company.currentUsers}
                      </span>
                      <span className="text-gray-500 ml-1">
                        / {company.maxUsers}
                      </span>
                    </div>
                    <div className="w-full bg-gray-200 rounded-full h-2 mt-1">
                      <div
                        className="bg-blue-600 h-2 rounded-full"
                        style={{
                          width: `${
                            (company.currentUsers / company.maxUsers) * 100
                          }%`,
                        }}
                      ></div>
                    </div>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                    <div className="flex items-center">
                      <span className="font-medium">
                        {company.currentSessions}
                      </span>
                      <span className="text-gray-500 ml-1">
                        / {company.maxSessions}
                      </span>
                    </div>
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
    </div>
  );
}
