import {
  BadRequestException,
  ForbiddenException,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { AuthService } from '../auth/auth.service';
import { UsersService } from '../users/users.service';
import { CompanyService } from '../company/company.service';
import { CleanupTokensTask } from '../auth/tasks/cleanup-tokens.task';
import {
  CreateCompanyWithUserDto,
  UpdateCompanyDto,
} from '../company/dto/company.dto';
import { CurrentUserPayload } from '../auth/interfaces/auth.interface';

// Definições temporárias dos DTOs até resolver o import
interface CreateUserDto {
  email: string;
  name: string;
  roleId: string;
  password?: string;
}

interface UpdateUserDto {
  name?: string;
  isActive?: boolean;
  roleId?: string;
  password?: string;
}

export interface CurrentUserPayloadExtended extends CurrentUserPayload {
  role?: {
    id: string;
    name: string;
    permissions: string[];
  };
}

@Injectable()
export class AdminService {
  constructor(
    private readonly prisma: PrismaService,
    private readonly authService: AuthService,
    private readonly usersService: UsersService,
    private readonly companyService: CompanyService,
    private readonly cleanupTokensTask: CleanupTokensTask,
  ) {}

  // ================================
  // GESTÃO DE EMPRESAS (SUPER_ADMIN)
  // ================================

  async getAllCompanies({
    page = 1,
    limit = 10,
    search,
    plan,
  }: {
    page: number;
    limit: number;
    search?: string;
    plan?: string;
  }) {
    const skip = (page - 1) * limit;

    // Construir filtros
    const where: any = {};
    if (search) {
      where.OR = [
        { name: { contains: search, mode: 'insensitive' } },
        { slug: { contains: search, mode: 'insensitive' } },
      ];
    }
    if (plan) {
      where.plan = plan;
    }

    // Buscar empresas com contagem
    const [companies, total] = await Promise.all([
      this.prisma.company.findMany({
        where,
        skip,
        take: limit,
        include: {
          _count: {
            select: {
              companyUsers: true,
              tickets: true,
              messagingSessions: true,
            },
          },
        },
        orderBy: { createdAt: 'desc' },
      }),
      this.prisma.company.count({ where }),
    ]);

    return {
      companies: companies.map((company) => ({
        ...company,
        _count: {
          users: company._count.companyUsers,
          tickets: company._count.tickets,
          sessions: company._count.messagingSessions,
        },
      })),
      pagination: {
        total,
        page,
        limit,
        totalPages: Math.ceil(total / limit),
      },
    };
  }

  async createCompanyWithOwner(createCompanyDto: CreateCompanyWithUserDto) {
    // Verificar se slug já existe
    const existingCompany = await this.prisma.company.findUnique({
      where: { slug: createCompanyDto.companySlug },
    });

    if (existingCompany) {
      throw new BadRequestException('Slug da empresa já está em uso');
    }

    // Verificar se email já existe
    const existingUser = await this.prisma.user.findUnique({
      where: { email: createCompanyDto.userEmail },
    });

    if (existingUser) {
      throw new BadRequestException('Email já está em uso');
    }

    // Criar empresa e usuário em transação
    return await this.prisma.$transaction(async (prisma) => {
      // Criar empresa
      const company = await prisma.company.create({
        data: {
          name: createCompanyDto.companyName,
          slug: createCompanyDto.companySlug,
          plan: createCompanyDto.companyPlan || 'FREE',
          isActive: true,
        },
      });

      // Buscar role de COMPANY_OWNER
      const ownerRole = await prisma.role.findUnique({
        where: { name: 'COMPANY_OWNER' },
      });

      if (!ownerRole) {
        throw new BadRequestException('Role COMPANY_OWNER não encontrado');
      }

      // Criar usuário
      const hashedPassword = await this.authService.hashPassword(
        createCompanyDto.userPassword,
      );

      const user = await prisma.user.create({
        data: {
          email: createCompanyDto.userEmail,
          password: hashedPassword,
          name: createCompanyDto.userName,
          isActive: true,
          isFirstLogin: true,
        },
      });

      // Criar relacionamento usuário-empresa
      await prisma.companyUser.create({
        data: {
          userId: user.id,
          companyId: company.id,
          roleId: ownerRole.id,
        },
      });

      return {
        company: {
          id: company.id,
          name: company.name,
          slug: company.slug,
          plan: company.plan,
        },
        user: {
          id: user.id,
          email: user.email,
          name: user.name,
        },
        message: 'Empresa criada com sucesso',
      };
    });
  }

  async getCompanyDetails(companyId: string) {
    const company = await this.prisma.company.findUnique({
      where: { id: companyId },
      include: {
        companyUsers: {
          include: {
            user: {
              select: {
                id: true,
                email: true,
                name: true,
                isActive: true,
                createdAt: true,
              },
            },
            role: {
              select: {
                id: true,
                name: true,
              },
            },
          },
        },
        _count: {
          select: {
            tickets: true,
            messagingSessions: true,
          },
        },
      },
    });

    if (!company) {
      throw new NotFoundException('Empresa não encontrada');
    }

    // Formatar usuários
    const users = company.companyUsers.map((companyUser) => ({
      id: companyUser.user.id,
      email: companyUser.user.email,
      name: companyUser.user.name,
      isActive: companyUser.user.isActive,
      role: companyUser.role,
      createdAt: companyUser.user.createdAt,
    }));

    // Estatísticas
    const stats = {
      totalTickets: company._count.tickets,
      activeSessions: company._count.messagingSessions,
      totalUsers: company.companyUsers.length,
    };

    return {
      id: company.id,
      name: company.name,
      slug: company.slug,
      plan: company.plan,
      isActive: company.isActive,
      users,
      stats,
      createdAt: company.createdAt,
    };
  }

  async updateCompany(companyId: string, updateCompanyDto: UpdateCompanyDto) {
    const company = await this.prisma.company.findUnique({
      where: { id: companyId },
    });

    if (!company) {
      throw new NotFoundException('Empresa não encontrada');
    }

    return await this.prisma.company.update({
      where: { id: companyId },
      data: updateCompanyDto,
    });
  }

  async toggleCompanyStatus(companyId: string) {
    const company = await this.prisma.company.findUnique({
      where: { id: companyId },
    });

    if (!company) {
      throw new NotFoundException('Empresa não encontrada');
    }

    const updatedCompany = await this.prisma.company.update({
      where: { id: companyId },
      data: { isActive: !company.isActive },
      select: {
        id: true,
        name: true,
        isActive: true,
      },
    });

    return {
      company: updatedCompany,
      message: `Empresa ${updatedCompany.isActive ? 'ativada' : 'desativada'} com sucesso`,
    };
  }

  // ================================
  // GESTÃO DE USUÁRIOS
  // ================================

  validateCompanyAccess(
    user: CurrentUserPayloadExtended,
    companyId: string,
  ): void {
    // SUPER_ADMIN tem acesso a todas as empresas
    if (user.roleName === 'SUPER_ADMIN') {
      return;
    }

    // Verificar se o usuário pertence à empresa
    if (user.companyId !== companyId) {
      throw new ForbiddenException('Acesso negado a esta empresa');
    }

    // Verificar se tem role apropriado
    const allowedRoles = ['COMPANY_OWNER', 'COMPANY_ADMIN'];
    if (!user.roleName || !allowedRoles.includes(user.roleName)) {
      throw new ForbiddenException('Acesso negado - role insuficiente');
    }
  }

  async getCompanyUsers(companyId: string) {
    const company = await this.prisma.company.findUnique({
      where: { id: companyId },
    });

    if (!company) {
      throw new NotFoundException('Empresa não encontrada');
    }

    const users = await this.prisma.companyUser.findMany({
      where: { companyId },
      include: {
        user: {
          select: {
            id: true,
            email: true,
            name: true,
            isActive: true,
            isFirstLogin: true,
            createdAt: true,
          },
        },
        role: {
          select: {
            id: true,
            name: true,
          },
        },
      },
    });

    return users.map((companyUser) => ({
      id: companyUser.user.id,
      email: companyUser.user.email,
      name: companyUser.user.name,
      isActive: companyUser.user.isActive,
      isFirstLogin: companyUser.user.isFirstLogin,
      role: companyUser.role,
      createdAt: companyUser.user.createdAt,
    }));
  }

  async createCompanyUser(companyId: string, createUserDto: CreateUserDto) {
    // Verificar se empresa existe
    const company = await this.prisma.company.findUnique({
      where: { id: companyId },
    });

    if (!company) {
      throw new NotFoundException('Empresa não encontrada');
    }

    // Verificar se email já existe
    const existingUser = await this.prisma.user.findUnique({
      where: { email: createUserDto.email },
    });

    if (existingUser) {
      throw new BadRequestException('Email já está em uso');
    }

    // Verificar se role existe
    const role = await this.prisma.role.findUnique({
      where: { id: createUserDto.roleId },
    });

    if (!role) {
      throw new BadRequestException('Role não encontrado');
    }

    // Gerar senha temporária
    const tempPassword = Math.random().toString(36).slice(-8);
    const hashedPassword = await this.authService.hashPassword(tempPassword);

    return await this.prisma.$transaction(async (prisma) => {
      // Criar usuário
      const user = await prisma.user.create({
        data: {
          email: createUserDto.email,
          password: hashedPassword,
          name: createUserDto.name,
          isActive: true,
          isFirstLogin: true,
        },
      });

      // Criar relacionamento usuário-empresa
      await prisma.companyUser.create({
        data: {
          userId: user.id,
          companyId,
          roleId: createUserDto.roleId,
        },
      });

      return {
        user: {
          id: user.id,
          email: user.email,
          name: user.name,
          isFirstLogin: user.isFirstLogin,
        },
        tempPassword,
        message: 'Usuário criado com sucesso',
      };
    });
  }

  async updateCompanyUser(
    companyId: string,
    userId: string,
    updateUserDto: UpdateUserDto,
  ) {
    // Verificar se o usuário pertence à empresa
    const companyUser = await this.prisma.companyUser.findFirst({
      where: {
        userId,
        companyId,
      },
      include: {
        user: true,
      },
    });

    if (!companyUser) {
      throw new NotFoundException('Usuário não encontrado nesta empresa');
    }

    // Atualizar usuário
    const updatedUser = await this.prisma.user.update({
      where: { id: userId },
      data: {
        name: updateUserDto.name,
        isActive: updateUserDto.isActive,
      },
    });

    // Atualizar role se fornecido
    if (updateUserDto.roleId) {
      const role = await this.prisma.role.findUnique({
        where: { id: updateUserDto.roleId },
      });

      if (!role) {
        throw new BadRequestException('Role não encontrado');
      }

      await this.prisma.companyUser.update({
        where: {
          userId_companyId: {
            userId,
            companyId,
          },
        },
        data: { roleId: updateUserDto.roleId },
      });
    }

    return {
      user: updatedUser,
      message: 'Usuário atualizado com sucesso',
    };
  }

  async removeCompanyUser(companyId: string, userId: string) {
    // Verificar se o usuário pertence à empresa
    const companyUser = await this.prisma.companyUser.findFirst({
      where: {
        userId,
        companyId,
      },
    });

    if (!companyUser) {
      throw new NotFoundException('Usuário não encontrado nesta empresa');
    }

    // Verificar se não é o último COMPANY_OWNER
    const ownerRole = await this.prisma.role.findUnique({
      where: { name: 'COMPANY_OWNER' },
    });

    if (ownerRole && companyUser.roleId === ownerRole.id) {
      const ownersCount = await this.prisma.companyUser.count({
        where: {
          companyId,
          roleId: ownerRole.id,
        },
      });

      if (ownersCount <= 1) {
        throw new BadRequestException(
          'Não é possível remover o último proprietário da empresa',
        );
      }
    }

    // Remover usuário da empresa
    await this.prisma.companyUser.delete({
      where: {
        userId_companyId: {
          userId,
          companyId,
        },
      },
    });

    return {
      message: 'Usuário removido da empresa com sucesso',
    };
  }

  // ================================
  // ESTATÍSTICAS E DASHBOARDS
  // ================================

  async getSystemDashboard() {
    const [
      companiesTotal,
      companiesActive,
      companiesByPlan,
      usersTotal,
      usersActive,
      ticketsTotal,
      sessionsTotal,
    ] = await Promise.all([
      this.prisma.company.count(),
      this.prisma.company.count({ where: { isActive: true } }),
      this.prisma.company.groupBy({
        by: ['plan'],
        _count: { plan: true },
      }),
      this.prisma.user.count(),
      this.prisma.user.count({ where: { isActive: true } }),
      this.prisma.ticket.count(),
      this.prisma.messagingSession.count(),
    ]);

    // Contar usuários criados este mês
    const thisMonthStart = new Date();
    thisMonthStart.setDate(1);
    thisMonthStart.setHours(0, 0, 0, 0);

    const usersThisMonth = await this.prisma.user.count({
      where: {
        createdAt: { gte: thisMonthStart },
      },
    });

    // Contar tickets de hoje
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    const tomorrow = new Date(today);
    tomorrow.setDate(tomorrow.getDate() + 1);

    const [ticketsOpenToday, ticketsResolvedToday] = await Promise.all([
      this.prisma.ticket.count({
        where: {
          createdAt: { gte: today, lt: tomorrow },
          status: { in: ['OPEN', 'IN_PROGRESS', 'WAITING_CUSTOMER'] },
        },
      }),
      this.prisma.ticket.count({
        where: {
          updatedAt: { gte: today, lt: tomorrow },
          status: 'CLOSED',
        },
      }),
    ]);

    // Formatar planos
    const planCounts = companiesByPlan.reduce(
      (acc, item) => {
        acc[item.plan] = item._count.plan;
        return acc;
      },
      { FREE: 0, BASIC: 0, PRO: 0, ENTERPRISE: 0 },
    );

    return {
      companies: {
        total: companiesTotal,
        active: companiesActive,
        byPlan: planCounts,
      },
      users: {
        total: usersTotal,
        active: usersActive,
        newThisMonth: usersThisMonth,
      },
      tickets: {
        total: ticketsTotal,
        openToday: ticketsOpenToday,
        resolvedToday: ticketsResolvedToday,
      },
      sessions: {
        total: sessionsTotal,
        connected: 0, // Será atualizado quando tivermos o status correto
        disconnected: sessionsTotal,
      },
    };
  }

  async getCompanyStats(companyId: string) {
    const company = await this.prisma.company.findUnique({
      where: { id: companyId },
    });

    if (!company) {
      throw new NotFoundException('Empresa não encontrada');
    }

    // Estatísticas da empresa
    const [
      totalUsers,
      totalTickets,
      openTickets,
      totalSessions,
      totalContacts,
    ] = await Promise.all([
      this.prisma.companyUser.count({ where: { companyId } }),
      this.prisma.ticket.count({ where: { companyId } }),
      this.prisma.ticket.count({
        where: {
          companyId,
          status: { in: ['OPEN', 'IN_PROGRESS', 'WAITING_CUSTOMER'] },
        },
      }),
      this.prisma.messagingSession.count({ where: { companyId } }),
      this.prisma.contact.count({ where: { companyId } }),
    ]);

    // Tickets por status
    const ticketsByStatus = await this.prisma.ticket.groupBy({
      by: ['status'],
      where: { companyId },
      _count: { status: true },
    });

    // Tickets dos últimos 30 dias
    const thirtyDaysAgo = new Date();
    thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 30);

    const recentTickets = await this.prisma.ticket.count({
      where: {
        companyId,
        createdAt: { gte: thirtyDaysAgo },
      },
    });

    return {
      company: {
        id: company.id,
        name: company.name,
        plan: company.plan,
      },
      users: {
        total: totalUsers,
      },
      tickets: {
        total: totalTickets,
        open: openTickets,
        recentlyCreated: recentTickets,
        byStatus: ticketsByStatus.reduce((acc, item) => {
          acc[item.status] = item._count.status;
          return acc;
        }, {}),
      },
      sessions: {
        total: totalSessions,
        active: 0, // Será atualizado quando tivermos o status correto
        inactive: totalSessions,
      },
      contacts: {
        total: totalContacts,
      },
    };
  }

  // ================================
  // LIMPEZA E MANUTENÇÃO
  // ================================

  async manualTokenCleanup() {
    return await this.cleanupTokensTask.manualCleanup();
  }
}
