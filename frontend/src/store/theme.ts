import { create } from "zustand";
import { persist } from "zustand/middleware";

export type Theme = "light" | "dark" | "system";
export type ResolvedTheme = "light" | "dark";

interface ThemeStore {
  theme: Theme;
  resolvedTheme: ResolvedTheme;
  setTheme: (theme: Theme) => void;
  toggleTheme: () => void;
}

// Função para detectar preferência do sistema
const getSystemTheme = (): ResolvedTheme => {
  if (typeof window === "undefined") return "light";
  return window.matchMedia("(prefers-color-scheme: dark)").matches
    ? "dark"
    : "light";
};

// Função para resolver o tema atual
const resolveTheme = (theme: Theme): ResolvedTheme => {
  if (theme === "system") {
    return getSystemTheme();
  }
  return theme;
};

// Aplicar tema no DOM
const applyTheme = (resolvedTheme: ResolvedTheme) => {
  if (typeof window === "undefined") return;

  const root = document.documentElement;

  if (resolvedTheme === "dark") {
    root.classList.add("dark");
    console.log("🌙 Tema DARK aplicado ao DOM");
  } else {
    root.classList.remove("dark");
    console.log("☀️ Tema LIGHT aplicado ao DOM");
  }

  // Verificar se foi aplicado corretamente
  console.log("🔍 Classes no html:", root.className);
};

export const useThemeStore = create<ThemeStore>()(
  persist(
    (set, get) => ({
      theme: "system",
      resolvedTheme: "light",

      setTheme: (theme: Theme) => {
        const resolvedTheme = resolveTheme(theme);

        set({ theme, resolvedTheme });

        // Aplicar tema imediatamente
        if (typeof window !== "undefined") {
          applyTheme(resolvedTheme);
        }
      },

      toggleTheme: () => {
        const { theme } = get();
        const newTheme: Theme = theme === "dark" ? "light" : "dark";
        get().setTheme(newTheme);
      },
    }),
    {
      name: "theme-storage",
      onRehydrateStorage: () => (state) => {
        if (state && typeof window !== "undefined") {
          // Reaplica o tema após hidratação
          const resolvedTheme = resolveTheme(state.theme);
          state.resolvedTheme = resolvedTheme;
          applyTheme(resolvedTheme);

          // Escuta mudanças no tema do sistema
          const mediaQuery = window.matchMedia("(prefers-color-scheme: dark)");
          const handleChange = () => {
            if (state.theme === "system") {
              const newResolvedTheme = getSystemTheme();
              state.resolvedTheme = newResolvedTheme;
              applyTheme(newResolvedTheme);
            }
          };

          mediaQuery.addEventListener("change", handleChange);

          // Cleanup seria ideal, mas zustand persist não tem cleanup hook
          // Em uma implementação real, você poderia usar um useEffect no componente raiz
        }
      },
    }
  )
);
