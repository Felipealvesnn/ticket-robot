import { Controller, Get, UseGuards } from '@nestjs/common';
import {
  ApiBearerAuth,
  ApiOperation,
  ApiResponse,
  ApiTags,
  ApiUnauthorizedResponse,
} from '@nestjs/swagger';
import { CurrentUser } from '../auth/decorators/current-user.decorator';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { CurrentUserData } from '../auth/interfaces/current-user.interface';
import { RolesService } from './roles.service';

@ApiTags('🎭 Roles')
@Controller('roles')
@ApiBearerAuth()
@UseGuards(JwtAuthGuard)
export class RolesController {
  constructor(private readonly rolesService: RolesService) {}

  @ApiOperation({
    summary: 'Listar roles disponíveis',
    description:
      'Retorna todas as roles que o usuário pode atribuir baseado em seu contexto.',
  })
  @ApiResponse({
    status: 200,
    description: 'Lista de roles retornada com sucesso',
    schema: {
      type: 'array',
      items: {
        type: 'object',
        properties: {
          id: { type: 'string', example: 'clq1234567890abcdef' },
          name: { type: 'string', example: 'COMPANY_ADMIN' },
          description: { type: 'string', example: 'Administrador da Empresa' },
        },
      },
    },
  })
  @ApiUnauthorizedResponse({
    description: 'Token inválido ou usuário não autenticado',
  })
  @Get()
  async getRoles(@CurrentUser() user: CurrentUserData) {
    return await this.rolesService.getAvailableRoles(user);
  }
}
