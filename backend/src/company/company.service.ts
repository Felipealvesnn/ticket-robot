/* eslint-disable prettier/prettier */
import {
  Injectable,
  ConflictException,
  NotFoundException,
  BadRequestException,
} from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import {
  CreateCompanyDto,
  UpdateCompanyDto,
  AddUserToCompanyDto,
  CreateCompanyWithUserDto,
} from './dto/company.dto';
import * as bcrypt from 'bcryptjs';

@Injectable()
export class CompanyService {
  constructor(private readonly prisma: PrismaService) {}

  async create(createCompanyDto: CreateCompanyDto) {
    // Verificar se slug já existe
    const existingCompany = await this.prisma.company.findUnique({
      where: { slug: createCompanyDto.slug },
    });

    if (existingCompany) {
      throw new ConflictException('Slug da empresa já está em uso');
    }
    const company = await this.prisma.company.create({
      data: {
        name: createCompanyDto.name,
        slug: createCompanyDto.slug,
        plan: createCompanyDto.plan || 'FREE',
      },
      include: {
        companyUsers: {
          include: {
            user: {
              select: {
                id: true,
                email: true,
                name: true,
              },
            },
            role: true,
          },
        },
        _count: {
          select: {
            companyUsers: true,
          },
        },
      },
    });

    return company;
  }

  async findAll() {
    return await this.prisma.company.findMany({
      where: { isActive: true },
      include: {
        _count: {
          select: {
            companyUsers: true,
          },
        },
      },
      orderBy: { createdAt: 'desc' },
    });
  }

  async findOne(id: string) {
    const company = await this.prisma.company.findUnique({
      where: { id, isActive: true },
      include: {
        companyUsers: {
          where: { isActive: true },
          include: {
            user: {
              select: {
                id: true,
                email: true,
                name: true,
                avatar: true,
              },
            },
            role: true,
          },
        },
        _count: {
          select: {
            companyUsers: true,
          },
        },
      },
    });

    if (!company) {
      throw new NotFoundException('Empresa não encontrada');
    }

    return company;
  }

  async findBySlug(slug: string) {
    const company = await this.prisma.company.findUnique({
      where: { slug, isActive: true },
      include: {
        companyUsers: {
          where: { isActive: true },
          include: {
            user: {
              select: {
                id: true,
                email: true,
                name: true,
                avatar: true,
              },
            },
            role: true,
          },
        },
      },
    });

    if (!company) {
      throw new NotFoundException('Empresa não encontrada');
    }

    return company;
  }

  async update(id: string, updateCompanyDto: UpdateCompanyDto) {
    const company = await this.prisma.company.findUnique({
      where: { id, isActive: true },
    });

    if (!company) {
      throw new NotFoundException('Empresa não encontrada');
    }

    return await this.prisma.company.update({
      where: { id },
      data: updateCompanyDto,
      include: {
        companyUsers: {
          include: {
            user: {
              select: {
                id: true,
                email: true,
                name: true,
                avatar: true,
              },
            },
            role: true,
          },
        },
      },
    });
  }

  async remove(id: string) {
    const company = await this.prisma.company.findUnique({
      where: { id, isActive: true },
    });

    if (!company) {
      throw new NotFoundException('Empresa não encontrada');
    }

    // Soft delete
    await this.prisma.company.update({
      where: { id },
      data: { isActive: false },
    });

    return { message: 'Empresa removida com sucesso' };
  }

