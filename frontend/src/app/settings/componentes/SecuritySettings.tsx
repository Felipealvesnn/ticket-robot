"use client";

import { Eye, EyeOff, Key, Lock, Save, Shield } from "lucide-react";
import { useState } from "react";

interface SecuritySettingsProps {
  onUnsavedChanges: (hasChanges: boolean) => void;
}

export default function SecuritySettings({
  onUnsavedChanges,
}: SecuritySettingsProps) {
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState<string | null>(null);
  const [showCurrentPassword, setShowCurrentPassword] = useState(false);
  const [showNewPassword, setShowNewPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);

  const [passwordData, setPasswordData] = useState({
    currentPassword: "",
    newPassword: "",
    confirmPassword: "",
  });

  const [twoFactorEnabled, setTwoFactorEnabled] = useState(false);

  const handlePasswordChange = (field: string, value: string) => {
    setPasswordData((prev) => ({ ...prev, [field]: value }));
    setError(null);
    setSuccess(null);

    // Detectar mudanças
    const hasChanges = Object.values({ ...passwordData, [field]: value }).some(
      (v) => v !== ""
    );
    onUnsavedChanges(hasChanges);
  };

  const handleChangePassword = async () => {
    if (passwordData.newPassword !== passwordData.confirmPassword) {
      setError("As senhas não coincidem");
      return;
    }

    if (passwordData.newPassword.length < 6) {
      setError("A nova senha deve ter pelo menos 6 caracteres");
      return;
    }

    setIsLoading(true);
    setError(null);

    try {
      // Aqui você faria a chamada para a API
      await new Promise((resolve) => setTimeout(resolve, 1000));

      setSuccess("Senha alterada com sucesso!");
      setPasswordData({
        currentPassword: "",
        newPassword: "",
        confirmPassword: "",
      });
      onUnsavedChanges(false);
    } catch (error) {
      setError("Erro ao alterar senha");
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="space-y-6">
      {/* Mensagens de feedback */}
      {error && (
        <div className="bg-red-50 border border-red-200 rounded-lg p-4">
          <p className="text-red-700">{error}</p>
        </div>
      )}

      {success && (
        <div className="bg-green-50 border border-green-200 rounded-lg p-4">
          <p className="text-green-700">{success}</p>
        </div>
      )}

      {/* Alterar Senha */}
      <div className="space-y-4">
        <h3 className="text-lg font-medium text-gray-900 flex items-center gap-2">
          <Key size={20} />
          Alterar Senha
        </h3>

        <div className="grid grid-cols-1 gap-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Senha Atual *
            </label>
            <div className="relative">
              <input
                type={showCurrentPassword ? "text" : "password"}
                value={passwordData.currentPassword}
                onChange={(e) =>
                  handlePasswordChange("currentPassword", e.target.value)
                }
                placeholder="Digite sua senha atual"
                className="w-full border border-gray-300 rounded-lg px-4 py-2 pr-10 focus:ring-2 focus:ring-blue-500 focus:border-transparent"
              />
              <button
                type="button"
                onClick={() => setShowCurrentPassword(!showCurrentPassword)}
                className="absolute right-3 top-1/2 transform -translate-y-1/2 text-gray-400 hover:text-gray-600"
              >
                {showCurrentPassword ? <EyeOff size={16} /> : <Eye size={16} />}
              </button>
            </div>
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Nova Senha *
            </label>
            <div className="relative">
              <input
                type={showNewPassword ? "text" : "password"}
                value={passwordData.newPassword}
                onChange={(e) =>
                  handlePasswordChange("newPassword", e.target.value)
                }
                placeholder="Digite sua nova senha"
                className="w-full border border-gray-300 rounded-lg px-4 py-2 pr-10 focus:ring-2 focus:ring-blue-500 focus:border-transparent"
              />
              <button
                type="button"
                onClick={() => setShowNewPassword(!showNewPassword)}
                className="absolute right-3 top-1/2 transform -translate-y-1/2 text-gray-400 hover:text-gray-600"
              >
                {showNewPassword ? <EyeOff size={16} /> : <Eye size={16} />}
              </button>
            </div>
            <p className="text-xs text-gray-500 mt-1">Mínimo de 6 caracteres</p>
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Confirmar Nova Senha *
            </label>
            <div className="relative">
              <input
                type={showConfirmPassword ? "text" : "password"}
                value={passwordData.confirmPassword}
                onChange={(e) =>
                  handlePasswordChange("confirmPassword", e.target.value)
                }
                placeholder="Confirme sua nova senha"
                className="w-full border border-gray-300 rounded-lg px-4 py-2 pr-10 focus:ring-2 focus:ring-blue-500 focus:border-transparent"
              />
              <button
                type="button"
                onClick={() => setShowConfirmPassword(!showConfirmPassword)}
                className="absolute right-3 top-1/2 transform -translate-y-1/2 text-gray-400 hover:text-gray-600"
              >
                {showConfirmPassword ? <EyeOff size={16} /> : <Eye size={16} />}
              </button>
            </div>
          </div>
        </div>

        <button
          onClick={handleChangePassword}
          disabled={
            isLoading ||
            !passwordData.currentPassword ||
            !passwordData.newPassword ||
            !passwordData.confirmPassword
          }
          className="flex items-center gap-2 bg-blue-600 text-white px-4 py-2 rounded-lg hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
        >
          <Save size={16} />
          {isLoading ? "Alterando..." : "Alterar Senha"}
        </button>
      </div>

      {/* Autenticação de Dois Fatores */}
      <div className="border-t border-gray-200 pt-6">
        <div className="space-y-4">
          <h3 className="text-lg font-medium text-gray-900 flex items-center gap-2">
            <Shield size={20} />
            Autenticação de Dois Fatores (2FA)
          </h3>

          <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
            <p className="text-blue-800 text-sm">
              A autenticação de dois fatores adiciona uma camada extra de
              segurança à sua conta, exigindo um código adicional além da sua
              senha.
            </p>
          </div>

          <div className="flex items-center justify-between p-4 bg-white border border-gray-200 rounded-lg">
            <div>
              <h4 className="font-medium text-gray-900">
                Autenticação de Dois Fatores
              </h4>
              <p className="text-sm text-gray-600">
                {twoFactorEnabled ? "Ativado" : "Desativado"}
              </p>
            </div>
            <button
              onClick={() => setTwoFactorEnabled(!twoFactorEnabled)}
              className={`relative inline-flex h-6 w-11 items-center rounded-full transition-colors ${
                twoFactorEnabled ? "bg-blue-600" : "bg-gray-200"
              }`}
            >
              <span
                className={`inline-block h-4 w-4 transform rounded-full bg-white transition-transform ${
                  twoFactorEnabled ? "translate-x-6" : "translate-x-1"
                }`}
              />
            </button>
          </div>

          {twoFactorEnabled && (
            <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-4">
              <p className="text-yellow-800 text-sm">
                <strong>Em desenvolvimento:</strong> A configuração de 2FA será
                implementada em breve.
              </p>
            </div>
          )}
        </div>
      </div>

      {/* Sessões Ativas */}
      <div className="border-t border-gray-200 pt-6">
        <div className="space-y-4">
          <h3 className="text-lg font-medium text-gray-900 flex items-center gap-2">
            <Lock size={20} />
            Sessões Ativas
          </h3>

          <div className="space-y-3">
            <div className="flex items-center justify-between p-4 bg-white border border-gray-200 rounded-lg">
              <div>
                <h4 className="font-medium text-gray-900">Esta sessão</h4>
                <p className="text-sm text-gray-600">
                  Chrome em Windows • Último acesso: agora
                </p>
              </div>
              <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-green-100 text-green-800">
                Atual
              </span>
            </div>

            <div className="flex items-center justify-between p-4 bg-white border border-gray-200 rounded-lg">
              <div>
                <h4 className="font-medium text-gray-900">Mobile App</h4>
                <p className="text-sm text-gray-600">
                  iOS • Último acesso: há 2 horas
                </p>
              </div>
              <button className="text-red-600 hover:text-red-900 text-sm font-medium">
                Desconectar
              </button>
            </div>
          </div>

          <button className="text-red-600 hover:text-red-900 text-sm font-medium">
            Desconectar de todas as outras sessões
          </button>
        </div>
      </div>
    </div>
  );
}
