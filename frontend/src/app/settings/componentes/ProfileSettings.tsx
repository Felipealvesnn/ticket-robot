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
import { useForm } from "react-hook-form";

interface ProfileSettingsProps {
  onUnsavedChanges: (hasChanges: boolean) => void;
}

interface ProfileFormData {
  name: string;
  email: string;
  avatar?: string;
  phone?: string;
  address?: string;
}

export default function ProfileSettings({
  onUnsavedChanges,
}: ProfileSettingsProps) {
  const { user, setUser, setCurrentCompany } = useAuthStore();
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState<string | null>(null);

  // � React Hook Form setup
  const {
    register,
    handleSubmit,
    watch,
    setValue,
    formState: { errors, isDirty },
    reset,
  } = useForm<ProfileFormData>({
    defaultValues: {
      name: "",
      email: "",
      avatar: "",
      phone: "",
      address: "",
    },
  });

  // Resetar formulário quando user mudar
  useEffect(() => {
    if (user) {
      console.log("🔄 Resetando formulário com dados do usuário...");
      reset({
        name: user.name || "",
        email: user.email || "",
        avatar: user.avatar || "",
        phone: user.phone || "",
        address: user.address || "",
      });
    }
  }, [user, reset]);

  // Verificar se usuário pode editar empresa (apenas SUPER_ADMIN e COMPANY_OWNER)
  const canEditCompany =
    user?.currentCompany?.role?.name === "SUPER_ADMIN" ||
    user?.currentCompany?.role?.name === "COMPANY_OWNER";

  // DEBUG: Log das permissões do usuário
  useEffect(() => {
    console.log("🔐 [ProfileSettings] Permissões do usuário:", {
      role: user?.currentCompany?.role?.name,
      canEditCompany,
      permissions: user?.currentCompany?.role?.permissions,
      allCompanies: user?.companies,
      totalCompanies: user?.companies?.length || 0,
      currentCompanyId: user?.currentCompany?.id,
    });
  }, [user, canEditCompany]);

  // Monitorar mudanças no formulário
  const watchedFields = watch();
  useEffect(() => {
    console.log("📝 [ProfileSettings] Formulário mudou:", watchedFields);
    onUnsavedChanges(isDirty);
  }, [isDirty, onUnsavedChanges, watchedFields]);

  const handleInputChange = (field: string, value: string) => {
    setValue(field as keyof ProfileFormData, value);
    setError(null);
    setSuccess(null);
  };

  const onSubmit = async (data: ProfileFormData) => {
    setIsLoading(true);
    setError(null);
    setSuccess(null);

    try {
      console.log("💾 Salvando perfil:", data);

      // Fazer chamada real para a API
      const updatedUser = await api.users.updateMyProfile({
        name: data.name,
        email: data.email,
        avatar: data.avatar || undefined,
        phone: data.phone || undefined,
        address: data.address || undefined,
      });

      setSuccess("Perfil atualizado com sucesso!");

      // Atualizar o store de autenticação com os novos dados
      const updatedUserData = {
        ...user!,
        ...updatedUser,
        avatar: updatedUser.avatar || undefined,
        phone: updatedUser.phone || undefined,
        address: updatedUser.address || undefined,
      };
      setUser(updatedUserData);

      // Resetar o estado dirty do formulário
      reset(data);
      onUnsavedChanges(false);
    } catch (error) {
      setError(
        error instanceof Error ? error.message : "Erro ao atualizar perfil"
      );
    } finally {
      setIsLoading(false);
    }
  };

  const handleCompanyChange = async (companyId: string) => {
    try {
      setIsLoading(true);
      console.log("🏢 Trocando para empresa:", companyId);

      // Chamar a função do store para trocar empresa
      await setCurrentCompany(companyId);

      // Atualizar o currentCompany no objeto user local
      const selectedCompany = user?.companies?.find((c) => c.id === companyId);
      if (selectedCompany && user) {
        setUser({
          ...user,
          currentCompany: selectedCompany,
        });
      }

      console.log("✅ Empresa alterada com sucesso!");
      setSuccess("Empresa alterada com sucesso!");
    } catch (error) {
      console.error("❌ Erro ao trocar empresa:", error);
      setError("Erro ao trocar empresa. Tente novamente.");
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
        setValue("avatar", reader.result as string);
      };
      reader.readAsDataURL(file);
    }
  };

  return (
    <form onSubmit={handleSubmit(onSubmit)} className="space-y-6">
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
            {watchedFields.avatar ? (
              <img
                src={watchedFields.avatar}
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
              {...register("name", { required: "Nome é obrigatório" })}
              placeholder="Seu nome completo"
              className="form-input"
            />
            {errors.name && (
              <p className="text-red-500 text-sm mt-1">{errors.name.message}</p>
            )}
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
                {...register("email", {
                  required: "Email é obrigatório",
                  pattern: {
                    value: /^[A-Z0-9._%+-]+@[A-Z0-9.-]+\.[A-Z]{2,}$/i,
                    message: "Email inválido",
                  },
                })}
                placeholder="seu@email.com"
                className="form-input-with-icon"
              />
            </div>
            {errors.email && (
              <p className="text-red-500 text-sm mt-1">
                {errors.email.message}
              </p>
            )}
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
                {...register("phone")}
                placeholder="(11) 99999-9999"
                className="form-input-with-icon"
              />
            </div>
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Empresa{" "}
              {canEditCompany && <span className="text-red-500">*</span>}
            </label>
            <div className="relative">
              <Building
                size={16}
                className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 z-10"
              />
              <select
                value={user?.currentCompany?.id || ""}
                onChange={(e) => handleCompanyChange(e.target.value)}
                className="form-input-with-icon appearance-none bg-white pr-10"
                disabled={!canEditCompany}
              >
                <option value="" disabled>
                  Selecione uma empresa
                </option>
                {user?.companies?.map((company) => (
                  <option key={company.id} value={company.id}>
                    {company.name} ({company.role.name})
                  </option>
                ))}
              </select>
              <div className="absolute inset-y-0 right-0 flex items-center pr-3 pointer-events-none">
                <svg
                  className="w-4 h-4 text-gray-400"
                  fill="none"
                  stroke="currentColor"
                  viewBox="0 0 24 24"
                >
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth={2}
                    d="M19 9l-7 7-7-7"
                  />
                </svg>
              </div>
            </div>
            <p className="text-xs text-gray-500 mt-1">
              {canEditCompany
                ? "Selecione a empresa que deseja gerenciar"
                : "Para trocar de empresa, entre em contato com o administrador"}
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
              {...register("address")}
              placeholder="Seu endereço completo"
              rows={3}
              className="form-input-with-icon resize-none"
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
          type="submit"
          disabled={isLoading}
          className="flex items-center gap-2 bg-blue-600 text-white px-6 py-2 rounded-lg hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
        >
          <Save size={16} />
          {isLoading ? "Salvando..." : "Salvar Alterações"}
        </button>
      </div>
    </form>
  );
}
