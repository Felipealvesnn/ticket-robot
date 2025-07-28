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
        ...(filters.sessionId && { sessionId: filters.sessionId }),
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
    const messagesByDay = await this.prisma.$queryRaw<
      Array<{ date: string; messages: bigint }>
    >`
      SELECT 
        DATE(created_at) as date,
        COUNT(*) as messages
      FROM Message 
      WHERE company_id = ${companyId}
        AND created_at >= ${startDate}
        AND created_at <= ${endDate}
        ${filters.sessionId ? `AND session_id = ${filters.sessionId}` : ''}
      GROUP BY DATE(created_at)
      ORDER BY date DESC
      LIMIT 7
    `;

    // Top contatos
    const topContacts = await this.prisma.$queryRaw<
      Array<{
        id: string;
        name: string;
        phone_number: string;
        message_count: bigint;
        last_message_at: Date;
      }>
    >`
      SELECT 
        c.id,
        c.name,
        c.phone_number,
        COUNT(m.id) as message_count,
        MAX(m.created_at) as last_message_at
      FROM Contact c
      LEFT JOIN Message m ON c.id = m.contact_id
      WHERE c.company_id = ${companyId}
        AND m.created_at >= ${startDate}
        AND m.created_at <= ${endDate}
      GROUP BY c.id, c.name, c.phone_number
      ORDER BY message_count DESC
      LIMIT 5
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
        phone: contact.phone_number,
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
      ...(filters.sessionId && { sessionId: filters.sessionId }),
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
        HOUR(created_at) as hour,
        COUNT(*) as message_count
      FROM Message 
      WHERE company_id = ${companyId}
        AND created_at >= ${startDate}
        AND created_at <= ${endDate}
      GROUP BY HOUR(created_at)
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
      const doc = new PDFDocument();
      const buffers: Buffer[] = [];

      doc.on('data', buffers.push.bind(buffers));
      doc.on('end', () => {
        const pdfData = Buffer.concat(buffers);
        resolve(pdfData);
      });

      doc.fontSize(16).text(title, 50, 50);
      doc.fontSize(12).text(JSON.stringify(data, null, 2), 50, 80);

      doc.end();
    });
  }

  private async generateExcel(title: string, data: any): Promise<Buffer> {
    const workbook = new ExcelJS.Workbook();
    const worksheet = workbook.addWorksheet(title);

    // Adicionar dados básicos
    worksheet.addRow([title]);
    worksheet.addRow(['Data:', new Date().toLocaleDateString()]);
    worksheet.addRow([]);

    // Adicionar dados específicos baseado no tipo
    if (data.totalMessages !== undefined) {
      // Overview
      worksheet.addRow(['Total de Mensagens', data.totalMessages]);
      worksheet.addRow(['Total de Contatos', data.totalContacts]);
      worksheet.addRow(['Sessões Ativas', data.activeSessions]);
      worksheet.addRow(['Tempo de Resposta', data.responseTime]);
    } else if (data.messages) {
      // Messages
      worksheet.addRow([
        'ID',
        'Conteúdo',
        'Tipo',
        'Data',
        'Contato',
        'Telefone',
        'Sessão',
      ]);
      data.messages.forEach((message: any) => {
        worksheet.addRow([
          message.id,
          message.content,
          message.type,
          message.timestamp,
          message.contactName,
          message.contactPhone,
          message.sessionName,
        ]);
      });
    } else if (data.contacts) {
      // Contacts
      worksheet.addRow([
        'ID',
        'Nome',
        'Telefone',
        'Mensagens',
        'Primeiro Contato',
        'Última Mensagem',
        'Status',
      ]);
      data.contacts.forEach((contact: any) => {
        worksheet.addRow([
          contact.id,
          contact.name,
          contact.phone,
          contact.messageCount,
          contact.firstContactAt,
          contact.lastMessageAt,
          contact.status,
        ]);
      });
    }

    const buffer = await workbook.xlsx.writeBuffer();
    return Buffer.from(buffer);
  }
}
