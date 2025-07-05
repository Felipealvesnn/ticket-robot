import { Injectable } from '@nestjs/common';
import { CurrentUserData } from '../auth/interfaces/current-user.interface';
import { PrismaService } from '../prisma/prisma.service';

@Injectable()
export class RolesService {
  constructor(private readonly prisma: PrismaService) {}

  async getAvailableRoles(user: CurrentUserData) {
    // Buscar o usuário e suas permissões
    const userWithRoles = await this.prisma.user.findUnique({
      where: { id: user.userId },
      include: {
        companyUsers: {
          include: {
            role: true,
            company: true,
          },
        },
      },
    });

    if (!userWithRoles) {
      throw new Error('Usuário não encontrado');
    }

    // Verificar se é SUPER_ADMIN
    const isSuperAdmin = userWithRoles.companyUsers.some(
      (cu) => cu.role.name === 'SUPER_ADMIN',
    );

    // Verificar se é COMPANY_OWNER
    const isCompanyOwner = userWithRoles.companyUsers.some(
      (cu) => cu.role.name === 'COMPANY_OWNER',
    );

    // Verificar se é COMPANY_ADMIN
    const isCompanyAdmin = userWithRoles.companyUsers.some(
      (cu) => cu.role.name === 'COMPANY_ADMIN',
    );

    // Definir quais roles podem ser atribuídas
    let allowedRoleNames: string[] = [];

    if (isSuperAdmin) {
      // SUPER_ADMIN pode atribuir qualquer role
      allowedRoleNames = [
        'SUPER_ADMIN',
        'COMPANY_OWNER',
        'COMPANY_ADMIN',
        'MANAGER',
        'EMPLOYEE',
        'VIEWER',
      ];
    } else if (isCompanyOwner) {
      // COMPANY_OWNER pode atribuir roles dentro da empresa
      allowedRoleNames = ['COMPANY_ADMIN', 'MANAGER', 'EMPLOYEE', 'VIEWER'];
    } else if (isCompanyAdmin) {
      // COMPANY_ADMIN pode atribuir roles básicas
      allowedRoleNames = ['MANAGER', 'EMPLOYEE', 'VIEWER'];
    } else {
      // Usuários normais não podem atribuir roles
      allowedRoleNames = [];
    }

    // Buscar as roles do banco de dados
    const roles = await this.prisma.role.findMany({
      where: {
        name: { in: allowedRoleNames },
        isActive: true,
      },
      select: {
        id: true,
        name: true,
        description: true,
      },
      orderBy: {
        name: 'asc',
      },
    });

    return roles;
  }
}
