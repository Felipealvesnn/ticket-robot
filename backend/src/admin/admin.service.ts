import {
  BadRequestException,
  ForbiddenException,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import { AuthService } from '../auth/auth.service';
import { CurrentUserPayload } from '../auth/interfaces/auth.interface';
import { CleanupTokensTask } from '../auth/tasks/cleanup-tokens.task';
import { CompanyService } from '../company/company.service';
import {
  CreateCompanyDto,
  CreateCompanyWithUserDto,
  UpdateCompanyDto,
} from '../company/dto/company.dto';
import { PrismaService } from '../prisma/prisma.service';
import {
  CreateUserDto,
  UpdateUserDto,
} from '../shared/interfaces/admin.interface';
import { UsersService } from '../users/users.service';

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
        { name: { contains: search } },
        { slug: { contains: search } },
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

  async createCompany(createCompanyDto: CreateCompanyDto) {
    // Verificar se slug já existe
    const existingCompany = await this.prisma.company.findUnique({
      where: { slug: createCompanyDto.slug },
    });

    if (existingCompany) {
      throw new BadRequestException('Slug da empresa já está em uso');
    }

    // Criar empresa
    const company = await this.prisma.company.create({
      data: {
        name: createCompanyDto.name,
        slug: createCompanyDto.slug,
        plan: createCompanyDto.plan || 'FREE',
        isActive: true,
      },
    });

    return {
      company: {
        id: company.id,
        name: company.name,
        slug: company.slug,
        plan: company.plan,
      },
      message: 'Empresa criada com sucesso',
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
  // GESTÃO GLOBAL DE USUÁRIOS (SUPER_ADMIN)
  // ================================

  async getAllUsers({
    page = 1,
    limit = 10,
    search,
  }: {
    page: number;
    limit: number;
    search?: string;
  }) {
    const skip = (page - 1) * limit;

    // Construir filtros
    const where: any = {};
    if (search) {
      where.OR = [
        { name: { contains: search } },
        { email: { contains: search } },
      ];
    }

    // Buscar usuários com contagem
    const [users, total] = await Promise.all([
      this.prisma.user.findMany({
        where,
        skip,
        take: limit,
        include: {
          companyUsers: {
            include: {
              company: {
                select: {
                  id: true,
                  name: true,
                  slug: true,
                  plan: true,
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
        },
        orderBy: { createdAt: 'desc' },
      }),
      this.prisma.user.count({ where }),
    ]);

    // Formatar resposta
    const formattedUsers = users.map((user) => ({
      id: user.id,
      email: user.email,
      name: user.name,
      isActive: user.isActive,
      isFirstLogin: user.isFirstLogin,
      createdAt: user.createdAt,
      companies: user.companyUsers.map((companyUser) => ({
        company: companyUser.company,
        role: companyUser.role,
      })),
    }));

    return {
      users: formattedUsers,
      pagination: {
        total,
        page,
        limit,
        totalPages: Math.ceil(total / limit),
      },
    };
  }

  async createGlobalUser(createUserDto: CreateUserDto) {
    // Verificar se email já existe
    const existingUser = await this.prisma.user.findUnique({
      where: { email: createUserDto.email },
    });

    if (existingUser) {
      throw new BadRequestException('Email já está em uso');
    }

    // Verificar se roleId existe (se fornecido)
    if (createUserDto.roleId) {
      const role = await this.prisma.role.findUnique({
        where: { id: createUserDto.roleId },
      });

      if (!role) {
        throw new BadRequestException('Role não encontrado');
      }
    }

    // Gerar senha se não fornecida
    const password =
      createUserDto.password || Math.random().toString(36).slice(-8);
    const hashedPassword = await this.authService.hashPassword(password);

    // Criar usuário
    const user = await this.prisma.user.create({
      data: {
        email: createUserDto.email,
        password: hashedPassword,
        name: createUserDto.name,
        isActive: true,
        isFirstLogin: !createUserDto.password, // Se senha foi gerada, é primeiro login
      },
      select: {
        id: true,
        email: true,
        name: true,
        isActive: true,
        isFirstLogin: true,
        createdAt: true,
      },
    });

    return {
      user,
      generatedPassword: !createUserDto.password ? password : undefined,
      message: 'Usuário criado com sucesso',
    };
  }

  async updateGlobalUser(userId: string, updateUserDto: UpdateUserDto) {
    // Verificar se usuário existe
    const existingUser = await this.prisma.user.findUnique({
      where: { id: userId },
    });

    if (!existingUser) {
      throw new NotFoundException('Usuário não encontrado');
    }

    // Preparar dados para atualização
    const updateData: any = {};

    if (updateUserDto.name !== undefined) {
      updateData.name = updateUserDto.name;
    }

    if (updateUserDto.isActive !== undefined) {
      updateData.isActive = updateUserDto.isActive;
    }

    if (updateUserDto.password) {
      updateData.password = await this.authService.hashPassword(
        updateUserDto.password,
      );
      updateData.isFirstLogin = false;
    }

    // Atualizar usuário
    const updatedUser = await this.prisma.user.update({
      where: { id: userId },
      data: updateData,
      select: {
        id: true,
        email: true,
        name: true,
        isActive: true,
        isFirstLogin: true,
        createdAt: true,
        updatedAt: true,
      },
    });

    return {
      user: updatedUser,
      message: 'Usuário atualizado com sucesso',
    };
  }

  async deleteGlobalUser(userId: string) {
    // Verificar se usuário existe
    const existingUser = await this.prisma.user.findUnique({
      where: { id: userId },
      include: {
        companyUsers: {
          include: {
            role: true,
            company: true,
          },
        },
      },
    });

    if (!existingUser) {
      throw new NotFoundException('Usuário não encontrado');
    }

    // Verificar se é o último COMPANY_OWNER em alguma empresa
    const ownerRole = await this.prisma.role.findUnique({
      where: { name: 'COMPANY_OWNER' },
    });

    if (ownerRole) {
      for (const companyUser of existingUser.companyUsers) {
        if (companyUser.roleId === ownerRole.id) {
          const ownersCount = await this.prisma.companyUser.count({
            where: {
              companyId: companyUser.companyId,
              roleId: ownerRole.id,
            },
          });

          if (ownersCount <= 1) {
            throw new BadRequestException(
              `Não é possível remover o usuário pois ele é o último proprietário da empresa "${companyUser.company.name}"`,
            );
          }
        }
      }
    }

    // Remover usuário (cascade removerá companyUsers automaticamente)
    await this.prisma.user.delete({
      where: { id: userId },
    });

    return {
      message: 'Usuário removido do sistema com sucesso',
    };
  }

  async manageUserCompanies(
    userId: string,
    manageCompaniesDto: {
      addCompanies?: Array<{ companyId: string; roleId: string }>;
      removeCompanies?: string[];
      updateRoles?: Array<{ companyId: string; roleId: string }>;
    },
  ) {
    // Verificar se usuário existe
    const user = await this.prisma.user.findUnique({
      where: { id: userId },
    });

    if (!user) {
      throw new NotFoundException('Usuário não encontrado');
    }

    const results: {
      added: Array<{
        company: { id: string; name: string };
        role: { id: string; name: string };
      }>;
      removed: Array<{ company: { id: string; name: string } }>;
      updated: Array<{
        company: { id: string; name: string };
        oldRole: { id: string; name: string };
        newRole: { id: string; name: string };
      }>;
      errors: string[];
    } = {
      added: [],
      removed: [],
      updated: [],
      errors: [],
    };

    // Executar operações em transação
    await this.prisma.$transaction(async (prisma) => {
      // Adicionar usuário a empresas
      if (manageCompaniesDto.addCompanies?.length) {
        for (const { companyId, roleId } of manageCompaniesDto.addCompanies) {
          try {
            // Verificar se empresa existe
            const company = await prisma.company.findUnique({
              where: { id: companyId },
            });

            if (!company) {
              results.errors.push(`Empresa ${companyId} não encontrada`);
              continue;
            }

            // Verificar se role existe
            const role = await prisma.role.findUnique({
              where: { id: roleId },
            });

            if (!role) {
              results.errors.push(`Role ${roleId} não encontrado`);
              continue;
            }

            // Verificar se já existe
            const existing = await prisma.companyUser.findUnique({
              where: {
                userId_companyId: {
                  userId,
                  companyId,
                },
              },
            });

            if (existing) {
              results.errors.push(
                `Usuário já pertence à empresa ${company.name}`,
              );
              continue;
            }

            // Adicionar
            await prisma.companyUser.create({
              data: {
                userId,
                companyId,
                roleId,
              },
            });

            results.added.push({
              company: { id: company.id, name: company.name },
              role: { id: role.id, name: role.name },
            });
          } catch (error) {
            results.errors.push(
              `Erro ao adicionar empresa ${companyId}: ${error.message}`,
            );
          }
        }
      }

      // Remover usuário de empresas
      if (manageCompaniesDto.removeCompanies?.length) {
        for (const companyId of manageCompaniesDto.removeCompanies) {
          try {
            // Verificar se usuário pertence à empresa
            const companyUser = await prisma.companyUser.findUnique({
              where: {
                userId_companyId: {
                  userId,
                  companyId,
                },
              },
              include: {
                company: true,
                role: true,
              },
            });

            if (!companyUser) {
              results.errors.push(`Usuário não pertence à empresa`);
              continue;
            }

            // Verificar se não é o último COMPANY_OWNER
            const ownerRole = await prisma.role.findUnique({
              where: { name: 'COMPANY_OWNER' },
            });

            if (ownerRole && companyUser.roleId === ownerRole.id) {
              const ownersCount = await prisma.companyUser.count({
                where: {
                  companyId,
                  roleId: ownerRole.id,
                },
              });

              if (ownersCount <= 1) {
                results.errors.push(
                  `Não é possível remover o último proprietário da empresa ${companyUser.company.name}`,
                );
                continue;
              }
            }

            // Remover
            await prisma.companyUser.delete({
              where: {
                userId_companyId: {
                  userId,
                  companyId,
                },
              },
            });

            results.removed.push({
              company: {
                id: companyUser.company.id,
                name: companyUser.company.name,
              },
            });
          } catch (error) {
            results.errors.push(
              `Erro ao remover empresa ${companyId}: ${error.message}`,
            );
          }
        }
      }

      // Atualizar roles
      if (manageCompaniesDto.updateRoles?.length) {
        for (const { companyId, roleId } of manageCompaniesDto.updateRoles) {
          try {
            // Verificar se usuário pertence à empresa
            const companyUser = await prisma.companyUser.findUnique({
              where: {
                userId_companyId: {
                  userId,
                  companyId,
                },
              },
              include: {
                company: true,
                role: true,
              },
            });

            if (!companyUser) {
              results.errors.push(`Usuário não pertence à empresa`);
              continue;
            }

            // Verificar se nova role existe
            const newRole = await prisma.role.findUnique({
              where: { id: roleId },
            });

            if (!newRole) {
              results.errors.push(`Role ${roleId} não encontrado`);
              continue;
            }

            // Verificar se não está removendo o último COMPANY_OWNER
            const ownerRole = await prisma.role.findUnique({
              where: { name: 'COMPANY_OWNER' },
            });

            if (
              ownerRole &&
              companyUser.roleId === ownerRole.id &&
              roleId !== ownerRole.id
            ) {
              const ownersCount = await prisma.companyUser.count({
                where: {
                  companyId,
                  roleId: ownerRole.id,
                },
              });

              if (ownersCount <= 1) {
                results.errors.push(
                  `Não é possível alterar o role do último proprietário da empresa ${companyUser.company.name}`,
                );
                continue;
              }
            }

            // Atualizar role
            await prisma.companyUser.update({
              where: {
                userId_companyId: {
                  userId,
                  companyId,
                },
              },
              data: { roleId },
            });

            results.updated.push({
              company: {
                id: companyUser.company.id,
                name: companyUser.company.name,
              },
              oldRole: { id: companyUser.role.id, name: companyUser.role.name },
              newRole: { id: newRole.id, name: newRole.name },
            });
          } catch (error) {
            results.errors.push(
              `Erro ao atualizar role na empresa ${companyId}: ${error.message}`,
            );
          }
        }
      }
    });

    return {
      results,
      message: 'Operações de gerenciamento completadas',
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

    // Verificar se role existe (roleId deve ser obrigatório para usuários de empresa)
    if (!createUserDto.roleId) {
      throw new BadRequestException(
        'Role é obrigatório para usuários de empresa',
      );
    }

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
          roleId: createUserDto.roleId!, // Sabemos que não é undefined por causa da verificação acima
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
