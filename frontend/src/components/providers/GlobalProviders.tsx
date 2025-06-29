"use client";

import { ToastContainer } from "@/components/ui/Toast";
import UniversalSearch from "@/components/ui/UniversalSearch";
import { useThemeStore } from "@/store/theme";
import { useToastStore } from "@/store/toast";
import { useEffect, useState } from "react";

interface GlobalProvidersProps {
  children: React.ReactNode;
}

const GlobalProviders = ({ children }: GlobalProvidersProps) => {
  const { toasts, removeToast, addToast } = useToastStore();
  const { setTheme, theme } = useThemeStore();
  const [isSearchOpen, setIsSearchOpen] = useState(false);

  // Inicializar tema na primeira renderização
  useEffect(() => {
    // Reaplicar o tema atual para garantir consistência
    setTheme(theme);
  }, []);

  // Atalho global para busca (Ctrl+K) e evento customizado
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

    const handleToastEvent = (e: CustomEvent) => {
      const { type, title, message, ...options } = e.detail;
      addToast({ type, title, message, ...options });
    };

    document.addEventListener("keydown", handleKeyDown);
    window.addEventListener("openUniversalSearch", handleCustomSearchEvent);
    window.addEventListener("showToast", handleToastEvent as EventListener);

    return () => {
      document.removeEventListener("keydown", handleKeyDown);
      window.removeEventListener(
        "openUniversalSearch",
        handleCustomSearchEvent
      );
      window.removeEventListener(
        "showToast",
        handleToastEvent as EventListener
      );
    };
  }, [addToast]);

  return (
    <>
      {children}

      {/* Sistema de Notificações */}
      <ToastContainer toasts={toasts} onRemove={removeToast} />

      {/* Busca Universal */}
      <UniversalSearch
        isOpen={isSearchOpen}
        onClose={() => setIsSearchOpen(false)}
      />
    </>
  );
};

export default GlobalProviders;
