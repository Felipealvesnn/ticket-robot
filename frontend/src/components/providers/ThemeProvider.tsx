"use client";

import { useThemeStore } from "@/store/theme";
import { useEffect } from "react";

interface ThemeProviderProps {
  children: React.ReactNode;
}

export default function ThemeProvider({ children }: ThemeProviderProps) {
  const { theme, setTheme, toggleTheme } = useThemeStore();

  useEffect(() => {
    // Aplicar tema inicial no DOM
    const applyThemeToDOM = (theme: "light" | "dark") => {
      const root = document.documentElement;

      if (theme === "dark") {
        root.classList.add("dark");
      } else {
        root.classList.remove("dark");
      }

      console.log(`🎨 ThemeProvider: Tema ${theme} aplicado ao DOM`);
      console.log("🔍 Classes no HTML:", root.className);
    };

    // Função para detectar preferência do sistema
    const getSystemTheme = (): "light" | "dark" => {
      return window.matchMedia("(prefers-color-scheme: dark)").matches
        ? "dark"
        : "light";
    };

    // Aplicar tema baseado na preferência atual
    if (theme === "system") {
      const systemTheme = getSystemTheme();
      applyThemeToDOM(systemTheme);

      // Listener para mudanças no tema do sistema
      const mediaQuery = window.matchMedia("(prefers-color-scheme: dark)");
      const handleSystemThemeChange = (e: MediaQueryListEvent) => {
        if (theme === "system") {
          applyThemeToDOM(e.matches ? "dark" : "light");
        }
      };

      mediaQuery.addEventListener("change", handleSystemThemeChange);

      // Cleanup listener para tema do sistema
      return () =>
        mediaQuery.removeEventListener("change", handleSystemThemeChange);
    } else {
      applyThemeToDOM(theme);
    }

    // Listener para evento de toggle de tema
    const handleToggleTheme = () => {
      toggleTheme();
    };

    window.addEventListener("toggleTheme", handleToggleTheme);

    return () => {
      window.removeEventListener("toggleTheme", handleToggleTheme);
    };
  }, [theme, toggleTheme]);

  return <>{children}</>;
}
