import { Injectable } from '@nestjs/common';
import * as ExcelJS from 'exceljs';
import * as PDFDocument from 'pdfkit';
import { PrismaService } from '../prisma/prisma.service';
import { ReportFiltersDto } from './dto/report-filters.dto';
import {
  ContactReport,
  MessageReport,
  OverviewStats,
  PerformanceReport,
} from './interfaces/report-types.interface';

@Injectable()
export class ReportsService {
  constructor(private prisma: PrismaService) {}

  async getOverviewStats(
    filters: ReportFiltersDto,
    companyId: string,
  ): Promise<OverviewStats> {
    const startDate = new Date(filters.startDate);
    const endDate = new Date(filters.endDate);

    // Total de mensagens no período
    const totalMessages = await this.prisma.message.count({
      where: {
        companyId,
        createdAt: {
          gte: startDate,
          lte: endDate,
        },
        ...(filters.sessionId && { messagingSessionId: filters.sessionId }),
        ...(filters.contactId && { contactId: filters.contactId }),
      },
    });

    // Total de contatos únicos no período
    const totalContacts = await this.prisma.contact.count({
      where: {
        companyId,
        createdAt: {
          gte: startDate,
          lte: endDate,
        },
      },
    });

    // Sessões ativas
    const activeSessions = await this.prisma.messagingSession.count({
      where: {
        companyId,
        status: 'CONNECTED',
      },
    });

    // Tempo médio de resposta (simulado por agora)
    const responseTime = '2.5 min';

    // Mensagens por dia
    const messagesByDay = filters.sessionId
      ? await this.prisma.$queryRaw<Array<{ date: string; messages: bigint }>>`
          SELECT 
            CAST(createdAt AS DATE) as date,
            COUNT(*) as messages
          FROM messages 
          WHERE companyId = ${companyId}
            AND createdAt >= ${startDate}
            AND createdAt <= ${endDate}
            AND messagingSessionId = ${filters.sessionId}
          GROUP BY CAST(createdAt AS DATE)
          ORDER BY date DESC
          OFFSET 0 ROWS FETCH NEXT 7 ROWS ONLY
        `
      : await this.prisma.$queryRaw<Array<{ date: string; messages: bigint }>>`
          SELECT 
            CAST(createdAt AS DATE) as date,
            COUNT(*) as messages
          FROM messages 
          WHERE companyId = ${companyId}
            AND createdAt >= ${startDate}
            AND createdAt <= ${endDate}
          GROUP BY CAST(createdAt AS DATE)
          ORDER BY date DESC
          OFFSET 0 ROWS FETCH NEXT 7 ROWS ONLY
        `;

    // Top contatos
    const topContacts = await this.prisma.$queryRaw<
      Array<{
        id: string;
        name: string;
        phoneNumber: string;
        message_count: bigint;
        last_message_at: Date;
      }>
    >`
      SELECT TOP 5
        c.id,
        c.name,
        c.phoneNumber,
        COUNT(m.id) as message_count,
        MAX(m.createdAt) as last_message_at
      FROM contacts c
      LEFT JOIN messages m ON c.id = m.contactId
      WHERE c.companyId = ${companyId}
        AND m.createdAt >= ${startDate}
        AND m.createdAt <= ${endDate}
      GROUP BY c.id, c.name, c.phoneNumber
      ORDER BY message_count DESC
    `;

    return {
      totalMessages,
      totalContacts,
      activeSessions,
      responseTime,
      messagesByDay: messagesByDay.map((item) => ({
        date: item.date,
        messages: Number(item.messages),
      })),
      topContacts: topContacts.map((contact) => ({
        id: contact.id,
        name: contact.name,
        phone: contact.phoneNumber,
        messageCount: Number(contact.message_count),
        lastMessageAt: contact.last_message_at.toISOString(),
      })),
    };
  }

