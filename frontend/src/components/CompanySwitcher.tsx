"use client";

import { useAuthStore } from "@/store/auth";
import { ChevronDownIcon } from "@heroicons/react/24/outline";
import { useState } from "react";

export default function CompanySwitcher() {
  const { user, currentCompanyId, setCurrentCompany } = useAuthStore();
  const [isOpen, setIsOpen] = useState(false);

  const companies = user?.companies || [];
  const currentCompany = companies.find((c) => c.id === currentCompanyId);

  // Só mostrar se o usuário tiver mais de uma empresa
  if (companies.length <= 1) {
    return null;
  }

  return (
    <div className="relative">
      <button
        onClick={() => setIsOpen(!isOpen)}
        className="flex items-center space-x-2 px-3 py-2 bg-white border border-gray-300 rounded-md shadow-sm text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
      >
        <div className="flex flex-col items-start">
          <span className="font-medium text-gray-900">
            {currentCompany?.name || "Selecionar Empresa"}
          </span>
          <span className="text-xs text-gray-500">
            {currentCompany?.role.name || ""}
          </span>
        </div>
        <ChevronDownIcon
          className={`h-4 w-4 text-gray-400 transition-transform ${
            isOpen ? "rotate-180" : ""
          }`}
        />
      </button>

      {isOpen && (
        <>
          {/* Backdrop */}
          <div
            className="fixed inset-0 z-10"
            onClick={() => setIsOpen(false)}
          />

          {/* Dropdown */}
          <div className="absolute top-full left-0 mt-1 w-64 bg-white border border-gray-200 rounded-md shadow-lg z-20">
            <div className="py-1">
              <div className="px-3 py-2 text-xs font-medium text-gray-500 uppercase tracking-wide">
                Suas Empresas ({companies.length})
              </div>

              {companies.map((company) => (
                <button
                  key={company.id}
                  onClick={() => {
                    if (company.id !== currentCompanyId) {
                      setCurrentCompany(company.id);
                    }
                    setIsOpen(false);
                  }}
                  className={`w-full text-left px-3 py-2 hover:bg-gray-50 ${
                    company.id === currentCompanyId
                      ? "bg-blue-50 border-r-2 border-blue-500"
                      : ""
                  }`}
                >
                  <div className="flex items-center justify-between">
                    <div>
                      <div className="font-medium text-gray-900">
                        {company.name}
                      </div>
                      <div className="text-sm text-gray-500">
                        {company.role.name}
                      </div>
                    </div>

                    {company.id === currentCompanyId && (
                      <div className="flex items-center">
                        <span className="text-xs bg-blue-100 text-blue-800 px-2 py-1 rounded">
                          Atual
                        </span>
                      </div>
                    )}
                  </div>
                </button>
              ))}

              <div className="border-t border-gray-100 mt-1 pt-1">
                <div className="px-3 py-2 text-xs text-gray-500">
                  💡 Trocar empresa reconectará suas sessões
                </div>
              </div>
            </div>
          </div>
        </>
      )}
    </div>
  );
}
