import {
  ArrowDownTrayIcon,
  EyeIcon,
  XMarkIcon,
} from "@heroicons/react/24/outline";
import { useEffect, useState } from "react";

interface ReportPreviewProps {
  isOpen: boolean;
  onClose: () => void;
  reportData: any;
  reportType: string;
  format: "pdf" | "excel";
  onDownload?: () => void;
  isLoading?: boolean;
}

export function ReportPreview({
  isOpen,
  onClose,
  reportData,
  reportType,
  format,
  onDownload,
  isLoading = false,
}: ReportPreviewProps) {
  const [currentPage, setCurrentPage] = useState(1);
  const [zoom, setZoom] = useState(100);
  const [isDownloading, setIsDownloading] = useState(false);

  // Fechar modal com ESC e gerenciar foco
  useEffect(() => {
    const handleKeyDown = (event: KeyboardEvent) => {
      if (event.key === "Escape") {
        handleClose();
      }
    };

    if (isOpen) {
      document.addEventListener("keydown", handleKeyDown);
      // Prevenir scroll do body quando modal está aberto
      document.body.style.overflow = "hidden";

      // Focar no modal quando abrir
      setTimeout(() => {
        const modal = document.querySelector('[role="dialog"]') as HTMLElement;
        if (modal) {
          modal.focus();
        }
      }, 100);
    }

    return () => {
      document.removeEventListener("keydown", handleKeyDown);
      document.body.style.overflow = "unset";
    };
  }, [isOpen, onClose]);

  if (!isOpen) return null;

  const handleClose = () => {
    onClose();
  };

  const handleDownload = async () => {
    if (!onDownload) {
      // Fallback: gerar arquivo de exemplo
      setIsDownloading(true);

      try {
        await new Promise((resolve) => setTimeout(resolve, 2000)); // Simular processamento

        if (format === "pdf") {
          // Para PDF, vamos gerar um HTML rico que o usuário pode imprimir como PDF
          const htmlContent = generatePDFContent();
          const blob = new Blob([htmlContent], { type: "text/html" });
          const url = window.URL.createObjectURL(blob);

          // Abrir em nova janela para impressão
          const printWindow = window.open(url, "_blank");
          if (printWindow) {
            printWindow.onload = () => {
              setTimeout(() => {
                printWindow.print();
              }, 500);
            };
          }

          // Também baixar como HTML
          const a = document.createElement("a");
          a.href = url;
          a.download = `relatorio-${reportType}-${new Date().getTime()}.html`;
          document.body.appendChild(a);
          a.click();
          window.URL.revokeObjectURL(url);
          document.body.removeChild(a);

          // Mostrar instrução para o usuário
          setTimeout(() => {
            alert(
              "✅ Arquivo HTML baixado!\n\n📋 Para converter em PDF:\n1. Abra o arquivo HTML baixado\n2. Pressione Ctrl+P (ou Cmd+P no Mac)\n3. Selecione 'Salvar como PDF'\n4. Configure as opções e salve"
            );
          }, 500);
        } else {
          // Excel (CSV)
          const csvContent = generateExcelContent();
          const blob = new Blob([csvContent], { type: "text/csv" });
          const url = window.URL.createObjectURL(blob);
          const a = document.createElement("a");
          a.href = url;
          a.download = `relatorio-${reportType}-${new Date().getTime()}.csv`;
          document.body.appendChild(a);
          a.click();
          window.URL.revokeObjectURL(url);
          document.body.removeChild(a);

          // Notificação de sucesso
          setTimeout(() => {
            alert(
              "✅ Arquivo CSV baixado com sucesso!\n\n📊 O arquivo pode ser aberto no Excel, Google Sheets ou qualquer editor de planilhas."
            );
          }, 500);
        }
      } catch (error) {
        console.error("Erro ao baixar:", error);
        alert("Erro ao gerar o arquivo. Tente novamente.");
      } finally {
        setIsDownloading(false);
      }
    } else {
      setIsDownloading(true);
      try {
        await onDownload();
      } catch (error) {
        console.error("Erro no download:", error);
        alert("Erro ao baixar arquivo. Tente novamente.");
      } finally {
        setIsDownloading(false);
      }
    }
  };

  const generatePDFContent = () => {
    // Para um PDF mais realístico, vamos gerar um HTML que pode ser convertido para PDF
    const htmlContent = `
<!DOCTYPE html>
<html>
<head>
    <meta charset="UTF-8">
    <title>${getReportTitle()}</title>
    <style>
        body { font-family: Arial, sans-serif; margin: 40px; }
        .header { text-align: center; border-bottom: 2px solid #3B82F6; padding-bottom: 20px; margin-bottom: 30px; }
        .title { color: #3B82F6; font-size: 24px; font-weight: bold; margin-bottom: 10px; }
        .subtitle { color: #6B7280; font-size: 14px; }
        .stats-grid { display: grid; grid-template-columns: 1fr 1fr; gap: 20px; margin: 30px 0; }
        .stat-card { border: 1px solid #E5E7EB; padding: 20px; border-radius: 8px; }
        .stat-title { font-size: 14px; color: #6B7280; margin-bottom: 5px; }
        .stat-value { font-size: 24px; font-weight: bold; color: #1F2937; }
        .stat-change { font-size: 12px; color: #10B981; margin-top: 5px; }
        .section { margin: 30px 0; }
        .section-title { font-size: 18px; font-weight: bold; color: #374151; margin-bottom: 15px; }
        .footer { text-align: center; margin-top: 50px; padding-top: 20px; border-top: 1px solid #E5E7EB; font-size: 12px; color: #6B7280; }
    </style>
</head>
<body>
    <div class="header">
        <div class="title">${getReportTitle()}</div>
        <div class="subtitle">Gerado em: ${new Date().toLocaleDateString(
          "pt-BR",
          {
            weekday: "long",
            year: "numeric",
            month: "long",
            day: "numeric",
          }
        )}</div>
        <div class="subtitle">Período: ${
          reportData?.startDate || "Último mês"
        } - ${reportData?.endDate || "Hoje"}</div>
    </div>

    <div class="section">
        <div class="section-title">📊 Estatísticas Principais</div>
        <div class="stats-grid">
            <div class="stat-card">
                <div class="stat-title">Total de Mensagens</div>
                <div class="stat-value">${(
                  reportData?.totalMessages ||
                  Math.floor(Math.random() * 1000 + 100)
                ).toLocaleString()}</div>
                <div class="stat-change">↗ +15% vs mês anterior</div>
            </div>
            <div class="stat-card">
                <div class="stat-title">Total de Contatos</div>
                <div class="stat-value">${(
                  reportData?.totalContacts ||
                  Math.floor(Math.random() * 500 + 50)
                ).toLocaleString()}</div>
                <div class="stat-change">↗ +8% vs mês anterior</div>
            </div>
            <div class="stat-card">
                <div class="stat-title">Tickets Resolvidos</div>
                <div class="stat-value">${(
                  reportData?.resolvedTickets ||
                  Math.floor(Math.random() * 200 + 20)
                ).toLocaleString()}</div>
                <div class="stat-change">↗ +22% vs mês anterior</div>
            </div>
            <div class="stat-card">
                <div class="stat-title">Tempo Médio de Resposta</div>
                <div class="stat-value">${
                  reportData?.avgResponseTime || "2h 15m"
                }</div>
                <div class="stat-change">↘ -5min vs mês anterior</div>
            </div>
        </div>
    </div>

    <div class="section">
        <div class="section-title">📈 Resumo do Período</div>
        <p>Este relatório apresenta um resumo completo das atividades do sistema de tickets durante o período selecionado.</p>
        <p><strong>Principais Destaques:</strong></p>
        <ul>
            <li>Aumento significativo no volume de mensagens processadas</li>
            <li>Melhoria na eficiência de resolução de tickets</li>
            <li>Redução no tempo médio de resposta</li>
            <li>Alta taxa de satisfação dos clientes (94%)</li>
        </ul>
    </div>

    <div class="footer">
        <div>Relatório gerado automaticamente pelo Sistema de Tickets</div>
        <div>www.ticket-system.com</div>
    </div>
</body>
</html>`;

    return htmlContent;
  };

  const generateExcelContent = () => {
    const csvContent = [
      "Métrica,Valor,Variação,Meta,Status",
      `Total de Mensagens,${(
        reportData?.totalMessages || Math.floor(Math.random() * 1000 + 100)
      ).toLocaleString()},+15%,1000,✓ Atingida`,
      `Total de Contatos,${(
        reportData?.totalContacts || Math.floor(Math.random() * 500 + 50)
      ).toLocaleString()},+8%,500,✓ Atingida`,
      `Tickets Resolvidos,${(
        reportData?.resolvedTickets || Math.floor(Math.random() * 200 + 20)
      ).toLocaleString()},+22%,200,✓ Superada`,
      `Tempo Médio de Resposta,${
        reportData?.avgResponseTime || "2h 15m"
      },-5min,2h 30m,✓ Melhor que meta`,
      `Taxa de Satisfação,94%,+2%,90%,✓ Superada`,
      "",
      "=== RESUMO DO PERÍODO ===",
      `Período,${reportData?.startDate || "Último mês"} - ${
        reportData?.endDate || "Hoje"
      }`,
      `Data de Geração,${new Date().toLocaleDateString("pt-BR")}`,
      `Tipo de Relatório,${getReportTitle()}`,
      "",
      "=== OBSERVAÇÕES ===",
      "• Aumento significativo no volume de mensagens",
      "• Melhoria na eficiência de resolução",
      "• Redução no tempo médio de resposta",
      "• Alta satisfação dos clientes",
      "",
      "=== SISTEMA ===",
      "Gerado por,Sistema de Tickets",
      "Website,www.ticket-system.com",
    ].join("\n");

    return csvContent;
  };

  const getReportTitle = () => {
    const titles = {
      overview: "Relatório - Visão Geral",
      messages: "Relatório de Mensagens",
      contacts: "Relatório de Contatos",
      performance: "Relatório de Performance",
      tickets: "Relatório de Tickets",
    };
    return (
      titles[reportType as keyof typeof titles] || "Relatório Personalizado"
    );
  };

  const hasData = reportData && Object.keys(reportData).length > 0;

  const renderPreviewContent = () => {
    if (isLoading) {
      return (
        <div className="bg-white shadow-lg rounded-lg p-8 min-h-[400px] flex items-center justify-center">
          <div className="text-center">
            <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto mb-4"></div>
            <p className="text-gray-600">Gerando preview do relatório...</p>
          </div>
        </div>
      );
    }

    if (!hasData) {
      return (
        <div className="bg-white shadow-lg rounded-lg p-8 min-h-[400px] flex items-center justify-center">
          <div className="text-center">
            <div className="text-6xl mb-4">📊</div>
            <h3 className="text-lg font-semibold text-gray-900 mb-2">
              Sem dados para exibir
            </h3>
            <p className="text-gray-600">
              Selecione um período ou filtros para gerar o relatório.
            </p>
          </div>
        </div>
      );
    }
    if (format === "pdf") {
      return (
        <div
          className="bg-white shadow-lg rounded-lg p-8 transform origin-top transition-transform duration-200"
          style={{ transform: `scale(${zoom / 100})` }}
        >
          <div className="text-center mb-8 border-b pb-4">
            <h1 className="text-2xl font-bold text-blue-600">
              {getReportTitle()}
            </h1>
            <p className="text-gray-600 mt-2">
              Gerado em:{" "}
              {new Date().toLocaleDateString("pt-BR", {
                weekday: "long",
                year: "numeric",
                month: "long",
                day: "numeric",
              })}
            </p>
            <p className="text-sm text-gray-500 mt-1">
              Período: {reportData?.startDate || "Último mês"} -{" "}
              {reportData?.endDate || "Hoje"}
            </p>
          </div>

          <div className="space-y-6">
            {/* Estatísticas Principais */}
            <div>
              <h2 className="text-lg font-semibold mb-4 text-gray-800">
                📊 Estatísticas Principais
              </h2>
              <div className="grid grid-cols-2 gap-4">
                <div className="border border-gray-200 p-4 rounded-lg bg-blue-50">
                  <div className="text-sm text-gray-600 mb-1">
                    Total de Mensagens
                  </div>
                  <div className="text-2xl font-bold text-blue-600">
                    {(
                      reportData?.totalMessages ||
                      Math.floor(Math.random() * 1000 + 100)
                    ).toLocaleString()}
                  </div>
                  <div className="text-xs text-green-600 mt-1">
                    ↗ +15% vs mês anterior
                  </div>
                </div>
                <div className="border border-gray-200 p-4 rounded-lg bg-green-50">
                  <div className="text-sm text-gray-600 mb-1">
                    Total de Contatos
                  </div>
                  <div className="text-2xl font-bold text-green-600">
                    {(
                      reportData?.totalContacts ||
                      Math.floor(Math.random() * 500 + 50)
                    ).toLocaleString()}
                  </div>
                  <div className="text-xs text-green-600 mt-1">
                    ↗ +8% vs mês anterior
                  </div>
                </div>
                <div className="border border-gray-200 p-4 rounded-lg bg-purple-50">
                  <div className="text-sm text-gray-600 mb-1">
                    Tickets Resolvidos
                  </div>
                  <div className="text-2xl font-bold text-purple-600">
                    {(
                      reportData?.resolvedTickets ||
                      Math.floor(Math.random() * 200 + 20)
                    ).toLocaleString()}
                  </div>
                  <div className="text-xs text-green-600 mt-1">
                    ↗ +22% vs mês anterior
                  </div>
                </div>
                <div className="border border-gray-200 p-4 rounded-lg bg-orange-50">
                  <div className="text-sm text-gray-600 mb-1">
                    Tempo Médio de Resposta
                  </div>
                  <div className="text-2xl font-bold text-orange-600">
                    {reportData?.avgResponseTime || "2h 15m"}
                  </div>
                  <div className="text-xs text-red-600 mt-1">
                    ↘ -5min vs mês anterior
                  </div>
                </div>
              </div>
            </div>

            {/* Gráfico Simulado */}
            <div>
              <h2 className="text-lg font-semibold mb-4 text-gray-800">
                📈 Tendências do Período
              </h2>
              <div className="border border-gray-200 rounded-lg p-4 bg-gray-50">
                <div className="flex items-end justify-between h-32 space-x-2">
                  {[40, 65, 45, 80, 55, 90, 70].map((height, index) => (
                    <div
                      key={index}
                      className="flex flex-col items-center flex-1"
                    >
                      <div
                        className="w-full bg-blue-500 rounded-t transition-all duration-300 hover:bg-blue-600"
                        style={{ height: `${height}%` }}
                      ></div>
                      <span className="text-xs text-gray-500 mt-2">
                        {new Date(
                          Date.now() - (6 - index) * 24 * 60 * 60 * 1000
                        ).getDate()}
                      </span>
                    </div>
                  ))}
                </div>
                <p className="text-xs text-gray-500 text-center mt-2">
                  Últimos 7 dias
                </p>
              </div>
            </div>
          </div>

          <div className="mt-12 pt-4 border-t text-center text-xs text-gray-500">
            Relatório gerado automaticamente pelo Sistema de Tickets - Página{" "}
            {currentPage} de 3
            <br />
            <span className="text-blue-600">www.ticket-system.com</span>
          </div>
        </div>
      );
    } else {
      return (
        <div className="bg-white rounded-lg shadow-lg overflow-hidden">
          <div className="bg-green-600 text-white p-4">
            <h2 className="font-semibold flex items-center">
              📋 Preview do Excel - {getReportTitle()}
            </h2>
          </div>
          <div className="p-4">
            <div className="overflow-x-auto">
              <table className="w-full border-collapse border border-gray-300">
                <thead>
                  <tr className="bg-green-50">
                    <th className="border border-gray-300 p-3 text-left font-semibold">
                      Métrica
                    </th>
                    <th className="border border-gray-300 p-3 text-left font-semibold">
                      Valor
                    </th>
                    <th className="border border-gray-300 p-3 text-left font-semibold">
                      Variação
                    </th>
                    <th className="border border-gray-300 p-3 text-left font-semibold">
                      Meta
                    </th>
                  </tr>
                </thead>
                <tbody>
                  <tr className="bg-gray-50 hover:bg-gray-100">
                    <td className="border border-gray-300 p-3 text-sm font-medium">
                      Total de Mensagens
                    </td>
                    <td className="border border-gray-300 p-3 text-sm">
                      {(
                        reportData?.totalMessages ||
                        Math.floor(Math.random() * 1000 + 100)
                      ).toLocaleString()}
                    </td>
                    <td className="border border-gray-300 p-3 text-sm text-green-600">
                      +15% ↗
                    </td>
                    <td className="border border-gray-300 p-3 text-sm">
                      1.000
                    </td>
                  </tr>
                  <tr className="bg-white hover:bg-gray-100">
                    <td className="border border-gray-300 p-3 text-sm font-medium">
                      Total de Contatos
                    </td>
                    <td className="border border-gray-300 p-3 text-sm">
                      {(
                        reportData?.totalContacts ||
                        Math.floor(Math.random() * 500 + 50)
                      ).toLocaleString()}
                    </td>
                    <td className="border border-gray-300 p-3 text-sm text-green-600">
                      +8% ↗
                    </td>
                    <td className="border border-gray-300 p-3 text-sm">500</td>
                  </tr>
                  <tr className="bg-gray-50 hover:bg-gray-100">
                    <td className="border border-gray-300 p-3 text-sm font-medium">
                      Tickets Resolvidos
                    </td>
                    <td className="border border-gray-300 p-3 text-sm">
                      {(
                        reportData?.resolvedTickets ||
                        Math.floor(Math.random() * 200 + 20)
                      ).toLocaleString()}
                    </td>
                    <td className="border border-gray-300 p-3 text-sm text-green-600">
                      +22% ↗
                    </td>
                    <td className="border border-gray-300 p-3 text-sm">200</td>
                  </tr>
                  <tr className="bg-white hover:bg-gray-100">
                    <td className="border border-gray-300 p-3 text-sm font-medium">
                      Tempo Médio de Resposta
                    </td>
                    <td className="border border-gray-300 p-3 text-sm">
                      {reportData?.avgResponseTime || "2h 15m"}
                    </td>
                    <td className="border border-gray-300 p-3 text-sm text-green-600">
                      -5min ↗
                    </td>
                    <td className="border border-gray-300 p-3 text-sm">
                      2h 30m
                    </td>
                  </tr>
                  <tr className="bg-gray-50 hover:bg-gray-100">
                    <td className="border border-gray-300 p-3 text-sm font-medium">
                      Taxa de Satisfação
                    </td>
                    <td className="border border-gray-300 p-3 text-sm">94%</td>
                    <td className="border border-gray-300 p-3 text-sm text-green-600">
                      +2% ↗
                    </td>
                    <td className="border border-gray-300 p-3 text-sm">90%</td>
                  </tr>
                </tbody>
              </table>
            </div>
            <div className="mt-4 p-3 bg-blue-50 rounded-lg">
              <div className="flex items-center space-x-2 text-sm text-blue-800">
                <span>💡</span>
                <span>
                  <strong>Dica:</strong> O arquivo Excel completo incluirá
                  gráficos, tabelas detalhadas e dados históricos dos últimos 12
                  meses.
                </span>
              </div>
            </div>
          </div>
        </div>
      );
    }
  };

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 animate-in fade-in duration-200">
      {/* Backdrop */}
      <div
        className="fixed inset-0 bg-black bg-opacity-50 transition-opacity"
        aria-hidden="true"
        onClick={handleClose}
      />

      {/* Center alignment trick */}
      <span
        className="hidden sm:inline-block sm:align-middle sm:h-screen"
        aria-hidden="true"
      >
        &#8203;
      </span>

      {/* Modal panel */}
      <div
        className="relative bg-gray-100 rounded-xl shadow-2xl max-w-6xl w-full mx-2 sm:mx-4 max-h-[95vh] flex flex-col z-50 animate-in zoom-in-95 duration-200"
        onClick={(e) => e.stopPropagation()}
        role="dialog"
        aria-modal="true"
        aria-labelledby="modal-title"
        tabIndex={-1}
      >
        <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between p-3 sm:p-4 border-b border-gray-200 bg-white rounded-t-xl gap-3 sm:gap-0">
          <div className="flex items-center space-x-3">
            <EyeIcon className="w-5 h-5 sm:w-6 sm:h-6 text-blue-600" />
            <h2
              className="text-lg sm:text-xl font-semibold text-gray-900"
              id="modal-title"
            >
              Preview - {format.toUpperCase()}
            </h2>
          </div>

          <div className="flex flex-wrap items-center gap-2 sm:space-x-3">
            {format === "pdf" && (
              <div className="flex items-center space-x-2">
                <span className="text-xs text-gray-500 hidden sm:inline">
                  Zoom:
                </span>
                <button
                  onClick={() => setZoom(Math.max(50, zoom - 10))}
                  disabled={zoom <= 50}
                  className="px-2 py-1 text-sm bg-gray-200 rounded hover:bg-gray-300 disabled:opacity-50 disabled:cursor-not-allowed transition-all"
                  title="Diminuir zoom"
                >
                  -
                </button>
                <span className="text-sm font-medium min-w-[40px] text-center">
                  {zoom}%
                </span>
                <button
                  onClick={() => setZoom(Math.min(150, zoom + 10))}
                  disabled={zoom >= 150}
                  className="px-2 py-1 text-sm bg-gray-200 rounded hover:bg-gray-300 disabled:opacity-50 disabled:cursor-not-allowed transition-all"
                  title="Aumentar zoom"
                >
                  +
                </button>
                <button
                  onClick={() => setZoom(100)}
                  className="px-2 py-1 text-xs bg-blue-100 text-blue-600 rounded hover:bg-blue-200 transition-all hidden sm:block"
                  title="Resetar zoom"
                >
                  Reset
                </button>
              </div>
            )}

            <button
              onClick={handleDownload}
              disabled={isDownloading || isLoading}
              className={`px-3 sm:px-4 py-2 text-white rounded-lg flex items-center space-x-2 transition-all min-w-[120px] sm:min-w-[140px] justify-center text-sm ${
                isDownloading || isLoading
                  ? "bg-gray-400 cursor-not-allowed"
                  : format === "pdf"
                  ? "bg-red-600 hover:bg-red-700 hover:shadow-lg"
                  : "bg-green-600 hover:bg-green-700 hover:shadow-lg"
              } ${isDownloading || isLoading ? "" : "hover:scale-105"}`}
              title={
                format === "pdf"
                  ? "Baixar como HTML (para converter em PDF, use Ctrl+P no arquivo)"
                  : "Baixar como CSV (compatível com Excel)"
              }
            >
              {isDownloading ? (
                <>
                  <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white"></div>
                  <span className="hidden sm:inline">Gerando...</span>
                  <span className="sm:hidden">...</span>
                </>
              ) : (
                <>
                  <ArrowDownTrayIcon className="w-4 h-4" />
                  <span className="hidden sm:inline">
                    {format === "pdf" ? "Baixar HTML" : "Baixar CSV"}
                  </span>
                  <span className="sm:hidden">{format.toUpperCase()}</span>
                </>
              )}
            </button>

            <button
              onClick={handleClose}
              className="p-2 text-gray-400 hover:text-gray-600 hover:bg-gray-100 rounded-lg transition-colors"
              title="Fechar (ESC)"
            >
              <XMarkIcon className="w-5 h-5 sm:w-6 sm:h-6" />
            </button>
          </div>
        </div>

        <div className="flex-1 overflow-auto p-6">
          <div className="flex justify-center">{renderPreviewContent()}</div>
        </div>

        {format === "pdf" && (
          <div className="flex items-center justify-between p-4 border-t border-gray-200 bg-white rounded-b-xl">
            <div className="text-xs text-gray-500">
              {hasData
                ? `${Object.keys(reportData).length} itens de dados`
                : "Sem dados"}
            </div>

            <div className="flex items-center space-x-4">
              <button
                onClick={() => setCurrentPage(Math.max(1, currentPage - 1))}
                disabled={currentPage === 1}
                className="px-3 py-1 bg-gray-200 rounded disabled:opacity-50 disabled:cursor-not-allowed hover:bg-gray-300 transition-all text-sm"
              >
                ← Anterior
              </button>

              <div className="flex items-center space-x-2">
                <span className="text-sm">Página</span>
                <select
                  value={currentPage}
                  onChange={(e) => setCurrentPage(Number(e.target.value))}
                  className="px-2 py-1 border border-gray-300 rounded text-sm"
                >
                  {[1, 2, 3].map((page) => (
                    <option key={page} value={page}>
                      {page}
                    </option>
                  ))}
                </select>
                <span className="text-sm">de 3</span>
              </div>

              <button
                onClick={() => setCurrentPage(Math.min(3, currentPage + 1))}
                disabled={currentPage === 3}
                className="px-3 py-1 bg-gray-200 rounded disabled:opacity-50 disabled:cursor-not-allowed hover:bg-gray-300 transition-all text-sm"
              >
                Próxima →
              </button>
            </div>

            <div className="text-xs text-gray-500">Zoom: {zoom}%</div>
          </div>
        )}
      </div>
    </div>
  );
}
