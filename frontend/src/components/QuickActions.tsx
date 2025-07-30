"use client";

import { AnimatePresence, motion } from "framer-motion";
import {
  BarChart3,
  MessageCircle,
  Plus,
  Settings,
  Sparkles,
  Users,
  Zap,
} from "lucide-react";
import Link from "next/link";
import { useState } from "react";

interface QuickAction {
  id: string;
  title: string;
  description: string;
  href: string;
  icon: React.ElementType;
  color: string;
  shortcut?: string;
}

const quickActions: QuickAction[] = [
  {
    id: "new-message",
    title: "Nova Mensagem",
    description: "Enviar mensagem rápida",
    href: "/messages?action=new",
    icon: MessageCircle,
    color: "blue",
    shortcut: "⌘ + M",
  },
  {
    id: "add-contact",
    title: "Novo Contato",
    description: "Adicionar contato",
    href: "/contacts?action=new",
    icon: Users,
    color: "green",
    shortcut: "⌘ + N",
  },
  {
    id: "view-reports",
    title: "Relatórios",
    description: "Visualizar métricas",
    href: "/reports",
    icon: BarChart3,
    color: "orange",
    shortcut: "⌘ + R",
  },
  {
    id: "settings",
    title: "Configurações",
    description: "Ajustar preferências",
    href: "/settings",
    icon: Settings,
    color: "gray",
    shortcut: "⌘ + ,",
  },
];

interface QuickActionsProps {
  isExpanded: boolean;
}

export default function QuickActions({ isExpanded }: QuickActionsProps) {
  const [isQuickActionsOpen, setIsQuickActionsOpen] = useState(false);

  const getColorClasses = (color: string) => {
    const colors: Record<string, { bg: string; text: string; hover: string }> =
      {
        blue: {
          bg: "bg-blue-50",
          text: "text-blue-600",
          hover: "hover:bg-blue-100",
        },
        green: {
          bg: "bg-green-50",
          text: "text-green-600",
          hover: "hover:bg-green-100",
        },
        orange: {
          bg: "bg-orange-50",
          text: "text-orange-600",
          hover: "hover:bg-orange-100",
        },
        gray: {
          bg: "bg-gray-50",
          text: "text-gray-600",
          hover: "hover:bg-gray-100",
        },
      };
    return colors[color] || colors.blue;
  };

  return (
    <div className="px-2 mt-4">
      {/* Quick Actions Trigger */}
      <motion.button
        onClick={() => setIsQuickActionsOpen(!isQuickActionsOpen)}
        className="w-full flex items-center px-3 py-2.5 text-gray-600 hover:text-purple-600 hover:bg-purple-50/50 rounded-xl transition-all duration-200 group"
        whileHover="hover"
        whileTap={{ scale: 0.98 }}
      >
        <motion.div whileHover={{ rotate: 180 }} transition={{ duration: 0.3 }}>
          <Zap className="w-5 h-5 flex-shrink-0" />
        </motion.div>

        <AnimatePresence>
          {isExpanded && (
            <motion.span
              initial={{ opacity: 0, width: 0 }}
              animate={{ opacity: 1, width: "auto" }}
              exit={{ opacity: 0, width: 0 }}
              transition={{ duration: 0.3 }}
              className="ml-3 overflow-hidden whitespace-nowrap font-medium"
            >
              Ações Rápidas
            </motion.span>
          )}
        </AnimatePresence>

        {isExpanded && (
          <motion.div
            animate={{ rotate: isQuickActionsOpen ? 180 : 0 }}
            transition={{ duration: 0.2 }}
            className="ml-auto"
          >
            <Plus className="w-4 h-4" />
          </motion.div>
        )}

        {!isExpanded && (
          <motion.div
            className="absolute left-full ml-3 px-3 py-2 text-sm text-white bg-purple-600/90 backdrop-blur-sm rounded-lg opacity-0 group-hover:opacity-100 transition-opacity duration-200 pointer-events-none z-50 whitespace-nowrap shadow-lg"
            initial={{ x: -10 }}
            animate={{ x: 0 }}
          >
            Ações Rápidas
            <div className="absolute top-1/2 left-0 w-0 h-0 border-t-4 border-b-4 border-r-4 border-transparent border-r-purple-600/90 transform -translate-y-1/2 -translate-x-full"></div>
          </motion.div>
        )}
      </motion.button>

      {/* Quick Actions Menu */}
      <AnimatePresence>
        {isQuickActionsOpen && isExpanded && (
          <motion.div
            initial={{ opacity: 0, height: 0 }}
            animate={{ opacity: 1, height: "auto" }}
            exit={{ opacity: 0, height: 0 }}
            transition={{ duration: 0.3 }}
            className="mt-2 overflow-hidden"
          >
            <motion.div
              className="bg-gradient-to-br from-white to-gray-50/50 rounded-xl p-3 border border-gray-200/50 shadow-sm backdrop-blur-sm"
              initial={{ scale: 0.95, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              transition={{ duration: 0.2, delay: 0.1 }}
            >
              {/* Header */}
              <div className="flex items-center space-x-2 mb-3 pb-2 border-b border-gray-100">
                <Sparkles className="w-4 h-4 text-purple-600" />
                <span className="text-sm font-semibold text-gray-800">
                  Ações Rápidas
                </span>
              </div>

              {/* Actions Grid */}
              <div className="grid grid-cols-2 gap-2">
                {quickActions.map((action, index) => {
                  const colorClasses = getColorClasses(action.color);
                  const Icon = action.icon;

                  return (
                    <motion.div
                      key={action.id}
                      initial={{ opacity: 0, y: 10 }}
                      animate={{ opacity: 1, y: 0 }}
                      transition={{ duration: 0.2, delay: index * 0.05 }}
                    >
                      <Link href={action.href}>
                        <motion.div
                          className={`p-3 rounded-lg ${colorClasses.bg} ${colorClasses.hover} transition-all duration-200 group cursor-pointer`}
                          whileHover={{ scale: 1.02 }}
                          whileTap={{ scale: 0.98 }}
                        >
                          <div className="flex flex-col items-center text-center space-y-2">
                            <motion.div
                              whileHover={{ scale: 1.1 }}
                              transition={{ duration: 0.2 }}
                            >
                              <Icon
                                className={`w-5 h-5 ${colorClasses.text}`}
                              />
                            </motion.div>

                            <div>
                              <p className="text-xs font-medium text-gray-800 leading-tight">
                                {action.title}
                              </p>
                              <p className="text-xs text-gray-500 mt-0.5">
                                {action.description}
                              </p>

                              {action.shortcut && (
                                <motion.span
                                  className="inline-block mt-1 px-1.5 py-0.5 text-xs bg-white/70 text-gray-600 rounded border border-gray-200 font-mono"
                                  initial={{ opacity: 0 }}
                                  animate={{ opacity: 1 }}
                                  transition={{ delay: 0.3 }}
                                >
                                  {action.shortcut}
                                </motion.span>
                              )}
                            </div>
                          </div>
                        </motion.div>
                      </Link>
                    </motion.div>
                  );
                })}
              </div>

              {/* Footer */}
              <motion.div
                className="mt-3 pt-2 border-t border-gray-100"
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                transition={{ delay: 0.4 }}
              >
                <p className="text-xs text-gray-500 text-center">
                  Use ⌘ + K para buscar mais opções
                </p>
              </motion.div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}
