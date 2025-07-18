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
        'Sessão não encontrada ou não pertence à empresa',
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

    const ticket = await this.prisma.ticket.create({
      data: {
        companyId,
        messagingSessionId: createTicketDto.messagingSessionId,
        contactId: createTicketDto.contactId,
        title: createTicketDto.title,
        description: createTicketDto.description,
        priority: createTicketDto.priority || 'MEDIUM',
        category: createTicketDto.category,
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
    agentUserId?: string,
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

    if (agentUserId) {
      where.agents = {
        some: {
          userId: agentUserId,
          isActive: true,
        },
      };
    }

    if (search) {
      where.OR = [
        { title: { contains: search } },
        { description: { contains: search } },
        { contact: { name: { contains: search } } },
        { contact: { phoneNumber: { contains: search } } },
      ];
    }

    const skip = (page - 1) * limit;

    const [tickets, total] = await Promise.all([
      this.prisma.ticket.findMany({
        where,
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
      throw new ForbiddenException(
        'Você não tem permissão para acessar este ticket',
      );
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
        ticketId: ticket.id,
        userId,
        action: 'STATUS_CHANGED',
        fromValue: ticket.status,
        toValue: updateTicketDto.status,
      });
    }

    if (
      updateTicketDto.priority &&
      updateTicketDto.priority !== ticket.priority
    ) {
      historyEntries.push({
        ticketId: ticket.id,
        userId,
        action: 'PRIORITY_CHANGED',
        fromValue: ticket.priority,
        toValue: updateTicketDto.priority,
      });
    }

    // Atualizar ticket e histórico em transação
    const result = await this.prisma.$transaction(async (tx) => {
      const updatedTicket = await tx.ticket.update({
        where: { id },
        data: updateTicketDto,
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

      // Criar entradas de histórico
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
    // Verificar se o ticket existe e pertence à empresa
    await this.findOne(id, companyId); // Throws if not found or forbidden

    // Verificar se o agente pertence à empresa
    const companyUser = await this.prisma.companyUser.findFirst({
      where: {
        userId: assignTicketDto.agentId,
        companyId,
        isActive: true,
      },
    });

    if (!companyUser) {
      throw new BadRequestException(
        'Agente não encontrado ou não pertence à empresa',
      );
    }

    // Verificar se o agente já está atribuído ao ticket
    const existingAgent = await this.prisma.ticketAgent.findUnique({
      where: {
        ticketId_userId: {
          ticketId: id,
          userId: assignTicketDto.agentId,
        },
      },
    });

    if (existingAgent && existingAgent.isActive) {
      throw new BadRequestException('Agente já está atribuído a este ticket');
    }

    // Se já existe mas não está ativo, reativar
    if (existingAgent && !existingAgent.isActive) {
      await this.prisma.ticketAgent.update({
        where: { id: existingAgent.id },
        data: {
          isActive: true,
          leftAt: null,
        },
      });
    } else {
      // Criar nova atribuição
      await this.prisma.ticketAgent.create({
        data: {
          ticketId: id,
          userId: assignTicketDto.agentId,
          role: 'AGENT',
        },
      });
    }

    // Registrar no histórico
    await this.prisma.ticketHistory.create({
      data: {
        ticketId: id,
        userId,
        action: 'AGENT_ASSIGNED',
        toValue: assignTicketDto.agentId,
        comment: 'Agente atribuído ao ticket',
      },
    });

    return this.findOne(id, companyId);
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
          action: 'COMMENT',
          comment: commentDto.comment,
        },
      });
    }

    return { message: 'Ticket fechado com sucesso' };
  }

  async getStats(companyId: string): Promise<TicketStatsData> {
    const [
      totalTickets,
      openTickets,
      inProgressTickets,
      waitingCustomerTickets,
      resolvedTickets,
      closedTickets,
    ] = await Promise.all([
      this.prisma.ticket.count({ where: { companyId } }),
      this.prisma.ticket.count({
        where: { companyId, status: 'OPEN' },
      }),
      this.prisma.ticket.count({
        where: { companyId, status: 'IN_PROGRESS' },
      }),
      this.prisma.ticket.count({
        where: { companyId, status: 'WAITING_CUSTOMER' },
      }),
      this.prisma.ticket.count({
        where: { companyId, status: 'RESOLVED' },
      }),
      this.prisma.ticket.count({
        where: { companyId, status: 'CLOSED' },
      }),
    ]);

    return {
      total: totalTickets,
      open: openTickets,
      inProgress: inProgressTickets,
      waitingCustomer: waitingCustomerTickets,
      resolved: resolvedTickets,
      closed: closedTickets,
    };
  }

  async getMyTickets(companyId: string, userId: string): Promise<TicketData[]> {
    return await this.prisma.ticket.findMany({
      where: {
        companyId,
        agents: {
          some: {
            userId,
            isActive: true,
          },
        },
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
      orderBy: { updatedAt: 'desc' },
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
    await this.update(ticketId, companyId, userId, { status: 'OPEN' });

    if (commentDto?.comment) {
      await this.prisma.ticketHistory.create({
        data: {
          ticketId,
          userId,
          action: 'COMMENT',
          comment: commentDto.comment,
        },
      });
    }

    return { message: 'Ticket reaberto com sucesso' };
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
      // 1. Buscar ticket e validar permissões
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

      // 2. Se ticket está OPEN, mudar para IN_PROGRESS automaticamente
      if (ticket.status === 'OPEN') {
        await this.prisma.ticket.update({
          where: { id: ticketId },
          data: {
            status: 'IN_PROGRESS',
          },
        });

        // Finalizar fluxos ativos do contato seria feito aqui se o método fosse público
        // await this.conversationService.finalizeActiveFlows(...)
      }

      // 3. Verificar se o usuário já é agente do ticket
      const existingAgent = await this.prisma.ticketAgent.findUnique({
        where: {
          ticketId_userId: {
            ticketId,
            userId,
          },
        },
      });

      // 4. Se não é agente, adicionar como agente
      if (!existingAgent) {
        await this.prisma.ticketAgent.create({
          data: {
            ticketId,
            userId,
            role: 'AGENT',
          },
        });
      } else if (!existingAgent.isActive) {
        // Se era agente mas saiu, reativar
        await this.prisma.ticketAgent.update({
          where: { id: existingAgent.id },
          data: {
            isActive: true,
            leftAt: null,
          },
        });
      }

      // 5. Enviar mensagem via SessionService
      const mediaData = messageData.fileData
        ? {
            fileData: messageData.fileData,
            fileName: messageData.fileName || 'file',
            mimeType: messageData.mimeType || 'application/octet-stream',
          }
        : undefined;

      const sentMessage = await this.sessionService.sendMessageOnly(
        ticket.messagingSessionId,
        ticket.contact.phoneNumber,
        messageData.content,
        mediaData,
      );

      // 6. Salvar a mensagem no banco com contexto do ticket
      const savedMessage = await this.prisma.message.create({
        data: {
          companyId,
          messagingSessionId: ticket.messagingSessionId,
          contactId: ticket.contactId,
          ticketId: ticketId,
          content: messageData.content,
          type: messageData.messageType || 'text',
          direction: 'outgoing',
          isFromBot: false,
          metadata: JSON.stringify({
            sentByUserId: userId,
            messageId: sentMessage?.id || null,
          }),
        },
      });

      // 7. Atualizar timestamp da última mensagem no ticket
      await this.prisma.ticket.update({
        where: { id: ticketId },
        data: {
          lastMessageAt: new Date(),
          updatedAt: new Date(),
        },
      });

      return {
        id: sentMessage.id._serialized,
        success: true,
        message: savedMessage,
        ticketStatus: 'IN_PROGRESS',
      };
    } catch (error) {
      this.logger.error(
        `Erro ao enviar mensagem via ticket ${ticketId}:`,
        error,
      );
      throw error;
    }
  }
}
