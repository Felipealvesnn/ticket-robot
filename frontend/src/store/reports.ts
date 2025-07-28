import type {
  ContactReport,
  MessageReport,
  OverviewStats,
  PerformanceReport,
  ReportFilters,
} from "@/services/reports";
import { reportsService } from "@/services/reports";
import { ExcelGenerator, PDFGenerator } from "@/utils/reportGenerators";
import { create } from "zustand";

interface ReportsState {
  // Estados de loading
  isLoading: boolean;
  error: string | null;

  // Dados dos relatórios
  overviewStats: OverviewStats | null;
  messageReport: MessageReport | null;
  contactReport: ContactReport | null;
  performanceReport: PerformanceReport | null;

  // Filtros atuais
  currentFilters: ReportFilters;

  // Ações
  setFilters: (filters: ReportFilters) => void;
  loadOverviewStats: () => Promise<void>;
  loadMessageReport: (page?: number, limit?: number) => Promise<void>;
  loadContactReport: (page?: number, limit?: number) => Promise<void>;
  loadPerformanceReport: () => Promise<void>;
  exportToPDF: (
    reportType: "overview" | "messages" | "contacts" | "performance"
  ) => Promise<void>;
  exportToExcel: (
    reportType: "overview" | "messages" | "contacts" | "performance"
  ) => Promise<void>;
  reset: () => void;
}

const initialFilters: ReportFilters = {
  startDate: new Date(Date.now() - 7 * 24 * 60 * 60 * 1000)
    .toISOString()
    .split("T")[0], // 7 dias atrás
  endDate: new Date().toISOString().split("T")[0], // hoje
};

export const useReportsStore = create<ReportsState>((set, get) => ({
  // Estados iniciais
  isLoading: false,
  error: null,
  overviewStats: null,
  messageReport: null,
  contactReport: null,
  performanceReport: null,
  currentFilters: initialFilters,

  // Definir filtros
  setFilters: (filters: ReportFilters) => {
    set({ currentFilters: filters });
  },

  // Carregar estatísticas de visão geral
  loadOverviewStats: async () => {
    const { currentFilters } = get();
    set({ isLoading: true, error: null });

    try {
      const data = await reportsService.getOverviewStats(currentFilters);
      set({ overviewStats: data, isLoading: false });
    } catch (error) {
      console.error("Erro ao carregar estatísticas:", error);
      set({
        error: "Erro ao carregar estatísticas. Tente novamente.",
        isLoading: false,
      });
    }
  },

  // Carregar relatório de mensagens
  loadMessageReport: async (page = 1, limit = 50) => {
    const { currentFilters } = get();
    set({ isLoading: true, error: null });

    try {
      const data = await reportsService.getMessageReport(
        currentFilters,
        page,
        limit
      );
      set({ messageReport: data, isLoading: false });
    } catch (error) {
      console.error("Erro ao carregar relatório de mensagens:", error);
      set({
        error: "Erro ao carregar relatório de mensagens. Tente novamente.",
        isLoading: false,
      });
    }
  },

  // Carregar relatório de contatos
  loadContactReport: async (page = 1, limit = 50) => {
    const { currentFilters } = get();
    set({ isLoading: true, error: null });

    try {
      const data = await reportsService.getContactReport(
        currentFilters,
        page,
        limit
      );
      set({ contactReport: data, isLoading: false });
    } catch (error) {
      console.error("Erro ao carregar relatório de contatos:", error);
      set({
        error: "Erro ao carregar relatório de contatos. Tente novamente.",
        isLoading: false,
      });
    }
  },

  // Carregar relatório de performance
  loadPerformanceReport: async () => {
    const { currentFilters } = get();
    set({ isLoading: true, error: null });

    try {
      const data = await reportsService.getPerformanceReport(currentFilters);
      set({ performanceReport: data, isLoading: false });
    } catch (error) {
      console.error("Erro ao carregar relatório de performance:", error);
      set({
        error: "Erro ao carregar relatório de performance. Tente novamente.",
        isLoading: false,
      });
    }
  },

  // Exportar para PDF
  exportToPDF: async (
    reportType: "overview" | "messages" | "contacts" | "performance"
  ) => {
    const {
      currentFilters,
      overviewStats,
      messageReport,
      contactReport,
      performanceReport,
    } = get();

    try {
      const pdfGenerator = new PDFGenerator();
      const filename = `relatorio-${reportType}-${
        new Date().toISOString().split("T")[0]
      }.pdf`;

      switch (reportType) {
        case "overview":
          if (overviewStats) {
            pdfGenerator.generateOverviewReport(overviewStats, currentFilters);
          }
          break;
        case "messages":
          if (messageReport) {
            pdfGenerator.generateMessageReport(messageReport, currentFilters);
          }
          break;
        case "contacts":
          if (contactReport) {
            pdfGenerator.generateContactReport(contactReport, currentFilters);
          }
          break;
        case "performance":
          if (performanceReport) {
            pdfGenerator.generatePerformanceReport(
              performanceReport,
              currentFilters
            );
          }
          break;
      }

      pdfGenerator.save(filename);
    } catch (error) {
      console.error("Erro ao gerar PDF:", error);
      set({ error: "Erro ao gerar PDF. Tente novamente." });
    }
  },

  // Exportar para Excel
  exportToExcel: async (
    reportType: "overview" | "messages" | "contacts" | "performance"
  ) => {
    const { currentFilters, overviewStats, messageReport } = get();

    try {
      const filename = `relatorio-${reportType}-${
        new Date().toISOString().split("T")[0]
      }.xlsx`;

      switch (reportType) {
        case "overview":
          if (overviewStats) {
            const wb = ExcelGenerator.generateOverviewReport(
              overviewStats,
              currentFilters
            );
            ExcelGenerator.save(wb, filename);
          }
          break;
        case "messages":
          if (messageReport) {
            const wb = ExcelGenerator.generateMessageReport(messageReport);
            ExcelGenerator.save(wb, filename);
          }
          break;
        // TODO: Implementar outros tipos de relatório no Excel
        default:
          console.warn(
            `Exportação Excel para ${reportType} ainda não implementada`
          );
      }
    } catch (error) {
      console.error("Erro ao gerar Excel:", error);
      set({ error: "Erro ao gerar Excel. Tente novamente." });
    }
  },

  // Reset do estado
  reset: () => {
    set({
      isLoading: false,
      error: null,
      overviewStats: null,
      messageReport: null,
      contactReport: null,
      performanceReport: null,
      currentFilters: initialFilters,
    });
  },
}));
