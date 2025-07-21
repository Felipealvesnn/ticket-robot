"use client";

import { useAuthStore } from "@/store/auth";
import {
  ArrowRightOnRectangleIcon,
  BellIcon,
  BuildingOfficeIcon,
  ChartBarIcon,
  ChatBubbleLeftRightIcon,
  ChevronRightIcon,
  Cog6ToothIcon,
  CommandLineIcon,
  HomeIcon,
  QrCodeIcon,
  ShieldCheckIcon,
  UsersIcon,
} from "@heroicons/react/24/outline";
import { Search } from "lucide-react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { useState } from "react";
import CompanySwitcher from "./CompanySwitcher";

// Tipos para os itens do menu
interface BaseMenuItem {
  name: string;
  href: string;
  icon: any;
  badge?: number;
}

interface SectionMenuItem {
  name: string;
  href: string;
  icon: any;
  isSection: true;
  children: {
    name: string;
    href: string;
    icon: any;
    description?: string;
  }[];
}

type MenuItem = BaseMenuItem | SectionMenuItem;

const baseMenuItems: MenuItem[] = [
  {
    name: "Dashboard",
    href: "/",
    icon: HomeIcon,
  },
  {
    name: "Sessões",
    href: "/sessions",
    icon: QrCodeIcon,
    badge: 3,
  },
  {
    name: "Flows ChatBot",
    href: "/flows/list",
    icon: CommandLineIcon,
    badge: 2,
  },
  {
    name: "Mensagens",
    href: "/messages",
    icon: ChatBubbleLeftRightIcon,
    badge: 12,
  },
  {
    name: "Contatos",
    href: "/contacts",
    icon: UsersIcon,
  },
  {
    name: "Relatórios",
    href: "/reports",
    icon: ChartBarIcon,
  },
  {
    name: "Notificações",
    href: "/notifications",
    icon: BellIcon,
    badge: 5,
  },
];

// Itens administrativos para SUPER_ADMIN
const superAdminMenuItems: SectionMenuItem[] = [
  {
    name: "🔱 Administração",
    href: "#",
    icon: ShieldCheckIcon,
    isSection: true,
    children: [
      {
        name: "Empresas",
        href: "/admin/companies",
        icon: BuildingOfficeIcon,
        description: "Gerenciar todas as empresas",
      },
      {
        name: "Usuários",
        href: "/admin/users",
        icon: UsersIcon,
        description: "Gerenciar todos os usuários",
      },
      {
        name: "Sistema",
        href: "/admin/system",
        icon: Cog6ToothIcon,
        description: "Configurações do sistema",
      },
    ],
  },
];

// Itens de gestão para COMPANY_OWNER/ADMIN
const companyAdminMenuItems: SectionMenuItem[] = [
  {
    name: "👥 Gestão",
    href: "#",
    icon: UsersIcon,
    isSection: true,
    children: [
      {
        name: "Usuários",
        href: "/management/users",
        icon: UsersIcon,
        description: "Gerenciar usuários da empresa",
      },
      {
        name: "Empresa",
        href: "/management/company",
        icon: BuildingOfficeIcon,
        description: "Configurações da empresa",
      },
    ],
  },
];

