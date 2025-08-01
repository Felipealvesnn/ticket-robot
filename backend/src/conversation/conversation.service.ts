/* eslint-disable prettier/prettier */
import { Injectable, Logger } from '@nestjs/common';
import { BusinessHoursService } from '../business-hours/business-hours.service';
import { FlowStateService } from '../flow/flow-state.service';
import { PrismaService } from '../prisma/prisma.service';
import { MessageQueueService } from '../queue/message-queue.service';

@Injectable()
export class ConversationService {
  private readonly logger = new Logger(ConversationService.name);

  constructor(
    private readonly prisma: PrismaService,
    private readonly flowStateService: FlowStateService,
    private readonly businessHoursService: BusinessHoursService,
    private readonly messageQueueService: MessageQueueService,
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
    mediaUrl?: string;
    mediaType?: 'image' | 'video' | 'audio' | 'document';
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
      ticket = await this.updateTicketActivity(ticket.id);

      // ⚠️ IMPORTANTE: Verificar se ticket foi transferido para humano
      // Se o status for IN_PROGRESS, o robô não deve responder
      if (ticket.status === 'IN_PROGRESS') {
        this.logger.debug(
          `🚫 Ticket ${ticket.id} está em atendimento humano (IN_PROGRESS) - robô não irá responder`,
        );

        // Finalizar qualquer fluxo ativo para não interferir no atendimento humano
        await this.finalizeActiveFlows(ticket.id, companyId);

        return {
          ticketId: ticket.id,
          shouldStartFlow: false,
          // Não retornar flowResponse para que o robô não envie mensagem
        };
      }

      // 🕐 NOVO: Verificar se é solicitação de atendimento humano e validar horário
      const transferCheck = await this.checkHumanTransferAvailability(
        companyId,
        message,
      );

      // Se é solicitação de humano e pode transferir, transferir imediatamente
      if (transferCheck.canTransfer) {
        await this.transferTicketToHuman(ticket.id, companyId, message);

        return {
          ticketId: ticket.id,
          shouldStartFlow: false,
          flowResponse:
            '🤝 Transferindo você para um atendente humano. Por favor, aguarde um momento...',
        };
      }

      // Se é solicitação de humano mas está fora do horário, retornar mensagem específica
      if (!transferCheck.canTransfer && transferCheck.suggestedResponse) {
        return {
          ticketId: ticket.id,
          shouldStartFlow: false,
          flowResponse: transferCheck.suggestedResponse,
        };
      }

      // 3. PRIORIDADE: Verificar se existe fluxo ativo PRIMEIRO
      let flowResponse: string | undefined;
      let mediaUrl: string | undefined;
      let mediaType: 'image' | 'video' | 'audio' | 'document' | undefined;
      let shouldStartFlow: string | false = false;

      const activeFlow = await this.getActiveTicketFlow(ticket.id);

      if (activeFlow) {
        // 🎯 JÁ EXISTE FLUXO ATIVO - processar no fluxo atual
        this.logger.debug(
          `🔄 Processando mensagem no fluxo ativo ${activeFlow.chatFlowId} para ticket ${ticket.id}`,
        );

        const flowResult = await this.processTicketFlowInput(
          ticket.id,
          message,
        );

        if (flowResult.success) {
          if (flowResult.response) {
            flowResponse = flowResult.response;
          }
          if (flowResult.mediaUrl) {
            mediaUrl = flowResult.mediaUrl;
            mediaType = flowResult.mediaType;
          }
        }
      } else {
        // 🆕 NÃO HÁ FLUXO ATIVO - verificar se deve iniciar novo fluxo
        shouldStartFlow = await this.flowStateService.shouldStartFlow(
          companyId,
          message,
        );

        if (shouldStartFlow) {
          this.logger.debug(
            `🚀 Iniciando novo fluxo ${shouldStartFlow} para ticket ${ticket.id}`,
          );

          // Iniciar novo fluxo para este ticket
          const flowResult = await this.startTicketFlow(
            ticket.id,
            companyId,
            messagingSessionId,
            contactId,
            shouldStartFlow,
            message,
          );

          if (flowResult.success) {
            if (flowResult.response) {
              flowResponse = flowResult.response;
            }
            if (flowResult.mediaUrl) {
              mediaUrl = flowResult.mediaUrl;
              mediaType = flowResult.mediaType;
            }

            // 🎯 Se o fluxo indica que deve mostrar menu após a mensagem
            if (flowResult.shouldShowMenu && flowResult.menuDelay) {
              // Programar envio do menu após delay
              this.scheduleMenuMessage(
                companyId,
                messagingSessionId,
                contactId,
                flowResult.menuDelay,
              );
              this.logger.debug(
                `Menu será enviado após ${flowResult.menuDelay}ms de delay`,
              );
            } else if (flowResult.shouldShowMenu) {
              // Fallback: mostrar menu imediatamente (comportamento antigo)
              this.logger.debug('Menu será enviado imediatamente');
            }
          }
        } else {
          // 🤷‍♂️ Não há fluxo ativo e nenhum trigger corresponde
          // Pode implementar resposta padrão ou ficar em silêncio
          this.logger.debug(
            `📭 Nenhum fluxo encontrado para mensagem "${message}" do ticket ${ticket.id}`,
          );
        }
      }

      return {
        ticketId: ticket.id,
        shouldStartFlow: Boolean(shouldStartFlow),
        flowResponse,
        mediaUrl,
        mediaType,
      };
    } catch (error) {
      this.logger.error('Erro ao processar mensagem:', error);
      throw error;
    }
  }

  /**
   * 🔍 Buscar ou criar ticket para a conversa
   * MELHORADO: Agora considera se há ticket fechado recentemente para reutilizar
   */
  private async getOrCreateTicket(
    companyId: string,
    messagingSessionId: string,
    contactId: string,
  ) {
    // 1. Buscar ticket aberto para este contato
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

    if (ticket) {
      // Ticket aberto encontrado - reutilizar
      this.logger.debug(`Reutilizando ticket existente: ${ticket.id}`);
      return ticket;
    }

    // 2. 🆕 NOVO: Verificar se há ticket fechado recentemente (últimas 2 horas)
    const twoHoursAgo = new Date();
    twoHoursAgo.setHours(twoHoursAgo.getHours() - 2);

    const recentClosedTicket = await this.prisma.ticket.findFirst({
      where: {
        companyId,
        messagingSessionId,
        contactId,
        status: 'CLOSED',
        closedAt: {
          gte: twoHoursAgo,
        },
      },
      orderBy: {
        closedAt: 'desc',
      },
    });

    if (recentClosedTicket) {
      // 3. Reabrir ticket fechado recentemente
      const now = new Date();
      const reopenedTicket = await this.prisma.ticket.update({
        where: { id: recentClosedTicket.id },
        data: {
          status: 'OPEN',
          closedAt: null,
          updatedAt: now,
          lastMessageAt: now,
        },
      });

      // Registrar no histórico
      try {
        await this.prisma.ticketHistory.create({
          data: {
            ticketId: reopenedTicket.id,
            action: 'REOPENED',
            toValue: 'OPEN',
            comment: 'Ticket reaberto automaticamente - nova mensagem recebida',
          },
        });
      } catch (historyError) {
        this.logger.warn(
          `Não foi possível criar histórico para ticket ${reopenedTicket.id}:`,
          historyError.message,
        );
      }

      this.logger.log(
        `🔄 Ticket ${reopenedTicket.id} reaberto automaticamente para contato ${contactId}`,
      );
      return reopenedTicket;
    }

    // 4. Criar novo ticket se não há nenhum adequado
    const newTicket = await this.prisma.ticket.create({
      data: {
        companyId,
        messagingSessionId,
        contactId,
        title: 'Nova Conversa',
        description: 'Ticket criado automaticamente para nova conversa',
        priority: 'MEDIUM',
        status: 'OPEN',
      },
      include: {
        contact: true,
        agents: {
          include: {
            user: {
              select: {
                id: true,
                name: true,
                email: true,
              },
            },
          },
        },
        messagingSession: {
          select: {
            id: true,
            name: true,
          },
        },
      },
    });

    // Registrar no histórico
    await this.prisma.ticketHistory.create({
      data: {
        ticketId: newTicket.id,
        action: 'CREATED',
        toValue: newTicket.status,
        comment: 'Ticket criado automaticamente',
      },
    });

    ticket = newTicket;

    this.logger.log(
      `🆕 Novo ticket criado: ${newTicket.id} para contato ${contactId}`,
    );

    // 🔥 NOVO: Enviar novo ticket para o frontend
    await this.sendNewTicketToFrontend(
      companyId,
      messagingSessionId,
      newTicket,
    );

    return ticket;
  }
  /**
   * ⏰ Atualizar atividade do ticket e resetar auto-close
   * NOTA: Campos de auto-close ainda não estão no schema, então apenas atualizamos updatedAt
   */
  private async updateTicketActivity(ticketId: string) {
    const now = new Date();
    // TODO: Quando o schema for atualizado, adicionar:
    const autoCloseAt = new Date(now.getTime() + 15 * 60 * 1000); // 15 minutos

    return await this.prisma.ticket.update({
      where: { id: ticketId },
      data: {
        lastMessageAt: now, // TODO: Adicionar quando campo existir no schema
        autoCloseAt: autoCloseAt, // TODO: Adicionar quando campo existir no schema
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
    try {
      return await this.flowStateService.startFlow(
        companyId,
        messagingSessionId,
        contactId,
        chatFlowId,
        triggerMessage,
      );
    } catch (error) {
      this.logger.error(
        `Erro ao iniciar fluxo ${chatFlowId} para ticket ${ticketId}:`,
        error,
      );
      return { success: false, response: undefined };
    }
  } /**
   * 🎯 Processar entrada do usuário no fluxo do ticket
   * TODO: Implementar quando migrarmos para TicketFlowState
   */
  private async processTicketFlowInput(ticketId: string, message: string) {
    try {
      // Por enquanto, buscar o estado do fluxo através do contato
      const ticket = await this.prisma.ticket.findUnique({
        where: { id: ticketId },
        include: { contact: true },
      });

      if (!ticket || !ticket.contact) {
        return { success: false, response: undefined };
      }

      // Verificar se temos messagingSessionId válido
      if (!ticket.messagingSessionId) {
        this.logger.warn(`Ticket ${ticketId} não possui messagingSessionId`);
        return { success: false, response: undefined };
      }

      // Usar o fluxo existente baseado em contato até migrarmos para TicketFlowState
      const flowResult = await this.flowStateService.processUserInput(
        ticket.companyId,
        ticket.messagingSessionId, // Remove assertion desnecessária
        ticket.contactId,
        message,
      );

      return {
        success: flowResult?.success || false,
        response: flowResult?.response,
        mediaUrl: flowResult?.mediaUrl,
        mediaType: flowResult?.mediaType,
      };
    } catch (error) {
      this.logger.error(
        `Erro ao processar entrada do fluxo para ticket ${ticketId}:`,
        error,
      );
      return { success: false, response: undefined };
    }
  }

  /**
   * 🔍 Buscar fluxo ativo para um ticket
   * TODO: Implementar quando migrarmos para TicketFlowState
   */
  private async getActiveTicketFlow(ticketId: string) {
    try {
      // Por enquanto, verificar através do estado do contato
      const ticket = await this.prisma.ticket.findUnique({
        where: { id: ticketId },
        include: { contact: true },
      });

      if (!ticket || !ticket.contact) {
        return null;
      }

      // Verificar se existe estado de fluxo ativo para o contato
      const contactFlowState = await this.prisma.contactFlowState.findFirst({
        where: {
          contactId: ticket.contactId,
          companyId: ticket.companyId,
          isActive: true,
        },
        include: {
          chatFlow: true,
        },
      });

      return contactFlowState || null;
    } catch (error) {
      this.logger.error(
        `Erro ao buscar fluxo ativo para ticket ${ticketId}:`,
        error,
      );
      return null;
    }
  }

  /**
   * 🔧 Fechar ticket manualmente
   */
  async closeTicket(
    ticketId: string,
    companyId: string,
    reason?: string,
  ): Promise<{
    success: boolean;
    ticket?: any;
    error?: string;
  }> {
    try {
      // Verificar se o ticket existe e pertence à empresa
      const existingTicket = await this.prisma.ticket.findFirst({
        where: {
          id: ticketId,
          companyId,
        },
      });

      if (!existingTicket) {
        return {
          success: false,
          error: 'Ticket não encontrado',
        };
      }

      if (existingTicket.status === 'CLOSED') {
        return {
          success: false,
          error: 'Ticket já está fechado',
        };
      }

      const now = new Date();

      // Fechar o ticket
      const closedTicket = await this.prisma.ticket.update({
        where: { id: ticketId },
        data: {
          status: 'CLOSED',
          closedAt: now,
          updatedAt: now,
        },
      });

      // Registrar no histórico
      await this.prisma.ticketHistory.create({
        data: {
          ticketId,
          action: 'CLOSED',
          toValue: 'CLOSED',
          comment: reason || 'Ticket fechado manualmente',
        },
      });

      // Finalizar fluxos ativos para este ticket/contato
      await this.finalizeActiveFlows(ticketId, companyId);

      this.logger.log(`Ticket ${ticketId} fechado manualmente`);

      return {
        success: true,
        ticket: closedTicket,
      };
    } catch (error) {
      this.logger.error(`Erro ao fechar ticket ${ticketId}:`, error);
      return {
        success: false,
        error: 'Erro interno ao fechar ticket',
      };
    }
  }

  /**
   * 🏃‍♂️ Finalizar fluxos ativos para um ticket
   */
  private async finalizeActiveFlows(
    ticketId: string,
    companyId: string,
  ): Promise<void> {
    try {
      const ticket = await this.prisma.ticket.findUnique({
        where: { id: ticketId },
      });

      if (!ticket) return;

      // Finalizar estados de fluxo ativos para o contato
      await this.prisma.contactFlowState.updateMany({
        where: {
          contactId: ticket.contactId,
          companyId,
          isActive: true,
        },
        data: {
          isActive: false,
          updatedAt: new Date(),
        },
      });

      this.logger.debug(`Fluxos finalizados para ticket ${ticketId}`);
    } catch (error) {
      this.logger.error(
        `Erro ao finalizar fluxos do ticket ${ticketId}:`,
        error,
      );
    }
  }

  /**
   * 🔍 Buscar ticket por ID
   */
  async getTicketById(ticketId: string, companyId: string) {
    try {
      return await this.prisma.ticket.findFirst({
        where: {
          id: ticketId,
          companyId,
        },
        include: {
          contact: true,
          messagingSession: true,
        },
      });
    } catch (error) {
      this.logger.error(`Erro ao buscar ticket ${ticketId}:`, error);
      return null;
    }
  }

  /**
   * 📋 Listar tickets por empresa com filtros
   */
  async getTicketsByCompany(
    companyId: string,
    filters?: {
      status?: string[];
      contactId?: string;
      messagingSessionId?: string;
      limit?: number;
      offset?: number;
    },
  ): Promise<{
    tickets: any[];
    total: number;
  }> {
    try {
      const whereClause: {
        companyId: string;
        status?: { in: string[] };
        contactId?: string;
        messagingSessionId?: string;
      } = { companyId };

      if (filters?.status && filters.status.length > 0) {
        whereClause.status = { in: filters.status };
      }

      if (filters?.contactId) {
        whereClause.contactId = filters.contactId;
      }

      if (filters?.messagingSessionId) {
        whereClause.messagingSessionId = filters.messagingSessionId;
      }

      const [tickets, total] = await Promise.all([
        this.prisma.ticket.findMany({
          where: whereClause,
          include: {
            contact: true,
            messagingSession: true,
          },
          orderBy: { updatedAt: 'desc' },
          take: filters?.limit || 50,
          skip: filters?.offset || 0,
        }),
        this.prisma.ticket.count({
          where: whereClause,
        }),
      ]);

      return { tickets, total };
    } catch (error) {
      this.logger.error(
        `Erro ao listar tickets da empresa ${companyId}:`,
        error,
      );
      return { tickets: [], total: 0 };
    }
  }

  /**
   * 🔄 Reabrir ticket fechado
   */
  async reopenTicket(
    ticketId: string,
    companyId: string,
    reason?: string,
  ): Promise<{
    success: boolean;
    ticket?: any;
    error?: string;
  }> {
    try {
      const existingTicket = await this.prisma.ticket.findFirst({
        where: {
          id: ticketId,
          companyId,
        },
      });

      if (!existingTicket) {
        return {
          success: false,
          error: 'Ticket não encontrado',
        };
      }

      if (existingTicket.status !== 'CLOSED') {
        return {
          success: false,
          error: 'Apenas tickets fechados podem ser reabertos',
        };
      }

      const now = new Date();

      const reopenedTicket = await this.prisma.ticket.update({
        where: { id: ticketId },
        data: {
          status: 'OPEN',
          closedAt: null,
          updatedAt: now,
        },
      });

      // Registrar no histórico
      await this.prisma.ticketHistory.create({
        data: {
          ticketId,
          action: 'REOPENED',
          toValue: 'OPEN',
          comment: reason || 'Ticket reaberto',
        },
      });

      this.logger.log(`Ticket ${ticketId} reaberto`);

      return {
        success: true,
        ticket: reopenedTicket,
      };
    } catch (error) {
      this.logger.error(`Erro ao reabrir ticket ${ticketId}:`, error);
      return {
        success: false,
        error: 'Erro interno ao reabrir ticket',
      };
    }
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
        // Buscar dados do ticket para finalizar fluxos específicos
        const ticketData = await this.prisma.ticket.findUnique({
          where: { id: ticket.id },
          select: {
            id: true,
            companyId: true,
            contactId: true,
            messagingSessionId: true,
          },
        });

        if (ticketData) {
          // Finalizar fluxos ativos com mensagem de inatividade para o contato específico
          await this.flowStateService.finishFlowByInactivity(
            ticketData.companyId,
            ticketData.contactId,
            ticketData.messagingSessionId,
          );
        }

        await this.prisma.ticket.update({
          where: { id: ticket.id },
          data: {
            status: 'CLOSED',
            closedAt: now,
            updatedAt: now,
          },
        });

        // Registrar no histórico (verificar se tabela existe)
        try {
          await this.prisma.ticketHistory.create({
            data: {
              ticketId: ticket.id,
              action: 'AUTO_CLOSED',
              toValue: 'CLOSED',
              comment: 'Ticket fechado automaticamente por inatividade',
            },
          });
        } catch (historyError) {
          this.logger.warn(
            `Não foi possível criar histórico para ticket ${ticket.id}:`,
            historyError,
          );
        }

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
      }),
      // Tickets que vão fechar em breve (próximos 5 minutos)
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

  /**
   * 🕐 Verificar se pode transferir para atendimento humano
   * Valida horário de funcionamento antes de permitir transferência
   */
  async checkHumanTransferAvailability(
    companyId: string,
    message: string,
  ): Promise<{
    canTransfer: boolean;
    reason?: string;
    suggestedResponse?: string;
  }> {
    try {
      // Verificar se a mensagem indica solicitação de atendimento humano
      const humanTransferKeywords = [
        'falar com atendente',
        'atendente',
        'humano',
        'pessoa',
        'operador',
        'atendimento',
        'suporte',
        'ajuda humana',
        'atendimento',
        'transferir',
        'sair do bot',
        'atendimento humano',
        'falar com alguém',
        'preciso de ajuda',
        'atendente humano',
        'quero falar com pessoa',
        'sair do robô',
      ];

      const messageText = message.toLowerCase();
      const isRequestingHuman = humanTransferKeywords.some((keyword) =>
        messageText.includes(keyword),
      );

      if (!isRequestingHuman) {
        return { canTransfer: false };
      }

      // Verificar se está dentro do horário de funcionamento
      const isBusinessOpen = await this.businessHoursService.isBusinessOpen(
        companyId,
        new Date(),
      );

      if (isBusinessOpen) {
        return {
          canTransfer: true,
          reason: 'Horário de atendimento disponível',
        };
      }

      // Buscar horários reais da empresa para exibir na mensagem
      const businessHours =
        await this.businessHoursService.getBusinessHours(companyId);

      // Buscar próximo horário de funcionamento
      const nextBusinessTime =
        await this.businessHoursService.getNextBusinessTime(companyId);

      // Mapear dias da semana
      const daysOfWeek = [
        'Domingo',
        'Segunda-feira',
        'Terça-feira',
        'Quarta-feira',
        'Quinta-feira',
        'Sexta-feira',
        'Sábado',
      ];

      let hoursMessage = '';

      if (businessHours && businessHours.length > 0) {
        const activeHours = businessHours
          .filter((h) => h.isActive)
          .map((h) => {
            const dayName = daysOfWeek[h.dayOfWeek];
            let timeRange = `${h.startTime} às ${h.endTime}`;

            // Adicionar intervalo se houver
            if (h.breakStart && h.breakEnd) {
              timeRange += ` (Intervalo: ${h.breakStart} às ${h.breakEnd})`;
            }

            return `• ${dayName}: ${timeRange}`;
          });

        if (activeHours.length > 0) {
          hoursMessage = activeHours.join('\n');
        } else {
          hoursMessage = '• Verifique nossos horários de funcionamento';
        }
      } else {
        // Fallback se não houver horários configurados
        hoursMessage = `• Segunda a Sexta: 08:00 às 17:00\n• Sábado: 08:00 às 12:00\n• Domingo: Fechado`;
      }

      let timeMessage = '';
      if (nextBusinessTime) {
        const nextTimeFormatted = nextBusinessTime.toLocaleString('pt-BR', {
          weekday: 'long',
          year: 'numeric',
          month: 'long',
          day: 'numeric',
          hour: '2-digit',
          minute: '2-digit',
        });
        timeMessage = `\n\n⏰ Próximo horário de atendimento: ${nextTimeFormatted}`;
      }

      const suggestedResponse = `🕐 **Atendimento Humano Indisponível**

Desculpe, nosso atendimento humano está fora do horário de funcionamento no momento.

**📅 Horários de Atendimento:**
${hoursMessage}${timeMessage}

💬 **Enquanto isso:**
• Continue nossa conversa - posso ajudar com várias questões
• Deixe sua mensagem que retornaremos assim que possível
• Use nosso sistema automatizado para resolver rapidamente sua solicitação

Como posso ajudá-lo agora mesmo? 😊`;

      return {
        canTransfer: false,
        reason: 'Fora do horário de atendimento',
        suggestedResponse,
      };
    } catch (error) {
      this.logger.error(
        `Erro ao verificar disponibilidade de transferência para empresa ${companyId}:`,
        error,
      );

      // Em caso de erro, permitir transferência para não bloquear o usuário
      return {
        canTransfer: true,
        reason: 'Erro na verificação - permitindo transferência',
      };
    }
  }

  /**
   * 🤝 Transferir ticket para atendimento humano
   */
  private async transferTicketToHuman(
    ticketId: string,
    companyId: string,
    triggerMessage: string,
  ): Promise<void> {
    try {
      // 1. Atualizar status do ticket para IN_PROGRESS
      await this.prisma.ticket.update({
        where: { id: ticketId },
        data: {
          status: 'IN_PROGRESS',
          updatedAt: new Date(),
        },
      });

      // 2. Registrar no histórico
      await this.prisma.ticketHistory.create({
        data: {
          ticketId,
          action: 'TRANSFERRED_TO_HUMAN',
          fromValue: 'OPEN',
          toValue: 'IN_PROGRESS',
          comment: `Transferido para humano por solicitação: "${triggerMessage.substring(0, 100)}"`,
        },
      });

      // 3. Finalizar todos os fluxos ativos para este ticket
      await this.finalizeActiveFlows(ticketId, companyId);

      this.logger.log(
        `🤝 Ticket ${ticketId} transferido para atendimento humano`,
      );
    } catch (error) {
      this.logger.error(
        `Erro ao transferir ticket ${ticketId} para humano:`,
        error,
      );
      throw error;
    }
  }

  /**
   * 🎫 Enviar novo ticket para o frontend via messageQueueService
   * Este método é chamado sempre que um novo ticket é criado
   */
  private async sendNewTicketToFrontend(
    companyId: string,
    sessionId: string,
    ticket: any,
  ): Promise<void> {
    try {
      await this.messageQueueService.queueMessage({
        sessionId,
        companyId,
        clientId: `system-${sessionId}`,
        eventType: 'new-ticket',
        data: {
          ticket,
          action: 'created',
        },
        timestamp: new Date(),
        priority: 1, // Prioridade alta para novos tickets
      });

      this.logger.debug(
        `✅ Novo ticket ${ticket.id} enviado para o frontend via messageQueue`,
      );
    } catch (error) {
      this.logger.error(
        `❌ Erro ao enviar novo ticket ${ticket.id} para o frontend:`,
        error,
      );
    }
  }

  /**
   * 📅 Programar envio de mensagem de menu após delay
   */
  private scheduleMenuMessage(
    companyId: string,
    messagingSessionId: string,
    contactId: string,
    delayMs: number,
  ): void {
    setTimeout(() => {
      try {
        // Buscar menu para este fluxo/empresa
        const menuMessage = this.buildMenuMessage();

        // Enviar mensagem de menu
        // Aqui você pode usar o mesmo sistema de envio de mensagens
        // Por enquanto, vou usar o logger para mostrar que funcionaria
        this.logger.debug(
          `📋 Enviando menu após delay para contato ${contactId} (session: ${messagingSessionId}, company: ${companyId}): ${menuMessage}`,
        );

        // TODO: Implementar envio real da mensagem de menu
        // Isso dependeria do sistema de mensagens que vocês usam
        // Pode ser via SessionService ou MessageService
      } catch (error) {
        this.logger.error('Erro ao enviar menu com delay:', error);
      }
    }, delayMs);
  }

  /**
   * 🏗️ Construir mensagem de menu padrão
   */
  private buildMenuMessage(): string {
    // Aqui você pode buscar menus específicos da empresa no banco de dados
    // Por enquanto, retorno um menu padrão
    return `🤖 **O que você gostaria de fazer agora?**

Digite uma das opções:
• *Menu* - Voltar ao menu principal
• *Atendente* - Falar com atendimento humano
• *Ajuda* - Ver opções disponíveis`;
  }
}