  async getMessageReport(
    filters: ReportFiltersDto,
    companyId: string,
    page: number = 1,
    limit: number = 50,
  ): Promise<MessageReport> {
    const startDate = new Date(filters.startDate);
    const endDate = new Date(filters.endDate);
    const skip = (page - 1) * limit;

    const whereClause = {
      companyId,
      createdAt: {
        gte: startDate,
        lte: endDate,
      },
      ...(filters.sessionId && { messagingSessionId: filters.sessionId }),
      ...(filters.contactId && { contactId: filters.contactId }),
    };

    const [messages, total] = await Promise.all([
      this.prisma.message.findMany({
        where: whereClause,
        include: {
          contact: {
            select: {
              name: true,
              phoneNumber: true,
            },
          },
          messagingSession: {
            select: {
              name: true,
            },
          },
        },
        orderBy: {
          createdAt: 'desc',
        },
        skip,
        take: limit,
      }),
      this.prisma.message.count({ where: whereClause }),
    ]);

    return {
      messages: messages.map((message) => ({
        id: message.id,
        content: message.content,
        type: message.direction === 'INBOUND' ? 'received' : 'sent',
        timestamp: message.createdAt.toISOString(),
        contactName: message.contact?.name || 'Desconhecido',
        contactPhone: message.contact?.phoneNumber || '',
        sessionName: message.messagingSession?.name || '',
        agentName: undefined, // Implementar quando tiver agentes
      })),
      total,
      page,
      limit,
    };
  }

  async getContactReport(
    filters: ReportFiltersDto,
    companyId: string,
    page: number = 1,
    limit: number = 50,
  ): Promise<ContactReport> {
    const startDate = new Date(filters.startDate);
    const endDate = new Date(filters.endDate);
    const skip = (page - 1) * limit;

    const whereClause = {
      companyId,
      createdAt: {
        gte: startDate,
        lte: endDate,
      },
    };

    const [contacts, total] = await Promise.all([
      this.prisma.contact.findMany({
        where: whereClause,
        include: {
          _count: {
            select: {
              messages: true,
            },
          },
          messages: {
            select: {
              createdAt: true,
            },
            orderBy: {
              createdAt: 'desc',
            },
            take: 1,
          },
        },
        orderBy: {
          createdAt: 'desc',
        },
        skip,
        take: limit,
      }),
      this.prisma.contact.count({ where: whereClause }),
    ]);

    return {
      contacts: contacts.map((contact) => ({
        id: contact.id,
        name: contact.name || 'Sem nome',
        phone: contact.phoneNumber,
        messageCount: contact._count.messages,
        firstContactAt: contact.createdAt.toISOString(),
        lastMessageAt:
          contact.messages[0]?.createdAt?.toISOString() ||
          contact.createdAt.toISOString(),
        status: 'active' as const, // Implementar lógica de status
      })),
      total,
      page,
      limit,
    };
  }

  async getPerformanceReport(
    filters: ReportFiltersDto,
    companyId: string,
  ): Promise<PerformanceReport> {
    const startDate = new Date(filters.startDate);
    const endDate = new Date(filters.endDate);

    // Tempo médio de resposta (simulado)
    const averageResponseTimeSeconds = 150; // segundos
    const averageResponseTime = `${Math.floor(averageResponseTimeSeconds / 60)}m ${averageResponseTimeSeconds % 60}s`;

    // Volume de mensagens por hora
    const messageVolumeByHour = await this.prisma.$queryRaw<
      Array<{ hour: number; message_count: bigint }>
    >`
      SELECT 
        DATEPART(HOUR, createdAt) as hour,
        COUNT(*) as message_count
      FROM messages 
      WHERE companyId = ${companyId}
        AND createdAt >= ${startDate}
        AND createdAt <= ${endDate}
      GROUP BY DATEPART(HOUR, createdAt)
      ORDER BY hour
    `;

    return {
      totalTickets: 0, // Implementar query real
      resolvedTickets: 0, // Implementar query real
      resolutionRate: 0, // Implementar cálculo real
      averageResponseTime,
      agentStats: [], // Implementar query real para agentes
      dailyStats: messageVolumeByHour.map((item) => ({
        date: new Date().toISOString().split('T')[0], // Usar data real baseada no hour
        messagesHandled: Number(item.message_count),
        ticketsResolved: 0, // Implementar query real
        averageResponseTime: `${Math.floor(150 / 60)}m ${150 % 60}s`, // Usar cálculo real
      })),
    };
  }

  // Métodos de exportação para PDF
  async exportOverviewToPDF(
    filters: ReportFiltersDto,
    companyId: string,
  ): Promise<Buffer> {
    const data = await this.getOverviewStats(filters, companyId);
    return this.generatePDF('Visão Geral', data);
  }

