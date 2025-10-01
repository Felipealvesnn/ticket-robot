"use client";

import { useReportsStore } from "@/store/reports";
import {
  ChartBarIcon,
  ChatBubbleLeftRightIcon,
  ClockIcon,
  UsersIcon,
} from "@heroicons/react/24/outline";
import { useEffect, useState } from "react";
import {
  ContactsReport,
  MessagesReport,
  OverviewReport,
  PerformanceReportComponent,
  ReportTypeSelector,
  ReportsFilters,
  ReportsHeader,
  StatsOverview,
  ToastProvider,
} from "./components";

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
        loadMessageReport(1);
        break;
      case "contacts":
        loadContactReport(1);
        break;
      case "performance":
        loadPerformanceReport();
        break;
    }
  }, [
    currentFilters,
    selectedReport,
    loadOverviewStats,
    loadMessageReport,
    loadContactReport,
    loadPerformanceReport,
  ]);

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
      totalTickets: 0,
      resolvedTickets: 0,
      resolutionRate: 0,
      averageResponseTime: "0m",
      agentStats: [],
      dailyStats: [],
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
    <ToastProvider>
      <div className="min-h-screen bg-gray-50">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
          {/* Header */}
          <ReportsHeader
            onExportPDF={() => exportReport("pdf")}
            onExportExcel={() => exportReport("excel")}
            currentReportType={selectedReport}
            isLoading={isLoading}
            currentData={currentData}
          />

          {/* Filtros */}
          <ReportsFilters
            reportTypes={reportTypes}
            selectedReport={selectedReport}
            currentFilters={currentFilters}
            onReportChange={handleReportChange}
            onDateRangeChange={handleDateRangeChange}
          />

          {/* Estatísticas Principais */}
          <StatsOverview stats={currentData.overview} />

          <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
            {/* Conteúdo baseado no tipo de relatório selecionado */}
            {selectedReport === "overview" && (
              <OverviewReport data={currentData.overview} />
            )}

            {/* Relatório de Mensagens */}
            {selectedReport === "messages" && (
              <MessagesReport
                data={currentData.messages}
                onLoadPage={loadMessageReport}
              />
            )}

            {/* Relatório de Contatos */}
            {selectedReport === "contacts" && (
              <ContactsReport
                data={currentData.contacts}
                onLoadPage={loadContactReport}
              />
            )}

            {/* Relatório de Performance */}
            {selectedReport === "performance" && (
              <PerformanceReportComponent data={currentData.performance} />
            )}
          </div>

          {/* Tipos de Relatório */}
          <ReportTypeSelector
            reportTypes={reportTypes}
            selectedReport={selectedReport}
            onReportSelect={setSelectedReport}
          />
        </div>
      </div>
    </ToastProvider>
  );
}
