"use client";

import { XMarkIcon } from "@heroicons/react/24/outline";
import { useState } from "react";

interface CreateUserModalProps {
  onSave: (data: { email: string; name: string; password?: string }) => void;
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

  const handleSave = () => {
    if (!email.trim() || !name.trim()) {
      alert("Por favor, preencha todos os campos obrigatórios");
      return;
    }

    const userData: any = {
      email: email.trim(),
      name: name.trim(),
    };

    if (!generatePassword && password.trim()) {
      userData.password = password.trim();
    }

    onSave(userData);
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
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Email *
            </label>
            <input
              type="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
              placeholder="usuario@exemplo.com"
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Nome *
            </label>
            <input
              type="text"
              value={name}
              onChange={(e) => setName(e.target.value)}
              className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
              placeholder="Nome completo"
            />
          </div>

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
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Senha
                </label>
                <input
                  type="password"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                  placeholder="Digite uma senha"
                />
              </div>
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
            className="px-4 py-2 text-gray-700 bg-white border border-gray-300 rounded-lg hover:bg-gray-50"
          >
            Cancelar
          </button>
          <button
            onClick={handleSave}
            className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700"
          >
            Criar Usuário
          </button>
        </div>
      </div>
    </div>
  );
}
