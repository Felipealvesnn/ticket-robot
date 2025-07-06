"use client";

import { useState } from "react";
import FormField from "../../components/FormField";
import {
  generateSlug,
  validateCompanyForm,
  ValidationError,
} from "../../utils/validation";
import { Plan } from "../types";

interface CreateCompanyModalProps {
  onSave: (data: {
    name: string;
    slug: string;
    plan: string;
    userEmail: string;
    userName: string;
    userPassword: string;
  }) => Promise<void>;
  onClose: () => void;
}

export default function CreateCompanyModal({
  onSave,
  onClose,
}: CreateCompanyModalProps) {
  const [name, setName] = useState("");
  const [slug, setSlug] = useState("");
  const [plan, setPlan] = useState<Plan>("FREE");
  const [userEmail, setUserEmail] = useState("");
  const [userName, setUserName] = useState("");
  const [userPassword, setUserPassword] = useState("");
  const [errors, setErrors] = useState<ValidationError[]>([]);
  const [isSubmitting, setIsSubmitting] = useState(false);

  const handleSave = async () => {
    setIsSubmitting(true);
    setErrors([]);

    const formData = {
      name: name.trim(),
      slug: slug.trim(),
      plan,
      userEmail: userEmail.trim(),
      userName: userName.trim(),
      userPassword: userPassword.trim(),
    };

    const validation = validateCompanyForm(formData);

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

  const handleNameChange = (value: string) => {
    setName(value);
    if (!slug || slug === generateSlug(name)) {
      setSlug(generateSlug(value));
    }
  };

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
      <div className="bg-white rounded-lg shadow-xl w-full max-w-2xl max-h-[90vh] overflow-y-auto">
        {/* Header */}
        <div className="p-6 border-b">
          <div className="flex items-center justify-between">
            <h2 className="text-xl font-semibold text-gray-900">
              Criar Nova Empresa
            </h2>
            <button
              onClick={onClose}
              className="p-2 text-gray-400 hover:text-gray-600 rounded-lg hover:bg-gray-100"
            >
              ✕
            </button>
          </div>
        </div>

        {/* Body */}
        <div className="p-6 space-y-6">
          {/* Informações da Empresa */}
          <div>
            <h3 className="text-lg font-medium text-gray-900 mb-4">
              Informações da Empresa
            </h3>
            <div className="space-y-4">
              <FormField
                label="Nome da Empresa"
                name="name"
                value={name}
                onChange={handleNameChange}
                placeholder="Ex: Minha Empresa LTDA"
                required
                errors={errors}
              />

              <FormField
                label="Slug (identificador)"
                name="slug"
                value={slug}
                onChange={(value) => setSlug(generateSlug(value))}
                placeholder="minha-empresa-ltda"
                required
                errors={errors}
                description="Usado na URL e identificação da empresa"
              />

              <FormField
                label="Plano"
                name="plan"
                type="select"
                value={plan}
                onChange={(value) => setPlan(value as Plan)}
                required
                errors={errors}
              >
                <option value="FREE">Gratuito</option>
                <option value="BASIC">Básico</option>
                <option value="PRO">Profissional</option>
                <option value="ENTERPRISE">Empresarial</option>
              </FormField>
            </div>
          </div>

          {/* Informações do Proprietário */}
          <div>
            <h3 className="text-lg font-medium text-gray-900 mb-4">
              Proprietário da Empresa
            </h3>
            <div className="space-y-4">
              <FormField
                label="Nome do Proprietário"
                name="userName"
                value={userName}
                onChange={setUserName}
                placeholder="João Silva"
                required
                errors={errors}
              />

              <FormField
                label="Email do Proprietário"
                name="userEmail"
                type="email"
                value={userEmail}
                onChange={setUserEmail}
                placeholder="joao@minhaempresa.com"
                required
                errors={errors}
              />

              <FormField
                label="Senha Temporária"
                name="userPassword"
                type="password"
                value={userPassword}
                onChange={setUserPassword}
                placeholder="Senha temporária para o proprietário"
                required
                errors={errors}
                description="O proprietário deverá alterar a senha no primeiro login"
              />
            </div>
          </div>
        </div>

        {/* Footer */}
        <div className="p-6 border-t bg-gray-50 flex items-center justify-end space-x-3">
          <button
            onClick={onClose}
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
            {isSubmitting ? "Criando..." : "Criar Empresa"}
          </button>
        </div>
      </div>
    </div>
  );
}
