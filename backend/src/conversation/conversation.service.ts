/* eslint-disable prettier/prettier */
import { Injectable, Logger } from '@nestjs/common';
import { FlowStateService } from '../flow/flow-state.service';
import { PrismaService } from '../prisma/prisma.service';
import { TicketService } from '../ticket/ticket.service';

@Injectable()
export class ConversationService {
  private readonly logger = new Logger(ConversationService.name);

  constructor(
    private readonly prisma: PrismaService,
    private readonly ticketService: TicketService,
    private readonly flowStateService: FlowStateService,
  ) {}

  /**
   * 🎫 Processar nova mensagem e gerenciar ticket/fluxo
   */
  async processIncomingMessage(
    companyId: string,
    messagingSessionId: string,
    contactId: string,
    message: string,
  ): Promise<{
    ticketId: string;
    shouldStartFlow?: boolean;
    flowResponse?: string;
  }> {
    try {
      // 1. Buscar ou criar ticket para essa conversa
      let ticket = await this.getOrCreateTicket(
        companyId,
        messagingSessionId,
        contactId,
      );

      if (!ticket) {
        throw new Error('Falha ao criar ou encontrar ticket');
      }

      // 2. Atualizar timestamp da última mensagem e resetar auto-close
      ticket = await this.updateTicketActivity(ticket.id, companyId);

      // 3. Verificar se deve iniciar um fluxo
      const shouldStartFlow = await this.flowStateService.shouldStartFlow(
        companyId,
        message,
      );

      let flowResponse: string | undefined;
      if (shouldStartFlow) {
        // Iniciar novo fluxo para este ticket
        const flowResult = await this.startTicketFlow(
          ticket.id,
          companyId,
          messagingSessionId,
          contactId,
          shouldStartFlow,
          message,
        );

        if (flowResult.success && flowResult.response) {
          flowResponse = flowResult.response;
        }
      } else {
        // Verificar se existe fluxo ativo para este ticket
        const activeFlow = await this.getActiveTicketFlow(ticket.id);

        if (activeFlow) {
          // Processar mensagem no fluxo existente
          const flowResult = await this.processTicketFlowInput(
            ticket.id,
            message,
          );

          if (flowResult.success && flowResult.response) {
            flowResponse = flowResult.response;
          }
        }
      }

      return {
        ticketId: ticket.id,
        shouldStartFlow: Boolean(shouldStartFlow),
        flowResponse,
      };
    } catch (error) {
      this.logger.error('Erro ao processar mensagem:', error);
      throw error;
    }
  }

  /**
   * 🔍 Buscar ou criar ticket para a conversa
   */
  private async getOrCreateTicket(
    companyId: string,
    messagingSessionId: string,
    contactId: string,
  ) {
    // Buscar ticket aberto para este contato
    let ticket = await this.prisma.ticket.findFirst({
      where: {
        companyId,
        messagingSessionId,
        contactId,
        status: {
          in: ['OPEN', 'IN_PROGRESS', 'WAITING_CUSTOMER'],
        },
      },
    });
    if (!ticket) {
      // Criar novo ticket usando o TicketService
      const newTicket = await this.ticketService.create(companyId, {
        messagingSessionId,
        contactId,
        title: 'Nova Conversa',
        description: 'Ticket criado automaticamente para nova conversa',
        priority: 'MEDIUM',
      });

      // Converter para o tipo correto
      ticket = newTicket as any;

      this.logger.log(
        `Novo ticket criado: ${newTicket.id} para contato ${contactId}`,
      );
    }

    return ticket;
  }
  /**
   * ⏰ Atualizar atividade do ticket e resetar auto-close
   * NOTA: Campos de auto-close ainda não estão no schema, então apenas atualizamos updatedAt
   */
  private async updateTicketActivity(ticketId: string, _companyId: string) {
    const now = new Date();
    // TODO: Quando o schema for atualizado, adicionar:
    // const autoCloseAt = new Date(now.getTime() + 15 * 60 * 1000); // 15 minutos

    return await this.prisma.ticket.update({
      where: { id: ticketId },
      data: {
        // lastMessageAt: now, // TODO: Adicionar quando campo existir no schema
        // autoCloseAt: autoCloseAt, // TODO: Adicionar quando campo existir no schema
        updatedAt: now,
      },
    });
  }

