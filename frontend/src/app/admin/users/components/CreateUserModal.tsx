"use client";

import { XMarkIcon } from "@heroicons/react/24/outline";
import { useState } from "react";
import FormField from "../../components/FormField";
import { validateUserForm, ValidationError } from "../../utils/validation";

interface CreateUserModalProps {
  onSave: (data: {
    email: string;
    name: string;
    password?: string;
  }) => Promise<void>;
  onClose: () => void;
}

export default function CreateUserModal({
  onSave,
  onClose,
}: CreateUserModalProps) {
  const [email, setEmail] = useState("");
  const [name, setName] = useState("");
  const [password, setPassword] = useState("");
  const [generatePassword, setGeneratePassword] = useState(true);
  const [errors, setErrors] = useState<ValidationError[]>([]);
  const [isSubmitting, setIsSubmitting] = useState(false);

  const handleSave = async () => {
    setIsSubmitting(true);
    setErrors([]);

    const formData = {
      email: email.trim(),
      name: name.trim(),
      ...(!generatePassword &&
        password.trim() && { password: password.trim() }),
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

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
      <div className="bg-white rounded-lg shadow-xl w-full max-w-md">
        {/* Header */}
        <div className="p-6 border-b">
          <div className="flex items-center justify-between">
            <h2 className="text-xl font-semibold text-gray-900">
              Criar Novo Usuário
            </h2>
            <button
              onClick={onClose}
              className="p-2 text-gray-400 hover:text-gray-600 rounded-lg hover:bg-gray-100"
            >
              <XMarkIcon className="w-5 h-5" />
            </button>
          </div>
        </div>

        {/* Body */}
        <div className="p-6 space-y-4">
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
            label="Nome"
            name="name"
            value={name}
            onChange={setName}
            placeholder="Nome completo"
            required
            errors={errors}
          />

          <div>
            <div className="flex items-center mb-2">
              <input
                type="checkbox"
                id="generatePassword"
                checked={generatePassword}
                onChange={(e) => setGeneratePassword(e.target.checked)}
                className="h-4 w-4 text-blue-600 focus:ring-blue-500 border-gray-300 rounded"
              />
              <label
                htmlFor="generatePassword"
                className="ml-2 text-sm text-gray-700"
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
                placeholder="Digite uma senha"
                errors={errors}
              />
            )}
          </div>

          <div className="text-sm text-gray-500">
            <p>* Campos obrigatórios</p>
            {generatePassword && (
              <p className="mt-1">
                Uma senha temporária será gerada automaticamente e o usuário
                deverá alterá-la no primeiro login.
              </p>
            )}
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
            {isSubmitting ? "Criando..." : "Criar Usuário"}
          </button>
        </div>
      </div>
    </div>
  );
}
