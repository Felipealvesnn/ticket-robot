"use client";

import { useAuthStore } from "@/store/auth";
import {
  ArrowRightOnRectangleIcon,
  BellIcon,
  ChartBarIcon,
  ChatBubbleLeftRightIcon,
  Cog6ToothIcon,
  CommandLineIcon,
  HomeIcon,
  QrCodeIcon,
  UsersIcon,
} from "@heroicons/react/24/outline";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { useState } from "react";

const menuItems = [
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
  {
    name: "Configurações",
    href: "/settings",
    icon: Cog6ToothIcon,
  },
];

export default function Sidebar() {
  const [isExpanded, setIsExpanded] = useState(false);
  const pathname = usePathname();
  const { user, logout } = useAuthStore();

  const handleLogout = () => {
    logout();
  };

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
      {/* Navigation */}
      <nav className="mt-6 px-2">
        <ul className="space-y-2">
          {menuItems.map((item) => {
            const isActive = pathname === item.href;
            const Icon = item.icon;

            return (
              <li key={item.name} className="relative">
                <Link
                  href={item.href}
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
                    {item.name}
                  </span>
                  {item.badge && isExpanded && (
                    <span className="ml-auto bg-red-500 text-white text-xs rounded-full px-2 py-0.5 min-w-[1.25rem] text-center">
                      {item.badge}
                    </span>
                  )}

                  {/* Tooltip para quando estiver colapsado */}
                  {!isExpanded && (
                    <div className="absolute left-full ml-2 px-2 py-1 text-sm text-white bg-gray-900 rounded-md opacity-0 group-hover:opacity-100 transition-opacity duration-200 pointer-events-none z-50 whitespace-nowrap">
                      {item.name}
                      {item.badge && (
                        <span className="ml-2 bg-red-500 text-white text-xs rounded-full px-1.5 py-0.5">
                          {item.badge}
                        </span>
                      )}
                      <div className="absolute top-1/2 left-0 w-0 h-0 border-t-4 border-b-4 border-r-4 border-transparent border-r-gray-900 transform -translate-y-1/2 -translate-x-full"></div>
                    </div>
                  )}
                </Link>
              </li>
            );
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
