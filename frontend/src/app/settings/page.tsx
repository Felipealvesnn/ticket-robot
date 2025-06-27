"use client";

import { useAuthStore } from "@/store/auth";
import {
  Bell,
  ChevronRight,
  Clock,
  Palette,
  Save,
  Settings as SettingsIcon,
  Shield,
  User,
  UserMinus,
} from "lucide-react";
import { useEffect, useState } from "react";
import AppearanceSettings from "./componentes/AppearanceSettings";
import IgnoredContactsSettings from "./componentes/IgnoredContactsSettings";
import NotificationSettings from "./componentes/NotificationSettings";
import ProfileSettings from "./componentes/ProfileSettings";
import SecuritySettings from "./componentes/SecuritySettings";
import SystemSettings from "./componentes/SystemSettings";

type SettingsSection =
  | "profile"
  | "security"
  | "ignored-contacts"
  | "notifications"
  | "business-hours"
  | "system"
  | "appearance";

const settingsSections = [
  {
    id: "profile" as SettingsSection,
    title: "Perfil",
    description: "Gerencie suas informações pessoais e de conta",
    icon: User,
    color: "blue",
  },
  {
    id: "security" as SettingsSection,
    title: "Segurança",
    description: "Senha, autenticação e permissões",
    icon: Shield,
    color: "green",
  },
  {
    id: "ignored-contacts" as SettingsSection,
    title: "Contatos Ignorados",
    description: "Números que o bot deve ignorar",
    icon: UserMinus,
    color: "red",
  },
  {
    id: "notifications" as SettingsSection,
    title: "Notificações",
    description: "Configure alertas e notificações",
    icon: Bell,
    color: "yellow",
  },
  {
    id: "business-hours" as SettingsSection,
    title: "Horários de Funcionamento",
    description: "Configure quando o atendimento humano está disponível",
    icon: Clock,
    color: "green",
    adminOnly: true, // 🔒 Apenas para administradores
  },
  {
    id: "system" as SettingsSection,
    title: "Sistema",
    description: "Configurações gerais do sistema",
    icon: SettingsIcon,
    color: "gray",
    adminOnly: true, // 🔒 Apenas para administradores
  },
  {
    id: "appearance" as SettingsSection,
    title: "Aparência",
    description: "Tema, idioma e personalização",
    icon: Palette,
    color: "purple",
  },
];

