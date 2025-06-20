/* eslint-disable prettier/prettier */
import {
  Injectable,
  CanActivate,
  ExecutionContext,
  ForbiddenException,
} from '@nestjs/common';
import { Reflector } from '@nestjs/core';

@Injectable()
export class PermissionsGuard implements CanActivate {
  constructor(private reflector: Reflector) {}

  canActivate(context: ExecutionContext): boolean {
    const requiredPermissions = this.reflector.get<string[]>(
      'permissions',
      context.getHandler(),
    );

    if (!requiredPermissions) {
      return true;
    }

    const request = context.switchToHttp().getRequest();
    const user = request.user;

    if (!user) {
      throw new ForbiddenException('Usuário não autenticado');
    }

    // Super Admin tem acesso a tudo
    if (user.roleName === 'SUPER_ADMIN') {
      return true;
    }

    // Verificar se usuário tem as permissões necessárias
    const hasPermission = requiredPermissions.some((permission) =>
      user.permissions?.includes(permission),
    );

    if (!hasPermission) {
      throw new ForbiddenException('Permissões insuficientes');
    }

    return true;
  }
}
