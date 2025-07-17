"use client";

import FirstLoginModal from "@/components/ui/FirstLoginModal";
import UniversalSearch from "@/components/ui/UniversalSearch";
import { useThemeStore } from "@/store/theme";
import { useEffect, useState } from "react";
import { ToastContainer } from "react-toastify";
import "react-toastify/dist/ReactToastify.css";

interface GlobalProvidersProps {
  children: React.ReactNode;
}

const GlobalProviders = ({ children }: GlobalProvidersProps) => {
  const { setTheme, theme, resolvedTheme } = useThemeStore();
  const [isSearchOpen, setIsSearchOpen] = useState(false);

  // Inicializar tema na primeira renderização
  useEffect(() => {
    console.log("🎨 GlobalProviders: Inicializando tema...");
    console.log("🎨 Tema atual:", theme);
    console.log("🎨 Tema resolvido:", resolvedTheme);

    // Forçar reaplicação do tema atual
    setTheme(theme);

    // Verificar se as classes foram aplicadas
    setTimeout(() => {
      const html = document.documentElement;
      const body = document.body;
      console.log("🔍 Classes no HTML após init:", html.className);
      console.log("🔍 Classes no BODY após init:", body.className);
    }, 100);
  }, [theme, setTheme]);

  // Atalho global para busca (Ctrl+K)
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if ((e.ctrlKey || e.metaKey) && e.key === "k") {
        e.preventDefault();
        setIsSearchOpen(true);
      }
    };

    const handleCustomSearchEvent = () => {
      setIsSearchOpen(true);
    };

    document.addEventListener("keydown", handleKeyDown);
    window.addEventListener("openUniversalSearch", handleCustomSearchEvent);

    return () => {
      document.removeEventListener("keydown", handleKeyDown);
      window.removeEventListener(
        "openUniversalSearch",
        handleCustomSearchEvent
      );
    };
  }, []);

  return (
    <>
      {children}

      {/* Sistema de Notificações com React Toastify */}
      <ToastContainer
        position="top-right"
        autoClose={5000}
        hideProgressBar={false}
        newestOnTop={false}
        closeOnClick
        rtl={false}
        pauseOnFocusLoss
        draggable
        pauseOnHover
        theme="light"
        className="!z-[9999]"
      />

      {/* Busca Universal */}
      <UniversalSearch
        isOpen={isSearchOpen}
        onClose={() => setIsSearchOpen(false)}
      />

      {/* Modal de Primeira Senha */}
      <FirstLoginModal />
    </>
  );
};

export default GlobalProviders;
