/* eslint-disable prettier/prettier */
import { Injectable, UnauthorizedException } from '@nestjs/common';
import { PassportStrategy } from '@nestjs/passport';
import { ExtractJwt, Strategy } from 'passport-jwt';
import { ConfigService } from '@nestjs/config';
import { PrismaService } from '../../prisma/prisma.service';
import { JwtPayload } from '../interfaces/auth.interface';

@Injectable()
export class JwtStrategy extends PassportStrategy(Strategy) {
  constructor(
    private readonly configService: ConfigService,
    private readonly prisma: PrismaService,
  ) {
    super({
      jwtFromRequest: ExtractJwt.fromAuthHeaderAsBearerToken(),
      ignoreExpiration: false,
      secretOrKey: configService.get('JWT_SECRET') || 'fallback-secret',
    });
  }

  async validate(payload: JwtPayload) {
    // Verificar se usuário ainda existe e está ativo
    const user = await this.prisma.user.findUnique({
      where: { id: payload.sub, isActive: true },
      include: {
        companyUsers: {
          where: {
            companyId: payload.companyId,
            isActive: true,
          },
          include: {
            company: true,
            role: true,
          },
        },
      },
    });

    if (!user) {
      throw new UnauthorizedException('Usuário não encontrado ou inativo');
    }

    // Verificar se ainda tem acesso à empresa
    if (payload.companyId) {
      const companyAccess = user.companyUsers.find(
        (cu) => cu.companyId === payload.companyId,
      );

      if (!companyAccess) {
        throw new UnauthorizedException('Acesso à empresa revogado');
      }

      // Atualizar permissões se mudaram
      const currentPermissions = JSON.parse(
        companyAccess.role.permissions || '[]',
      );

      return {
        userId: user.id,
        email: user.email,
        companyId: payload.companyId,
        roleId: companyAccess.role.id,
        roleName: companyAccess.role.name,
        permissions: currentPermissions,
        user,
        company: companyAccess.company,
      };
    }

    // Super admin sem empresa específica
    return {
      userId: user.id,
      email: user.email,
      permissions: payload.permissions || [],
      user,
    };
  }
}
