"use client";

import { TrashIcon, UsersIcon, XMarkIcon } from "@heroicons/react/24/outline";
import { useState } from "react";
import { AdminUser, Company, Role, UserCompany } from "../types";

interface EditUserModalProps {
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
}

export default function EditUserModal({
  user,
  companies,
  roles,
  onSave,
  onClose,
}: EditUserModalProps) {
  console.log("EditUserModal - User companies:", user.companies);
  console.log("EditUserModal - Available companies:", companies.length);
  console.log("EditUserModal - Available roles:", roles.length);

  const [name, setName] = useState(user.name);
  const [isActive, setIsActive] = useState(user.isActive);
  const [userCompanies, setUserCompanies] = useState<UserCompany[]>(
    (user.companies || []).map((uc: any) => ({
      companyId: uc.company?.id || "",
      roleId: uc.role?.id || "",
      originalCompanyId: uc.company?.id || "",
      originalRoleId: uc.role?.id || "",
    }))
  );

  const handleAddCompany = () => {
    // Buscar empresa e role padrão que ainda não estejam sendo usadas
    const usedCompanyIds = userCompanies.map((uc) => uc.companyId);
    const availableCompany = companies.find(
      (c) => !usedCompanyIds.includes(c.id)
    );
    const defaultRole = roles.find((r) => r.name !== "SUPER_ADMIN") || roles[0];

    if (availableCompany && defaultRole) {
      setUserCompanies([
        ...userCompanies,
        {
          companyId: availableCompany.id,
          roleId: defaultRole.id,
          originalCompanyId: "",
          originalRoleId: "",
        },
      ]);
    }
  };

  const handleRemoveCompany = (index: number) => {
    setUserCompanies(
      userCompanies.filter((_: UserCompany, i: number) => i !== index)
    );
  };

  const handleClose = () => {
    // Reset form state
    setName(user.name);
    setIsActive(user.isActive);
    setUserCompanies(
      user.companies.map((uc: any) => ({
        companyId: uc.company.id,
        roleId: uc.role.id,
        originalCompanyId: uc.company.id,
        originalRoleId: uc.role.id,
      }))
    );

    // Close modal
    onClose();
  };

  const handleCompanyChange = (index: number, field: string, value: string) => {
    const updated = [...userCompanies];
    updated[index] = { ...updated[index], [field]: value };
    setUserCompanies(updated);
  };

  const handleSave = () => {
    console.log("Saving user data:", {
      userCompanies,
      originalCompanies: user.companies,
    });

    // Calcular mudanças
    const original = (user.companies || []).map((uc: any) => ({
      companyId: uc.company?.id || "",
      roleId: uc.role?.id || "",
    }));

    const current = userCompanies
      .filter((uc: UserCompany) => uc.companyId && uc.roleId)
      .map((uc: UserCompany) => ({
        companyId: uc.companyId,
        roleId: uc.roleId,
      }));

    // Empresas a adicionar (novas)
    const addCompanies = current.filter(
      (curr: any) =>
        !original.some(
          (orig: any) =>
            orig.companyId === curr.companyId && orig.roleId === curr.roleId
        )
    );

    // Empresas a remover (removidas)
    const removeCompanies = original
      .filter(
        (orig: any) =>
          orig.companyId &&
          !current.some((curr: any) => curr.companyId === orig.companyId)
      )
      .map((orig: any) => orig.companyId);

    // Roles a atualizar (mudaram)
    const updateRoles = userCompanies
      .filter(
        (uc: UserCompany) =>
          uc.originalCompanyId &&
          uc.originalRoleId !== uc.roleId &&
          uc.companyId &&
          uc.roleId
      )
      .map((uc: UserCompany) => ({
        companyId: uc.companyId,
        roleId: uc.roleId,
      }));

    console.log("Changes calculated:", {
      addCompanies,
      removeCompanies,
      updateRoles,
    });

    onSave({
      name,
      isActive,
      addCompanies,
      removeCompanies,
      updateRoles,
    });
  };

  return (
    <div className="fixed inset-0 z-50 overflow-y-auto">
      <div className="flex items-center justify-center min-h-screen pt-4 px-4 pb-20 text-center sm:block sm:p-0">
        {/* Backdrop */}
        <div
          className="fixed inset-0 bg-gray-500 bg-opacity-75 transition-opacity"
          aria-hidden="true"
          onClick={handleClose}
        />

        {/* Center alignment trick */}
        <span
          className="hidden sm:inline-block sm:align-middle sm:h-screen"
          aria-hidden="true"
        >
          &#8203;
        </span>

        {/* Modal panel */}
        <div
          className="relative inline-block align-bottom bg-white rounded-lg text-left overflow-hidden shadow-xl transform transition-all sm:my-8 sm:align-middle sm:max-w-2xl sm:w-full z-50"
          onClick={(e) => e.stopPropagation()}
        >
          {/* Header */}
          <div className="p-6 border-b">
            <div className="flex items-center justify-between">
              <h2 className="text-xl font-semibold text-gray-900">
                Editar Usuário
              </h2>
              <button
                onClick={handleClose}
                className="p-2 hover:bg-gray-100 rounded-lg transition-colors"
              >
                <XMarkIcon className="w-5 h-5 text-gray-400" />
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
                {userCompanies.map(
                  (userCompany: UserCompany, index: number) => {
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
                          <label className="block text-xs text-gray-500 mb-1">
                            Empresa
                          </label>
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
                            <option value="">Selecione uma empresa</option>
                            {companies.map((company: Company) => (
                              <option key={company.id} value={company.id}>
                                {company.name}
                              </option>
                            ))}
                          </select>
                        </div>

                        <div className="flex-1">
                          <label className="block text-xs text-gray-500 mb-1">
                            Papel
                          </label>
                          <select
                            value={userCompany.roleId}
                            onChange={(e) =>
                              handleCompanyChange(
                                index,
                                "roleId",
                                e.target.value
                              )
                            }
                            className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm"
                          >
                            <option value="">Selecione um papel</option>
                            {roles.map((role: Role) => (
                              <option key={role.id} value={role.id}>
                                {role.name}
                              </option>
                            ))}
                          </select>
                        </div>

                        <div className="flex-shrink-0">
                          <button
                            onClick={() => handleRemoveCompany(index)}
                            className="p-2 text-red-600 hover:bg-red-50 rounded-lg"
                            title="Remover empresa"
                          >
                            <TrashIcon className="w-4 h-4" />
                          </button>
                        </div>
                      </div>
                    );
                  }
                )}

                {userCompanies.length === 0 && (
                  <div className="text-center py-8 text-gray-500">
                    <UsersIcon className="w-12 h-12 mx-auto mb-2 text-gray-400" />
                    <p>Usuário não pertence a nenhuma empresa</p>
                    <p className="text-sm mt-1">
                      Clique em "Adicionar Empresa" para atribuir uma empresa
                    </p>
                  </div>
                )}
              </div>
            </div>
          </div>

          {/* Footer */}
          <div className="p-6 border-t bg-gray-50 flex items-center justify-end space-x-3">
            <button
              onClick={handleClose}
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
    </div>
  );
}
