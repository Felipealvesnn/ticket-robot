"use client";

import { useAuthStore } from "@/store/auth";
import { useToastStore } from "@/store/toast";
import { Eye, EyeOff, Lock } from "lucide-react";
import { useState } from "react";

const FirstLoginModal = () => {
  const { user, showFirstLoginModal, changeFirstLoginPassword } =
    useAuthStore();
  const [formData, setFormData] = useState({
    currentPassword: "",
    newPassword: "",
    confirmPassword: "",
  });
  const [showPasswords, setShowPasswords] = useState({
    current: false,
    new: false,
    confirm: false,
  });
  const [isLoading, setIsLoading] = useState(false);
  const [errors, setErrors] = useState<Record<string, string>>({});

  const { success, error: showError } = useToastStore();

  // Não mostrar se não está aberto ou usuário não está em primeiro login
  if (!showFirstLoginModal || !user?.isFirstLogin) {
    return null;
  }

  // Validações
  const validateForm = () => {
    const newErrors: Record<string, string> = {};

    if (!formData.currentPassword.trim()) {
      newErrors.currentPassword = "Senha atual é obrigatória";
    }

    if (!formData.newPassword.trim()) {
      newErrors.newPassword = "Nova senha é obrigatória";
    } else if (formData.newPassword.length < 8) {
      newErrors.newPassword = "Nova senha deve ter pelo menos 8 caracteres";
    } else if (!/(?=.*[a-z])(?=.*[A-Z])(?=.*\d)/.test(formData.newPassword)) {
      newErrors.newPassword =
        "Nova senha deve conter ao menos: 1 maiúscula, 1 minúscula e 1 número";
    }

    if (!formData.confirmPassword.trim()) {
      newErrors.confirmPassword = "Confirmação de senha é obrigatória";
    } else if (formData.newPassword !== formData.confirmPassword) {
      newErrors.confirmPassword = "Senhas não coincidem";
    }

    if (formData.currentPassword === formData.newPassword) {
      newErrors.newPassword = "Nova senha deve ser diferente da atual";
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!validateForm()) {
      return;
    }

    setIsLoading(true);

    try {
      const token = localStorage.getItem("authToken");

      const response = await fetch("/api/auth/change-first-login-password", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify({
          currentPassword: formData.currentPassword,
          newPassword: formData.newPassword,
        }),
      });

      const data = await response.json();

      if (response.ok) {
        // Atualizar tokens se retornados
        if (data.tokens) {
          localStorage.setItem("authToken", data.tokens.accessToken);
          localStorage.setItem("refreshToken", data.tokens.refreshToken);
        }

        success("Senha alterada!", "Sua senha foi alterada com sucesso");
        onPasswordChanged();
      } else {
        showError("Erro ao alterar senha", data.message || "Tente novamente");
      }
    } catch (error) {
      console.error("Erro ao alterar senha:", error);
      showError("Erro de conexão", "Não foi possível alterar a senha");
    } finally {
      setIsLoading(false);
    }
  };

  const handleChange = (field: string, value: string) => {
    setFormData((prev) => ({ ...prev, [field]: value }));
    // Limpar erro do campo ao digitar
    if (errors[field]) {
      setErrors((prev) => ({ ...prev, [field]: "" }));
    }
  };

  const togglePasswordVisibility = (field: "current" | "new" | "confirm") => {
    setShowPasswords((prev) => ({ ...prev, [field]: !prev[field] }));
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
      <div className="bg-white rounded-lg shadow-xl max-w-md w-full p-6">
        {/* Header */}
        <div className="text-center mb-6">
          <div className="mx-auto w-16 h-16 bg-gradient-to-r from-orange-400 to-red-500 rounded-full flex items-center justify-center mb-4">
            <Lock className="w-8 h-8 text-white" />
          </div>
          <h2 className="text-2xl font-bold text-gray-900">Primeiro Login</h2>
          <p className="text-sm text-gray-600 mt-2">
            Para sua segurança, é necessário alterar a senha padrão
          </p>
          <p className="text-xs text-gray-500 mt-1">{userEmail}</p>
        </div>

        {/* Form */}
        <form onSubmit={handleSubmit} className="space-y-4">
          {/* Senha Atual */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Senha Atual
            </label>
            <div className="relative">
              <input
                type={showPasswords.current ? "text" : "password"}
                value={formData.currentPassword}
                onChange={(e) =>
                  handleChange("currentPassword", e.target.value)
                }
                className={`w-full px-3 py-2 pr-10 border rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 transition-colors ${
                  errors.currentPassword ? "border-red-300" : "border-gray-300"
                }`}
                placeholder="Digite a senha atual (padrão: 123)"
              />
              <button
                type="button"
                onClick={() => togglePasswordVisibility("current")}
                className="absolute inset-y-0 right-0 pr-3 flex items-center"
              >
                {showPasswords.current ? (
                  <EyeOff className="w-4 h-4 text-gray-400" />
                ) : (
                  <Eye className="w-4 h-4 text-gray-400" />
                )}
              </button>
            </div>
            {errors.currentPassword && (
              <p className="text-red-500 text-xs mt-1">
                {errors.currentPassword}
              </p>
            )}
          </div>

          {/* Nova Senha */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Nova Senha
            </label>
            <div className="relative">
              <input
                type={showPasswords.new ? "text" : "password"}
                value={formData.newPassword}
                onChange={(e) => handleChange("newPassword", e.target.value)}
                className={`w-full px-3 py-2 pr-10 border rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 transition-colors ${
                  errors.newPassword ? "border-red-300" : "border-gray-300"
                }`}
                placeholder="Digite sua nova senha"
              />
              <button
                type="button"
                onClick={() => togglePasswordVisibility("new")}
                className="absolute inset-y-0 right-0 pr-3 flex items-center"
              >
                {showPasswords.new ? (
                  <EyeOff className="w-4 h-4 text-gray-400" />
                ) : (
                  <Eye className="w-4 h-4 text-gray-400" />
                )}
              </button>
            </div>
            {errors.newPassword && (
              <p className="text-red-500 text-xs mt-1">{errors.newPassword}</p>
            )}
          </div>

          {/* Confirmar Senha */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Confirmar Nova Senha
            </label>
            <div className="relative">
              <input
                type={showPasswords.confirm ? "text" : "password"}
                value={formData.confirmPassword}
                onChange={(e) =>
                  handleChange("confirmPassword", e.target.value)
                }
                className={`w-full px-3 py-2 pr-10 border rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 transition-colors ${
                  errors.confirmPassword ? "border-red-300" : "border-gray-300"
                }`}
                placeholder="Confirme sua nova senha"
              />
              <button
                type="button"
                onClick={() => togglePasswordVisibility("confirm")}
                className="absolute inset-y-0 right-0 pr-3 flex items-center"
              >
                {showPasswords.confirm ? (
                  <EyeOff className="w-4 h-4 text-gray-400" />
                ) : (
                  <Eye className="w-4 h-4 text-gray-400" />
                )}
              </button>
            </div>
            {errors.confirmPassword && (
              <p className="text-red-500 text-xs mt-1">
                {errors.confirmPassword}
              </p>
            )}
          </div>

          {/* Requisitos de Senha */}
          <div className="bg-gray-50 rounded-lg p-3">
            <p className="text-xs text-gray-600 font-medium mb-2">
              Requisitos da senha:
            </p>
            <ul className="text-xs text-gray-500 space-y-1">
              <li className="flex items-center">
                <div
                  className={`w-2 h-2 rounded-full mr-2 ${
                    formData.newPassword.length >= 8
                      ? "bg-green-500"
                      : "bg-gray-300"
                  }`}
                />
                Mínimo 8 caracteres
              </li>
              <li className="flex items-center">
                <div
                  className={`w-2 h-2 rounded-full mr-2 ${
                    /[A-Z]/.test(formData.newPassword)
                      ? "bg-green-500"
                      : "bg-gray-300"
                  }`}
                />
                Uma letra maiúscula
              </li>
              <li className="flex items-center">
                <div
                  className={`w-2 h-2 rounded-full mr-2 ${
                    /[a-z]/.test(formData.newPassword)
                      ? "bg-green-500"
                      : "bg-gray-300"
                  }`}
                />
                Uma letra minúscula
              </li>
              <li className="flex items-center">
                <div
                  className={`w-2 h-2 rounded-full mr-2 ${
                    /\d/.test(formData.newPassword)
                      ? "bg-green-500"
                      : "bg-gray-300"
                  }`}
                />
                Um número
              </li>
            </ul>
          </div>

          {/* Botão */}
          <button
            type="submit"
            disabled={isLoading}
            className="w-full py-3 px-4 bg-gradient-to-r from-blue-500 to-indigo-600 text-white font-medium rounded-lg hover:from-blue-600 hover:to-indigo-700 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2 disabled:opacity-50 disabled:cursor-not-allowed transition-all duration-200"
          >
            {isLoading ? (
              <div className="flex items-center justify-center">
                <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white mr-2" />
                Alterando senha...
              </div>
            ) : (
              "Alterar Senha"
            )}
          </button>
        </form>

        {/* Aviso */}
        <div className="mt-4 p-3 bg-yellow-50 border border-yellow-200 rounded-lg">
          <p className="text-xs text-yellow-700">
            <strong>Importante:</strong> Esta ação é obrigatória para sua
            segurança. O modal só será fechado após a alteração bem-sucedida da
            senha.
          </p>
        </div>
      </div>
    </div>
  );
};

export default FirstLoginModal;