  async exportMessagesToPDF(
    filters: ReportFiltersDto,
    companyId: string,
  ): Promise<Buffer> {
    const data = await this.getMessageReport(filters, companyId, 1, 1000);
    return this.generatePDF('Relatório de Mensagens', data);
  }

  async exportContactsToPDF(
    filters: ReportFiltersDto,
    companyId: string,
  ): Promise<Buffer> {
    const data = await this.getContactReport(filters, companyId, 1, 1000);
    return this.generatePDF('Relatório de Contatos', data);
  }

  async exportPerformanceToPDF(
    filters: ReportFiltersDto,
    companyId: string,
  ): Promise<Buffer> {
    const data = await this.getPerformanceReport(filters, companyId);
    return this.generatePDF('Relatório de Performance', data);
  }

  // Métodos de exportação para Excel
  async exportOverviewToExcel(
    filters: ReportFiltersDto,
    companyId: string,
  ): Promise<Buffer> {
    const data = await this.getOverviewStats(filters, companyId);
    return this.generateExcel('Visão Geral', data);
  }

  async exportMessagesToExcel(
    filters: ReportFiltersDto,
    companyId: string,
  ): Promise<Buffer> {
    const data = await this.getMessageReport(filters, companyId, 1, 1000);
    return this.generateExcel('Relatório de Mensagens', data);
  }

  async exportContactsToExcel(
    filters: ReportFiltersDto,
    companyId: string,
  ): Promise<Buffer> {
    const data = await this.getContactReport(filters, companyId, 1, 1000);
    return this.generateExcel('Relatório de Contatos', data);
  }

  async exportPerformanceToExcel(
    filters: ReportFiltersDto,
    companyId: string,
  ): Promise<Buffer> {
    const data = await this.getPerformanceReport(filters, companyId);
    return this.generateExcel('Relatório de Performance', data);
  }

