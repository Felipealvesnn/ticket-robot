"use client";

import FirstLoginModal from "@/components/ui/FirstLoginModal";
import UniversalSearch from "@/components/ui/UniversalSearch";
import { useEffect, useState } from "react";
import { ToastContainer } from "react-toastify";
import "react-toastify/dist/ReactToastify.css";
import NextThemeProvider from "./NextThemeProvider";

interface GlobalProvidersProps {
  children: React.ReactNode;
}

const GlobalProviders = ({ children }: GlobalProvidersProps) => {
  const [isSearchOpen, setIsSearchOpen] = useState(false);

  // Atalho global para busca (Ctrl+K)
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if ((e.ctrlKey || e.metaKey) && e.key === "k") {
        e.preventDefault();
        setIsSearchOpen(true);
      }

      // Atalho rápido para alternar tema (Ctrl+Shift+L)
      if ((e.ctrlKey || e.metaKey) && e.shiftKey && e.key === "L") {
        e.preventDefault();
        // Disparar evento personalizado para alternar tema
        window.dispatchEvent(new CustomEvent("toggleTheme"));
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
    <NextThemeProvider>
      {children}

      {/* Sistema de Notificações com React Toastify */}
      <ToastContainer
        position="top-right"
        autoClose={4000}
        hideProgressBar={false}
        newestOnTop={true}
        closeOnClick
        rtl={false}
        pauseOnFocusLoss
        draggable
        pauseOnHover
        theme="colored"
        className="!z-[9999]"
        toastClassName="!bg-white !dark:bg-gray-800 !shadow-lg !border !border-gray-200 !dark:border-gray-700 !rounded-lg !text-gray-800 !dark:text-gray-200"
        progressClassName="!bg-gradient-to-r !from-blue-500 !to-purple-500"
      />

      {/* Busca Universal */}
      <UniversalSearch
        isOpen={isSearchOpen}
        onClose={() => setIsSearchOpen(false)}
      />

      {/* Modal de Primeira Senha */}
      <FirstLoginModal />
    </NextThemeProvider>
  );
};

export default GlobalProviders;
