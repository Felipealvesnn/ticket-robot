/* eslint-disable prettier/prettier */
import {
  BadRequestException,
  ForbiddenException,
  Injectable,
  Logger,
  NotFoundException,
} from '@nestjs/common';
import {
  MessageResponse,
  TicketData,
  TicketStatsData,
} from '../common/interfaces/data.interface';
import { ConversationService } from '../conversation/conversation.service';
import { PrismaService } from '../prisma/prisma.service';
import { SessionService } from '../session/session.service';
import {
  AssignTicketDto,
  CreateTicketDto,
  TicketCommentDto,
  UpdateTicketDto,
} from './dto/ticket.dto';

@Injectable()
export class TicketService {
  private readonly logger = new Logger(TicketService.name);

  constructor(
    private readonly prisma: PrismaService,
    private readonly sessionService: SessionService,
    private readonly conversationService: ConversationService,
  ) {}

  async create(
    companyId: string,
    createTicketDto: CreateTicketDto,
  ): Promise<TicketData> {
    // Verificar se a sessão do WhatsApp pertence à empresa
    const session = await this.prisma.messagingSession.findFirst({
      where: {
        id: createTicketDto.messagingSessionId,
        companyId,
      },
    });

    if (!session) {
      throw new BadRequestException(
        'Sessão do WhatsApp não encontrada ou não pertence à empresa',
      );
    }

    // Verificar se o contato pertence à empresa
    const contact = await this.prisma.contact.findFirst({
      where: {
        id: createTicketDto.contactId,
        companyId,
      },
    });

    if (!contact) {
      throw new BadRequestException(
        'Contato não encontrado ou não pertence à empresa',
      );
    }

    // Se um agente foi especificado, verificar se ele pertence à empresa
    if (createTicketDto.assignedAgentId) {
      const agent = await this.prisma.companyUser.findFirst({
        where: {
          userId: createTicketDto.assignedAgentId,
          companyId,
          isActive: true,
        },
      });

      if (!agent) {
        throw new BadRequestException(
          'Agente não encontrado ou não pertence à empresa',
        );
      }
    }

    const ticket = await this.prisma.ticket.create({
      data: {
        companyId,
        messagingSessionId: createTicketDto.messagingSessionId,
        contactId: createTicketDto.contactId,
        title: createTicketDto.title,
        description: createTicketDto.description,
        priority: createTicketDto.priority || 'MEDIUM',
        category: createTicketDto.category,
        assignedAgentId: createTicketDto.assignedAgentId,
      },
      include: {
        contact: true,
        assignedAgent: {
          select: {
            id: true,
            name: true,
            email: true,
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
        ticketId: ticket.id,
        action: 'CREATED',
        toValue: ticket.status,
        comment: 'Ticket criado',
      },
    });

    return ticket;
  }
  async findAll(
    companyId: string,
    status?: string,
    assignedAgentId?: string,
  ): Promise<TicketData[]> {
    const where: {
      companyId: string;
      status?: string;
      assignedAgentId?: string;
    } = { companyId };

    if (status) {
      where.status = status;
    }

    if (assignedAgentId) {
      where.assignedAgentId = assignedAgentId;
    }

    return await this.prisma.ticket.findMany({
      where,
      include: {
        contact: {
          select: {
            id: true,
            name: true,
            phoneNumber: true,
          },
        },
        assignedAgent: {
          select: {
            id: true,
            name: true,
            email: true,
          },
        },
        messagingSession: {
          select: {
            id: true,
            name: true,
          },
        },
        _count: {
          select: {
            messages: true,
          },
        },
      },
      orderBy: { createdAt: 'desc' },
    });
  }

  async findOne(id: string, companyId: string): Promise<TicketData> {
    const ticket = await this.prisma.ticket.findUnique({
      where: { id },
      include: {
        contact: true,
        assignedAgent: {
          select: {
            id: true,
            name: true,
            email: true,
          },
        },
        messagingSession: {
          select: {
            id: true,
            name: true,
          },
        },
        messages: {
          orderBy: { createdAt: 'asc' },
          include: {
            contact: {
              select: {
                name: true,
                phoneNumber: true,
              },
            },
          },
        },
        history: {
          orderBy: { createdAt: 'desc' },
        },
      },
    });

    if (!ticket) {
      throw new NotFoundException('Ticket não encontrado');
    }

    if (ticket.companyId !== companyId) {
      throw new ForbiddenException('Acesso negado a este ticket');
    }

    return ticket;
  }
  async update(
    id: string,
    companyId: string,
    userId: string,
    updateTicketDto: UpdateTicketDto,
  ): Promise<TicketData> {
    const ticket = await this.findOne(id, companyId);

    // Se status está sendo alterado, registrar no histórico
    const historyEntries: Array<{
      ticketId: string;
      userId?: string;
      action: string;
      fromValue?: string;
      toValue?: string;
    }> = [];

    if (updateTicketDto.status && updateTicketDto.status !== ticket.status) {
      historyEntries.push({
        ticketId: id,
        userId,
        action: 'STATUS_CHANGED',
        fromValue: ticket.status,
        toValue: updateTicketDto.status,
      });

      // Atualizar timestamps especiais baseados no status
      const updateData: UpdateTicketDto & {
        resolvedAt?: Date;
        closedAt?: Date;
      } = { ...updateTicketDto };

      if (updateTicketDto.status === 'RESOLVED' && !ticket.resolvedAt) {
        updateData.resolvedAt = new Date();
      }

      if (updateTicketDto.status === 'CLOSED' && !ticket.closedAt) {
        updateData.closedAt = new Date();
      }

      updateTicketDto = updateData;
    }

    if (
      updateTicketDto.priority &&
      updateTicketDto.priority !== ticket.priority
    ) {
      historyEntries.push({
        ticketId: id,
        userId,
        action: 'PRIORITY_CHANGED',
        fromValue: ticket.priority,
        toValue: updateTicketDto.priority,
      });
    }

    if (
      updateTicketDto.assignedAgentId &&
      updateTicketDto.assignedAgentId !== ticket.assignedAgentId
    ) {
      // Verificar se o agente pertence à empresa
      if (updateTicketDto.assignedAgentId) {
        const agent = await this.prisma.companyUser.findFirst({
          where: {
            userId: updateTicketDto.assignedAgentId,
            companyId,
            isActive: true,
          },
        });

        if (!agent) {
          throw new BadRequestException(
            'Agente não encontrado ou não pertence à empresa',
          );
        }
      }

      historyEntries.push({
        ticketId: id,
        userId,
        action: 'ASSIGNED',
        fromValue: ticket.assignedAgentId || 'UNASSIGNED',
        toValue: updateTicketDto.assignedAgentId || 'UNASSIGNED',
      });
    }

    // Atualizar ticket e histórico em transação
    const result = await this.prisma.$transaction(async (tx) => {
      const updatedTicket = await tx.ticket.update({
        where: { id },
        data: updateTicketDto,
        include: {
          contact: true,
          assignedAgent: {
            select: {
              id: true,
              name: true,
              email: true,
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

      // Criar entradas no histórico
      if (historyEntries.length > 0) {
        await tx.ticketHistory.createMany({
          data: historyEntries,
        });
      }

      return updatedTicket;
    });

    return result;
  }

  async assign(
    id: string,
    companyId: string,
    userId: string,
    assignTicketDto: AssignTicketDto,
  ): Promise<TicketData> {
    return await this.update(id, companyId, userId, {
      assignedAgentId: assignTicketDto.agentId,
    });
  }

  async close(
    id: string,
    companyId: string,
    userId: string,
    commentDto?: TicketCommentDto,
  ): Promise<MessageResponse> {
    const updateData = { status: 'CLOSED' as const };

    await this.update(id, companyId, userId, updateData);

    // Adicionar comentário se fornecido
    if (commentDto?.comment) {
      await this.prisma.ticketHistory.create({
        data: {
          ticketId: id,
          userId,
          action: 'CLOSED',
          comment: commentDto.comment,
        },
      });
    }

    return { message: 'Ticket fechado com sucesso' };
  }

  async getStats(companyId: string): Promise<TicketStatsData> {
    const [total, open, inProgress, waitingCustomer, resolved, closed] =
      await Promise.all([
        this.prisma.ticket.count({ where: { companyId } }),
        this.prisma.ticket.count({ where: { companyId, status: 'OPEN' } }),
        this.prisma.ticket.count({
          where: { companyId, status: 'IN_PROGRESS' },
        }),
        this.prisma.ticket.count({
          where: { companyId, status: 'WAITING_CUSTOMER' },
        }),
        this.prisma.ticket.count({ where: { companyId, status: 'RESOLVED' } }),
        this.prisma.ticket.count({ where: { companyId, status: 'CLOSED' } }),
      ]);

    return {
      total,
      open,
      inProgress,
      waitingCustomer,
      resolved,
      closed,
    };
  }

  async getMyTickets(companyId: string, userId: string): Promise<TicketData[]> {
    return await this.prisma.ticket.findMany({
      where: {
        companyId,
        assignedAgentId: userId,
        status: { not: 'CLOSED' },
      },
      include: {
        contact: {
          select: {
            id: true,
            name: true,
            phoneNumber: true,
          },
        },
        messagingSession: {
          select: {
            id: true,
            name: true,
          },
        },
        _count: {
          select: {
            messages: true,
          },
        },
      },
      orderBy: { createdAt: 'desc' },
    });
  }

  /**
   * 📤 Enviar mensagem para um ticket
   */
  async sendMessage(
    ticketId: string,
    companyId: string,
    userId: string,
    messageData: {
      content: string;
      messageType?: 'TEXT' | 'IMAGE' | 'AUDIO' | 'VIDEO' | 'DOCUMENT';
    },
  ): Promise<{
    id: string;
    content: string;
    direction: 'OUTBOUND';
    messageType: string;
    status: string;
    isFromBot: boolean;
    createdAt: string;
  }> {
    // Buscar ticket e verificar permissões
    const ticket = await this.findOne(ticketId, companyId);

    try {
      // 🔥 NOVO: Enviar mensagem via WhatsApp primeiro
      let whatsappSent = false;
      let whatsappError: string | null = null;

      try {
        // Verificar se há uma sessão conectada para a empresa
        const messagingSession = await this.prisma.messagingSession.findFirst({
          where: {
            id: ticket.messagingSessionId,
            companyId,
            status: 'CONNECTED',
          },
        });

        if (!messagingSession) {
          throw new Error(
            'Sessão do WhatsApp não está conectada. Verifique a conexão.',
          );
        }

        // Enviar mensagem via SessionService
        const phoneNumber = String(ticket.contact.phoneNumber);
        await this.sessionService.sendMessage(
          messagingSession.id,
          phoneNumber,
          messageData.content,
          companyId,
        );

        whatsappSent = true;
        console.log(`✅ Mensagem enviada via WhatsApp para ${phoneNumber}`);
      } catch (whatsappSendError) {
        whatsappError = whatsappSendError.message;
        console.error(
          `❌ Erro ao enviar mensagem via WhatsApp: ${whatsappError}`,
        );
        // Continuar para salvar no banco mesmo se o WhatsApp falhar
      }

      // Salvar mensagem no banco de dados
      const message = await this.prisma.message.create({
        data: {
          companyId,
          contactId: ticket.contactId,
          messagingSessionId: ticket.messagingSessionId,
          ticketId: ticketId,
          content: messageData.content,
          type: messageData.messageType || 'TEXT',
          direction: 'OUTGOING',
          isFromBot: false,
        },
      });

      // Atualizar status do ticket para IN_PROGRESS se estava OPEN
      if (ticket.status === 'OPEN') {
        await this.update(ticketId, companyId, userId, {
          status: 'IN_PROGRESS',
        }); // 🔥 NOVO: Finalizar fluxos ativos quando ticket é transferido para humano
        this.logger.log(
          `🤖➡️👨 Finalizando fluxos ativos - Ticket ${ticketId} transferido para atendimento humano`,
        );

        try {
          // Finalizar apenas os fluxos ativos, sem fechar o ticket
          await this.finalizeActiveFlowsForTicket(ticketId, companyId);
        } catch (flowError) {
          this.logger.warn(
            `Aviso: Erro ao finalizar fluxos para ticket ${ticketId}: ${flowError.message}`,
          );
          // Não falhar o envio da mensagem por causa disso
        }
      }

      // Retornar com status apropriado
      return {
        id: message.id,
        content: message.content,
        direction: 'OUTBOUND' as const,
        messageType: message.type,
        status: whatsappSent ? 'SENT' : 'FAILED',
        isFromBot: false,
        createdAt: message.createdAt.toISOString(),
        ...(whatsappError && { error: whatsappError }),
      };
    } catch (error) {
      throw new BadRequestException(
        `Erro ao enviar mensagem: ${error.message}`,
      );
    }
  }

  /**
   * 🔄 Reabrir ticket
   */
  async reopen(
    ticketId: string,
    companyId: string,
    userId: string,
    commentDto?: TicketCommentDto,
  ): Promise<MessageResponse> {
    const updateData = { status: 'OPEN' as const };

    await this.update(ticketId, companyId, userId, updateData);

    // Adicionar comentário se fornecido
    if (commentDto?.comment) {
      await this.prisma.ticketHistory.create({
        data: {
          ticketId: ticketId,
          userId,
          action: 'REOPENED',
          comment: commentDto.comment,
        },
      });
    }

    return { message: 'Ticket reaberto com sucesso' };
  }

  /**
   * 🏃‍♂️ Finalizar fluxos ativos para um ticket quando transferido para humano
   * NOVO: Método específico para finalizar apenas os fluxos, sem fechar o ticket
   */
  private async finalizeActiveFlowsForTicket(
    ticketId: string,
    companyId: string,
  ): Promise<void> {
    try {
      const ticket = await this.prisma.ticket.findUnique({
        where: { id: ticketId },
      });

      if (!ticket) {
        this.logger.warn(
          `Ticket ${ticketId} não encontrado para finalizar fluxos`,
        );
        return;
      }

      // Finalizar estados de fluxo ativos para o contato
      const updatedFlows = await this.prisma.contactFlowState.updateMany({
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

      this.logger.log(
        `✅ ${updatedFlows.count} fluxo(s) finalizado(s) para ticket ${ticketId} (transferência para humano)`,
      );
    } catch (error) {
      this.logger.error(
        `Erro ao finalizar fluxos do ticket ${ticketId}:`,
        error,
      );
      throw error;
    }
  }
}