  /**
   * 🚀 Iniciar fluxo para um ticket
   */
  private async startTicketFlow(
    ticketId: string,
    companyId: string,
    messagingSessionId: string,
    contactId: string,
    chatFlowId: string,
    triggerMessage: string,
  ) {
    // TODO: Implementar quando migrarmos para TicketFlowState
    // Por enquanto, usar o fluxo existente baseado em contato
    return await this.flowStateService.startFlow(
      companyId,
      messagingSessionId,
      contactId,
      chatFlowId,
      triggerMessage,
    );
  } /**
   * 🎯 Processar entrada do usuário no fluxo do ticket
   * TODO: Implementar quando migrarmos para TicketFlowState
   */
  private processTicketFlowInput(_ticketId: string, _message: string) {
    // Por enquanto, retornar sucesso sem ação
    return Promise.resolve({ success: false, response: undefined });
  }

  /**
   * 🔍 Buscar fluxo ativo para um ticket
   * TODO: Implementar quando migrarmos para TicketFlowState
   */
  private getActiveTicketFlow(_ticketId: string) {
    // TODO: Implementar quando migrarmos para TicketFlowState
    return Promise.resolve(null);
  }
  /**
   * 🏁 Fechar tickets inativos (para job/cron)
   * NOTA: Versão simplificada sem autoCloseAt até schema ser atualizado
   */
  async closeInactiveTickets(companyId?: string): Promise<{
    closedCount: number;
    closedTickets: string[];
  }> {
    const now = new Date();
    const fifteenMinutesAgo = new Date(now.getTime() - 15 * 60 * 1000);

    const whereClause: {
      companyId?: string;
      status: { in: string[] };
      updatedAt: { lte: Date };
    } = {
      status: {
        in: ['OPEN', 'IN_PROGRESS', 'WAITING_CUSTOMER'],
      },
      updatedAt: {
        lte: fifteenMinutesAgo, // Usar updatedAt como proxy por enquanto
      },
    };

    if (companyId) {
      whereClause.companyId = companyId;
    }

    // Buscar tickets que devem ser fechados
    const ticketsToClose = await this.prisma.ticket.findMany({
      where: whereClause,
      select: { id: true, companyId: true },
    });

    const closedTickets: string[] = [];

    // Fechar cada ticket individualmente
    for (const ticket of ticketsToClose) {
      try {
        await this.prisma.ticket.update({
          where: { id: ticket.id },
          data: {
            status: 'CLOSED',
            closedAt: now,
            updatedAt: now,
          },
        });

        // Registrar no histórico
        await this.prisma.ticketHistory.create({
          data: {
            ticketId: ticket.id,
            action: 'AUTO_CLOSED',
            toValue: 'CLOSED',
            comment: 'Ticket fechado automaticamente por inatividade',
          },
        });

        closedTickets.push(ticket.id);
        this.logger.log(`Ticket ${ticket.id} fechado automaticamente`);
      } catch (error) {
        this.logger.error(`Erro ao fechar ticket ${ticket.id}:`, error);
      }
    }

    return {
      closedCount: closedTickets.length,
      closedTickets,
    };
  }

  /**
   * 📊 Estatísticas de tickets ativos
   */
  async getActiveTicketsStats(companyId: string) {
    const [totalActive, aboutToClose] = await Promise.all([
      // Tickets ativos
      this.prisma.ticket.count({
        where: {
          companyId,
          status: {
            in: ['OPEN', 'IN_PROGRESS', 'WAITING_CUSTOMER'],
          },
        },
      }), // Tickets que vão fechar em breve (próximos 5 minutos)
      // TODO: Quando autoCloseAt existir no schema, usar esta query:
      /*
      this.prisma.ticket.count({
        where: {
          companyId,
          status: {
            in: ['OPEN', 'IN_PROGRESS', 'WAITING_CUSTOMER'],
          },
          autoCloseAt: {
            lte: new Date(Date.now() + 5 * 60 * 1000),
          },
          isAutoCloseEnabled: true,
        },
      }),
      */
      // Por enquanto, retornar 0
      Promise.resolve(0),
    ]);

    return {
      totalActive,
      aboutToClose,
    };
  }
}
