"use client";

import { XMarkIcon } from "@heroicons/react/24/outline";
import { useEffect, useState } from "react";
import FormField from "../../components/FormField";
import { validateUserForm, ValidationError } from "../../utils/validation";

interface Company {
  id: string;
  name: string;
  slug: string;
}

interface Role {
  id: string;
  name: string;
  description: string;
}

interface CreateUserModalProps {
  companies: Company[];
  roles: Role[];
  onSave: (data: {
    email: string;
    name: string;
    password?: string;
    companyId?: string;
    roleId?: string;
    phone?: string;
    address?: string;
  }) => Promise<void>;
  onClose: () => void;
}

export default function CreateUserModal({
  companies,
  roles,
  onSave,
  onClose,
}: CreateUserModalProps) {
  const [email, setEmail] = useState("");
  const [name, setName] = useState("");
  const [password, setPassword] = useState("");
  const [generatePassword, setGeneratePassword] = useState(true);
  const [companyId, setCompanyId] = useState("");
  const [roleId, setRoleId] = useState("");
  const [phone, setPhone] = useState("");
  const [address, setAddress] = useState("");
  const [errors, setErrors] = useState<ValidationError[]>([]);
  const [isSubmitting, setIsSubmitting] = useState(false);

  // Set default role when component mounts
  useEffect(() => {
    const defaultRole =
      roles.find((r) => r.name === "COMPANY_AGENT") || roles[0];
    if (defaultRole && !roleId) {
      setRoleId(defaultRole.id);
    }
  }, [roles, roleId]);

  const handleSave = async () => {
    setIsSubmitting(true);
    setErrors([]);

    const formData = {
      email: email.trim(),
      name: name.trim(),
      ...(!generatePassword &&
        password.trim() && { password: password.trim() }),
      ...(companyId && { companyId }),
      ...(roleId && { roleId }),
      ...(phone.trim() && { phone: phone.trim() }),
      ...(address.trim() && { address: address.trim() }),
    };

    const validation = validateUserForm(formData);

    if (!validation.isValid) {
      setErrors(validation.errors);
      setIsSubmitting(false);
      return;
    }

    try {
      await onSave(formData);
    } catch (error) {
      setIsSubmitting(false);
      // O erro será tratado pelo componente pai
    }
  };

  const handleClose = () => {
    setEmail("");
    setName("");
    setPassword("");
    setGeneratePassword(true);
    setCompanyId("");
    setRoleId("");
    setPhone("");
    setAddress("");
    setErrors([]);
    onClose();
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

        {/* This element is to trick the browser into centering the modal contents. */}
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
                Criar Novo Usuário
              </h2>
              <button
                onClick={handleClose}
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
                <FormField
                  label="Email"
                  name="email"
                  type="email"
                  value={email}
                  onChange={setEmail}
                  placeholder="usuario@exemplo.com"
                  required
                  errors={errors}
                />

                <FormField
                  label="Nome Completo"
                  name="name"
                  value={name}
                  onChange={setName}
                  placeholder="Nome completo do usuário"
                  required
                  errors={errors}
                />

                <FormField
                  label="Telefone"
                  name="phone"
                  value={phone}
                  onChange={setPhone}
                  placeholder="(11) 99999-9999"
                  errors={errors}
                  description="Opcional - Telefone de contato"
                />

                <FormField
                  label="Endereço"
                  name="address"
                  value={address}
                  onChange={setAddress}
                  placeholder="Endereço completo"
                  errors={errors}
                  description="Opcional - Endereço do usuário"
                />
              </div>
            </div>

            {/* Senha */}
            <div>
              <h3 className="text-lg font-medium text-gray-900 mb-4">
                Configurações de Acesso
              </h3>
              <div className="space-y-4">
                <div>
                  <div className="flex items-center mb-3">
                    <input
                      type="checkbox"
                      id="generatePassword"
                      checked={generatePassword}
                      onChange={(e) => setGeneratePassword(e.target.checked)}
                      className="h-4 w-4 text-blue-600 focus:ring-blue-500 border-gray-300 rounded"
                    />
                    <label
                      htmlFor="generatePassword"
                      className="ml-2 text-sm text-gray-700 font-medium"
                    >
                      Gerar senha automática
                    </label>
                  </div>

                  {!generatePassword && (
                    <FormField
                      label="Senha"
                      name="password"
                      type="password"
                      value={password}
                      onChange={setPassword}
                      placeholder="Digite uma senha segura"
                      errors={errors}
                      description="Mínimo 6 caracteres"
                    />
                  )}

                  {generatePassword && (
                    <div className="bg-blue-50 border border-blue-200 rounded-lg p-3">
                      <p className="text-sm text-blue-700">
                        Uma senha temporária será gerada automaticamente e o
                        usuário deverá alterá-la no primeiro login.
                      </p>
                    </div>
                  )}
                </div>
              </div>
            </div>

            {/* Empresa e Papel */}
            <div>
              <h3 className="text-lg font-medium text-gray-900 mb-4">
                Empresa e Permissões
              </h3>
              <div className="space-y-4">
                <FormField
                  label="Empresa"
                  name="companyId"
                  type="select"
                  value={companyId}
                  onChange={setCompanyId}
                  errors={errors}
                  description="Escolha a empresa para vincular o usuário"
                >
                  <option value="">Selecione uma empresa (opcional)</option>
                  {companies.map((company) => (
                    <option key={company.id} value={company.id}>
                      {company.name}
                    </option>
                  ))}
                </FormField>

                {companyId && (
                  <FormField
                    label="Papel/Função"
                    name="roleId"
                    type="select"
                    value={roleId}
                    onChange={setRoleId}
                    required
                    errors={errors}
                    description="Defina o papel do usuário na empresa"
                  >
                    <option value="">Selecione um papel</option>
                    {roles
                      .filter((role) => role.name !== "SUPER_ADMIN")
                      .map((role) => (
                        <option key={role.id} value={role.id}>
                          {role.name} - {role.description}
                        </option>
                      ))}
                  </FormField>
                )}
              </div>
            </div>

            {/* Nota informativa */}
            <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-4">
              <div className="flex items-start">
                <div className="flex-shrink-0">
                  <svg
                    className="h-5 w-5 text-yellow-400"
                    viewBox="0 0 20 20"
                    fill="currentColor"
                  >
                    <path
                      fillRule="evenodd"
                      d="M18 10a8 8 0 11-16 0 8 8 0 0116 0zm-7-4a1 1 0 11-2 0 1 1 0 012 0zM9 9a1 1 0 000 2v3a1 1 0 001 1h1a1 1 0 100-2v-3a1 1 0 00-1-1H9z"
                      clipRule="evenodd"
                    />
                  </svg>
                </div>
                <div className="ml-3">
                  <h4 className="text-sm font-medium text-yellow-800">
                    Informação importante
                  </h4>
                  <p className="text-sm text-yellow-700 mt-1">
                    Se não vincular a uma empresa agora, você poderá fazê-lo
                    posteriormente na edição do usuário.
                  </p>
                </div>
              </div>
            </div>
          </div>

          {/* Footer */}
          <div className="p-6 border-t bg-gray-50 flex items-center justify-end space-x-3">
            <button
              onClick={handleClose}
              disabled={isSubmitting}
              className="px-4 py-2 text-gray-700 bg-white border border-gray-300 rounded-lg hover:bg-gray-50 disabled:opacity-50 disabled:cursor-not-allowed"
            >
              Cancelar
            </button>
            <button
              onClick={handleSave}
              disabled={isSubmitting}
              className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed flex items-center"
            >
              {isSubmitting && (
                <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin mr-2"></div>
              )}
              {isSubmitting ? "Criando..." : "Criar Usuário"}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