export default function SettingsPage() {
  const { user } = useAuthStore();
  const [activeSection, setActiveSection] =
    useState<SettingsSection>("profile");
  const [hasUnsavedChanges, setHasUnsavedChanges] = useState(false);

  // Verificar se o usuário tem permissões administrativas
  const isAdmin = () => {
    if (!user?.currentCompany?.role?.name) return false;

    const adminRoles = ["SUPER_ADMIN", "COMPANY_OWNER", "COMPANY_ADMIN"];

    return adminRoles.includes(user.currentCompany.role.name);
  };

  // Filtrar seções baseado nas permissões
  const availableSections = settingsSections.filter((section) => {
    // Se a seção requer admin e o usuário não é admin, ocultar
    if (section.adminOnly && !isAdmin()) {
      return false;
    }
    return true;
  });

  // Garantir que a seção ativa seja válida para o usuário
  useEffect(() => {
    const isActiveSectionAvailable = availableSections.some(
      (section) => section.id === activeSection
    );

    if (!isActiveSectionAvailable && availableSections.length > 0) {
      setActiveSection(availableSections[0].id);
    }
  }, [availableSections, activeSection]);

  const renderSettingsContent = () => {
    switch (activeSection) {
      case "profile":
        return <ProfileSettings onUnsavedChanges={setHasUnsavedChanges} />;
      case "security":
        return <SecuritySettings onUnsavedChanges={setHasUnsavedChanges} />;
      case "ignored-contacts":
        return (
          <IgnoredContactsSettings onUnsavedChanges={setHasUnsavedChanges} />
        );
      case "notifications":
        return <NotificationSettings onUnsavedChanges={setHasUnsavedChanges} />;
      case "business-hours":
        return (
          <div className="space-y-6">
            <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
              <h3 className="text-lg font-medium text-blue-900 mb-2">
                🕐 Horários de Funcionamento
              </h3>
              <p className="text-blue-700">
                Configure os horários em que o atendimento humano está
                disponível. Esta funcionalidade estará disponível em breve!
              </p>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {[
                "Segunda",
                "Terça",
                "Quarta",
                "Quinta",
                "Sexta",
                "Sábado",
                "Domingo",
              ].map((dia, index) => (
                <div
                  key={dia}
                  className="p-4 border border-gray-200 rounded-lg"
                >
                  <div className="flex items-center justify-between mb-3">
                    <h4 className="font-medium text-gray-900">{dia}</h4>
                    <button className="text-blue-600 hover:text-blue-800">
                      {index < 5 ? "🟢 Ativo" : "🔴 Inativo"}
                    </button>
                  </div>
                  {index < 5 && (
                    <div className="space-y-2 text-sm text-gray-600">
                      <p>Abertura: 08:00</p>
                      <p>Fechamento: 17:00</p>
                      <p>Almoço: 12:00 - 13:00</p>
                    </div>
                  )}
                </div>
              ))}
            </div>
          </div>
        );
      case "system":
        return <SystemSettings onUnsavedChanges={setHasUnsavedChanges} />;
      case "appearance":
        return <AppearanceSettings onUnsavedChanges={setHasUnsavedChanges} />;
      default:
        return <ProfileSettings onUnsavedChanges={setHasUnsavedChanges} />;
    }
  };

  const getColorClasses = (color: string) => {
    const colorMap = {
      blue: "bg-blue-100 text-blue-600 border-blue-200",
      green: "bg-green-100 text-green-600 border-green-200",
      red: "bg-red-100 text-red-600 border-red-200",
      yellow: "bg-yellow-100 text-yellow-600 border-yellow-200",
      gray: "bg-gray-100 text-gray-600 border-gray-200",
      purple: "bg-purple-100 text-purple-600 border-purple-200",
    };
    return colorMap[color as keyof typeof colorMap] || colorMap.gray;
  };

  return (
    <div className="container mx-auto p-6">
      {/* Header */}
      <div className="mb-8">
        <h1 className="text-3xl font-bold text-gray-900">Configurações</h1>
        <p className="text-gray-600 mt-2">
          Personalize sua experiência e gerencie suas preferências
        </p>
      </div>

      {/* Alert para mudanças não salvas */}
      {hasUnsavedChanges && (
        <div className="mb-6 bg-yellow-50 border border-yellow-200 rounded-lg p-4">
          <div className="flex items-center gap-2">
            <Save className="text-yellow-600" size={20} />
            <p className="text-yellow-800 font-medium">
              Você tem alterações não salvas
            </p>
          </div>
          <p className="text-yellow-700 text-sm mt-1">
            Lembre-se de salvar suas alterações antes de sair desta seção.
          </p>
        </div>
      )}

      <div className="grid grid-cols-1 lg:grid-cols-4 gap-6">
        {/* Sidebar de navegação */}
        <div className="lg:col-span-1">
          <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-2">
            <nav className="space-y-1">
              {availableSections.map((section) => {
                const Icon = section.icon;
                const isActive = activeSection === section.id;

                return (
                  <button
                    key={section.id}
                    onClick={() => setActiveSection(section.id)}
                    className={`w-full flex items-center justify-between p-3 rounded-lg transition-all duration-200 text-left ${
                      isActive
                        ? "bg-blue-50 text-blue-700 border border-blue-200"
                        : "text-gray-700 hover:bg-gray-50 hover:text-blue-600"
                    }`}
                  >
                    <div className="flex items-center gap-3">
                      <div
                        className={`p-2 rounded-lg ${
                          isActive
                            ? getColorClasses(section.color)
                            : "bg-gray-100 text-gray-500"
                        }`}
                      >
                        <Icon size={16} />
                      </div>
                      <div className="hidden lg:block">
                        <p className="font-medium text-sm">{section.title}</p>
                        <p className="text-xs text-gray-500 mt-0.5 line-clamp-2">
                          {section.description}
                        </p>
                      </div>
                    </div>
                    <ChevronRight
                      size={16}
                      className={`hidden lg:block transition-transform ${
                        isActive ? "rotate-90" : ""
                      }`}
                    />
                  </button>
                );
              })}
            </nav>
          </div>
        </div>

        {/* Conteúdo principal */}
        <div className="lg:col-span-3">
          <div className="bg-white rounded-lg shadow-sm border border-gray-200">
            {/* Header da seção */}
            <div className="p-6 border-b border-gray-200">
              <div className="flex items-center gap-3">
                {(() => {
                  const currentSection = availableSections.find(
                    (s) => s.id === activeSection
                  );
                  if (!currentSection) return null;
                  const Icon = currentSection.icon;
                  return (
                    <>
                      <div
                        className={`p-3 rounded-lg ${getColorClasses(
                          currentSection.color
                        )}`}
                      >
                        <Icon size={24} />
                      </div>
                      <div>
                        <h2 className="text-xl font-semibold text-gray-900">
                          {currentSection.title}
                        </h2>
                        <p className="text-gray-600 text-sm">
                          {currentSection.description}
                        </p>
                      </div>
                    </>
                  );
                })()}
              </div>
            </div>

            {/* Conteúdo da seção */}
            <div className="p-6">{renderSettingsContent()}</div>
          </div>
        </div>
      </div>
    </div>
  );
}
