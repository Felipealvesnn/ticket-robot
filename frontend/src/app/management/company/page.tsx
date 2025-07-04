"use client";

import api from "@/services/api";
import { useAuthStore } from "@/store/auth";
import * as Types from "@/types";
import {
  BuildingOfficeIcon,
  CheckIcon,
  PencilIcon,
  XMarkIcon,
} from "@heroicons/react/24/outline";
import { useEffect, useState } from "react";

export default function ManagementCompanyPage() {
  const { user } = useAuthStore();
  const [company, setCompany] = useState<Types.CompanyWithUsers | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [isEditing, setIsEditing] = useState(false);
  const [saving, setSaving] = useState(false);

  const currentCompanyId = user?.currentCompany?.id;

  // Estados para formulário de edição
  const [editForm, setEditForm] = useState({
    name: "",
    slug: "",
    plan: "FREE" as "FREE" | "BASIC" | "PRO" | "ENTERPRISE",
  });

  // Carregar dados da empresa
  useEffect(() => {
    if (currentCompanyId) {
      loadCompany();
    }
  }, [currentCompanyId]);

  const loadCompany = async () => {
    try {
      setLoading(true);
      setError(null);
      const response = await api.company.getMyCompany(currentCompanyId!);
      setCompany(response);

      // Preencher formulário de edição
      setEditForm({
        name: response.name,
        slug: response.slug,
        plan: response.plan,
      });
    } catch (error) {
      setError("Erro ao carregar dados da empresa");
      console.error("Erro ao carregar empresa:", error);
    } finally {
      setLoading(false);
    }
  };

  const handleSaveChanges = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!company) return;

    try {
      setSaving(true);
      const response = await api.company.updateCompany(company.id, editForm);
      setCompany({ ...company, ...response });
      setIsEditing(false);
    } catch (error) {
      console.error("Erro ao atualizar empresa:", error);
      alert("Erro ao salvar alterações");
    } finally {
      setSaving(false);
    }
  };

  const handleCancelEdit = () => {
    if (company) {
      setEditForm({
        name: company.name,
        slug: company.slug,
        plan: company.plan,
      });
    }
    setIsEditing(false);
  };

  const getPlanBadgeColor = (plan: string) => {
    switch (plan) {
      case "FREE":
        return "bg-gray-100 text-gray-800";
      case "BASIC":
        return "bg-blue-100 text-blue-800";
      case "PRO":
        return "bg-purple-100 text-purple-800";
      case "ENTERPRISE":
        return "bg-gold-100 text-gold-800";
      default:
        return "bg-gray-100 text-gray-800";
    }
  };

  const getPlanName = (plan: string) => {
    switch (plan) {
      case "FREE":
        return "Gratuito";
      case "BASIC":
        return "Básico";
      case "PRO":
        return "Profissional";
      case "ENTERPRISE":
        return "Enterprise";
      default:
        return plan;
    }
  };

  if (loading) {
    return (
      <div className="p-8">
        <div className="max-w-4xl mx-auto">
          <div className="animate-pulse">
            <div className="h-8 bg-gray-200 rounded mb-4"></div>
            <div className="h-64 bg-gray-200 rounded"></div>
          </div>
        </div>
      </div>
    );
  }

  if (error || !company) {
    return (
      <div className="p-8">
        <div className="max-w-4xl mx-auto">
          <div className="bg-red-50 border border-red-200 rounded-lg p-4">
            <p className="text-red-800">{error || "Empresa não encontrada"}</p>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="p-8">
      <div className="max-w-4xl mx-auto">
        {/* Header */}
        <div className="mb-8">
          <div className="flex items-center justify-between">
            <div>
              <h1 className="text-3xl font-bold text-gray-900 flex items-center">
                <BuildingOfficeIcon className="w-8 h-8 mr-3 text-blue-600" />
                Configurações da Empresa
              </h1>
              <p className="text-gray-600 mt-2">
                Gerencie as informações e configurações da sua empresa
              </p>
            </div>
            {!isEditing && (
              <button
                onClick={() => setIsEditing(true)}
                className="bg-blue-600 text-white px-4 py-2 rounded-lg hover:bg-blue-700 transition-colors flex items-center"
              >
                <PencilIcon className="w-5 h-5 mr-2" />
                Editar
              </button>
            )}
          </div>
        </div>

        {/* Informações da Empresa */}
        <div className="bg-white rounded-lg shadow">
          <div className="p-6">
            <h2 className="text-lg font-semibold text-gray-900 mb-6">
              Informações Básicas
            </h2>

            {isEditing ? (
              /* Formulário de Edição */
              <form onSubmit={handleSaveChanges} className="space-y-6">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      Nome da Empresa
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
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      Slug da Empresa
                    </label>
                    <input
                      type="text"
                      value={editForm.slug}
                      onChange={(e) =>
                        setEditForm({ ...editForm, slug: e.target.value })
                      }
                      className="w-full border border-gray-300 rounded-lg px-3 py-2 focus:outline-none focus:ring-2 focus:ring-blue-500"
                      required
                      pattern="^[a-z0-9-]+$"
                      title="Apenas letras minúsculas, números e hífens"
                    />
                    <p className="text-sm text-gray-500 mt-1">
                      Usado para URLs e identificação única
                    </p>
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      Plano
                    </label>
                    <select
                      value={editForm.plan}
                      onChange={(e) =>
                        setEditForm({
                          ...editForm,
                          plan: e.target.value as any,
                        })
                      }
                      className="w-full border border-gray-300 rounded-lg px-3 py-2 focus:outline-none focus:ring-2 focus:ring-blue-500"
                    >
                      <option value="FREE">Gratuito</option>
                      <option value="BASIC">Básico</option>
                      <option value="PRO">Profissional</option>
                      <option value="ENTERPRISE">Enterprise</option>
                    </select>
                  </div>
                </div>

                {/* Botões de Ação */}
                <div className="flex items-center justify-end space-x-3 pt-6 border-t">
                  <button
                    type="button"
                    onClick={handleCancelEdit}
                    className="px-4 py-2 text-gray-700 border border-gray-300 rounded-lg hover:bg-gray-50 transition-colors flex items-center"
                    disabled={saving}
                  >
                    <XMarkIcon className="w-4 h-4 mr-2" />
                    Cancelar
                  </button>
                  <button
                    type="submit"
                    className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors flex items-center disabled:opacity-50"
                    disabled={saving}
                  >
                    {saving ? (
                      <>
                        <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin mr-2"></div>
                        Salvando...
                      </>
                    ) : (
                      <>
                        <CheckIcon className="w-4 h-4 mr-2" />
                        Salvar Alterações
                      </>
                    )}
                  </button>
                </div>
              </form>
            ) : (
              /* Visualização das Informações */
              <div className="space-y-6">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      Nome da Empresa
                    </label>
                    <div className="text-lg font-semibold text-gray-900">
                      {company.name}
                    </div>
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      Slug da Empresa
                    </label>
                    <div className="text-lg text-gray-800 font-mono bg-gray-50 px-3 py-2 rounded border">
                      {company.slug}
                    </div>
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      Plano Atual
                    </label>
                    <span
                      className={`inline-flex px-3 py-1 rounded-full text-sm font-medium ${getPlanBadgeColor(
                        company.plan
                      )}`}
                    >
                      {getPlanName(company.plan)}
                    </span>
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      Status
                    </label>
                    <span
                      className={`inline-flex px-3 py-1 rounded-full text-sm font-medium ${
                        company.isActive
                          ? "bg-green-100 text-green-800"
                          : "bg-red-100 text-red-800"
                      }`}
                    >
                      {company.isActive ? "Ativa" : "Inativa"}
                    </span>
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      Data de Criação
                    </label>
                    <div className="text-gray-800">
                      {new Date(company.createdAt).toLocaleDateString("pt-BR", {
                        day: "2-digit",
                        month: "2-digit",
                        year: "numeric",
                        hour: "2-digit",
                        minute: "2-digit",
                      })}
                    </div>
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      Total de Usuários
                    </label>
                    <div className="text-lg font-semibold text-blue-600">
                      {company.companyUsers?.length || 0} usuários
                    </div>
                  </div>
                </div>
              </div>
            )}
          </div>
        </div>

        {/* Estatísticas Rápidas */}
        <div className="mt-8 grid grid-cols-1 md:grid-cols-3 gap-6">
          <div className="bg-white rounded-lg shadow p-6">
            <div className="flex items-center">
              <div className="w-12 h-12 bg-blue-100 rounded-lg flex items-center justify-center">
                <BuildingOfficeIcon className="w-6 h-6 text-blue-600" />
              </div>
              <div className="ml-4">
                <p className="text-sm font-medium text-gray-500">
                  Usuários Ativos
                </p>
                <p className="text-2xl font-semibold text-gray-900">
                  {company.companyUsers?.filter((u) => u.isActive).length || 0}
                </p>
              </div>
            </div>
          </div>

          <div className="bg-white rounded-lg shadow p-6">
            <div className="flex items-center">
              <div className="w-12 h-12 bg-green-100 rounded-lg flex items-center justify-center">
                <CheckIcon className="w-6 h-6 text-green-600" />
              </div>
              <div className="ml-4">
                <p className="text-sm font-medium text-gray-500">Plano Atual</p>
                <p className="text-2xl font-semibold text-gray-900">
                  {getPlanName(company.plan)}
                </p>
              </div>
            </div>
          </div>

          <div className="bg-white rounded-lg shadow p-6">
            <div className="flex items-center">
              <div className="w-12 h-12 bg-purple-100 rounded-lg flex items-center justify-center">
                <span className="text-purple-600 font-bold text-lg">
                  {company.name.charAt(0).toUpperCase()}
                </span>
              </div>
              <div className="ml-4">
                <p className="text-sm font-medium text-gray-500">
                  ID da Empresa
                </p>
                <p className="text-sm font-mono text-gray-900 truncate">
                  {company.id}
                </p>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