  async addUser(companyId: string, addUserDto: AddUserToCompanyDto) {
    // Verificar se empresa existe
    const company = await this.prisma.company.findUnique({
      where: { id: companyId, isActive: true },
    });

    if (!company) {
      throw new NotFoundException('Empresa não encontrada');
    }

    // Verificar se usuário existe
    const user = await this.prisma.user.findUnique({
      where: { email: addUserDto.userEmail, isActive: true },
    });

    if (!user) {
      throw new NotFoundException('Usuário não encontrado');
    }

    // Verificar se role existe
    const role = await this.prisma.role.findUnique({
      where: { id: addUserDto.roleId },
    });

    if (!role) {
      throw new NotFoundException('Role não encontrado');
    }

    // Verificar se usuário já está na empresa
    const existingAssociation = await this.prisma.companyUser.findUnique({
      where: {
        userId_companyId: {
          userId: user.id,
          companyId,
        },
      },
    });

    if (existingAssociation) {
      throw new ConflictException('Usuário já pertence a esta empresa');
    }

    // Adicionar usuário à empresa
    const companyUser = await this.prisma.companyUser.create({
      data: {
        userId: user.id,
        companyId,
        roleId: addUserDto.roleId,
      },
      include: {
        user: {
          select: {
            id: true,
            email: true,
            name: true,
            avatar: true,
          },
        },
        role: true,
      },
    });

    return {
      message: 'Usuário adicionado à empresa com sucesso',
      companyUser,
    };
  }

  async removeUser(companyId: string, userId: string) {
    const companyUser = await this.prisma.companyUser.findUnique({
      where: {
        userId_companyId: {
          userId,
          companyId,
        },
      },
    });

    if (!companyUser) {
      throw new NotFoundException('Usuário não está associado a esta empresa');
    }

    // Soft delete
    await this.prisma.companyUser.update({
      where: {
        userId_companyId: {
          userId,
          companyId,
        },
      },
      data: { isActive: false },
    });

    return { message: 'Usuário removido da empresa com sucesso' };
  }

  async getUserCompanies(userId: string) {
    return await this.prisma.companyUser.findMany({
      where: { userId, isActive: true },
      include: {
        company: {
          select: {
            id: true,
            name: true,
            slug: true,
            plan: true,
          },
        },
        role: true,
      },
    });
  }

  async createWithUser(createCompanyWithUserDto: CreateCompanyWithUserDto) {
    // Verificar se slug já existe
    const existingCompany = await this.prisma.company.findUnique({
      where: { slug: createCompanyWithUserDto.companySlug },
    });

    if (existingCompany) {
      throw new ConflictException('Slug da empresa já está em uso');
    }

    // Verificar se email já existe
    const existingUser = await this.prisma.user.findUnique({
      where: { email: createCompanyWithUserDto.userEmail },
    });

    if (existingUser) {
      throw new ConflictException('Email já está em uso');
    }

    // Buscar role de COMPANY_OWNER
    const ownerRole = await this.prisma.role.findFirst({
      where: { name: 'COMPANY_OWNER' },
    });

    if (!ownerRole) {
      throw new BadRequestException('Role COMPANY_OWNER não encontrado');
    }

    // Hash da senha
    const hashedPassword = await bcrypt.hash(
      createCompanyWithUserDto.userPassword,
      10,
    );

    // Criar empresa e usuário em transação
    const result = await this.prisma.$transaction(async (tx) => {
      // Criar usuário
      const user = await tx.user.create({
        data: {
          email: createCompanyWithUserDto.userEmail,
          password: hashedPassword,
          name: createCompanyWithUserDto.userName,
          isFirstLogin: false,
        },
      });

      // Criar empresa
      const company = await tx.company.create({
        data: {
          name: createCompanyWithUserDto.companyName,
          slug: createCompanyWithUserDto.companySlug,
          plan: createCompanyWithUserDto.companyPlan || 'FREE',
        },
      });

      // Vincular usuário à empresa como proprietário
      const companyUser = await tx.companyUser.create({
        data: {
          userId: user.id,
          companyId: company.id,
          roleId: ownerRole.id,
        },
        include: {
          user: {
            select: {
              id: true,
              email: true,
              name: true,
              avatar: true,
            },
          },
          role: true,
        },
      });

      return {
        user: {
          id: user.id,
          email: user.email,
          name: user.name,
          avatar: user.avatar,
        },
        company: {
          id: company.id,
          name: company.name,
          slug: company.slug,
          plan: company.plan,
        },
        role: ownerRole,
        companyUser,
      };
    });

    return {
      message: 'Empresa e usuário proprietário criados com sucesso',
      ...result,
    };
  }
}
