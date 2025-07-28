"use client";

import { useReportsStore } from "@/store/reports";
import {
  ChartBarIcon,
  ChartPieIcon,
  ChatBubbleLeftRightIcon,
  ClockIcon,
  DocumentArrowDownIcon,
  PhoneIcon,
  TableCellsIcon,
  UsersIcon,
} from "@heroicons/react/24/outline";
import { useEffect, useState } from "react";

export default function ReportsPage() {
  const {
    isLoading,
    error,
    overviewStats,
    messageReport,
    contactReport,
    performanceReport,
    currentFilters,
    setFilters,
    loadOverviewStats,
    loadMessageReport,
    loadContactReport,
    loadPerformanceReport,
    exportToPDF,
    exportToExcel,
    reset,
  } = useReportsStore();

  const [selectedReport, setSelectedReport] = useState("overview");

  // Definir tipos de relatório
  const reportTypes = [
    {
      id: "overview",
      name: "Visão Geral",
      description: "Estatísticas gerais do sistema",
      icon: ChartBarIcon,
    },
    {
      id: "messages",
      name: "Mensagens",
      description: "Relatório detalhado de mensagens",
      icon: ChatBubbleLeftRightIcon,
    },
    {
      id: "contacts",
      name: "Contatos",
      description: "Análise de contatos e interações",
      icon: UsersIcon,
    },
    {
      id: "performance",
      name: "Performance",
      description: "Métricas de performance dos agentes",
      icon: ClockIcon,
    },
  ];

  // Carregar dados ao montar o componente
  useEffect(() => {
    loadOverviewStats();
    return () => reset();
  }, [loadOverviewStats, reset]);

  // Recarregar dados quando os filtros mudarem
  useEffect(() => {
    switch (selectedReport) {
      case "overview":
        loadOverviewStats();
        break;
      case "messages":
        loadMessageReport();
        break;
      case "contacts":
        loadContactReport();
        break;
      case "performance":
        loadPerformanceReport();
        break;
    }
  }, [currentFilters, selectedReport]);

  const handleDateRangeChange = (
    field: "startDate" | "endDate",
    value: string
  ) => {
    setFilters({
      ...currentFilters,
      [field]: value,
    });
  };

  const handleReportChange = (reportId: string) => {
    setSelectedReport(reportId);
  };

  const handleExportPDF = () => {
    exportToPDF(selectedReport as any);
  };

  const handleExportExcel = () => {
    exportToExcel(selectedReport as any);
  };

  const exportReport = (format: "pdf" | "excel") => {
    if (format === "pdf") {
      handleExportPDF();
    } else {
      handleExportExcel();
    }
  };

  // Usar dados reais do store ou fallback para dados vazios
  const currentData = {
    overview: overviewStats || {
      totalMessages: 0,
      totalContacts: 0,
      activeSessions: 0,
      responseTime: "0 min",
      messagesByDay: [],
      topContacts: [],
    },
    messages: messageReport || { messages: [], total: 0, page: 1, limit: 50 },
    contacts: contactReport || { contacts: [], total: 0, page: 1, limit: 50 },
    performance: performanceReport || {
      averageResponseTime: 0,
      messageVolumeByHour: [],
      agentPerformance: [],
      sessionStats: [],
    },
  };

  // Loading state
  if (isLoading) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto"></div>
          <p className="mt-4 text-gray-600">Carregando relatórios...</p>
        </div>
      </div>
    );
  }

  // Error state
  if (error) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <div className="text-red-500 text-xl mb-4">⚠️ Erro</div>
          <p className="text-gray-600 mb-4">{error}</p>
          <button
            onClick={() => loadOverviewStats()}
            className="bg-blue-600 text-white px-4 py-2 rounded-lg hover:bg-blue-700 transition-colors"
          >
            Tentar novamente
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* Header */}
        <div className="bg-white rounded-lg shadow mb-6">
          <div className="px-6 py-4 border-b border-gray-200">
            <div className="flex items-center justify-between">
              <div>
                <h1 className="text-2xl font-bold text-gray-900">Relatórios</h1>
                <p className="text-gray-600">
                  Análise completa de mensagens e performance
                </p>
              </div>
              <div className="flex space-x-3">
                <button
                  onClick={() => exportReport("pdf")}
                  className="bg-red-600 text-white px-4 py-2 rounded-lg hover:bg-red-700 transition-colors flex items-center"
                >
                  <DocumentArrowDownIcon className="w-5 h-5 mr-2" />
                  PDF
                </button>
                <button
                  onClick={() => exportReport("excel")}
                  className="bg-green-600 text-white px-4 py-2 rounded-lg hover:bg-green-700 transition-colors flex items-center"
                >
                  <TableCellsIcon className="w-5 h-5 mr-2" />
                  Excel
                </button>
              </div>
            </div>
          </div>
        </div>

        {/* Filtros */}
        <div className="bg-white rounded-lg shadow mb-6">
          <div className="p-6">
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Tipo de Relatório
                </label>
                <select
                  value={selectedReport}
                  onChange={(e) => handleReportChange(e.target.value)}
                  className="w-full border border-gray-300 rounded-lg px-3 py-2 focus:outline-none focus:ring-2 focus:ring-blue-500"
                >
                  {reportTypes.map((type) => (
                    <option key={type.id} value={type.id}>
                      {type.name}
                    </option>
                  ))}
                </select>
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Data Início
                </label>
                <input
                  type="date"
                  value={currentFilters.startDate}
                  onChange={(e) =>
                    handleDateRangeChange("startDate", e.target.value)
                  }
                  className="w-full border border-gray-300 rounded-lg px-3 py-2 focus:outline-none focus:ring-2 focus:ring-blue-500"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Data Fim
                </label>
                <input
                  type="date"
                  value={currentFilters.endDate}
                  onChange={(e) =>
                    handleDateRangeChange("endDate", e.target.value)
                  }
                  className="w-full border border-gray-300 rounded-lg px-3 py-2 focus:outline-none focus:ring-2 focus:ring-blue-500"
                />
              </div>
            </div>
          </div>
        </div>

        {/* Estatísticas Principais */}
        <div className="grid grid-cols-1 md:grid-cols-4 gap-6 mb-8">
          <div className="bg-white rounded-lg shadow p-6">
            <div className="flex items-center">
              <div className="w-12 h-12 bg-blue-100 rounded-lg flex items-center justify-center">
                <ChatBubbleLeftRightIcon className="w-6 h-6 text-blue-600" />
              </div>
              <div className="ml-4">
                <p className="text-sm font-medium text-gray-500">
                  Total Mensagens
                </p>
                <p className="text-2xl font-semibold text-gray-900">
                  {currentData.overview.totalMessages.toLocaleString()}
                </p>
              </div>
            </div>
          </div>

          <div className="bg-white rounded-lg shadow p-6">
            <div className="flex items-center">
              <div className="w-12 h-12 bg-green-100 rounded-lg flex items-center justify-center">
                <UsersIcon className="w-6 h-6 text-green-600" />
              </div>
              <div className="ml-4">
                <p className="text-sm font-medium text-gray-500">
                  Total Contatos
                </p>
                <p className="text-2xl font-semibold text-gray-900">
                  {currentData.overview.totalContacts}
                </p>
              </div>
            </div>
          </div>

          <div className="bg-white rounded-lg shadow p-6">
            <div className="flex items-center">
              <div className="w-12 h-12 bg-purple-100 rounded-lg flex items-center justify-center">
                <PhoneIcon className="w-6 h-6 text-purple-600" />
              </div>
              <div className="ml-4">
                <p className="text-sm font-medium text-gray-500">
                  Sessões Ativas
                </p>
                <p className="text-2xl font-semibold text-gray-900">
                  {currentData.overview.activeSessions}
                </p>
              </div>
            </div>
          </div>

          <div className="bg-white rounded-lg shadow p-6">
            <div className="flex items-center">
              <div className="w-12 h-12 bg-yellow-100 rounded-lg flex items-center justify-center">
                <ClockIcon className="w-6 h-6 text-yellow-600" />
              </div>
              <div className="ml-4">
                <p className="text-sm font-medium text-gray-500">
                  Tempo Resposta
                </p>
                <p className="text-2xl font-semibold text-gray-900">
                  {currentData.overview.responseTime}
                </p>
              </div>
            </div>
          </div>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
          {/* Gráfico de Mensagens por Dia */}
          <div className="bg-white rounded-lg shadow">
            <div className="p-6">
              <div className="flex items-center justify-between mb-6">
                <h3 className="text-lg font-semibold text-gray-900">
                  Mensagens por Dia
                </h3>
                <ChartBarIcon className="w-5 h-5 text-gray-400" />
              </div>
              <div className="space-y-4">
                {currentData.overview.messagesByDay.length > 0 ? (
                  currentData.overview.messagesByDay.map(
                    (day: any, index: number) => (
                      <div key={index} className="flex items-center">
                        <div className="w-12 text-sm text-gray-600">
                          {new Date(day.date).toLocaleDateString("pt-BR", {
                            weekday: "short",
                          })}
                        </div>
                        <div className="flex-1 mx-4">
                          <div className="bg-gray-200 rounded-full h-3">
                            <div
                              className="bg-blue-600 h-3 rounded-full transition-all duration-500"
                              style={{
                                width: `${Math.min(
                                  (day.messages /
                                    Math.max(
                                      ...currentData.overview.messagesByDay.map(
                                        (d: any) => d.messages
                                      )
                                    )) *
                                    100,
                                  100
                                )}%`,
                              }}
                            ></div>
                          </div>
                        </div>
                        <div className="w-12 text-sm font-medium text-gray-900 text-right">
                          {day.messages}
                        </div>
                      </div>
                    )
                  )
                ) : (
                  <div className="text-center text-gray-500 py-8">
                    Nenhum dado disponível
                  </div>
                )}
              </div>
            </div>
          </div>

          {/* Top Contatos */}
          <div className="bg-white rounded-lg shadow">
            <div className="p-6">
              <div className="flex items-center justify-between mb-6">
                <h3 className="text-lg font-semibold text-gray-900">
                  Top Contatos
                </h3>
                <ChartPieIcon className="w-5 h-5 text-gray-400" />
              </div>
              <div className="space-y-4">
                {currentData.overview.topContacts.length > 0 ? (
                  currentData.overview.topContacts.map(
                    (contact: any, index: number) => (
                      <div
                        key={index}
                        className="flex items-center justify-between"
                      >
                        <div className="flex items-center">
                          <div className="w-8 h-8 bg-gray-100 rounded-full flex items-center justify-center mr-3">
                            <span className="text-sm font-medium text-gray-600">
                              {index + 1}
                            </span>
                          </div>
                          <div>
                            <p className="font-medium text-gray-900">
                              {contact.name}
                            </p>
                            <p className="text-sm text-gray-500">
                              {contact.phone}
                            </p>
                          </div>
                        </div>
                        <div className="text-right">
                          <p className="font-medium text-gray-900">
                            {contact.messageCount || contact.messages || 0}
                          </p>
                          <p className="text-sm text-gray-500">mensagens</p>
                        </div>
                      </div>
                    )
                  )
                ) : (
                  <div className="text-center text-gray-500 py-8">
                    Nenhum dado disponível
                  </div>
                )}
              </div>
            </div>
          </div>
        </div>

        {/* Tipos de Relatório */}
        <div className="mt-8">
          <h3 className="text-lg font-semibold text-gray-900 mb-6">
            Relatórios Disponíveis
          </h3>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
            {reportTypes.map((type) => {
              const Icon = type.icon;
              return (
                <div
                  key={type.id}
                  className={`bg-white rounded-lg shadow p-6 cursor-pointer transition-all duration-200 ${
                    selectedReport === type.id
                      ? "ring-2 ring-blue-500 bg-blue-50"
                      : "hover:shadow-lg"
                  }`}
                  onClick={() => setSelectedReport(type.id)}
                >
                  <div className="flex flex-col items-center text-center">
                    <div
                      className={`w-12 h-12 rounded-lg flex items-center justify-center mb-4 ${
                        selectedReport === type.id
                          ? "bg-blue-600"
                          : "bg-gray-100"
                      }`}
                    >
                      <Icon
                        className={`w-6 h-6 ${
                          selectedReport === type.id
                            ? "text-white"
                            : "text-gray-600"
                        }`}
                      />
                    </div>
                    <h4 className="font-semibold text-gray-900 mb-2">
                      {type.name}
                    </h4>
                    <p className="text-sm text-gray-500">{type.description}</p>
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      </div>
    </div>
  );
}
