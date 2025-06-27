import { Injectable, NotFoundException } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { CreateIgnoredContactDto } from './dto/create-ignored-contact.dto';
import { UpdateIgnoredContactDto } from './dto/update-ignored-contact.dto';

@Injectable()
export class IgnoredContactsService {
  constructor(private readonly prisma: PrismaService) {}

  // Criar contato ignorado
  async create(
    companyId: string,
    userId: string,
    createIgnoredContactDto: CreateIgnoredContactDto,
  ) {
    return await this.prisma.ignoredContact.create({
      data: {
        companyId,
        createdBy: userId,
        type: 'MANUAL',
        ignoreBotOnly: true,
        ...createIgnoredContactDto,
      },
    });
  }

  // Listar contatos ignorados da empresa
  async findAllByCompany(companyId: string) {
    const result = await this.prisma.ignoredContact.findMany({
      where: {
        companyId,
        isActive: true,
      },
      include: {
        messagingSession: {
          select: {
            id: true,
            name: true,
            platform: true,
          },
        },
      },
      orderBy: {
        createdAt: 'desc',
      },
    });

    return result;
  }

  // Buscar por ID
  async findOne(id: string, companyId: string) {
    const ignoredContact = await this.prisma.ignoredContact.findFirst({
      where: {
        id,
        companyId,
      },
      include: {
        messagingSession: {
          select: {
            id: true,
            name: true,
            platform: true,
          },
        },
      },
    });

    if (!ignoredContact) {
      throw new NotFoundException('Contato ignorado não encontrado');
    }

    return ignoredContact;
  }

  // Atualizar contato ignorado
  async update(
    id: string,
    companyId: string,
    updateIgnoredContactDto: UpdateIgnoredContactDto,
  ) {
    const ignoredContact = await this.findOne(id, companyId);

    return await this.prisma.ignoredContact.update({
      where: { id: ignoredContact.id },
      data: updateIgnoredContactDto,
    });
  }

  // Remover contato ignorado (soft delete)
  async remove(id: string, companyId: string) {
    const ignoredContact = await this.findOne(id, companyId);

    return await this.prisma.ignoredContact.update({
      where: { id: ignoredContact.id },
      data: { isActive: false },
    });
  }

  // Verificar se um número deve ser ignorado
  async shouldIgnoreContact(
    companyId: string,
    phoneNumber: string,
    messagingSessionId?: string,
    botMessage = true,
  ): Promise<{
    shouldIgnore: boolean;
    reason?: string;
    ignoredContact?: any;
  }> {
    // Primeiro verifica ignore específico da sessão
    if (messagingSessionId) {
      const sessionIgnored = await this.prisma.ignoredContact.findFirst({
        where: {
          companyId,
          phoneNumber,
          messagingSessionId,
          isActive: true,
        },
      });

      if (sessionIgnored) {
        const shouldIgnore = botMessage ? true : !sessionIgnored.ignoreBotOnly;
        return {
          shouldIgnore,
          reason: sessionIgnored.reason || 'Ignorado para esta sessão',
          ignoredContact: sessionIgnored,
        };
      }
    }

    // Depois verifica ignore global da empresa
    const globalIgnored = await this.prisma.ignoredContact.findFirst({
      where: {
        companyId,
        phoneNumber,
        messagingSessionId: null, // Global
        isActive: true,
      },
    });

    if (globalIgnored) {
      const shouldIgnore = botMessage ? true : !globalIgnored.ignoreBotOnly;
      return {
        shouldIgnore,
        reason: globalIgnored.reason || 'Ignorado globalmente',
        ignoredContact: globalIgnored,
      };
    }

    return { shouldIgnore: false };
  }

  // Listar por sessão específica
  async findBySession(companyId: string, messagingSessionId: string) {
    return await this.prisma.ignoredContact.findMany({
      where: {
        companyId,
        messagingSessionId,
        isActive: true,
      },
      orderBy: {
        createdAt: 'desc',
      },
    });
  }

  // Listar ignorados globais
  async findGlobal(companyId: string) {
    return await this.prisma.ignoredContact.findMany({
      where: {
        companyId,
        messagingSessionId: null,
        isActive: true,
      },
      orderBy: {
        createdAt: 'desc',
      },
    });
  }

  // Estatísticas
  async getStats(companyId: string) {
    const total = await this.prisma.ignoredContact.count({
      where: { companyId, isActive: true },
    });

    const global = await this.prisma.ignoredContact.count({
      where: { companyId, messagingSessionId: null, isActive: true },
    });

    const bySession = await this.prisma.ignoredContact.count({
      where: { companyId, messagingSessionId: { not: null }, isActive: true },
    });

    const byReason = await this.prisma.ignoredContact.groupBy({
      by: ['reason'],
      where: { companyId, isActive: true },
      _count: true,
    });

    return {
      total,
      global,
      bySession,
      byReason: byReason.reduce(
        (acc, curr) => {
          acc[curr.reason || 'OTHER'] = curr._count;
          return acc;
        },
        {} as Record<string, number>,
      ),
    };
  }
}
