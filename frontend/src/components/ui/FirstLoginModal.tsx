"use client";

import { useAuthStore } from "@/store/auth";
import { useToastStore } from "@/store/toast";
import { yupResolver } from "@hookform/resolvers/yup";
import { Eye, EyeOff, Lock } from "lucide-react";
import { useState } from "react";
import { Controller, useForm } from "react-hook-form";
import * as yup from "yup";

// Schema de validação
const schema = yup.object({
  currentPassword: yup.string().required("Senha atual é obrigatória"),
  newPassword: yup
    .string()
    .required("Nova senha é obrigatória")
    .min(8, "Nova senha deve ter pelo menos 8 caracteres")
    .matches(
      /(?=.*[a-z])(?=.*[A-Z])(?=.*\d)/,
      "Nova senha deve conter ao menos: 1 maiúscula, 1 minúscula e 1 número"
    )
    .test(
      "different-from-current",
      "Nova senha deve ser diferente da atual",
      function (value) {
        return value !== this.parent.currentPassword;
      }
    ),
  confirmPassword: yup
    .string()
    .required("Confirmação de senha é obrigatória")
    .oneOf([yup.ref("newPassword")], "Senhas não coincidem"),
});

type FormData = yup.InferType<typeof schema>;

const FirstLoginModal = () => {
  const { user, showFirstLoginModal, changeFirstLoginPassword } =
    useAuthStore();
  const { success, error: showError } = useToastStore();

  const [showPasswords, setShowPasswords] = useState({
    current: false,
    new: false,
    confirm: false,
  });
  const [isLoading, setIsLoading] = useState(false);

  const {
    control,
    handleSubmit,
    watch,
    formState: { errors },
  } = useForm<FormData>({
    resolver: yupResolver(schema),
    defaultValues: {
      currentPassword: "",
      newPassword: "",
      confirmPassword: "",
    },
  });

  const newPassword = watch("newPassword");

  // Não mostrar se não está aberto ou usuário não está em primeiro login
  if (!showFirstLoginModal || !user?.isFirstLogin) {
    return null;
  }

  const onSubmit = async (data: FormData) => {
    setIsLoading(true);
    try {
      await changeFirstLoginPassword(data.currentPassword, data.newPassword);
      success("Senha alterada!", "Sua senha foi alterada com sucesso");
    } catch (error: any) {
      console.error("Erro ao alterar senha:", error);
      showError("Erro ao alterar senha", error.message || "Tente novamente");
    } finally {
      setIsLoading(false);
    }
  };

  const togglePasswordVisibility = (field: "current" | "new" | "confirm") => {
    setShowPasswords((prev) => ({ ...prev, [field]: !prev[field] }));
  };

  const passwordRequirements = [
    {
      label: "Mínimo 8 caracteres",
      met: (newPassword || "").length >= 8,
    },
    {
      label: "Uma letra maiúscula",
      met: /[A-Z]/.test(newPassword || ""),
    },
    {
      label: "Uma letra minúscula",
      met: /[a-z]/.test(newPassword || ""),
    },
    {
      label: "Um número",
      met: /\d/.test(newPassword || ""),
    },
  ];

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
          <p className="text-xs text-gray-500 mt-1">{user?.email}</p>
        </div>

        {/* Form */}
        <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
          {/* Senha Atual */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Senha Atual
            </label>
            <div className="relative">
              <Controller
                name="currentPassword"
                control={control}
                render={({ field }) => (
                  <input
                    {...field}
                    type={showPasswords.current ? "text" : "password"}
                    className={`w-full px-3 py-2 pr-10 border rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 transition-colors ${
                      errors.currentPassword
                        ? "border-red-300"
                        : "border-gray-300"
                    }`}
                    placeholder="Digite a senha atual (padrão: 123)"
                  />
                )}
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
                {errors.currentPassword.message}
              </p>
            )}
          </div>

          {/* Nova Senha */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Nova Senha
            </label>
            <div className="relative">
              <Controller
                name="newPassword"
                control={control}
                render={({ field }) => (
                  <input
                    {...field}
                    type={showPasswords.new ? "text" : "password"}
                    className={`w-full px-3 py-2 pr-10 border rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 transition-colors ${
                      errors.newPassword ? "border-red-300" : "border-gray-300"
                    }`}
                    placeholder="Digite sua nova senha"
                  />
                )}
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
              <p className="text-red-500 text-xs mt-1">
                {errors.newPassword.message}
              </p>
            )}
          </div>

          {/* Confirmar Senha */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Confirmar Nova Senha
            </label>
            <div className="relative">
              <Controller
                name="confirmPassword"
                control={control}
                render={({ field }) => (
                  <input
                    {...field}
                    type={showPasswords.confirm ? "text" : "password"}
                    className={`w-full px-3 py-2 pr-10 border rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 transition-colors ${
                      errors.confirmPassword
                        ? "border-red-300"
                        : "border-gray-300"
                    }`}
                    placeholder="Confirme sua nova senha"
                  />
                )}
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
                {errors.confirmPassword.message}
              </p>
            )}
          </div>

          {/* Requisitos de Senha */}
          <div className="bg-gray-50 rounded-lg p-3">
            <p className="text-xs text-gray-600 font-medium mb-2">
              Requisitos da senha:
            </p>
            <ul className="text-xs text-gray-500 space-y-1">
              {passwordRequirements.map((req, index) => (
                <li key={index} className="flex items-center">
                  <div
                    className={`w-2 h-2 rounded-full mr-2 ${
                      req.met ? "bg-green-500" : "bg-gray-300"
                    }`}
                  />
                  {req.label}
                </li>
              ))}
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