  private async generatePDF(title: string, data: any): Promise<Buffer> {
    return new Promise((resolve) => {
      const doc = new PDFDocument({ margin: 50 });
      const buffers: Buffer[] = [];

      doc.on('data', (chunk: Buffer) => buffers.push(chunk));
      doc.on('end', () => {
        const pdfData = Buffer.concat(buffers);
        resolve(pdfData);
      });

      // Header
      doc.fontSize(20).fillColor('#2563eb').text(title, 50, 50);
      doc
        .fontSize(12)
        .fillColor('#6b7280')
        .text(`Gerado em: ${new Date().toLocaleDateString('pt-BR')}`, 50, 80);

      let yPosition = 120;

      // Visão Geral
      if (data.totalMessages !== undefined) {
        doc
          .fontSize(16)
          .fillColor('#1f2937')
          .text('Estatísticas Principais', 50, yPosition);
        yPosition += 30;

        // Cards de estatísticas
        const stats = [
          {
            label: 'Total de Mensagens',
            value: data.totalMessages.toLocaleString('pt-BR'),
          },
          {
            label: 'Total de Contatos',
            value: data.totalContacts.toLocaleString('pt-BR'),
          },
          { label: 'Sessões Ativas', value: data.activeSessions.toString() },
          { label: 'Tempo de Resposta', value: data.responseTime },
        ];

        stats.forEach((stat, index) => {
          doc
            .fontSize(12)
            .fillColor('#4b5563')
            .text(stat.label + ':', 50, yPosition);
          doc
            .fontSize(14)
            .fillColor('#1f2937')
            .text(stat.value, 200, yPosition);
          yPosition += 25;
        });

        yPosition += 20;

        // Top Contatos
        if (data.topContacts && data.topContacts.length > 0) {
          doc
            .fontSize(16)
            .fillColor('#1f2937')
            .text('Top Contatos', 50, yPosition);
          yPosition += 30;

          data.topContacts.forEach((contact: any, index: number) => {
            doc
              .fontSize(12)
              .fillColor('#4b5563')
              .text(`${index + 1}. ${contact.name}`, 50, yPosition);
            doc.text(
              `${contact.phone} - ${contact.messageCount} mensagens`,
              70,
              yPosition + 15,
            );
            yPosition += 40;
          });
        }

        // Mensagens por dia
        if (data.messagesByDay && data.messagesByDay.length > 0) {
          yPosition += 20;
          doc
            .fontSize(16)
            .fillColor('#1f2937')
            .text('Mensagens por Dia', 50, yPosition);
          yPosition += 30;

          data.messagesByDay.forEach((day: any) => {
            doc
              .fontSize(12)
              .fillColor('#4b5563')
              .text(
                `${new Date(day.date).toLocaleDateString('pt-BR')}: ${day.messages} mensagens`,
                50,
                yPosition,
              );
            yPosition += 20;
          });
        }
      }

      // Relatório de Mensagens
      else if (data.messages) {
        doc
          .fontSize(16)
          .fillColor('#1f2937')
          .text(`Total: ${data.total} mensagens`, 50, yPosition);
        yPosition += 30;

        data.messages.slice(0, 20).forEach((message: any) => {
          if (yPosition > 700) {
            doc.addPage();
            yPosition = 50;
          }

          doc
            .fontSize(12)
            .fillColor('#1f2937')
            .text(`${message.contactName}`, 50, yPosition);
          doc
            .fontSize(10)
            .fillColor('#6b7280')
            .text(
              `${new Date(message.timestamp).toLocaleString('pt-BR')} - ${message.type}`,
              50,
              yPosition + 15,
            );
          doc
            .fontSize(11)
            .fillColor('#4b5563')
            .text(
              message.content.substring(0, 100) +
                (message.content.length > 100 ? '...' : ''),
              50,
              yPosition + 30,
            );
          yPosition += 60;
        });
      }

      // Relatório de Contatos
      else if (data.contacts) {
        doc
          .fontSize(16)
          .fillColor('#1f2937')
          .text(`Total: ${data.total} contatos`, 50, yPosition);
        yPosition += 30;

        data.contacts.slice(0, 30).forEach((contact: any) => {
          if (yPosition > 720) {
            doc.addPage();
            yPosition = 50;
          }

          doc
            .fontSize(12)
            .fillColor('#1f2937')
            .text(`${contact.name}`, 50, yPosition);
          doc
            .fontSize(10)
            .fillColor('#6b7280')
            .text(
              `${contact.phone} - ${contact.messageCount} mensagens`,
              50,
              yPosition + 15,
            );
          doc
            .fontSize(10)
            .fillColor('#6b7280')
            .text(
              `Primeiro contato: ${new Date(contact.firstContactAt).toLocaleDateString('pt-BR')}`,
              50,
              yPosition + 30,
            );
          yPosition += 50;
        });
      }

      // Relatório de Performance
      else if (data.averageResponseTime !== undefined) {
        const perfStats = [
          { label: 'Total de Tickets', value: data.totalTickets.toString() },
          {
            label: 'Tickets Resolvidos',
            value: data.resolvedTickets.toString(),
          },
          { label: 'Taxa de Resolução', value: `${data.resolutionRate}%` },
          { label: 'Tempo Médio de Resposta', value: data.averageResponseTime },
        ];

        perfStats.forEach((stat) => {
          doc
            .fontSize(12)
            .fillColor('#4b5563')
            .text(stat.label + ':', 50, yPosition);
          doc
            .fontSize(14)
            .fillColor('#1f2937')
            .text(stat.value, 200, yPosition);
          yPosition += 25;
        });
      }

      // Footer
      doc
        .fontSize(8)
        .fillColor('#9ca3af')
        .text(
          'Relatório gerado automaticamente pelo Sistema de Tickets',
          50,
          doc.page.height - 50,
        );

      doc.end();
    });
  }

