"use client";

import { Command } from "cmdk";
import { AnimatePresence, motion } from "framer-motion";
import { Search, Settings, X } from "lucide-react";
import { useEffect, useState } from "react";

interface CommandPaletteProps {
  isOpen: boolean;
  onClose: () => void;
  onNavigate: (section: string) => void;
  availableSections: Array<{
    id: string;
    title: string;
    description: string;
    icon: any;
    color: string;
  }>;
}

export function CommandPalette({
  isOpen,
  onClose,
  onNavigate,
  availableSections,
}: CommandPaletteProps) {
  const [search, setSearch] = useState("");

  useEffect(() => {
    const down = (e: KeyboardEvent) => {
      if (e.key === "k" && (e.metaKey || e.ctrlKey)) {
        e.preventDefault();
        onClose();
      }
      if (e.key === "Escape") {
        onClose();
      }
    };

    document.addEventListener("keydown", down);
    return () => document.removeEventListener("keydown", down);
  }, [onClose]);

  if (!isOpen) return null;

  return (
    <AnimatePresence>
      <motion.div
        className="fixed inset-0 z-50 bg-black/50 backdrop-blur-sm"
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        exit={{ opacity: 0 }}
        onClick={onClose}
      >
        <div className="flex min-h-full items-start justify-center p-4 pt-[10vh]">
          <motion.div
            className="mx-auto max-w-xl w-full"
            initial={{ opacity: 0, scale: 0.95, y: -20 }}
            animate={{ opacity: 1, scale: 1, y: 0 }}
            exit={{ opacity: 0, scale: 0.95, y: -20 }}
            transition={{ duration: 0.2 }}
            onClick={(e) => e.stopPropagation()}
          >
            <Command className="bg-white rounded-xl shadow-2xl border border-gray-200 overflow-hidden">
              <div className="flex items-center border-b border-gray-100 px-4">
                <Search className="mr-3 h-5 w-5 text-gray-400" />
                <Command.Input
                  value={search}
                  onValueChange={setSearch}
                  placeholder="Buscar configurações..."
                  className="flex-1 bg-transparent py-4 text-base placeholder:text-gray-400 focus:outline-none"
                />
                <button
                  onClick={onClose}
                  className="ml-2 p-1 hover:bg-gray-100 rounded-md transition-colors"
                >
                  <X className="h-4 w-4 text-gray-400" />
                </button>
              </div>

              <Command.List className="max-h-80 overflow-y-auto p-2">
                <Command.Empty className="py-8 text-center text-gray-500">
                  <Settings className="mx-auto mb-2 h-8 w-8 text-gray-300" />
                  <p>Nenhuma configuração encontrada.</p>
                </Command.Empty>

                <Command.Group heading="Configurações">
                  {availableSections.map((section) => {
                    const Icon = section.icon;
                    return (
                      <Command.Item
                        key={section.id}
                        value={`${section.title} ${section.description}`}
                        onSelect={() => {
                          onNavigate(section.id);
                          onClose();
                        }}
                        className="flex items-center gap-3 px-3 py-3 rounded-lg cursor-pointer transition-colors data-[selected]:bg-blue-50 data-[selected]:text-blue-700"
                      >
                        <div
                          className={`p-2 rounded-lg ${getColorClasses(
                            section.color
                          )}`}
                        >
                          <Icon size={16} />
                        </div>
                        <div className="flex-1 min-w-0">
                          <p className="font-medium text-sm">{section.title}</p>
                          <p className="text-xs text-gray-500 truncate">
                            {section.description}
                          </p>
                        </div>
                        <kbd className="pointer-events-none hidden h-5 select-none items-center gap-1 rounded border bg-gray-100 px-1.5 font-mono text-[10px] font-medium text-gray-600 sm:flex">
                          <span className="text-xs">↵</span>
                        </kbd>
                      </Command.Item>
                    );
                  })}
                </Command.Group>
              </Command.List>

              <div className="border-t border-gray-100 px-4 py-3 text-xs text-gray-500 bg-gray-50">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <kbd className="pointer-events-none h-5 select-none items-center gap-1 rounded border bg-white px-1.5 font-mono text-[10px] font-medium text-gray-600 flex">
                      ↵
                    </kbd>
                    <span>para navegar</span>
                  </div>
                  <div className="flex items-center gap-2">
                    <kbd className="pointer-events-none h-5 select-none items-center gap-1 rounded border bg-white px-1.5 font-mono text-[10px] font-medium text-gray-600 flex">
                      esc
                    </kbd>
                    <span>para fechar</span>
                  </div>
                </div>
              </div>
            </Command>
          </motion.div>
        </div>
      </motion.div>
    </AnimatePresence>
  );
}

function getColorClasses(color: string) {
  const colorMap = {
    blue: "bg-blue-100 text-blue-600",
    green: "bg-green-100 text-green-600",
    red: "bg-red-100 text-red-600",
    yellow: "bg-yellow-100 text-yellow-600",
    gray: "bg-gray-100 text-gray-600",
    purple: "bg-purple-100 text-purple-600",
  };
  return colorMap[color as keyof typeof colorMap] || colorMap.gray;
}
