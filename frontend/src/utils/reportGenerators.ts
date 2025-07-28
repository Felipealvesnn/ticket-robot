import jsPDF from "jspdf";
import autoTable from "jspdf-autotable";
import * as XLSX from "xlsx";

// Configuração do PDF
const PDF_CONFIG = {
  orientation: "portrait" as const,
  unit: "mm" as const,
  format: "a4" as const,
  fontSize: 10,
  lineHeight: 1.2,
  margin: {
    top: 20,
    right: 20,
    bottom: 20,
    left: 20,
  },
};

// Configuração de cores
const COLORS = {
  primary: "#2563eb",
  secondary: "#64748b",
  success: "#10b981",
  warning: "#f59e0b",
  danger: "#ef4444",
  text: "#1f2937",
  border: "#e5e7eb",
};

export class PDFGenerator {
  private doc: jsPDF;

  constructor() {
    this.doc = new jsPDF(PDF_CONFIG);
  }

  // Adicionar header do relatório
  private addHeader(title: string, subtitle?: string) {
    const pageWidth = this.doc.internal.pageSize.width;

    // Logo/Título principal
    this.doc.setFontSize(20);
    this.doc.setTextColor(COLORS.primary);
    this.doc.text("Ticket Robot", PDF_CONFIG.margin.left, 30);

    // Título do relatório
    this.doc.setFontSize(16);
    this.doc.setTextColor(COLORS.text);
    this.doc.text(title, PDF_CONFIG.margin.left, 45);

    // Subtítulo (período)
    if (subtitle) {
      this.doc.setFontSize(10);
      this.doc.setTextColor(COLORS.secondary);
      this.doc.text(subtitle, PDF_CONFIG.margin.left, 52);
    }

    // Data de geração
    const today = new Date().toLocaleDateString("pt-BR", {
      year: "numeric",
      month: "long",
      day: "numeric",
      hour: "2-digit",
      minute: "2-digit",
    });
    this.doc.text(
      `Gerado em: ${today}`,
      pageWidth - PDF_CONFIG.margin.right - 60,
      30
    );

    // Linha separadora
    this.doc.setDrawColor(COLORS.border);
    this.doc.line(
      PDF_CONFIG.margin.left,
      60,
      pageWidth - PDF_CONFIG.margin.right,
      60
    );

    return 70; // Retorna a posição Y para continuar o conteúdo
  }

  // Adicionar footer
  private addFooter() {
    const pageWidth = this.doc.internal.pageSize.width;
    const pageHeight = this.doc.internal.pageSize.height;

    this.doc.setFontSize(8);
    this.doc.setTextColor(COLORS.secondary);
    this.doc.text(
      `Página ${this.doc.getCurrentPageInfo().pageNumber}`,
      pageWidth / 2,
      pageHeight - 10,
      { align: "center" }
    );
  }

  // Gerar relatório de visão geral
  generateOverviewReport(
    data: any,
    filters: { startDate: string; endDate: string }
  ) {
    const subtitle = `Período: ${new Date(filters.startDate).toLocaleDateString(
      "pt-BR"
    )} - ${new Date(filters.endDate).toLocaleDateString("pt-BR")}`;
    let yPosition = this.addHeader("Relatório de Visão Geral", subtitle);

    // Cards de estatísticas
    const stats = [
      ["Total de Mensagens", data.totalMessages.toLocaleString("pt-BR")],
      ["Total de Contatos", data.totalContacts.toLocaleString("pt-BR")],
      ["Sessões Ativas", data.activeSessions.toString()],
      ["Tempo Médio de Resposta", data.responseTime],
    ];

    yPosition += 10;
    this.doc.setFontSize(14);
    this.doc.setTextColor(COLORS.text);
    this.doc.text("Estatísticas Gerais", PDF_CONFIG.margin.left, yPosition);

    yPosition += 10;
    autoTable(this.doc, {
      startY: yPosition,
      head: [["Métrica", "Valor"]],
      body: stats,
      theme: "grid",
      styles: { fontSize: 10 },
      headStyles: { fillColor: COLORS.primary },
    });

    yPosition = (this.doc as any).lastAutoTable.finalY + 20;

    // Tabela de top contatos
    if (data.topContacts && data.topContacts.length > 0) {
      this.doc.setFontSize(14);
      this.doc.text("Top Contatos", PDF_CONFIG.margin.left, yPosition);

      const contactsData = data.topContacts.map((contact: any) => [
        contact.name,
        contact.phone,
        contact.messageCount?.toString() || contact.messages?.toString() || "0",
      ]);

      autoTable(this.doc, {
        startY: yPosition + 5,
        head: [["Nome", "Telefone", "Mensagens"]],
        body: contactsData,
        theme: "grid",
        styles: { fontSize: 9 },
        headStyles: { fillColor: COLORS.primary },
      });
    }

    this.addFooter();
    return this.doc;
  }

