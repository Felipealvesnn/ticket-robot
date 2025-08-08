"use client";

import FirstLoginModal from "@/components/ui/FirstLoginModal";
import UniversalSearch from "@/components/ui/UniversalSearch";
import { useState } from "react";
import { useHotkeys } from "react-hotkeys-hook";
import { ToastContainer } from "react-toastify";
import "react-toastify/dist/ReactToastify.css";
import NextThemeProvider from "./NextThemeProvider";

interface GlobalProvidersProps {
  children: React.ReactNode;
}

const GlobalProviders = ({ children }: GlobalProvidersProps) => {
  const [isSearchOpen, setIsSearchOpen] = useState(false);

  // 🔥 ATALHOS GLOBAIS COM REACT-HOTKEYS-HOOK (mais limpo e robusto)

  // Atalho para busca universal (Ctrl+K ou Cmd+K)
  useHotkeys(
    "ctrl+k, cmd+k",
    (e) => {
      e.preventDefault();
      setIsSearchOpen(true);
    },
    {
      enableOnFormTags: false, // Não ativar em inputs/forms
      description: "Abrir busca universal",
    }
  );

  // Atalho para alternar tema (Ctrl+Shift+L ou Cmd+Shift+L)
  useHotkeys(
    "ctrl+shift+l, cmd+shift+l",
    (e) => {
      e.preventDefault();
      // Disparar evento personalizado para alternar tema
      window.dispatchEvent(new CustomEvent("toggleTheme"));
    },
    {
      enableOnFormTags: false,
      description: "Alternar tema",
    }
  );

  // Atalho para fechar busca (Escape)
  useHotkeys(
    "escape",
    () => {
      setIsSearchOpen(false);
    },
    {
      enableOnFormTags: true, // Permitir em forms para fechar busca
      description: "Fechar busca universal",
      enabled: isSearchOpen, // Só ativar quando busca estiver aberta
    }
  );

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
