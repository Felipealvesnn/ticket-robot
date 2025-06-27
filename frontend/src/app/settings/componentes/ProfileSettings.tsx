"use client";

import api from "@/services/api";
import { useAuthStore } from "@/store/auth";
import {
  Building,
  Camera,
  Mail,
  MapPin,
  Phone,
  Save,
  User,
} from "lucide-react";
import { useEffect, useState } from "react";

interface ProfileSettingsProps {
  onUnsavedChanges: (hasChanges: boolean) => void;
}

export default function ProfileSettings({
  onUnsavedChanges,
}: ProfileSettingsProps) {
  const { user } = useAuthStore();
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState<string | null>(null);

  const [formData, setFormData] = useState({
    name: user?.name || "",
    email: user?.email || "",
    avatar: user?.avatar || "",
    phone: "",
    address: "",
  });

  // Detectar mudanças
  useEffect(() => {
    const hasChanges =
      formData.name !== (user?.name || "") ||
      formData.email !== (user?.email || "") ||
      formData.avatar !== (user?.avatar || "") ||
      formData.phone !== "" ||
      formData.address !== "";

    onUnsavedChanges(hasChanges);
  }, [formData, user, onUnsavedChanges]);

  const handleInputChange = (field: string, value: string) => {
    setFormData((prev) => ({ ...prev, [field]: value }));
    setError(null);
    setSuccess(null);
  };

  const handleSave = async () => {
    setIsLoading(true);
    setError(null);
    setSuccess(null);

    try {
      // Fazer chamada real para a API
      const updatedUser = await api.users.updateMyProfile({
        name: formData.name,
        email: formData.email,
        avatar: formData.avatar || undefined,
        phone: formData.phone || undefined,
        address: formData.address || undefined,
      });

      setSuccess("Perfil atualizado com sucesso!");
      onUnsavedChanges(false);

      // Aqui você poderia atualizar o store de autenticação com os novos dados
      // updateUserInStore(updatedUser);
    } catch (error) {
      setError(
        error instanceof Error ? error.message : "Erro ao atualizar perfil"
      );
    } finally {
      setIsLoading(false);
    }
  };

  const handleAvatarChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      // Aqui você implementaria o upload da imagem
      const reader = new FileReader();
      reader.onloadend = () => {
        setFormData((prev) => ({ ...prev, avatar: reader.result as string }));
      };
      reader.readAsDataURL(file);
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

      {/* Avatar */}
      <div className="flex items-center gap-6">
        <div className="relative">
          <div className="w-20 h-20 bg-gradient-to-r from-blue-500 to-purple-600 rounded-full flex items-center justify-center overflow-hidden">
            {formData.avatar ? (
              <img
                src={formData.avatar}
                alt="Avatar"
                className="w-full h-full object-cover"
              />
            ) : (
              <User size={32} className="text-white" />
            )}
          </div>
          <label
            htmlFor="avatar-upload"
            className="absolute -bottom-1 -right-1 w-8 h-8 bg-blue-600 rounded-full flex items-center justify-center cursor-pointer hover:bg-blue-700 transition-colors"
          >
            <Camera size={16} className="text-white" />
          </label>
          <input
            id="avatar-upload"
            type="file"
            accept="image/*"
            onChange={handleAvatarChange}
            className="hidden"
          />
        </div>
        <div>
          <h3 className="text-lg font-medium text-gray-900">Foto do Perfil</h3>
          <p className="text-sm text-gray-600">
            Clique no ícone da câmera para alterar sua foto
          </p>
        </div>
      </div>

      {/* Informações Pessoais */}
      <div className="space-y-4">
        <h3 className="text-lg font-medium text-gray-900 flex items-center gap-2">
          <User size={20} />
          Informações Pessoais
        </h3>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Nome Completo *
            </label>
            <input
              type="text"
              value={formData.name}
              onChange={(e) => handleInputChange("name", e.target.value)}
              placeholder="Seu nome completo"
              className="w-full border border-gray-300 rounded-lg px-4 py-2 focus:ring-2 focus:ring-blue-500 focus:border-transparent"
              required
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Email *
            </label>
            <div className="relative">
              <Mail
                size={16}
                className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400"
              />
              <input
                type="email"
                value={formData.email}
                onChange={(e) => handleInputChange("email", e.target.value)}
                placeholder="seu@email.com"
                className="w-full border border-gray-300 rounded-lg pl-10 pr-4 py-2 focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                required
              />
            </div>
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Telefone
            </label>
            <div className="relative">
              <Phone
                size={16}
                className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400"
              />
              <input
                type="tel"
                value={formData.phone}
                onChange={(e) => handleInputChange("phone", e.target.value)}
                placeholder="(11) 99999-9999"
                className="w-full border border-gray-300 rounded-lg pl-10 pr-4 py-2 focus:ring-2 focus:ring-blue-500 focus:border-transparent"
              />
            </div>
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Empresa
            </label>
            <div className="relative">
              <Building
                size={16}
                className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400"
              />
              <input
                type="text"
                value={user?.currentCompany?.name || ""}
                onChange={(e) => handleInputChange("company", e.target.value)}
                placeholder="Nome da empresa"
                className="w-full border border-gray-300 rounded-lg pl-10 pr-4 py-2 focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                disabled
              />
            </div>
            <p className="text-xs text-gray-500 mt-1">
              Para alterar a empresa, entre em contato com o administrador
            </p>
          </div>
        </div>

        <div>
          <label className="block text-sm font-medium text-gray-700 mb-2">
            Endereço
          </label>
          <div className="relative">
            <MapPin size={16} className="absolute left-3 top-3 text-gray-400" />
            <textarea
              value={formData.address}
              onChange={(e) => handleInputChange("address", e.target.value)}
              placeholder="Seu endereço completo"
              rows={3}
              className="w-full border border-gray-300 rounded-lg pl-10 pr-4 py-2 focus:ring-2 focus:ring-blue-500 focus:border-transparent resize-none"
            />
          </div>
        </div>
      </div>

      {/* Informações da Conta */}
      <div className="space-y-4">
        <h3 className="text-lg font-medium text-gray-900">
          Informações da Conta
        </h3>

        <div className="bg-gray-50 rounded-lg p-4 space-y-2">
          <div className="flex justify-between">
            <span className="text-sm text-gray-600">ID da Conta:</span>
            <span className="text-sm font-mono text-gray-900">{user?.id}</span>
          </div>
          <div className="flex justify-between">
            <span className="text-sm text-gray-600">Cargo:</span>
            <span className="text-sm text-gray-900">
              {user?.currentCompany?.role?.name || "N/A"}
            </span>
          </div>
          <div className="flex justify-between">
            <span className="text-sm text-gray-600">Membro desde:</span>
            <span className="text-sm text-gray-900">
              {new Date().toLocaleDateString("pt-BR")}
            </span>
          </div>
        </div>
      </div>

      {/* Botão de Salvar */}
      <div className="flex justify-end pt-6 border-t border-gray-200">
        <button
          onClick={handleSave}
          disabled={isLoading}
          className="flex items-center gap-2 bg-blue-600 text-white px-6 py-2 rounded-lg hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
        >
          <Save size={16} />
          {isLoading ? "Salvando..." : "Salvar Alterações"}
        </button>
      </div>
    </div>
  );
}
