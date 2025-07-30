"use client";

import { useAuthStore } from "@/store/auth";
import { AnimatePresence, motion } from "framer-motion";
import {
  AlertCircle,
  Bell,
  ChevronRight,
  Clock,
  Command,
  Filter,
  Home,
  Loader2,
  Palette,
  Save,
  Search,
  Settings as SettingsIcon,
  Shield,
  User,
  UserMinus,
} from "lucide-react";
import { useEffect, useState } from "react";
import { toast } from "react-toastify";
import AppearanceSettings from "./componentes/AppearanceSettings";
import BusinessHoursSettings from "./componentes/BusinessHoursSettings";
import IgnoredContactsSettings from "./componentes/IgnoredContactsSettings";
import NotificationSettings from "./componentes/NotificationSettings";
import ProfileSettings from "./componentes/ProfileSettings";
import SecuritySettings from "./componentes/SecuritySettings";
import SystemSettings from "./componentes/SystemSettings";
import { CommandPalette } from "./components/CommandPalette";
import MobileSettingsDrawer from "./components/MobileSettingsDrawer";

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
  const [searchTerm, setSearchTerm] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const [isMobileSidebarOpen, setIsMobileSidebarOpen] = useState(false);
  const [showCommandPalette, setShowCommandPalette] = useState(false);

  // Verificar se o usuário tem permissões administrativas
  const isAdmin = () => {
    if (!user?.currentCompany?.role?.name) return false;

    const adminRoles = ["SUPER_ADMIN", "COMPANY_OWNER", "COMPANY_ADMIN"];

    return adminRoles.includes(user.currentCompany.role.name);
  };

  // Filtrar seções baseado nas permissões e termo de busca
  const availableSections = settingsSections.filter((section) => {
    // Se a seção requer admin e o usuário não é admin, ocultar
    if (section.adminOnly && !isAdmin()) {
      return false;
    }

    // Filtrar por termo de busca
    if (searchTerm) {
      const searchLower = searchTerm.toLowerCase();
      return (
        section.title.toLowerCase().includes(searchLower) ||
        section.description.toLowerCase().includes(searchLower)
      );
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

  // Keyboard shortcuts
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      // Cmd/Ctrl + K para command palette
      if ((e.metaKey || e.ctrlKey) && e.key === "k") {
        e.preventDefault();
        setShowCommandPalette(true);
      }

      // Cmd/Ctrl + S para salvar
      if ((e.metaKey || e.ctrlKey) && e.key === "s" && hasUnsavedChanges) {
        e.preventDefault();
        handleSaveChanges();
      }
    };

    document.addEventListener("keydown", handleKeyDown);
    return () => document.removeEventListener("keydown", handleKeyDown);
  }, [hasUnsavedChanges]);

  const handleSaveChanges = async () => {
    setIsLoading(true);
    try {
      // Simular salvamento
      await new Promise((resolve) => setTimeout(resolve, 1000));
      setHasUnsavedChanges(false);

      // Toast moderno com react-toastify
      toast.success("✨ Configurações salvas com sucesso!", {
        position: "top-right",
        autoClose: 3000,
        hideProgressBar: false,
        closeOnClick: true,
        pauseOnHover: true,
        draggable: true,
        style: {
          background: "linear-gradient(135deg, #10b981 0%, #059669 100%)",
          color: "white",
          borderRadius: "12px",
          fontWeight: "500",
        },
      });
    } catch (error) {
      console.error("Erro ao salvar:", error);
      toast.error("❌ Erro ao salvar configurações", {
        position: "top-right",
        autoClose: 3000,
        style: {
          background: "linear-gradient(135deg, #ef4444 0%, #dc2626 100%)",
          color: "white",
          borderRadius: "12px",
          fontWeight: "500",
        },
      });
    } finally {
      setIsLoading(false);
    }
  };

  const handleSectionChange = (sectionId: SettingsSection) => {
    setActiveSection(sectionId);
    setIsMobileSidebarOpen(false); // Fechar sidebar no mobile

    // Toast informativo suave
    const section = settingsSections.find((s) => s.id === sectionId);
    if (section) {
      toast.info(`📋 ${section.title}`, {
        position: "bottom-right",
        autoClose: 1500,
        hideProgressBar: true,
        closeOnClick: false,
        pauseOnHover: false,
        draggable: false,
        style: {
          background: "rgba(59, 130, 246, 0.95)",
          color: "white",
          borderRadius: "8px",
          fontSize: "14px",
          padding: "8px 16px",
          minHeight: "auto",
        },
      });
    }
  };

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
          <BusinessHoursSettings onUnsavedChanges={setHasUnsavedChanges} />
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
    <div className="min-h-screen bg-gray-50">
      <div className="container mx-auto p-4 lg:p-6">
        {/* Breadcrumb */}
        <motion.div
          className="mb-6"
          initial={{ opacity: 0, y: -20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.3 }}
        >
          <nav className="flex items-center space-x-2 text-sm text-gray-600 mb-4">
            <Home size={16} />
            <ChevronRight size={14} />
            <span>Configurações</span>
            <ChevronRight size={14} />
            <motion.span
              className="text-gray-900 font-medium"
              key={activeSection}
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              transition={{ duration: 0.2 }}
            >
              {availableSections.find((s) => s.id === activeSection)?.title}
            </motion.span>
          </nav>

          {/* Enhanced Header */}
          <div className="flex flex-col lg:flex-row lg:items-center lg:justify-between gap-4">
            <motion.div
              initial={{ opacity: 0, x: -20 }}
              animate={{ opacity: 1, x: 0 }}
              transition={{ duration: 0.4, delay: 0.1 }}
            >
              <h1 className="text-3xl font-bold text-gray-900 flex items-center gap-3">
                <motion.div
                  className="p-3 bg-blue-100 rounded-xl"
                  whileHover={{ scale: 1.05, rotate: 5 }}
                  transition={{ type: "spring", stiffness: 300 }}
                >
                  <SettingsIcon className="text-blue-600" size={32} />
                </motion.div>
                Configurações
              </h1>
              <p className="text-gray-600 mt-2">
                Personalize sua experiência e gerencie suas preferências do
                sistema
              </p>
            </motion.div>

            {/* Quick Actions */}
            <motion.div
              className="flex items-center gap-3"
              initial={{ opacity: 0, x: 20 }}
              animate={{ opacity: 1, x: 0 }}
              transition={{ duration: 0.4, delay: 0.2 }}
            >
              <AnimatePresence>
                {hasUnsavedChanges && (
                  <motion.button
                    onClick={handleSaveChanges}
                    disabled={isLoading}
                    className="inline-flex items-center gap-2 bg-blue-600 text-white px-4 py-2 rounded-lg hover:bg-blue-700 transition-colors disabled:opacity-50"
                    initial={{ opacity: 0, scale: 0.8, x: 20 }}
                    animate={{ opacity: 1, scale: 1, x: 0 }}
                    exit={{ opacity: 0, scale: 0.8, x: 20 }}
                    whileHover={{ scale: 1.02 }}
                    whileTap={{ scale: 0.98 }}
                  >
                    {isLoading ? (
                      <Loader2 className="animate-spin" size={16} />
                    ) : (
                      <Save size={16} />
                    )}
                    {isLoading ? "Salvando..." : "Salvar Alterações"}
                  </motion.button>
                )}
              </AnimatePresence>

              <div className="hidden lg:flex items-center gap-2 text-xs text-gray-500 bg-white px-3 py-2 rounded-lg border">
                <Command size={12} />
                <span>+K para buscar</span>
              </div>

              {/* Command Palette Button - Mobile */}
              <button
                onClick={() => setShowCommandPalette(true)}
                className="lg:hidden inline-flex items-center gap-2 text-xs text-gray-500 bg-white px-3 py-2 rounded-lg border hover:bg-gray-50 transition-colors"
              >
                <Command size={12} />
                <span>Buscar</span>
              </button>
            </motion.div>
          </div>
        </motion.div>

        {/* Alert para mudanças não salvas - versão mais discreta */}
        <AnimatePresence>
          {hasUnsavedChanges && (
            <motion.div
              className="mb-6 bg-amber-50 border border-amber-200 rounded-lg p-4"
              initial={{ opacity: 0, height: 0 }}
              animate={{ opacity: 1, height: "auto" }}
              exit={{ opacity: 0, height: 0 }}
              transition={{ duration: 0.3 }}
            >
              <div className="flex items-start gap-3">
                <AlertCircle
                  className="text-amber-600 flex-shrink-0 mt-0.5"
                  size={20}
                />
                <div className="flex-1">
                  <p className="text-amber-800 font-medium">
                    Você tem alterações não salvas
                  </p>
                  <p className="text-amber-700 text-sm mt-1">
                    Lembre-se de salvar suas alterações antes de sair desta
                    seção.
                    <span className="hidden lg:inline">
                      {" "}
                      Use Ctrl+S ou clique no botão "Salvar Alterações".
                    </span>
                  </p>
                </div>
                <motion.button
                  onClick={handleSaveChanges}
                  disabled={isLoading}
                  className="inline-flex items-center gap-1 bg-amber-100 text-amber-800 px-3 py-1 rounded-md hover:bg-amber-200 transition-colors text-sm disabled:opacity-50"
                  whileHover={{ scale: 1.02 }}
                  whileTap={{ scale: 0.98 }}
                >
                  {isLoading ? (
                    <Loader2 className="animate-spin" size={14} />
                  ) : (
                    <Save size={14} />
                  )}
                  Salvar Agora
                </motion.button>
              </div>
            </motion.div>
          )}
        </AnimatePresence>

        <motion.div
          className="grid grid-cols-1 lg:grid-cols-4 gap-6"
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.4, delay: 0.3 }}
        >
          {/* Mobile Settings Drawer - Modern Alternative */}
          <MobileSettingsDrawer
            sections={settingsSections}
            activeSection={activeSection}
            onSectionChange={(section) =>
              setActiveSection(section as SettingsSection)
            }
          />

          {/* Mobile Menu Button - Fallback */}
          <div className="lg:hidden mb-4">
            <motion.button
              onClick={() => setIsMobileSidebarOpen(!isMobileSidebarOpen)}
              className="w-full flex items-center justify-between p-3 bg-white rounded-lg border border-gray-200"
              whileTap={{ scale: 0.98 }}
            >
              <span className="font-medium">Menu de Configurações</span>
              <motion.div
                animate={{ rotate: isMobileSidebarOpen ? 90 : 0 }}
                transition={{ duration: 0.2 }}
              >
                <ChevronRight size={20} />
              </motion.div>
            </motion.button>
          </div>

          {/* Sidebar de navegação */}
          <div
            className={`lg:col-span-1 ${
              isMobileSidebarOpen ? "block" : "hidden lg:block"
            }`}
          >
            <motion.div
              className="bg-white rounded-xl shadow-sm border border-gray-200 overflow-hidden"
              initial={{ opacity: 0, x: -20 }}
              animate={{ opacity: 1, x: 0 }}
              transition={{ duration: 0.4, delay: 0.1 }}
            >
              {/* Search Bar */}
              <div className="p-4 border-b border-gray-100">
                <div className="relative">
                  <Search
                    className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400"
                    size={16}
                  />
                  <input
                    id="settings-search"
                    type="text"
                    placeholder="Buscar configurações..."
                    value={searchTerm}
                    onChange={(e) => setSearchTerm(e.target.value)}
                    className="w-full pl-10 pr-4 py-2 text-sm border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                  />
                </div>
                {searchTerm && (
                  <div className="mt-2 text-xs text-gray-500">
                    {availableSections.length} resultado
                    {availableSections.length !== 1 ? "s" : ""} encontrado
                    {availableSections.length !== 1 ? "s" : ""}
                  </div>
                )}
              </div>

              {/* Navigation */}
              <nav className="p-2">
                {availableSections.length === 0 ? (
                  <div className="p-4 text-center text-gray-500 text-sm">
                    <Filter className="mx-auto mb-2" size={24} />
                    Nenhuma configuração encontrada
                  </div>
                ) : (
                  <div className="space-y-1">
                    {availableSections.map((section, index) => {
                      const Icon = section.icon;
                      const isActive = activeSection === section.id;

                      return (
                        <motion.button
                          key={section.id}
                          onClick={() => handleSectionChange(section.id)}
                          className={`w-full flex items-center justify-between p-3 rounded-lg transition-all duration-200 text-left group ${
                            isActive
                              ? "bg-blue-50 text-blue-700 border border-blue-200 shadow-sm"
                              : "text-gray-700 hover:bg-gray-50 hover:text-blue-600"
                          }`}
                          initial={{ opacity: 0, x: -20 }}
                          animate={{ opacity: 1, x: 0 }}
                          transition={{ duration: 0.3, delay: index * 0.05 }}
                          whileHover={{ scale: 1.02, x: 4 }}
                          whileTap={{ scale: 0.98 }}
                        >
                          <div className="flex items-center gap-3 flex-1 min-w-0">
                            <div
                              className={`p-2 rounded-lg flex-shrink-0 transition-colors ${
                                isActive
                                  ? getColorClasses(section.color)
                                  : "bg-gray-100 text-gray-500 group-hover:bg-gray-200"
                              }`}
                            >
                              <Icon size={16} />
                            </div>
                            <div className="min-w-0 flex-1">
                              <p className="font-medium text-sm truncate">
                                {section.title}
                              </p>
                              <p className="text-xs text-gray-500 mt-0.5 line-clamp-2">
                                {section.description}
                              </p>
                            </div>
                          </div>
                          <ChevronRight
                            size={16}
                            className={`flex-shrink-0 ml-2 transition-transform ${
                              isActive
                                ? "rotate-90 text-blue-600"
                                : "text-gray-400"
                            }`}
                          />
                        </motion.button>
                      );
                    })}
                  </div>
                )}
              </nav>
            </motion.div>
          </div>

          {/* Conteúdo principal */}
          <div className="lg:col-span-3">
            <div className="bg-white rounded-xl shadow-sm border border-gray-200 overflow-hidden">
              {/* Header da seção */}
              <div className="p-6 border-b border-gray-100 bg-gradient-to-r from-gray-50 to-white">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-4">
                    {(() => {
                      const currentSection = availableSections.find(
                        (s) => s.id === activeSection
                      );
                      if (!currentSection) return null;
                      const Icon = currentSection.icon;
                      return (
                        <>
                          <div
                            className={`p-3 rounded-xl ${getColorClasses(
                              currentSection.color
                            )} shadow-sm`}
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

                  {/* Progress Indicator */}
                  <div className="hidden lg:flex items-center gap-2 text-sm text-gray-500">
                    <span>
                      {availableSections.findIndex(
                        (s) => s.id === activeSection
                      ) + 1}
                    </span>
                    <span>/</span>
                    <span>{availableSections.length}</span>
                  </div>
                </div>
              </div>

              {/* Conteúdo da seção */}
              <div className="p-6">
                {isLoading ? (
                  <div className="flex items-center justify-center py-12">
                    <div className="text-center">
                      <Loader2
                        className="animate-spin mx-auto mb-4 text-blue-600"
                        size={32}
                      />
                      <p className="text-gray-600">
                        Carregando configurações...
                      </p>
                    </div>
                  </div>
                ) : (
                  renderSettingsContent()
                )}
              </div>
            </div>
          </div>
        </motion.div>

        {/* Command Palette */}
        <CommandPalette
          isOpen={showCommandPalette}
          onClose={() => setShowCommandPalette(false)}
          onNavigate={(sectionId) =>
            handleSectionChange(sectionId as SettingsSection)
          }
          availableSections={availableSections}
        />
      </div>
    </div>
  );
}
