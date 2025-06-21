/* eslint-disable prettier/prettier */
import {
  BadRequestException,
  ForbiddenException,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import {
  MessageResponse,
  TicketData,
  TicketStatsData,
} from '../common/interfaces/data.interface';
import { PrismaService } from '../prisma/prisma.service';
import {
  AssignTicketDto,
  CreateTicketDto,
  TicketCommentDto,
  UpdateTicketDto,
} from './dto/ticket.dto';

@Injectable()
export class TicketService {
  constructor(private readonly prisma: PrismaService) {}

  async create(
    companyId: string,
    createTicketDto: CreateTicketDto,
  ): Promise<TicketData> {
    // Verificar se a sessão do WhatsApp pertence à empresa
    const session = await this.prisma.whatsappSession.findFirst({
      where: {
        id: createTicketDto.whatsappSessionId,
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
        whatsappSessionId: createTicketDto.whatsappSessionId,
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
        whatsappSession: {
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
        whatsappSession: {
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
        whatsappSession: {
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
          whatsappSession: {
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
        whatsappSession: {
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
}