  // Gerar relatório de mensagens
  generateMessageReport(
    data: any,
    filters: { startDate: string; endDate: string }
  ) {
    const subtitle = `Período: ${new Date(filters.startDate).toLocaleDateString(
      "pt-BR"
    )} - ${new Date(filters.endDate).toLocaleDateString("pt-BR")}`;
    let yPosition = this.addHeader("Relatório de Mensagens", subtitle);

    if (data.messages && data.messages.length > 0) {
      const messagesData = data.messages.map((msg: any) => [
        new Date(msg.timestamp).toLocaleDateString("pt-BR"),
        msg.contactName || msg.contact?.name || "N/A",
        msg.contactPhone || msg.contact?.phone || "N/A",
        msg.type === "sent" ? "Enviada" : "Recebida",
        msg.content?.substring(0, 50) +
          (msg.content?.length > 50 ? "..." : "") || "N/A",
      ]);

      autoTable(this.doc, {
        startY: yPosition,
        head: [["Data", "Contato", "Telefone", "Tipo", "Mensagem"]],
        body: messagesData,
        theme: "grid",
        styles: { fontSize: 8 },
        headStyles: { fillColor: COLORS.primary },
        columnStyles: {
          4: { cellWidth: 60 }, // Coluna da mensagem mais larga
        },
      });
    }

    this.addFooter();
    return this.doc;
  }

  // Gerar relatório de contatos
  generateContactReport(
    data: any,
    filters: { startDate: string; endDate: string }
  ) {
    const subtitle = `Período: ${new Date(filters.startDate).toLocaleDateString(
      "pt-BR"
    )} - ${new Date(filters.endDate).toLocaleDateString("pt-BR")}`;
    let yPosition = this.addHeader("Relatório de Contatos", subtitle);

    if (data.contacts && data.contacts.length > 0) {
      const contactsData = data.contacts.map((contact: any) => [
        contact.name || "N/A",
        contact.phone || "N/A",
        contact.messageCount?.toString() || "0",
        contact.status === "active"
          ? "Ativo"
          : contact.status === "blocked"
          ? "Bloqueado"
          : "Inativo",
        contact.lastMessageAt
          ? new Date(contact.lastMessageAt).toLocaleDateString("pt-BR")
          : "N/A",
      ]);

      autoTable(this.doc, {
        startY: yPosition,
        head: [["Nome", "Telefone", "Mensagens", "Status", "Última Mensagem"]],
        body: contactsData,
        theme: "grid",
        styles: { fontSize: 9 },
        headStyles: { fillColor: COLORS.primary },
      });
    }

    this.addFooter();
    return this.doc;
  }

