import { create } from "zustand";
import { persist } from "zustand/middleware";

export type Theme = "light" | "dark" | "system";

interface ThemeStore {
  theme: Theme;
  setTheme: (theme: Theme) => void;
  toggleTheme: () => void;
}

export const useThemeStore = create<ThemeStore>()(
  persist(
    (set, get) => ({
      theme: "system",

      setTheme: (theme: Theme) => {
        console.log("🎨 Store: Definindo tema para:", theme);
        set({ theme });
      },

      toggleTheme: () => {
        const { theme } = get();
        const newTheme: Theme = theme === "dark" ? "light" : "dark";
        get().setTheme(newTheme);
      },
    }),
    {
      name: "theme-storage",
    }
  )
);
