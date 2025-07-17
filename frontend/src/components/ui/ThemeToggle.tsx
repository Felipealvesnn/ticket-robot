"use client";

import { Theme, useThemeStore } from "@/store/theme";
import { Monitor, Moon, Sun } from "lucide-react";

const ThemeToggle = () => {
  const { theme, setTheme } = useThemeStore();

  const themes: { value: Theme; label: string; icon: React.ReactNode }[] = [
    { value: "light", label: "Claro", icon: <Sun className="h-4 w-4" /> },
    { value: "dark", label: "Escuro", icon: <Moon className="h-4 w-4" /> },
    {
      value: "system",
      label: "Sistema",
      icon: <Monitor className="h-4 w-4" />,
    },
  ];

  return (
    <div className="flex items-center space-x-1 bg-gray-100 dark:bg-gray-800 rounded-lg p-1">
      {themes.map((themeOption) => (
        <button
          key={themeOption.value}
          onClick={() => {
            console.log(
              "🎨 ThemeToggle: Mudando tema para:",
              themeOption.value
            );
            setTheme(themeOption.value);

            // Verificar aplicação imediata
            setTimeout(() => {
              const html = document.documentElement;
              const body = document.body;
              console.log("🔍 Após mudança - HTML classes:", html.className);
              console.log("🔍 Após mudança - BODY classes:", body.className);
            }, 50);
          }}
          className={`
            flex items-center space-x-2 px-3 py-2 rounded-md text-sm font-medium transition-all
            ${
              theme === themeOption.value
                ? "bg-white dark:bg-gray-700 text-gray-900 dark:text-gray-100 shadow-sm"
                : "text-gray-600 dark:text-gray-400 hover:text-gray-900 dark:hover:text-gray-100"
            }
          `}
        >
          {themeOption.icon}
          <span className="hidden sm:inline">{themeOption.label}</span>
        </button>
      ))}
    </div>
  );
};

export default ThemeToggle;