  // Gerar relatório de performance
  generatePerformanceReport(
    data: any,
    filters: { startDate: string; endDate: string }
  ) {
    const subtitle = `Período: ${new Date(filters.startDate).toLocaleDateString(
      "pt-BR"
    )} - ${new Date(filters.endDate).toLocaleDateString("pt-BR")}`;
    let yPosition = this.addHeader("Relatório de Performance", subtitle);

    // Estatísticas de performance
    yPosition += 10;
    this.doc.setFontSize(14);
    this.doc.text("Métricas de Performance", PDF_CONFIG.margin.left, yPosition);

    const perfStats = [
      ["Tempo Médio de Resposta", `${data.averageResponseTime || 0} minutos`],
    ];

    autoTable(this.doc, {
      startY: yPosition + 5,
      head: [["Métrica", "Valor"]],
      body: perfStats,
      theme: "grid",
      styles: { fontSize: 10 },
      headStyles: { fillColor: COLORS.primary },
    });

    yPosition = (this.doc as any).lastAutoTable.finalY + 20;

    // Performance dos agentes
    if (data.agentPerformance && data.agentPerformance.length > 0) {
      this.doc.setFontSize(14);
      this.doc.text(
        "Performance dos Agentes",
        PDF_CONFIG.margin.left,
        yPosition
      );

      const agentData = data.agentPerformance.map((agent: any) => [
        agent.agentName || "N/A",
        agent.handledTickets?.toString() || "0",
        `${agent.averageResponseTime || 0} min`,
        agent.activeTickets?.toString() || "0",
      ]);

      autoTable(this.doc, {
        startY: yPosition + 5,
        head: [
          ["Agente", "Tickets Atendidos", "Tempo Médio", "Tickets Ativos"],
        ],
        body: agentData,
        theme: "grid",
        styles: { fontSize: 9 },
        headStyles: { fillColor: COLORS.primary },
      });
    }

    this.addFooter();
    return this.doc;
  }

  // Salvar PDF
  save(filename: string) {
    this.doc.save(filename);
  }

  // Obter blob do PDF
  getBlob(): Blob {
    return this.doc.output("blob");
  }
}

// Função para gerar Excel
export class ExcelGenerator {
  static generateOverviewReport(
    data: any,
    filters: { startDate: string; endDate: string }
  ) {
    const wb = XLSX.utils.book_new();

    // Aba de estatísticas gerais
    const statsData = [
      ["Métrica", "Valor"],
      ["Total de Mensagens", data.totalMessages],
      ["Total de Contatos", data.totalContacts],
      ["Sessões Ativas", data.activeSessions],
      ["Tempo Médio de Resposta", data.responseTime],
    ];

    const statsWs = XLSX.utils.aoa_to_sheet(statsData);
    XLSX.utils.book_append_sheet(wb, statsWs, "Estatísticas");

    // Aba de top contatos
    if (data.topContacts && data.topContacts.length > 0) {
      const contactsData = [
        ["Nome", "Telefone", "Mensagens"],
        ...data.topContacts.map((c: any) => [
          c.name,
          c.phone,
          c.messageCount || c.messages || 0,
        ]),
      ];

      const contactsWs = XLSX.utils.aoa_to_sheet(contactsData);
      XLSX.utils.book_append_sheet(wb, contactsWs, "Top Contatos");
    }

    return wb;
  }

  static generateMessageReport(data: any) {
    const wb = XLSX.utils.book_new();

    if (data.messages && data.messages.length > 0) {
      const messagesData = [
        ["Data", "Contato", "Telefone", "Tipo", "Mensagem", "Agente"],
        ...data.messages.map((msg: any) => [
          new Date(msg.timestamp).toLocaleDateString("pt-BR"),
          msg.contactName || msg.contact?.name || "N/A",
          msg.contactPhone || msg.contact?.phone || "N/A",
          msg.type === "sent" ? "Enviada" : "Recebida",
          msg.content || "N/A",
          msg.agentName || "N/A",
        ]),
      ];

      const ws = XLSX.utils.aoa_to_sheet(messagesData);
      XLSX.utils.book_append_sheet(wb, ws, "Mensagens");
    }

    return wb;
  }

  static save(workbook: XLSX.WorkBook, filename: string) {
    XLSX.writeFile(workbook, filename);
  }
}
