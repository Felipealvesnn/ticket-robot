"use client";

import { useAuthStore } from "@/store/auth";
import { useToastStore } from "@/store/toast";
import {
  ArrowPathIcon,
  BuildingOfficeIcon,
  CheckIcon,
  ChevronDownIcon,
} from "@heroicons/react/24/outline";
import { useEffect, useRef, useState } from "react";

export default function CompanySwitcher() {
  const { user, currentCompanyId, setCurrentCompany } = useAuthStore();
  const { success: showSuccessToast, error: showErrorToast } = useToastStore();
  const [isOpen, setIsOpen] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [switchingToCompanyId, setSwitchingToCompanyId] = useState<
    string | null
  >(null);
  const [focusedIndex, setFocusedIndex] = useState(0);
  const dropdownRef = useRef<HTMLDivElement>(null);
  const buttonRef = useRef<HTMLButtonElement>(null);

  const companies = user?.companies || [];
  const currentCompany = companies.find((c) => c.id === currentCompanyId);

  // Só mostrar se o usuário tiver mais de uma empresa
  if (companies.length <= 1) {
    return null;
  }

  const handleCompanySwitch = async (companyId: string) => {
    if (companyId === currentCompanyId) {
      setIsOpen(false);
      return;
    }

    const targetCompany = companies.find((c) => c.id === companyId);
    if (!targetCompany) return;

    // Evitar múltiplas trocas rápidas
    if (isLoading) {
      console.log("🗑️ Troca já em andamento, ignorando...");
      return;
    }

    setIsLoading(true);
    setSwitchingToCompanyId(companyId);

    try {
      console.log("🏢 Iniciando troca para:", targetCompany.name);
      await setCurrentCompany(companyId);

      // Mostrar toast de sucesso
      showSuccessToast(
        "Empresa alterada!",
        `Agora você está trabalhando na empresa: ${targetCompany.name}`,
        { duration: 4000 }
      );

      // Fechar dropdown
      setIsOpen(false);
    } catch (error) {
      console.error("Erro ao trocar empresa:", error);
      showErrorToast(
        "Erro ao trocar empresa",
        "Ocorreu um erro inesperado. Tente novamente.",
        { duration: 6000 }
      );
    } finally {
      setIsLoading(false);
      setSwitchingToCompanyId(null);
    }
  };

  // Fechar dropdown com ESC e navegação com teclado
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (!isOpen) return;

      switch (e.key) {
        case "Escape":
          setIsOpen(false);
          buttonRef.current?.focus();
          break;
        case "ArrowDown":
          e.preventDefault();
          setFocusedIndex((prev) => (prev + 1) % companies.length);
          break;
        case "ArrowUp":
          e.preventDefault();
          setFocusedIndex(
            (prev) => (prev - 1 + companies.length) % companies.length
          );
          break;
        case "Enter":
        case " ":
          e.preventDefault();
          if (companies[focusedIndex]) {
            handleCompanySwitch(companies[focusedIndex].id);
          }
          break;
        case "Tab":
          setIsOpen(false);
          break;
      }
    };

    document.addEventListener("keydown", handleKeyDown);
    return () => document.removeEventListener("keydown", handleKeyDown);
  }, [isOpen, focusedIndex, companies]);

  // Resetar foco quando abrir/fechar
  useEffect(() => {
    if (isOpen) {
      const currentIndex = companies.findIndex(
        (c) => c.id === currentCompanyId
      );
      setFocusedIndex(currentIndex >= 0 ? currentIndex : 0);
    }
  }, [isOpen, currentCompanyId, companies]);

  return (
    <div className="relative" ref={dropdownRef}>
      <button
        ref={buttonRef}
        onClick={() => setIsOpen(!isOpen)}
        disabled={isLoading}
        className="group w-full flex items-center space-x-3 px-4 py-3 bg-gradient-to-r from-white to-gray-50 
                   border border-gray-200 hover:border-gray-300 rounded-xl shadow-sm hover:shadow-md
                   focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent 
                   transition-all duration-200 disabled:opacity-50 disabled:cursor-not-allowed
                   transform hover:scale-[1.02] active:scale-[0.98]"
        aria-expanded={isOpen}
        aria-haspopup="listbox"
        aria-label={`Empresa atual: ${
          currentCompany?.name || "Nenhuma"
        }. Clique para trocar de empresa.`}
      >
        {/* Ícone da empresa */}
        <div className="flex-shrink-0">
          <div
            className="w-8 h-8 bg-gradient-to-br from-blue-500 to-blue-600 rounded-lg 
                          flex items-center justify-center shadow-sm group-hover:shadow-md
                          transition-all duration-200 group-hover:scale-110"
          >
            <BuildingOfficeIcon className="w-4 h-4 text-white" />
          </div>
        </div>

        {/* Informações da empresa */}
        <div className="flex-1 min-w-0 text-left">
          <div className="font-medium text-gray-900 truncate">
            {currentCompany?.name || "Selecionar Empresa"}
          </div>
          <div className="text-xs text-gray-500 truncate">
            {currentCompany?.role.name || ""}
          </div>
        </div>

        {/* Indicador de loading ou chevron */}
        <div className="flex-shrink-0">
          {isLoading ? (
            <ArrowPathIcon className="w-4 h-4 text-gray-400 animate-spin" />
          ) : (
            <ChevronDownIcon
              className={`w-4 h-4 text-gray-400 transition-transform duration-200 group-hover:text-gray-600 ${
                isOpen ? "rotate-180" : ""
              }`}
            />
          )}
        </div>
      </button>

      {/* Dropdown */}
      {isOpen && (
        <>
          {/* Backdrop */}
          <div
            className="fixed inset-0 z-10"
            onClick={() => setIsOpen(false)}
          />

          {/* Menu Dropdown */}
          <div
            className="absolute top-full left-0 mt-2 w-full min-w-72 bg-white border border-gray-200 
                          rounded-xl shadow-xl z-20 overflow-hidden
                          animate-in slide-in-from-top-2 fade-in-0 duration-200 ease-out"
          >
            {/* Header */}
            <div className="px-4 py-3 bg-gradient-to-r from-gray-50 to-gray-100 border-b border-gray-200">
              <div className="flex items-center space-x-2">
                <BuildingOfficeIcon className="w-4 h-4 text-gray-500" />
                <span className="text-sm font-medium text-gray-700">
                  Suas Empresas
                </span>
                <span className="text-xs bg-blue-100 text-blue-700 px-2 py-0.5 rounded-full font-medium">
                  {companies.length}
                </span>
              </div>
            </div>

            {/* Lista de empresas */}
            <div className="py-1 max-h-80 overflow-y-auto">
              {companies.map((company, index) => {
                const isActive = company.id === currentCompanyId;
                const isSwitching = switchingToCompanyId === company.id;
                const isFocused = index === focusedIndex;

                return (
                  <button
                    key={company.id}
                    onClick={() => handleCompanySwitch(company.id)}
                    disabled={isLoading}
                    className={`w-full text-left px-4 py-3 transition-all duration-150 group relative
                              hover:bg-blue-50 focus:bg-blue-50 focus:outline-none
                              disabled:opacity-50 disabled:cursor-not-allowed
                              ${
                                isActive
                                  ? "bg-blue-50 border-r-4 border-blue-500"
                                  : ""
                              }
                              ${isFocused ? "bg-gray-100" : ""}`}
                    role="option"
                    aria-selected={isActive}
                    aria-label={`${company.name}, ${company.role.name}${
                      isActive ? " (empresa atual)" : ""
                    }`}
                  >
                    <div className="flex items-center space-x-3">
                      {/* Avatar da empresa */}
                      <div
                        className={`w-10 h-10 rounded-lg flex items-center justify-center shadow-sm transition-all duration-200
                                    ${
                                      isActive
                                        ? "bg-gradient-to-br from-blue-500 to-blue-600 scale-110"
                                        : "bg-gradient-to-br from-gray-400 to-gray-500 group-hover:from-blue-400 group-hover:to-blue-500 group-hover:scale-105"
                                    }`}
                      >
                        <BuildingOfficeIcon className="w-5 h-5 text-white" />
                      </div>

                      {/* Informações */}
                      <div className="flex-1 min-w-0">
                        <div className="flex items-center space-x-2">
                          <span
                            className={`font-medium truncate transition-colors ${
                              isActive
                                ? "text-blue-900"
                                : "text-gray-900 group-hover:text-blue-700"
                            }`}
                          >
                            {company.name}
                          </span>
                          {isActive && (
                            <CheckIcon className="w-4 h-4 text-blue-600 flex-shrink-0 animate-in zoom-in-50 duration-200" />
                          )}
                        </div>
                        <div
                          className={`text-sm truncate transition-colors ${
                            isActive
                              ? "text-blue-700"
                              : "text-gray-500 group-hover:text-blue-600"
                          }`}
                        >
                          {company.role.name}
                        </div>
                      </div>

                      {/* Estado */}
                      <div className="flex-shrink-0">
                        {isSwitching ? (
                          <ArrowPathIcon className="w-4 h-4 text-blue-500 animate-spin" />
                        ) : isActive ? (
                          <span
                            className="text-xs bg-blue-100 text-blue-700 px-2 py-1 rounded-full font-medium
                                         animate-in slide-in-from-right-1 duration-300"
                          >
                            Atual
                          </span>
                        ) : null}
                      </div>
                    </div>
                  </button>
                );
              })}
            </div>

          
          </div>
        </>
      )}
    </div>
  );
}
