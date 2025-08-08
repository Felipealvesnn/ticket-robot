"use client";

import { TicketFilters as TicketFiltersType } from "@/store/tickets";
import {
  ArrowPathIcon,
  MagnifyingGlassIcon,
} from "@heroicons/react/24/outline";
import { useCallback, useEffect, useRef, useState } from "react";

interface TicketFiltersProps {
  filters: TicketFiltersType;
  onFiltersChange: (filters: any) => void;
  onRefresh: () => void;
  loading: boolean;
}

export default function TicketFilters({
  filters,
  onFiltersChange,
  onRefresh,
  loading,
}: TicketFiltersProps) {
  const [searchTerm, setSearchTerm] = useState(filters.search || "");
  const searchTimeoutRef = useRef<NodeJS.Timeout | null>(null);

  // Função debounced para atualizar o filtro de busca
  const debouncedSetSearch = useCallback(
    (value: string) => {
      if (searchTimeoutRef.current) {
        clearTimeout(searchTimeoutRef.current);
      }
      searchTimeoutRef.current = setTimeout(() => {
        onFiltersChange({ search: value });
      }, 500);
    },
    [onFiltersChange]
  );

  // Limpar timeout quando o componente desmontar
  useEffect(() => {
    return () => {
      if (searchTimeoutRef.current) {
        clearTimeout(searchTimeoutRef.current);
      }
    };
  }, []);

  return (
    <div className="bg-white border-b border-gray-200 px-6 py-3 flex-shrink-0">
      <div className="flex flex-wrap items-center gap-3">
        {/* Busca */}
        <div className="relative min-w-64 flex-1 max-w-md">
          <MagnifyingGlassIcon className="w-4 h-4 absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400" />
          <input
            type="text"
            placeholder="Buscar por nome, telefone..."
            value={searchTerm}
            onChange={(e) => {
              setSearchTerm(e.target.value);
              debouncedSetSearch(e.target.value);
            }}
            className="w-full pl-9 pr-4 py-2 text-sm border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
          />
        </div>

        {/* Filtros */}
        <select
          value={filters.status || "ALL"}
          onChange={(e) => onFiltersChange({ status: e.target.value as any })}
          className="px-3 py-2 text-sm border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
        >
          <option value="ALL">Todos Status</option>
          <option value="OPEN">Abertos</option>
          <option value="IN_PROGRESS">Em Progresso</option>
          <option value="CLOSED">Fechados</option>
        </select>

        <select
          value={filters.priority || "ALL"}
          onChange={(e) => onFiltersChange({ priority: e.target.value as any })}
          className="px-3 py-2 text-sm border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
        >
          <option value="ALL">Todas Prioridades</option>
          <option value="LOW">Baixa</option>
          <option value="MEDIUM">Média</option>
          <option value="HIGH">Alta</option>
          <option value="URGENT">Urgente</option>
        </select>

        {/* Refresh Button */}
        <button
          onClick={onRefresh}
          disabled={loading}
          className="p-2 text-gray-500 hover:text-gray-700 hover:bg-gray-100 rounded-lg transition-colors disabled:opacity-50"
          title="Atualizar tickets"
        >
          <ArrowPathIcon
            className={`w-4 h-4 ${loading ? "animate-spin" : ""}`}
          />
        </button>
      </div>
    </div>
  );
}
