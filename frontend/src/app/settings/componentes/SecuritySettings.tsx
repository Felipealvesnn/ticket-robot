"use client";

import api from "@/services/api";
import { Eye, EyeOff, Key, Lock, Save, Shield } from "lucide-react";
import { useState } from "react";
import { toast } from "react-toastify";

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

  // Função para verificar a força da senha
  const getPasswordStrength = (password: string) => {
    if (!password) return { score: 0, text: "", color: "", feedback: "" };

    let score = 0;
    let feedback = [];

    // Critérios de força
    if (password.length >= 8) score += 1;
    else feedback.push("pelo menos 8 caracteres");

    if (/[a-z]/.test(password)) score += 1;
    else feedback.push("letras minúsculas");

    if (/[A-Z]/.test(password)) score += 1;
    else feedback.push("letras maiúsculas");

    if (/[0-9]/.test(password)) score += 1;
    else feedback.push("números");

    if (/[^A-Za-z0-9]/.test(password)) score += 1;
    else feedback.push("caracteres especiais");

    const strengthLevels = [
      { text: "Muito fraca", color: "text-red-600 bg-red-100" },
      { text: "Fraca", color: "text-orange-600 bg-orange-100" },
      { text: "Regular", color: "text-yellow-600 bg-yellow-100" },
      { text: "Boa", color: "text-blue-600 bg-blue-100" },
      { text: "Forte", color: "text-green-600 bg-green-100" },
      { text: "Muito forte", color: "text-green-700 bg-green-200" },
    ];

    const level = strengthLevels[Math.min(score, 5)];

    return {
      score,
      text: level.text,
      color: level.color,
      feedback:
        feedback.length > 0
          ? `Adicione: ${feedback.join(", ")}`
          : "Senha forte!",
    };
  };

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
    // Validações mais rigorosas
    if (!passwordData.currentPassword.trim()) {
      setError("Senha atual é obrigatória");
      return;
    }

    if (!passwordData.newPassword.trim()) {
      setError("Nova senha é obrigatória");
      return;
    }

    if (!passwordData.confirmPassword.trim()) {
      setError("Confirmação de senha é obrigatória");
      return;
    }

    if (passwordData.newPassword !== passwordData.confirmPassword) {
      setError("As senhas não coincidem");
      return;
    }

    if (passwordData.newPassword.length < 6) {
      setError("A nova senha deve ter pelo menos 6 caracteres");
      return;
    }

    if (passwordData.currentPassword === passwordData.newPassword) {
      setError("A nova senha deve ser diferente da senha atual");
      return;
    }

    // Verificar se a senha é muito fraca
    const strength = getPasswordStrength(passwordData.newPassword);
    if (strength.score < 2) {
      setError("A senha é muito fraca. Por favor, use uma senha mais forte.");
      return;
    }

    setIsLoading(true);
    setError(null);
    setSuccess(null);

    try {
      const response = await api.auth.changePassword({
        currentPassword: passwordData.currentPassword,
        newPassword: passwordData.newPassword,
      });

      setSuccess("Senha alterada com sucesso!");
      toast.success(
        "Senha alterada com sucesso! Por segurança, você será redirecionado para o login."
      );

      setPasswordData({
        currentPassword: "",
        newPassword: "",
        confirmPassword: "",
      });
      onUnsavedChanges(false);

      // Fazer logout automático após troca de senha (segurança)
      setTimeout(() => {
        // Limpar tokens do localStorage
        localStorage.removeItem("auth_token");
        localStorage.removeItem("refresh_token");

        // Redirecionar para login
        window.location.href = "/auth/login";
      }, 2000);
    } catch (error: any) {
      console.error("Erro ao alterar senha:", error);

      // Tratar diferentes tipos de erro
      if (error.response?.status === 401) {
        setError("Senha atual incorreta");
      } else if (error.response?.status === 409) {
        setError("A nova senha deve ser diferente da senha atual");
      } else if (error.response?.status === 400) {
        setError(
          "Dados inválidos. Verifique se a senha atende aos requisitos."
        );
      } else if (error.response?.data?.message) {
        setError(error.response.data.message);
      } else {
        setError("Erro ao alterar senha. Tente novamente.");
      }
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

        <div className="bg-blue-50 border border-blue-200 rounded-lg p-4 mb-4">
          <h4 className="font-medium text-blue-900 mb-2">Dicas de Segurança</h4>
          <ul className="text-sm text-blue-800 space-y-1">
            <li>• Use pelo menos 8 caracteres</li>
            <li>• Combine maiúsculas, minúsculas, números e símbolos</li>
            <li>• Evite informações pessoais (nome, data de nascimento)</li>
            <li>• Não reutilize senhas de outras contas</li>
          </ul>
        </div>

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

            {/* Indicador de força da senha */}
            {passwordData.newPassword && (
              <div className="mt-2">
                <div className="flex items-center gap-2 mb-1">
                  <div className="flex-1 bg-gray-200 rounded-full h-2">
                    <div
                      className={`h-2 rounded-full transition-all duration-300 ${
                        getPasswordStrength(passwordData.newPassword).score <= 2
                          ? "bg-red-500"
                          : getPasswordStrength(passwordData.newPassword)
                              .score <= 3
                          ? "bg-yellow-500"
                          : "bg-green-500"
                      }`}
                      style={{
                        width: `${
                          (getPasswordStrength(passwordData.newPassword).score /
                            5) *
                          100
                        }%`,
                      }}
                    />
                  </div>
                  <span
                    className={`text-xs px-2 py-1 rounded ${
                      getPasswordStrength(passwordData.newPassword).color
                    }`}
                  >
                    {getPasswordStrength(passwordData.newPassword).text}
                  </span>
                </div>
                <p className="text-xs text-gray-500">
                  {getPasswordStrength(passwordData.newPassword).feedback}
                </p>
              </div>
            )}

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
            !passwordData.confirmPassword ||
            passwordData.newPassword !== passwordData.confirmPassword ||
            getPasswordStrength(passwordData.newPassword).score < 2
          }
          className={`flex items-center gap-2 px-4 py-2 rounded-lg transition-colors ${
            isLoading ||
            !passwordData.currentPassword ||
            !passwordData.newPassword ||
            !passwordData.confirmPassword ||
            passwordData.newPassword !== passwordData.confirmPassword ||
            getPasswordStrength(passwordData.newPassword).score < 2
              ? "bg-gray-400 text-gray-200 cursor-not-allowed"
              : "bg-blue-600 text-white hover:bg-blue-700"
          }`}
        >
          <Save size={16} />
          {isLoading ? "Alterando..." : "Alterar Senha"}
        </button>

        {/* Aviso sobre segurança */}
        {passwordData.newPassword && passwordData.confirmPassword && (
          <div className="mt-2">
            {passwordData.newPassword !== passwordData.confirmPassword ? (
              <p className="text-sm text-red-600">As senhas não coincidem</p>
            ) : getPasswordStrength(passwordData.newPassword).score < 2 ? (
              <p className="text-sm text-orange-600">
                Senha muito fraca. Use uma senha mais forte para continuar.
              </p>
            ) : (
              <p className="text-sm text-green-600">✓ Senha válida</p>
            )}
          </div>
        )}
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