  private async generateExcel(title: string, data: any): Promise<Buffer> {
    const workbook = new ExcelJS.Workbook();

    // Configurações do workbook
    workbook.creator = 'Sistema de Tickets';
    workbook.created = new Date();

    // Visão Geral
    if (data.totalMessages !== undefined) {
      const worksheet = workbook.addWorksheet('Visão Geral');

      // Header estilizado
      const headerRow = worksheet.addRow([title]);
      headerRow.font = { size: 18, bold: true, color: { argb: 'FF2563EB' } };
      headerRow.alignment = { horizontal: 'center' };
      worksheet.mergeCells('A1:B1');

      const dateRow = worksheet.addRow([
        'Gerado em:',
        new Date().toLocaleDateString('pt-BR'),
      ]);
      dateRow.font = { size: 12, color: { argb: 'FF6B7280' } };

      worksheet.addRow([]); // Linha vazia

      // Estatísticas principais
      const statsHeader = worksheet.addRow(['Estatísticas Principais']);
      statsHeader.font = { size: 14, bold: true, color: { argb: 'FF1F2937' } };
      worksheet.mergeCells(`A${statsHeader.number}:B${statsHeader.number}`);

      const stats = [
        ['Total de Mensagens', data.totalMessages],
        ['Total de Contatos', data.totalContacts],
        ['Sessões Ativas', data.activeSessions],
        ['Tempo de Resposta', data.responseTime],
      ];

      stats.forEach(([label, value]) => {
        const row = worksheet.addRow([label, value]);
        row.getCell(1).font = { bold: true, color: { argb: 'FF4B5563' } };
        row.getCell(2).font = { color: { argb: 'FF1F2937' } };
      });

      worksheet.addRow([]); // Linha vazia

      // Top contatos
      if (data.topContacts && data.topContacts.length > 0) {
        const contactsHeader = worksheet.addRow(['Top Contatos']);
        contactsHeader.font = {
          size: 14,
          bold: true,
          color: { argb: 'FF1F2937' },
        };
        worksheet.mergeCells(
          `A${contactsHeader.number}:D${contactsHeader.number}`,
        );

        const headerColumns = worksheet.addRow([
          '#',
          'Nome',
          'Telefone',
          'Mensagens',
        ]);
        headerColumns.font = { bold: true, color: { argb: 'FFFFFFFF' } };
        headerColumns.fill = {
          type: 'pattern',
          pattern: 'solid',
          fgColor: { argb: 'FF2563EB' },
        };

        data.topContacts.forEach((contact: any, index: number) => {
          const row = worksheet.addRow([
            index + 1,
            contact.name,
            contact.phone,
            contact.messageCount,
          ]);
          row.getCell(1).alignment = { horizontal: 'center' };
          row.getCell(4).alignment = { horizontal: 'center' };
        });
      }

      // Mensagens por dia
      if (data.messagesByDay && data.messagesByDay.length > 0) {
        worksheet.addRow([]); // Linha vazia

        const daysHeader = worksheet.addRow(['Mensagens por Dia']);
        daysHeader.font = { size: 14, bold: true, color: { argb: 'FF1F2937' } };
        worksheet.mergeCells(`A${daysHeader.number}:B${daysHeader.number}`);

        const dayColumns = worksheet.addRow(['Data', 'Mensagens']);
        dayColumns.font = { bold: true, color: { argb: 'FFFFFFFF' } };
        dayColumns.fill = {
          type: 'pattern',
          pattern: 'solid',
          fgColor: { argb: 'FF2563EB' },
        };

        data.messagesByDay.forEach((day: any) => {
          const row = worksheet.addRow([
            new Date(day.date).toLocaleDateString('pt-BR'),
            day.messages,
          ]);
          row.getCell(2).alignment = { horizontal: 'center' };
        });
      }

      // Formatação das colunas
      worksheet.columns = [
        { width: 25 },
        { width: 20 },
        { width: 15 },
        { width: 12 },
      ];
    }

    // Relatório de Mensagens
    else if (data.messages) {
      const worksheet = workbook.addWorksheet('Mensagens');

      // Header
      const headerRow = worksheet.addRow(['Relatório de Mensagens']);
      headerRow.font = { size: 18, bold: true, color: { argb: 'FF2563EB' } };
      worksheet.mergeCells('A1:F1');

      const infoRow = worksheet.addRow([`Total: ${data.total} mensagens`]);
      infoRow.font = { size: 12, color: { argb: 'FF6B7280' } };
      worksheet.mergeCells(`A${infoRow.number}:F${infoRow.number}`);

      worksheet.addRow([]); // Linha vazia

      // Headers das colunas
      const columnHeaders = worksheet.addRow([
        'Contato',
        'Telefone',
        'Tipo',
        'Conteúdo',
        'Sessão',
        'Data/Hora',
      ]);
      columnHeaders.font = { bold: true, color: { argb: 'FFFFFFFF' } };
      columnHeaders.fill = {
        type: 'pattern',
        pattern: 'solid',
        fgColor: { argb: 'FF2563EB' },
      };

      // Dados das mensagens
      data.messages.forEach((message: any) => {
        const row = worksheet.addRow([
          message.contactName,
          message.contactPhone,
          message.type === 'sent' ? 'Enviada' : 'Recebida',
          message.content.substring(0, 100) +
            (message.content.length > 100 ? '...' : ''),
          message.sessionName,
          new Date(message.timestamp).toLocaleString('pt-BR'),
        ]);

        // Cor alternada nas linhas
        if (row.number % 2 === 0) {
          row.fill = {
            type: 'pattern',
            pattern: 'solid',
            fgColor: { argb: 'FFF8FAFC' },
          };
        }
      });

      // Formatação das colunas
      worksheet.columns = [
        { width: 20 },
        { width: 15 },
        { width: 12 },
        { width: 40 },
        { width: 15 },
        { width: 18 },
      ];
    }

    // Relatório de Contatos
    else if (data.contacts) {
      const worksheet = workbook.addWorksheet('Contatos');

      // Header
      const headerRow = worksheet.addRow(['Relatório de Contatos']);
      headerRow.font = { size: 18, bold: true, color: { argb: 'FF2563EB' } };
      worksheet.mergeCells('A1:E1');

      const infoRow = worksheet.addRow([`Total: ${data.total} contatos`]);
      infoRow.font = { size: 12, color: { argb: 'FF6B7280' } };
      worksheet.mergeCells(`A${infoRow.number}:E${infoRow.number}`);

      worksheet.addRow([]); // Linha vazia

      // Headers das colunas
      const columnHeaders = worksheet.addRow([
        'Nome',
        'Telefone',
        'Mensagens',
        'Primeiro Contato',
        'Última Mensagem',
      ]);
      columnHeaders.font = { bold: true, color: { argb: 'FFFFFFFF' } };
      columnHeaders.fill = {
        type: 'pattern',
        pattern: 'solid',
        fgColor: { argb: 'FF2563EB' },
      };

      // Dados dos contatos
      data.contacts.forEach((contact: any) => {
        const row = worksheet.addRow([
          contact.name,
          contact.phone,
          contact.messageCount,
          new Date(contact.firstContactAt).toLocaleDateString('pt-BR'),
          new Date(contact.lastMessageAt).toLocaleDateString('pt-BR'),
        ]);

        // Cor alternada nas linhas
        if (row.number % 2 === 0) {
          row.fill = {
            type: 'pattern',
            pattern: 'solid',
            fgColor: { argb: 'FFF8FAFC' },
          };
        }

        row.getCell(3).alignment = { horizontal: 'center' };
      });

      // Formatação das colunas
      worksheet.columns = [
        { width: 25 },
        { width: 15 },
        { width: 12 },
        { width: 15 },
        { width: 15 },
      ];
    }

    // Relatório de Performance
    else if (data.averageResponseTime !== undefined) {
      const worksheet = workbook.addWorksheet('Performance');

      // Header
      const headerRow = worksheet.addRow(['Relatório de Performance']);
      headerRow.font = { size: 18, bold: true, color: { argb: 'FF2563EB' } };
      worksheet.mergeCells('A1:B1');

      worksheet.addRow([]); // Linha vazia

      // Estatísticas de performance
      const perfStats = [
        ['Total de Tickets', data.totalTickets],
        ['Tickets Resolvidos', data.resolvedTickets],
        ['Taxa de Resolução', `${data.resolutionRate}%`],
        ['Tempo Médio de Resposta', data.averageResponseTime],
      ];

      perfStats.forEach(([label, value]) => {
        const row = worksheet.addRow([label, value]);
        row.getCell(1).font = { bold: true, color: { argb: 'FF4B5563' } };
        row.getCell(2).font = { color: { argb: 'FF1F2937' } };
      });

      // Formatação das colunas
      worksheet.columns = [{ width: 25 }, { width: 20 }];
    }

    const buffer = await workbook.xlsx.writeBuffer();
    return Buffer.from(buffer);
  }
}
