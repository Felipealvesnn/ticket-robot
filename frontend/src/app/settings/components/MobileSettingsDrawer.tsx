"use client";

import { motion } from "framer-motion";
import { ChevronDown, Menu } from "lucide-react";
import { useState } from "react";
import { Drawer } from "vaul";

interface MobileSettingsDrawerProps {
  sections: Array<{
    id: string;
    title: string;
    icon: React.ElementType;
  }>;
  activeSection: string;
  onSectionChange: (section: string) => void;
}

export default function MobileSettingsDrawer({
  sections,
  activeSection,
  onSectionChange,
}: MobileSettingsDrawerProps) {
  const [isOpen, setIsOpen] = useState(false);

  const handleSectionSelect = (sectionId: string) => {
    onSectionChange(sectionId);
    setIsOpen(false);
  };

  const activeItem = sections.find((section) => section.id === activeSection);

  return (
    <>
      {/* Trigger Button - only visible on mobile */}
      <button
        onClick={() => setIsOpen(true)}
        className="md:hidden fixed top-4 left-4 z-40 bg-white dark:bg-gray-800 p-3 rounded-lg shadow-lg border border-gray-200 dark:border-gray-700"
      >
        <Menu className="w-5 h-5 text-gray-600 dark:text-gray-300" />
      </button>

      <Drawer.Root open={isOpen} onOpenChange={setIsOpen}>
        <Drawer.Portal>
          <Drawer.Overlay className="fixed inset-0 bg-black/40 z-50" />
          <Drawer.Content className="bg-white dark:bg-gray-800 flex flex-col rounded-t-[10px] h-fit fixed bottom-0 left-0 right-0 z-50">
            <div className="mx-auto w-12 h-1.5 flex-shrink-0 rounded-full bg-gray-300 dark:bg-gray-600 mt-4" />

            <div className="p-4 flex-1">
              <div className="mx-auto max-w-md">
                <Drawer.Title className="font-bold text-lg text-gray-900 dark:text-white mb-4">
                  Configurações
                </Drawer.Title>

                {/* Active Section Display */}
                <motion.div
                  initial={{ opacity: 0, y: 10 }}
                  animate={{ opacity: 1, y: 0 }}
                  className="mb-6 p-3 bg-gray-50 dark:bg-gray-700 rounded-lg"
                >
                  <div className="flex items-center justify-between">
                    <div className="flex items-center space-x-3">
                      {activeItem && (
                        <>
                          <activeItem.icon className="w-5 h-5 text-blue-600 dark:text-blue-400" />
                          <span className="font-medium text-gray-900 dark:text-white">
                            {activeItem.title}
                          </span>
                        </>
                      )}
                    </div>
                    <ChevronDown className="w-4 h-4 text-gray-500 dark:text-gray-400" />
                  </div>
                </motion.div>

                {/* Sections List */}
                <div className="space-y-2 max-h-80 overflow-y-auto">
                  {sections.map((section, index) => {
                    const isActive = section.id === activeSection;

                    return (
                      <motion.button
                        key={section.id}
                        initial={{ opacity: 0, y: 20 }}
                        animate={{ opacity: 1, y: 0 }}
                        transition={{ delay: index * 0.05 }}
                        onClick={() => handleSectionSelect(section.id)}
                        className={`
                          w-full flex items-center space-x-3 p-3 rounded-lg text-left transition-all duration-200
                          ${
                            isActive
                              ? "bg-blue-50 dark:bg-blue-900/30 text-blue-600 dark:text-blue-400 border border-blue-200 dark:border-blue-700"
                              : "hover:bg-gray-50 dark:hover:bg-gray-700 text-gray-700 dark:text-gray-300"
                          }
                        `}
                      >
                        <section.icon
                          className={`w-5 h-5 ${
                            isActive
                              ? "text-blue-600 dark:text-blue-400"
                              : "text-gray-500 dark:text-gray-400"
                          }`}
                        />
                        <span className="font-medium">{section.title}</span>
                        {isActive && (
                          <motion.div
                            layoutId="activeIndicator"
                            className="w-2 h-2 bg-blue-600 dark:bg-blue-400 rounded-full ml-auto"
                          />
                        )}
                      </motion.button>
                    );
                  })}
                </div>

                {/* Close Button */}
                <motion.button
                  initial={{ opacity: 0 }}
                  animate={{ opacity: 1 }}
                  transition={{ delay: 0.3 }}
                  onClick={() => setIsOpen(false)}
                  className="w-full mt-6 bg-gray-100 dark:bg-gray-700 text-gray-700 dark:text-gray-300 py-3 rounded-lg font-medium hover:bg-gray-200 dark:hover:bg-gray-600 transition-colors"
                >
                  Fechar
                </motion.button>
              </div>
            </div>
          </Drawer.Content>
        </Drawer.Portal>
      </Drawer.Root>
    </>
  );
}
