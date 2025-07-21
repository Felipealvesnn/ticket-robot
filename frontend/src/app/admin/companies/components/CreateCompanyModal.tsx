"use client";

import { useState } from "react";
import FormField from "../../components/FormField";
import { generateSlug, ValidationError } from "../../utils/validation";
import { Plan } from "../types";

interface CreateCompanyModalProps {
  onSave: (data: { name: string; slug: string; plan: string }) => Promise<void>;
  onClose: () => void;
}

export default function CreateCompanyModal({
  onSave,
  onClose,
}: CreateCompanyModalProps) {
  const [name, setName] = useState("");
  const [slug, setSlug] = useState("");
  const [plan, setPlan] = useState<Plan>("FREE");
  const [errors, setErrors] = useState<ValidationError[]>([]);
  const [isSubmitting, setIsSubmitting] = useState(false);

  const handleSave = async () => {
    setIsSubmitting(true);
    setErrors([]);

    const formData = {
      name: name.trim(),
      slug: slug.trim(),
      plan,
    };

    // Validação simples apenas para empresa
    const validation: { isValid: boolean; errors: ValidationError[] } = {
      isValid: true,
      errors: [],
    };

    if (!formData.name) {
      validation.isValid = false;
      validation.errors.push({
        field: "name",
        message: "Nome da empresa é obrigatório",
      });
    }

    if (!formData.slug) {
      validation.isValid = false;
      validation.errors.push({ field: "slug", message: "Slug é obrigatório" });
    }

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

  const handleClose = () => {
    setName("");
    setSlug("");
    setPlan("FREE");
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
                Criar Nova Empresa
              </h2>
              <button
                onClick={handleClose}
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

            {/* Nota sobre usuários */}
            <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
              <div className="flex items-start">
                <div className="flex-shrink-0">
                  <svg
                    className="h-5 w-5 text-blue-400"
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
                  <h4 className="text-sm font-medium text-blue-800">
                    Próximo passo
                  </h4>
                  <p className="text-sm text-blue-700 mt-1">
                    Após criar a empresa, você poderá adicionar usuários na
                    seção de gestão de usuários.
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
              {isSubmitting ? "Criando..." : "Criar Empresa"}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
