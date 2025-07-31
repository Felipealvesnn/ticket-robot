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
import { AnimatePresence, motion } from "framer-motion";
import { Clock, Search, Star, TrendingUp } from "lucide-react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { useEffect, useState } from "react";
import { confirmAlert } from "react-confirm-alert";
import "../styles/confirm-alert.css";
import CompanySwitcher from "./CompanySwitcher";
import QuickActions from "./QuickActions";

// Tipos para os itens do menu
interface BaseMenuItem {
  name: string;
  href: string;
  icon: any;
  badge?: number;
  color?: string;
  isNew?: boolean;
  isFavorite?: boolean;
  lastVisited?: Date;
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
    color: "blue",
    lastVisited: new Date(),
  },
  {
    name: "Sessões",
    href: "/sessions",
    icon: QrCodeIcon,
    badge: 3,
    color: "green",
  },
  {
    name: "Flows ChatBot",
    href: "/flows/list",
    icon: CommandLineIcon,
    badge: 2,
    color: "purple",
    isNew: true,
  },
  {
    name: "Mensagens",
    href: "/messages",
    icon: ChatBubbleLeftRightIcon,
    badge: 12,
    color: "blue",
    isFavorite: true,
  },
  {
    name: "Contatos",
    href: "/contacts",
    icon: UsersIcon,
    color: "indigo",
  },
  {
    name: "Relatórios",
    href: "/reports",
    icon: ChartBarIcon,
    color: "orange",
  },
  {
    name: "Notificações",
    href: "/notifications",
    icon: BellIcon,
    badge: 5,
    color: "red",
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
  const [recentItems, setRecentItems] = useState<string[]>([]);
  const [hoverItem, setHoverItem] = useState<string | null>(null);
  const pathname = usePathname();
  const { user, logout } = useAuthStore();

  // Animação variants
  const sidebarVariants = {
    expanded: { width: 256 },
    collapsed: { width: 64 },
  };

  const itemVariants = {
    hidden: { opacity: 0, x: -20 },
    visible: { opacity: 1, x: 0 },
    hover: { scale: 1.02, transition: { duration: 0.2 } },
  };

  // Track recent items
  useEffect(() => {
    if (pathname && pathname !== "/" && !recentItems.includes(pathname)) {
      setRecentItems((prev) => [pathname, ...prev].slice(0, 3));
    }
  }, [pathname, recentItems]);

  // Color mapping
  const getColorClasses = (color: string, isActive: boolean) => {
    const colors: Record<
      string,
      {
        bg: string;
        text: string;
        activeBg: string;
        activeText: string;
        border: string;
      }
    > = {
      blue: {
        bg: "hover:bg-blue-50",
        text: "hover:text-blue-600",
        activeBg: "bg-blue-50",
        activeText: "text-blue-600",
        border: "border-blue-500",
      },
      green: {
        bg: "hover:bg-green-50",
        text: "hover:text-green-600",
        activeBg: "bg-green-50",
        activeText: "text-green-600",
        border: "border-green-500",
      },
      purple: {
        bg: "hover:bg-purple-50",
        text: "hover:text-purple-600",
        activeBg: "bg-purple-50",
        activeText: "text-purple-600",
        border: "border-purple-500",
      },
      indigo: {
        bg: "hover:bg-indigo-50",
        text: "hover:text-indigo-600",
        activeBg: "bg-indigo-50",
        activeText: "text-indigo-600",
        border: "border-indigo-500",
      },
      orange: {
        bg: "hover:bg-orange-50",
        text: "hover:text-orange-600",
        activeBg: "bg-orange-50",
        activeText: "text-orange-600",
        border: "border-orange-500",
      },
      red: {
        bg: "hover:bg-red-50",
        text: "hover:text-red-600",
        activeBg: "bg-red-50",
        activeText: "text-red-600",
        border: "border-red-500",
      },
    };

    return colors[color] || colors.blue;
  };

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
    confirmAlert({
      title: "🚪 Confirmar Saída",
      message:
        "Tem certeza de que deseja sair do sistema? Você precisará fazer login novamente.",
      buttons: [
        {
          label: "Cancelar",
          onClick: () => {
            // Apenas fecha o modal
          },
        },
        {
          label: "Sair do Sistema",
          onClick: () => {
            logout();
          },
        },
      ],
      childrenElement: () => (
        <div className="mt-4 p-4 bg-gradient-to-r from-blue-50 to-indigo-50 rounded-lg border border-blue-200">
          <div className="flex items-center space-x-3">
            <div className="w-10 h-10 bg-gradient-to-br from-blue-500 via-purple-500 to-pink-500 rounded-xl flex items-center justify-center shadow-lg">
              <span className="text-sm font-bold text-white">
                {user?.name?.charAt(0).toUpperCase() || "👤"}
              </span>
            </div>
            <div>
              <p className="text-sm font-semibold text-gray-900">
                {user?.name || "Admin"}
              </p>
              <p className="text-xs text-gray-600">
                {user?.currentCompany?.role?.name || "Administrador"}
              </p>
            </div>
          </div>
          <div className="mt-3 text-xs text-blue-700">
            💡 Dica: Pressione <strong>Esc</strong> para cancelar rapidamente
          </div>
        </div>
      ),
      closeOnEscape: true,
      closeOnClickOutside: true,
    });
  };

  const openSearch = () => {
    // Dispara um evento customizado que o GlobalProviders vai escutar
    window.dispatchEvent(new CustomEvent("openUniversalSearch"));
  };

  const menuItems = getMenuItems();

  return (
    <motion.div
      className="fixed left-0 top-0 h-full bg-white/95 backdrop-blur-md shadow-xl border-r border-gray-200/50 z-50 overflow-hidden"
      variants={sidebarVariants}
      animate={isExpanded ? "expanded" : "collapsed"}
      transition={{ duration: 0.3, ease: "easeInOut" }}
      onMouseEnter={() => setIsExpanded(true)}
      onMouseLeave={() => setIsExpanded(false)}
    >
      {/* Header com animação aprimorada */}
      <Link href={"/"}>
        <motion.div
          className="p-4 border-b border-gray-200/50"
          whileHover={{ scale: 1.02 }}
          transition={{ duration: 0.2 }}
        >
          <div className="flex items-center space-x-3">
            <motion.div
              className="w-8 h-8 bg-gradient-to-br from-blue-500 to-blue-600 rounded-xl flex items-center justify-center flex-shrink-0 shadow-lg"
              whileHover={{ rotate: 5, scale: 1.1 }}
              transition={{ duration: 0.2 }}
            >
              <span className="text-white text-lg">🤖</span>
            </motion.div>
            <AnimatePresence>
              {isExpanded && (
                <motion.div
                  initial={{ opacity: 0, width: 0 }}
                  animate={{ opacity: 1, width: "auto" }}
                  exit={{ opacity: 0, width: 0 }}
                  transition={{ duration: 0.3 }}
                  className="overflow-hidden"
                >
                  <h1 className="text-lg font-bold bg-gradient-to-r from-gray-900 to-gray-600 bg-clip-text text-transparent whitespace-nowrap">
                    Ticket Robot
                  </h1>
                  <p className="text-xs text-gray-500 whitespace-nowrap">
                    WhatsApp Automation
                  </p>
                </motion.div>
              )}
            </AnimatePresence>
          </div>
        </motion.div>
      </Link>

      {/* Enhanced Search Button */}
      <div className="px-2 mt-4">
        <motion.button
          onClick={openSearch}
          className="w-full flex items-center px-3 py-2.5 text-gray-600 hover:text-blue-600 hover:bg-blue-50/50 rounded-xl transition-all duration-200 group backdrop-blur-sm"
          whileHover="hover"
          variants={itemVariants}
          whileTap={{ scale: 0.98 }}
        >
          <Search className="w-5 h-5 flex-shrink-0" />
          <AnimatePresence>
            {isExpanded && (
              <motion.span
                initial={{ opacity: 0, width: 0 }}
                animate={{ opacity: 1, width: "auto" }}
                exit={{ opacity: 0, width: 0 }}
                transition={{ duration: 0.3 }}
                className="ml-3 overflow-hidden whitespace-nowrap font-medium"
              >
                Buscar...
              </motion.span>
            )}
          </AnimatePresence>

          {!isExpanded && (
            <motion.div
              className="absolute left-full ml-2 px-3 py-2 text-sm text-white bg-gray-900/90 backdrop-blur-sm rounded-lg opacity-0 group-hover:opacity-100 transition-opacity duration-200 pointer-events-none z-50 whitespace-nowrap shadow-lg"
              initial={{ x: -10 }}
              animate={{ x: 0 }}
            >
              Buscar (Ctrl+K)
              <div className="absolute top-1/2 left-0 w-0 h-0 border-t-4 border-b-4 border-r-4 border-transparent border-r-gray-900/90 transform -translate-y-1/2 -translate-x-full"></div>
            </motion.div>
          )}

          {isExpanded && (
            <motion.span
              className="ml-auto text-xs text-gray-400 opacity-75 bg-gray-100 px-2 py-1 rounded-md"
              initial={{ opacity: 0, scale: 0.8 }}
              animate={{ opacity: 1, scale: 1 }}
              transition={{ delay: 0.2 }}
            >
              ⌘K
            </motion.span>
          )}
        </motion.button>
      </div>

      {/* Quick Actions - Nova funcionalidade */}
      <QuickActions isExpanded={isExpanded} />

      {/* Company Switcher - Enhanced */}
      <AnimatePresence>
        {isExpanded && (
          <motion.div
            className="px-2 mt-4"
            initial={{ opacity: 0, height: 0 }}
            animate={{ opacity: 1, height: "auto" }}
            exit={{ opacity: 0, height: 0 }}
            transition={{ duration: 0.3 }}
          >
            <CompanySwitcher />
          </motion.div>
        )}
      </AnimatePresence>

      {/* Navigation with enhanced animations */}
      <nav className="mt-6 px-2 flex-1 overflow-y-auto">
        <motion.ul
          className="space-y-1"
          initial="hidden"
          animate="visible"
          variants={{
            visible: {
              transition: {
                staggerChildren: 0.05,
              },
            },
          }}
        >
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
              // Renderizar item normal com animações aprimoradas
              const baseItem = item as BaseMenuItem;
              const isActive = pathname === baseItem.href;
              const Icon = baseItem.icon;
              const colorClasses = getColorClasses(
                baseItem.color || "blue",
                isActive
              );

              return (
                <motion.li
                  key={baseItem.name}
                  className="relative"
                  variants={itemVariants}
                  onHoverStart={() => setHoverItem(baseItem.name)}
                  onHoverEnd={() => setHoverItem(null)}
                >
                  <Link href={baseItem.href}>
                    <motion.div
                      className={`flex items-center px-3 py-2.5 rounded-xl text-sm font-medium transition-all duration-200 group relative overflow-hidden ${
                        isActive
                          ? `${colorClasses.activeBg} ${colorClasses.activeText} shadow-sm border-l-3 ${colorClasses.border}`
                          : `text-gray-600 ${colorClasses.bg} ${colorClasses.text}`
                      }`}
                      whileHover="hover"
                      variants={itemVariants}
                      whileTap={{ scale: 0.98 }}
                    >
                      {/* Active indicator */}
                      {isActive && (
                        <motion.div
                          className={`absolute left-0 top-0 bottom-0 w-1 bg-gradient-to-b from-${
                            baseItem.color || "blue"
                          }-500 to-${
                            baseItem.color || "blue"
                          }-600 rounded-r-full`}
                          layoutId="activeIndicator"
                          transition={{
                            type: "spring",
                            stiffness: 500,
                            damping: 30,
                          }}
                        />
                      )}

                      {/* Icon with enhanced styling */}
                      <motion.div
                        className="relative"
                        whileHover={{ scale: 1.1, rotate: 5 }}
                        transition={{ duration: 0.2 }}
                      >
                        <Icon
                          className={`w-5 h-5 flex-shrink-0 transition-colors duration-200 ${
                            isActive
                              ? colorClasses.activeText
                              : `text-gray-500 group-hover:${colorClasses.text}`
                          }`}
                        />

                        {/* Favorite star */}
                        {baseItem.isFavorite && (
                          <motion.div
                            className="absolute -top-1 -right-1"
                            initial={{ scale: 0 }}
                            animate={{ scale: 1 }}
                            transition={{ delay: 0.2 }}
                          >
                            <Star className="w-2.5 h-2.5 text-yellow-500 fill-yellow-500" />
                          </motion.div>
                        )}

                        {/* New indicator */}
                        {baseItem.isNew && (
                          <motion.div
                            className="absolute -top-1 -right-1 w-2 h-2 bg-green-500 rounded-full"
                            animate={{ scale: [1, 1.2, 1] }}
                            transition={{ repeat: Infinity, duration: 2 }}
                          />
                        )}
                      </motion.div>

                      {/* Text with enhanced animation */}
                      <AnimatePresence>
                        {isExpanded && (
                          <motion.span
                            initial={{ opacity: 0, width: 0 }}
                            animate={{ opacity: 1, width: "auto" }}
                            exit={{ opacity: 0, width: 0 }}
                            transition={{ duration: 0.3 }}
                            className="ml-3 overflow-hidden whitespace-nowrap"
                          >
                            {baseItem.name}
                          </motion.span>
                        )}
                      </AnimatePresence>

                      {/* Enhanced badge */}
                      {baseItem.badge && isExpanded && (
                        <motion.span
                          className={`ml-auto px-2 py-1 text-xs rounded-full font-medium shadow-sm ${
                            baseItem.badge > 9
                              ? "bg-red-500 text-white animate-pulse"
                              : "bg-gray-100 text-gray-700"
                          }`}
                          initial={{ scale: 0 }}
                          animate={{ scale: 1 }}
                          transition={{ delay: 0.1, type: "spring" }}
                          whileHover={{ scale: 1.1 }}
                        >
                          {baseItem.badge > 99 ? "99+" : baseItem.badge}
                        </motion.span>
                      )}

                      {/* Recent indicator */}
                      {recentItems.includes(baseItem.href) && isExpanded && (
                        <motion.div
                          className="ml-2"
                          initial={{ opacity: 0, scale: 0 }}
                          animate={{ opacity: 1, scale: 1 }}
                          transition={{ delay: 0.2 }}
                        >
                          <Clock className="w-3 h-3 text-gray-400" />
                        </motion.div>
                      )}

                      {/* Enhanced tooltip */}
                      {!isExpanded && (
                        <AnimatePresence>
                          {hoverItem === baseItem.name && (
                            <motion.div
                              className="absolute left-full ml-3 px-3 py-2 text-sm text-white bg-gray-900/90 backdrop-blur-sm rounded-lg shadow-xl z-50 whitespace-nowrap border border-gray-700"
                              initial={{ opacity: 0, x: -10, scale: 0.9 }}
                              animate={{ opacity: 1, x: 0, scale: 1 }}
                              exit={{ opacity: 0, x: -10, scale: 0.9 }}
                              transition={{ duration: 0.2 }}
                            >
                              <div className="flex items-center space-x-2">
                                <span>{baseItem.name}</span>
                                {baseItem.badge && (
                                  <span className="bg-red-500 text-white text-xs rounded-full px-2 py-0.5">
                                    {baseItem.badge}
                                  </span>
                                )}
                                {baseItem.isFavorite && (
                                  <Star className="w-3 h-3 text-yellow-400 fill-yellow-400" />
                                )}
                                {baseItem.isNew && (
                                  <span className="text-green-400 text-xs">
                                    NEW
                                  </span>
                                )}
                              </div>
                              <div className="absolute top-1/2 left-0 w-0 h-0 border-t-4 border-b-4 border-r-4 border-transparent border-r-gray-900/90 transform -translate-y-1/2 -translate-x-full"></div>
                            </motion.div>
                          )}
                        </AnimatePresence>
                      )}
                    </motion.div>
                  </Link>
                </motion.li>
              );
            }
          })}
        </motion.ul>
      </nav>
      {/* Enhanced Status Section */}
      <div className="absolute bottom-20 left-0 right-0 px-2">
        <motion.div
          className="relative overflow-hidden rounded-xl bg-gradient-to-r from-green-50 to-emerald-50 border border-green-200/50 backdrop-blur-sm"
          whileHover={{ scale: 1.02 }}
          transition={{ duration: 0.2 }}
        >
          <div
            className={`flex items-center px-3 py-3 ${
              isExpanded ? "justify-start" : "justify-center"
            }`}
          >
            <motion.div
              className="w-3 h-3 bg-green-500 rounded-full flex-shrink-0 shadow-lg"
              animate={{
                scale: [1, 1.2, 1],
                boxShadow: [
                  "0 0 0 0 rgba(34, 197, 94, 0.7)",
                  "0 0 0 4px rgba(34, 197, 94, 0)",
                  "0 0 0 0 rgba(34, 197, 94, 0)",
                ],
              }}
              transition={{ repeat: Infinity, duration: 2 }}
            />

            <AnimatePresence>
              {isExpanded && (
                <motion.div
                  initial={{ opacity: 0, width: 0 }}
                  animate={{ opacity: 1, width: "auto" }}
                  exit={{ opacity: 0, width: 0 }}
                  transition={{ duration: 0.3 }}
                  className="ml-3 overflow-hidden"
                >
                  <p className="text-xs text-green-700 font-semibold whitespace-nowrap flex items-center">
                    Sistema Online
                    <motion.span
                      animate={{ opacity: [1, 0.5, 1] }}
                      transition={{ repeat: Infinity, duration: 1.5 }}
                      className="ml-1 text-green-600"
                    >
                      ●
                    </motion.span>
                  </p>
                  <p className="text-xs text-green-600 whitespace-nowrap">
                    3 sessões ativas
                  </p>
                </motion.div>
              )}
            </AnimatePresence>
          </div>

          {/* Subtle animated background */}
          <motion.div
            className="absolute inset-0 bg-gradient-to-r from-green-100/20 to-emerald-100/20"
            animate={{ opacity: [0.5, 1, 0.5] }}
            transition={{ repeat: Infinity, duration: 3 }}
          />
        </motion.div>
      </div>

      {/* Enhanced User Section */}
      <div className="absolute bottom-4 left-0 right-0 px-2 space-y-2">
        {/* User Info with improved design */}
        <motion.div
          className={`flex items-center px-3 py-3 rounded-xl bg-gradient-to-r from-gray-50 to-gray-100/50 border border-gray-200/50 backdrop-blur-sm ${
            isExpanded ? "justify-start" : "justify-center"
          }`}
          whileHover={{ scale: 1.02, backgroundColor: "rgb(248 250 252)" }}
          transition={{ duration: 0.2 }}
        >
          <motion.div
            className="w-9 h-9 bg-gradient-to-br from-blue-500 via-purple-500 to-pink-500 rounded-xl flex items-center justify-center flex-shrink-0 shadow-lg ring-2 ring-white"
            whileHover={{ scale: 1.1, rotate: 5 }}
            transition={{ duration: 0.2 }}
          >
            <span className="text-sm font-bold text-white">
              {user?.name?.charAt(0).toUpperCase() || "👤"}
            </span>
          </motion.div>

          <AnimatePresence>
            {isExpanded && (
              <motion.div
                initial={{ opacity: 0, width: 0 }}
                animate={{ opacity: 1, width: "auto" }}
                exit={{ opacity: 0, width: 0 }}
                transition={{ duration: 0.3 }}
                className="ml-3 overflow-hidden"
              >
                <p className="text-sm font-semibold text-gray-900 whitespace-nowrap">
                  {user?.name || "Admin"}
                </p>
                <p className="text-xs text-gray-500 whitespace-nowrap">
                  {user?.currentCompany?.role?.name || "Administrador"}
                </p>
              </motion.div>
            )}
          </AnimatePresence>
        </motion.div>

        {/* Enhanced Logout Button */}
        <motion.button
          onClick={handleLogout}
          className={`w-full flex items-center px-3 py-2.5 rounded-xl text-red-600 hover:text-red-700 hover:bg-red-50 transition-all duration-200 group ${
            isExpanded ? "justify-start" : "justify-center"
          }`}
          whileHover={{ scale: 1.02 }}
          whileTap={{ scale: 0.98 }}
          title="Sair"
        >
          <motion.div
            whileHover={{ rotate: 15 }}
            transition={{ duration: 0.2 }}
          >
            <ArrowRightOnRectangleIcon className="w-5 h-5 flex-shrink-0" />
          </motion.div>

          <AnimatePresence>
            {isExpanded && (
              <motion.span
                initial={{ opacity: 0, width: 0 }}
                animate={{ opacity: 1, width: "auto" }}
                exit={{ opacity: 0, width: 0 }}
                transition={{ duration: 0.3 }}
                className="ml-3 text-sm font-medium overflow-hidden whitespace-nowrap"
              >
                Sair
              </motion.span>
            )}
          </AnimatePresence>
        </motion.button>
      </div>
    </motion.div>
  );
}