export default function Sidebar() {
  const [isExpanded, setIsExpanded] = useState(false);
  const [expandedSections, setExpandedSections] = useState<string[]>([]);
  const pathname = usePathname();
  const { user, logout } = useAuthStore();

  // Verificar role do usuário
  const getUserRole = () => {
    return user?.currentCompany?.role?.name || "";
  };

  const isSuperAdmin = () => getUserRole() === "SUPER_ADMIN";
  const isCompanyAdmin = () =>
    ["COMPANY_OWNER", "COMPANY_ADMIN"].includes(getUserRole());

  // Construir menu dinâmico baseado na role
  const getMenuItems = (): MenuItem[] => {
    let menuItems: MenuItem[] = [...baseMenuItems];

    // Adicionar itens administrativos baseados na role
    if (isSuperAdmin()) {
      menuItems = [...menuItems, ...superAdminMenuItems];
    } else if (isCompanyAdmin()) {
      menuItems = [...menuItems, ...companyAdminMenuItems];
    }

    // Adicionar configurações no final
    menuItems.push({
      name: "Configurações",
      href: "/settings",
      icon: Cog6ToothIcon,
    });

    return menuItems;
  };

  const toggleSection = (sectionName: string) => {
    setExpandedSections((prev) =>
      prev.includes(sectionName)
        ? prev.filter((s) => s !== sectionName)
        : [...prev, sectionName]
    );
  };

  const handleLogout = () => {
    logout();
  };

  const openSearch = () => {
    // Dispara um evento customizado que o GlobalProviders vai escutar
    window.dispatchEvent(new CustomEvent("openUniversalSearch"));
  };

  const menuItems = getMenuItems();

  return (
    <div
      className={`fixed left-0 top-0 h-full bg-white shadow-lg border-r border-gray-200 transition-all duration-300 ease-in-out z-50 ${
        isExpanded ? "w-64" : "w-16"
      }`}
      onMouseEnter={() => setIsExpanded(true)}
      onMouseLeave={() => setIsExpanded(false)}
    >
      {/* Header */}
      <Link href={"/"}>
        <div className="p-4 border-b border-gray-200">
          <div className="flex items-center space-x-3">
            <div className="w-8 h-8 bg-blue-600 rounded-lg flex items-center justify-center flex-shrink-0">
              <span className="text-white text-lg">🤖</span>
            </div>
            <div
              className={`transition-all duration-300 ${
                isExpanded ? "opacity-100 w-auto" : "opacity-0 w-0"
              } overflow-hidden`}
            >
              <h1 className="text-lg font-bold text-gray-900 whitespace-nowrap">
                Ticket Robot
              </h1>
              <p className="text-xs text-gray-500 whitespace-nowrap">
                WhatsApp Automation
              </p>
            </div>
          </div>
        </div>
      </Link>
      {/* Botão de Busca */}
      <div className="px-2 mt-4">
        <button
          onClick={openSearch}
          className="w-full flex items-center px-3 py-2 text-gray-600 hover:text-blue-600 hover:bg-gray-50 rounded-lg transition-all duration-200 group"
        >
          <Search className="w-5 h-5 flex-shrink-0" />
          <span
            className={`ml-3 transition-all duration-300 ${
              isExpanded ? "opacity-100 w-auto" : "opacity-0 w-0"
            } overflow-hidden whitespace-nowrap`}
          >
            Buscar...
          </span>
          {!isExpanded && (
            <div className="absolute left-full ml-2 px-2 py-1 text-sm text-white bg-gray-900 rounded-md opacity-0 group-hover:opacity-100 transition-opacity duration-200 pointer-events-none z-50 whitespace-nowrap">
              Buscar (Ctrl+K)
            </div>
          )}
          {isExpanded && (
            <span className="ml-auto text-xs text-gray-400 opacity-75">
              Ctrl+K
            </span>
          )}
        </button>
      </div>
      {/* Company Switcher - Só aparece quando expandido e usuário tem múltiplas empresas */}
      {isExpanded && (
        <div className="px-2 mt-4">
          <CompanySwitcher />
        </div>
      )}
      {/* Navigation */}
      <nav className="mt-6 px-2">
        <ul className="space-y-2">
          {menuItems.map((item) => {
            // Type guard para verificar se é uma seção
            const isSection = "isSection" in item && item.isSection;

            if (isSection) {
              // Renderizar seção com filhos (expansível)
              const sectionItem = item as SectionMenuItem;
              const isSectionExpanded = expandedSections.includes(
                sectionItem.name
              );
              const Icon = sectionItem.icon;

              return (
                <li key={sectionItem.name} className="relative">
                  <button
                    onClick={() => toggleSection(sectionItem.name)}
                    className="w-full flex items-center px-3 py-2 rounded-lg text-sm font-medium transition-all duration-200 group text-gray-600 hover:bg-gray-50 hover:text-blue-600"
                  >
                    <Icon className="w-5 h-5 flex-shrink-0 transition-colors duration-200 text-gray-500 group-hover:text-blue-600" />
                    <span
                      className={`ml-3 transition-all duration-300 ${
                        isExpanded ? "opacity-100 w-auto" : "opacity-0 w-0"
                      } overflow-hidden whitespace-nowrap`}
                    >
                      {sectionItem.name}
                    </span>
                    {isExpanded && (
                      <ChevronRightIcon
                        className={`ml-auto w-4 h-4 transition-transform duration-200 ${
                          isSectionExpanded ? "rotate-90" : ""
                        }`}
                      />
                    )}
                  </button>

                  {/* Submenu */}
                  {isSectionExpanded && isExpanded && (
                    <ul className="ml-8 mt-2 space-y-1">
                      {sectionItem.children.map((child) => {
                        const isChildActive = pathname === child.href;
                        const ChildIcon = child.icon;

                        return (
                          <li key={child.name}>
                            <Link
                              href={child.href}
                              className={`flex items-center px-3 py-2 rounded-lg text-sm transition-all duration-200 group ${
                                isChildActive
                                  ? "bg-blue-50 text-blue-700 border-r-2 border-blue-600"
                                  : "text-gray-500 hover:bg-gray-50 hover:text-blue-600"
                              }`}
                            >
                              <ChildIcon className="w-4 h-4 flex-shrink-0" />
                              <span className="ml-2 whitespace-nowrap">
                                {child.name}
                              </span>
                            </Link>
                          </li>
                        );
                      })}
                    </ul>
                  )}
                </li>
              );
            } else {
              // Renderizar item normal
              const baseItem = item as BaseMenuItem;
              const isActive = pathname === baseItem.href;
              const Icon = baseItem.icon;

              return (
                <li key={baseItem.name} className="relative">
                  <Link
                    href={baseItem.href}
                    className={`flex items-center px-3 py-2 rounded-lg text-sm font-medium transition-all duration-200 group ${
                      isActive
                        ? "bg-blue-50 text-blue-700 border-r-2 border-blue-600"
                        : "text-gray-600 hover:bg-gray-50 hover:text-blue-600"
                    }`}
                  >
                    <Icon
                      className={`w-5 h-5 flex-shrink-0 transition-colors duration-200 ${
                        isActive
                          ? "text-blue-600"
                          : "text-gray-500 group-hover:text-blue-600"
                      }`}
                    />
                    <span
                      className={`ml-3 transition-all duration-300 ${
                        isExpanded ? "opacity-100 w-auto" : "opacity-0 w-0"
                      } overflow-hidden whitespace-nowrap`}
                    >
                      {baseItem.name}
                    </span>
                    {baseItem.badge && isExpanded && (
                      <span className="ml-auto bg-red-500 text-white text-xs rounded-full px-2 py-0.5 min-w-[1.25rem] text-center">
                        {baseItem.badge}
                      </span>
                    )}

                    {/* Tooltip para quando estiver colapsado */}
                    {!isExpanded && (
                      <div className="absolute left-full ml-2 px-2 py-1 text-sm text-white bg-gray-900 rounded-md opacity-0 group-hover:opacity-100 transition-opacity duration-200 pointer-events-none z-50 whitespace-nowrap">
                        {baseItem.name}
                        {baseItem.badge && (
                          <span className="ml-2 bg-red-500 text-white text-xs rounded-full px-1.5 py-0.5">
                            {baseItem.badge}
                          </span>
                        )}
                        <div className="absolute top-1/2 left-0 w-0 h-0 border-t-4 border-b-4 border-r-4 border-transparent border-r-gray-900 transform -translate-y-1/2 -translate-x-full"></div>
                      </div>
                    )}
                  </Link>
                </li>
              );
            }
          })}
        </ul>
      </nav>
      {/* Status Section */}
      <div className="absolute bottom-16 left-0 right-0 px-2">
        <div
          className={`flex items-center px-3 py-2 rounded-lg bg-green-50 border border-green-200 ${
            isExpanded ? "justify-start" : "justify-center"
          }`}
        >
          <div className="w-3 h-3 bg-green-500 rounded-full animate-pulse flex-shrink-0"></div>
          <div
            className={`ml-2 transition-all duration-300 ${
              isExpanded ? "opacity-100 w-auto" : "opacity-0 w-0"
            } overflow-hidden`}
          >
            <p className="text-xs text-green-700 font-medium whitespace-nowrap">
              Sistema Online
            </p>
            <p className="text-xs text-green-600 whitespace-nowrap">
              3 sessões ativas
            </p>
          </div>
        </div>
      </div>{" "}
      {/* User Section */}
      <div className="absolute bottom-4 left-0 right-0 px-2 space-y-2">
        {/* User Info */}
        <div
          className={`flex items-center px-3 py-2 rounded-lg bg-gray-50 ${
            isExpanded ? "justify-start" : "justify-center"
          }`}
        >
          <div className="w-8 h-8 bg-gradient-to-r from-blue-500 to-purple-600 rounded-full flex items-center justify-center flex-shrink-0">
            <span className="text-sm font-medium text-white">
              {user?.name?.charAt(0).toUpperCase() || "👤"}
            </span>
          </div>
          <div
            className={`ml-3 transition-all duration-300 ${
              isExpanded ? "opacity-100 w-auto" : "opacity-0 w-0"
            } overflow-hidden`}
          >
            {" "}
            <p className="text-sm font-medium text-gray-900 whitespace-nowrap">
              {user?.name || "Admin"}
            </p>
            <p className="text-xs text-gray-500 whitespace-nowrap">
              {user?.currentCompany?.role?.name || "Administrador"}
            </p>
          </div>
        </div>

        {/* Logout Button */}
        <button
          onClick={handleLogout}
          className={`w-full flex items-center px-3 py-2 rounded-lg text-red-600 hover:bg-red-50 transition-colors duration-200 ${
            isExpanded ? "justify-start" : "justify-center"
          }`}
          title="Sair"
        >
          <ArrowRightOnRectangleIcon className="w-5 h-5 flex-shrink-0" />
          <span
            className={`ml-3 text-sm font-medium transition-all duration-300 ${
              isExpanded ? "opacity-100 w-auto" : "opacity-0 w-0"
            } overflow-hidden whitespace-nowrap`}
          >
            Sair
          </span>
        </button>
      </div>
    </div>
  );
}
