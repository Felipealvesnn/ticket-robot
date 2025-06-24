import {
  BadRequestException,
  ConflictException,
  ForbiddenException,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { CreateContactDto, UpdateContactDto } from './dto/contact.dto';

@Injectable()
export class ContactService {
  constructor(private readonly prisma: PrismaService) {}

  async create(companyId: string, createContactDto: CreateContactDto) {
    // Verificar se a sessão do WhatsApp pertence à empresa
    const session = await this.prisma.messagingSession.findFirst({
      where: {
        id: createContactDto.messagingSessionId,
        companyId,
      },
    });

    if (!session) {
      throw new BadRequestException(
        'Sessão do WhatsApp não encontrada ou não pertence à empresa',
      );
    }

    // Verificar se já existe um contato com esse número na empresa
    const existingContact = await this.prisma.contact.findFirst({
      where: {
        companyId,
        phoneNumber: createContactDto.phoneNumber,
      },
    });

    if (existingContact) {
      throw new ConflictException(
        'Contato com este número já existe nesta empresa',
      );
    }

    return await this.prisma.contact.create({
      data: {
        companyId,
        messagingSessionId: createContactDto.messagingSessionId,
        phoneNumber: createContactDto.phoneNumber,
        name: createContactDto.name,
        avatar: createContactDto.avatar,
        tags: createContactDto.tags,
        customFields: createContactDto.customFields,
      },
      include: {
        messagingSession: {
          select: {
            id: true,
            name: true,
          },
        },
        _count: {
          select: {
            messages: true,
            tickets: true,
          },
        },
      },
    });
  }

  async findAll(
    companyId: string,
    whatsappSessionId?: string,
    isBlocked?: boolean,
  ) {
    const where: {
      companyId: string;
      whatsappSessionId?: string;
      isBlocked?: boolean;
    } = { companyId };

    if (whatsappSessionId) {
      where.whatsappSessionId = whatsappSessionId;
    }

    if (isBlocked !== undefined) {
      where.isBlocked = isBlocked;
    }

    return await this.prisma.contact.findMany({
      where,
      include: {
        messagingSession: {
          select: {
            id: true,
            name: true,
          },
        },
        _count: {
          select: {
            messages: true,
            tickets: true,
          },
        },
      },
      orderBy: { lastMessageAt: 'desc' },
    });
  }

  async findOne(id: string, companyId: string) {
    const contact = await this.prisma.contact.findUnique({
      where: { id },
      include: {
        messagingSession: {
          select: {
            id: true,
            name: true,
          },
        },
        messages: {
          take: 50, // Últimas 50 mensagens
          orderBy: { createdAt: 'desc' },
          select: {
            id: true,
            content: true,
            type: true,
            direction: true,
            isFromBot: true,
            createdAt: true,
          },
        },
        tickets: {
          where: { status: { not: 'CLOSED' } },
          include: {
            assignedAgent: {
              select: {
                id: true,
                name: true,
                email: true,
              },
            },
          },
          orderBy: { createdAt: 'desc' },
        },
        _count: {
          select: {
            messages: true,
            tickets: true,
          },
        },
      },
    });

    if (!contact) {
      throw new NotFoundException('Contato não encontrado');
    }

    if (contact.companyId !== companyId) {
      throw new ForbiddenException('Acesso negado a este contato');
    }

    return contact;
  }

  async update(
    id: string,
    companyId: string,
    updateContactDto: UpdateContactDto,
  ) {
    const contact = await this.findOne(id, companyId); // Valida se existe e pertence à empresa

    return await this.prisma.contact.update({
      where: { id },
      data: updateContactDto,
      include: {
        messagingSession: {
          select: {
            id: true,
            name: true,
          },
        },
        _count: {
          select: {
            messages: true,
            tickets: true,
          },
        },
      },
    });
  }

  async block(id: string, companyId: string) {
    return await this.update(id, companyId, { isBlocked: true });
  }

  async unblock(id: string, companyId: string) {
    return await this.update(id, companyId, { isBlocked: false });
  }

  async getByPhoneNumber(companyId: string, phoneNumber: string) {
    return await this.prisma.contact.findFirst({
      where: {
        companyId,
        phoneNumber,
      },
      include: {
        messagingSession: {
          select: {
            id: true,
            name: true,
          },
        },
        _count: {
          select: {
            messages: true,
            tickets: true,
          },
        },
      },
    });
  }

  async getRecentContacts(companyId: string, limit: number = 20) {
    return await this.prisma.contact.findMany({
      where: {
        companyId,
        lastMessageAt: { not: null },
      },
      take: limit,
      include: {
        messagingSession: {
          select: {
            id: true,
            name: true,
          },
        },
        _count: {
          select: {
            messages: true,
            tickets: true,
          },
        },
      },
      orderBy: { lastMessageAt: 'desc' },
    });
  }

  async searchContacts(companyId: string, query: string) {
    return await this.prisma.contact.findMany({
      where: {
        companyId,
        OR: [
          { name: { contains: query } },
          { phoneNumber: { contains: query } },
        ],
      },
      include: {
        messagingSession: {
          select: {
            id: true,
            name: true,
          },
        },
        _count: {
          select: {
            messages: true,
            tickets: true,
          },
        },
      },
      take: 50,
      orderBy: { lastMessageAt: 'desc' },
    });
  }
}
