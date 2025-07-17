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
    page: number = 1,
    limit: number = 10,
    search?: string,
  ): Promise<{
    tickets: TicketData[];
    pagination: {
      page: number;
      limit: number;
      total: number;
      totalPages: number;
    };
  }> {
    const where: any = { companyId };

    if (status) {
      where.status = status;
    }

    if (assignedAgentId) {
      where.assignedAgentId = assignedAgentId;
    }

    if (search) {
      // Busca simples que funciona com SQL Server
      where.OR = [
        {
          contact: {
            OR: [
              {
                name: {
                  contains: search,
                },
              },
              {
                phoneNumber: {
                  contains: search,
                },
              },
            ],
          },
        },
      ];
    }

    const skip = (page - 1) * limit;

    const [tickets, total] = await Promise.all([
      this.prisma.ticket.findMany({
        where,
        include: {
          contact: true, // Traz todos os campos do contato
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
        orderBy: [{ lastMessageAt: 'desc' }, { createdAt: 'desc' }],
        skip,
        take: limit,
      }),
      this.prisma.ticket.count({ where }),
    ]);

    const totalPages = Math.ceil(total / limit);

    return {
      tickets,
      pagination: {
        page,
        limit,
        total,
        totalPages,
      },
    };
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
        contact: true, // Traz todos os campos do contato
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

  /**
   *  Reabrir ticket
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

  /**
   * 📤 Enviar mensagem via ticket e associar agente automaticamente
   */
  async sendMessage(
    ticketId: string,
    companyId: string,
    userId: string,
    messageData: {
      content: string;
      messageType?: string;
      fileData?: string;
      fileName?: string;
      mimeType?: string;
    },
  ): Promise<any> {
    try {
      // 1. Verificar se o ticket existe e pertence à empresa
      const ticket = await this.prisma.ticket.findFirst({
        where: {
          id: ticketId,
          companyId,
        },
        include: {
          contact: true,
          messagingSession: true,
        },
      });

      if (!ticket) {
        throw new NotFoundException('Ticket não encontrado');
      }

      // 2. Mudar status do ticket para IN_PROGRESS se necessário
      if (ticket.status === 'OPEN') {
        await this.prisma.ticket.update({
          where: { id: ticketId },
          data: {
            status: 'IN_PROGRESS',
            assignedAgentId: userId, // Atribuir agente ao ticket
            firstResponseAt: ticket.firstResponseAt || new Date(),
            updatedAt: new Date(),
          },
        });

        // Registrar no histórico
        await this.prisma.ticketHistory.create({
          data: {
            ticketId,
            userId,
            action: 'STATUS_CHANGED',
            fromValue: 'OPEN',
            toValue: 'IN_PROGRESS',
            comment: 'Ticket assumido por agente',
          },
        });

        this.logger.log(
          `🔄 Ticket ${ticketId} mudou para IN_PROGRESS e atribuído ao agente ${userId}`,
        );
      }

      // 3. Se o ticket já está em progresso, mas não tem agente atribuído, atribuir
      if (ticket.status === 'IN_PROGRESS' && !ticket.assignedAgentId) {
        await this.prisma.ticket.update({
          where: { id: ticketId },
          data: {
            assignedAgentId: userId,
            updatedAt: new Date(),
          },
        });

        // Registrar no histórico
        await this.prisma.ticketHistory.create({
          data: {
            ticketId,
            userId,
            action: 'ASSIGNED',
            toValue: userId,
            comment: 'Agente atribuído ao ticket',
          },
        });

        this.logger.log(`👤 Agente ${userId} atribuído ao ticket ${ticketId}`);
      }

      // 4. Criar a mensagem no banco
      const message = await this.prisma.message.create({
        data: {
          companyId,
          messagingSessionId: ticket.messagingSessionId,
          contactId: ticket.contactId,
          ticketId,
          content: messageData.content,
          type: (messageData.messageType as any) || 'TEXT',
          direction: 'OUTGOING',
          isFromBot: false,
          isMe: false,
          mediaUrl: messageData.fileData
            ? `data:${messageData.mimeType};base64,${messageData.fileData}`
            : undefined,
        },
      });

      // 5. Atualizar atividade do ticket
      await this.prisma.ticket.update({
        where: { id: ticketId },
        data: {
          lastMessageAt: new Date(),
          updatedAt: new Date(),
        },
      });

      this.logger.log(
        `📤 Mensagem enviada por agente ${userId} no ticket ${ticketId}`,
      );

      return {
        message: 'Mensagem enviada com sucesso',
        data: {
          messageId: message.id,
          ticketId,
          message: message,
        },
      };
    } catch (error) {
      this.logger.error(
        `Erro ao enviar mensagem no ticket ${ticketId}:`,
        error,
      );
      throw error;
    }
  }
}
