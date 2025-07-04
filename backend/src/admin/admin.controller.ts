import {
  Body,
  Controller,
  Delete,
  Get,
  HttpCode,
  HttpStatus,
  Param,
  Patch,
  Post,
  Query,
  UseGuards,
} from '@nestjs/common';
import {
  ApiBadRequestResponse,
  ApiBearerAuth,
  ApiForbiddenResponse,
  ApiNotFoundResponse,
  ApiOperation,
  ApiParam,
  ApiQuery,
  ApiResponse,
  ApiTags,
  ApiUnauthorizedResponse,
} from '@nestjs/swagger';
import { CurrentUser } from '../auth/decorators/current-user.decorator';
import { Roles } from '../auth/decorators/roles.decorator';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { RolesGuard } from '../auth/guards/roles.guard';
import { CurrentUserPayload } from '../auth/interfaces/auth.interface';
import {
  CreateCompanyWithUserDto,
  UpdateCompanyDto,
} from '../company/dto/company.dto';
import { CreateUserDto, UpdateUserDto } from '../users/dto/user.dto';
import { AdminService } from './admin.service';

@ApiTags('🛡️ Administração')
@Controller('admin')
@ApiBearerAuth()
@UseGuards(JwtAuthGuard, RolesGuard)
export class AdminController {
  constructor(private readonly adminService: AdminService) {}

  // ================================
  // GESTÃO DE EMPRESAS (SUPER_ADMIN)
  // ================================

  @ApiOperation({
    summary: 'Listar todas as empresas (SUPER_ADMIN)',
    description: 'Retorna lista paginada de todas as empresas do sistema.',
  })
  @ApiQuery({
    name: 'page',
    required: false,
    description: 'Página da listagem',
    example: 1,
  })
  @ApiQuery({
    name: 'limit',
    required: false,
    description: 'Itens por página',
    example: 10,
  })
  @ApiQuery({
    name: 'search',
    required: false,
    description: 'Busca por nome ou slug',
    example: 'empresa',
  })
  @ApiQuery({
    name: 'plan',
    required: false,
    description: 'Filtrar por plano',
    enum: ['FREE', 'BASIC', 'PRO', 'ENTERPRISE'],
  })
  @ApiResponse({
    status: 200,
    description: 'Lista de empresas retornada com sucesso',
    schema: {
      type: 'object',
      properties: {
        companies: {
          type: 'array',
          items: {
            type: 'object',
            properties: {
              id: { type: 'string', example: 'clq1234567890abcdef' },
              name: { type: 'string', example: 'Empresa ABC' },
              slug: { type: 'string', example: 'empresa-abc' },
              plan: { type: 'string', example: 'PRO' },
              isActive: { type: 'boolean', example: true },
              _count: {
                type: 'object',
                properties: {
                  users: { type: 'number', example: 5 },
                  tickets: { type: 'number', example: 120 },
                  sessions: { type: 'number', example: 3 },
                },
              },
              createdAt: { type: 'string', format: 'date-time' },
            },
          },
        },
        pagination: {
          type: 'object',
          properties: {
            total: { type: 'number', example: 50 },
            page: { type: 'number', example: 1 },
            limit: { type: 'number', example: 10 },
            totalPages: { type: 'number', example: 5 },
          },
        },
      },
    },
  })
  @ApiUnauthorizedResponse({
    description: 'Token inválido ou usuário não autenticado',
  })
  @ApiForbiddenResponse({ description: 'Acesso negado - requer SUPER_ADMIN' })
  @Roles('SUPER_ADMIN')
  @Get('companies')
  async getAllCompanies(
    @CurrentUser() user: CurrentUserPayload,
    @Query('page') page = 1,
    @Query('limit') limit = 10,
    @Query('search') search?: string,
    @Query('plan') plan?: string,
  ) {
    return await this.adminService.getAllCompanies({
      page: Number(page),
      limit: Number(limit),
      search,
      plan,
    });
  }

  @ApiOperation({
    summary: 'Criar nova empresa com usuário proprietário (SUPER_ADMIN)',
    description:
      'Cria uma nova empresa no sistema junto com seu usuário proprietário.',
  })
  @ApiResponse({
    status: 201,
    description: 'Empresa criada com sucesso',
    schema: {
      type: 'object',
      properties: {
        company: {
          type: 'object',
          properties: {
            id: { type: 'string', example: 'clq1234567890abcdef' },
            name: { type: 'string', example: 'Nova Empresa' },
            slug: { type: 'string', example: 'nova-empresa' },
            plan: { type: 'string', example: 'FREE' },
          },
        },
        user: {
          type: 'object',
          properties: {
            id: { type: 'string', example: 'clq0987654321fedcba' },
            email: { type: 'string', example: 'owner@novaempresa.com' },
            name: { type: 'string', example: 'João Proprietário' },
          },
        },
        message: { type: 'string', example: 'Empresa criada com sucesso' },
      },
    },
  })
  @ApiBadRequestResponse({ description: 'Dados inválidos ou slug já em uso' })
  @ApiForbiddenResponse({ description: 'Acesso negado - requer SUPER_ADMIN' })
  @Roles('SUPER_ADMIN')
  @Post('companies')
  @HttpCode(HttpStatus.CREATED)
  async createCompanyWithOwner(
    @CurrentUser() user: CurrentUserPayload,
    @Body() createCompanyDto: CreateCompanyWithUserDto,
  ) {
    return await this.adminService.createCompanyWithOwner(createCompanyDto);
  }

  @ApiOperation({
    summary: 'Obter detalhes de uma empresa (SUPER_ADMIN)',
    description: 'Retorna informações detalhadas de uma empresa específica.',
  })
  @ApiParam({
    name: 'companyId',
    description: 'ID da empresa',
    example: 'clq1234567890abcdef',
  })
  @ApiResponse({
    status: 200,
    description: 'Detalhes da empresa retornados com sucesso',
    schema: {
      type: 'object',
      properties: {
        id: { type: 'string', example: 'clq1234567890abcdef' },
        name: { type: 'string', example: 'Empresa ABC' },
        slug: { type: 'string', example: 'empresa-abc' },
        plan: { type: 'string', example: 'PRO' },
        isActive: { type: 'boolean', example: true },
        users: {
          type: 'array',
          items: {
            type: 'object',
            properties: {
              id: { type: 'string' },
              email: { type: 'string' },
              name: { type: 'string' },
              role: { type: 'object' },
            },
          },
        },
        stats: {
          type: 'object',
          properties: {
            totalTickets: { type: 'number', example: 120 },
            activeSessions: { type: 'number', example: 3 },
            totalUsers: { type: 'number', example: 5 },
          },
        },
        createdAt: { type: 'string', format: 'date-time' },
      },
    },
  })
  @ApiNotFoundResponse({ description: 'Empresa não encontrada' })
  @ApiForbiddenResponse({ description: 'Acesso negado - requer SUPER_ADMIN' })
  @Roles('SUPER_ADMIN')
  @Get('companies/:companyId')
  async getCompanyDetails(
    @CurrentUser() user: CurrentUserPayload,
    @Param('companyId') companyId: string,
  ) {
    return await this.adminService.getCompanyDetails(companyId);
  }

  @ApiOperation({
    summary: 'Atualizar empresa (SUPER_ADMIN)',
    description: 'Atualiza informações de uma empresa específica.',
  })
  @ApiParam({
    name: 'companyId',
    description: 'ID da empresa',
    example: 'clq1234567890abcdef',
  })
  @ApiResponse({
    status: 200,
    description: 'Empresa atualizada com sucesso',
  })
  @ApiNotFoundResponse({ description: 'Empresa não encontrada' })
  @ApiForbiddenResponse({ description: 'Acesso negado - requer SUPER_ADMIN' })
  @Roles('SUPER_ADMIN')
  @Patch('companies/:companyId')
  async updateCompany(
    @CurrentUser() user: CurrentUserPayload,
    @Param('companyId') companyId: string,
    @Body() updateCompanyDto: UpdateCompanyDto,
  ) {
    return await this.adminService.updateCompany(companyId, updateCompanyDto);
  }

  @ApiOperation({
    summary: 'Desativar/reativar empresa (SUPER_ADMIN)',
    description: 'Alterna o status ativo/inativo de uma empresa.',
  })
  @ApiParam({
    name: 'companyId',
    description: 'ID da empresa',
    example: 'clq1234567890abcdef',
  })
  @ApiResponse({
    status: 200,
    description: 'Status da empresa alterado com sucesso',
    schema: {
      type: 'object',
      properties: {
        company: {
          type: 'object',
          properties: {
            id: { type: 'string' },
            name: { type: 'string' },
            isActive: { type: 'boolean' },
          },
        },
        message: { type: 'string', example: 'Empresa desativada com sucesso' },
      },
    },
  })
  @ApiNotFoundResponse({ description: 'Empresa não encontrada' })
  @ApiForbiddenResponse({ description: 'Acesso negado - requer SUPER_ADMIN' })
  @Roles('SUPER_ADMIN')
  @Patch('companies/:companyId/toggle-status')
  async toggleCompanyStatus(
    @CurrentUser() user: CurrentUserPayload,
    @Param('companyId') companyId: string,
  ) {
    return await this.adminService.toggleCompanyStatus(companyId);
  }

  // ================================
  // GESTÃO DE USUÁRIOS (COMPANY_OWNER/ADMIN + SUPER_ADMIN)
  // ================================

  @ApiOperation({
    summary: 'Listar usuários de uma empresa',
    description: 'Lista todos os usuários de uma empresa específica.',
  })
  @ApiParam({
    name: 'companyId',
    description: 'ID da empresa',
    example: 'clq1234567890abcdef',
  })
  @ApiResponse({
    status: 200,
    description: 'Lista de usuários retornada com sucesso',
    schema: {
      type: 'array',
      items: {
        type: 'object',
        properties: {
          id: { type: 'string', example: 'clq1234567890abcdef' },
          email: { type: 'string', example: 'user@empresa.com' },
          name: { type: 'string', example: 'João Silva' },
          isActive: { type: 'boolean', example: true },
          isFirstLogin: { type: 'boolean', example: false },
          role: {
            type: 'object',
            properties: {
              id: { type: 'string' },
              name: { type: 'string', example: 'AGENT' },
            },
          },
          createdAt: { type: 'string', format: 'date-time' },
          lastLoginAt: { type: 'string', format: 'date-time', nullable: true },
        },
      },
    },
  })
  @ApiNotFoundResponse({ description: 'Empresa não encontrada' })
  @ApiForbiddenResponse({ description: 'Acesso negado' })
  @Roles('SUPER_ADMIN', 'COMPANY_OWNER', 'COMPANY_ADMIN')
  @Get('companies/:companyId/users')
  async getCompanyUsers(
    @CurrentUser() user: CurrentUserPayload,
    @Param('companyId') companyId: string,
  ) {
    // Verificar se o usuário tem acesso a esta empresa
    await this.adminService.validateCompanyAccess(user, companyId);
    return await this.adminService.getCompanyUsers(companyId);
  }

  @ApiOperation({
    summary: 'Criar usuário em uma empresa',
    description: 'Cria um novo usuário dentro de uma empresa específica.',
  })
  @ApiParam({
    name: 'companyId',
    description: 'ID da empresa',
    example: 'clq1234567890abcdef',
  })
  @ApiResponse({
    status: 201,
    description: 'Usuário criado com sucesso',
    schema: {
      type: 'object',
      properties: {
        user: {
          type: 'object',
          properties: {
            id: { type: 'string', example: 'clq1234567890abcdef' },
            email: { type: 'string', example: 'newuser@empresa.com' },
            name: { type: 'string', example: 'Novo Usuário' },
            isFirstLogin: { type: 'boolean', example: true },
          },
        },
        tempPassword: { type: 'string', example: 'TempPass123' },
        message: { type: 'string', example: 'Usuário criado com sucesso' },
      },
    },
  })
  @ApiBadRequestResponse({ description: 'Email já em uso ou dados inválidos' })
  @ApiForbiddenResponse({ description: 'Acesso negado' })
  @Roles('SUPER_ADMIN', 'COMPANY_OWNER', 'COMPANY_ADMIN')
  @Post('companies/:companyId/users')
  @HttpCode(HttpStatus.CREATED)
  async createCompanyUser(
    @CurrentUser() user: CurrentUserPayload,
    @Param('companyId') companyId: string,
    @Body() createUserDto: CreateUserDto,
  ) {
    // Verificar se o usuário tem acesso a esta empresa
    await this.adminService.validateCompanyAccess(user, companyId);
    return await this.adminService.createCompanyUser(companyId, createUserDto);
  }

  @ApiOperation({
    summary: 'Atualizar usuário da empresa',
    description: 'Atualiza informações de um usuário específico da empresa.',
  })
  @ApiParam({
    name: 'companyId',
    description: 'ID da empresa',
    example: 'clq1234567890abcdef',
  })
  @ApiParam({
    name: 'userId',
    description: 'ID do usuário',
    example: 'clq0987654321fedcba',
  })
  @ApiResponse({
    status: 200,
    description: 'Usuário atualizado com sucesso',
  })
  @ApiNotFoundResponse({ description: 'Usuário ou empresa não encontrados' })
  @ApiForbiddenResponse({ description: 'Acesso negado' })
  @Roles('SUPER_ADMIN', 'COMPANY_OWNER', 'COMPANY_ADMIN')
  @Patch('companies/:companyId/users/:userId')
  async updateCompanyUser(
    @CurrentUser() user: CurrentUserPayload,
    @Param('companyId') companyId: string,
    @Param('userId') userId: string,
    @Body() updateUserDto: UpdateUserDto,
  ) {
    // Verificar se o usuário tem acesso a esta empresa
    await this.adminService.validateCompanyAccess(user, companyId);
    return await this.adminService.updateCompanyUser(
      companyId,
      userId,
      updateUserDto,
    );
  }

  @ApiOperation({
    summary: 'Remover usuário da empresa',
    description: 'Remove um usuário de uma empresa específica.',
  })
  @ApiParam({
    name: 'companyId',
    description: 'ID da empresa',
    example: 'clq1234567890abcdef',
  })
  @ApiParam({
    name: 'userId',
    description: 'ID do usuário',
    example: 'clq0987654321fedcba',
  })
  @ApiResponse({
    status: 200,
    description: 'Usuário removido com sucesso',
    schema: {
      type: 'object',
      properties: {
        message: {
          type: 'string',
          example: 'Usuário removido da empresa com sucesso',
        },
      },
    },
  })
  @ApiNotFoundResponse({ description: 'Usuário ou empresa não encontrados' })
  @ApiForbiddenResponse({ description: 'Acesso negado' })
  @Roles('SUPER_ADMIN', 'COMPANY_OWNER', 'COMPANY_ADMIN')
  @Delete('companies/:companyId/users/:userId')
  async removeCompanyUser(
    @CurrentUser() user: CurrentUserPayload,
    @Param('companyId') companyId: string,
    @Param('userId') userId: string,
  ) {
    // Verificar se o usuário tem acesso a esta empresa
    await this.adminService.validateCompanyAccess(user, companyId);
    return await this.adminService.removeCompanyUser(companyId, userId);
  }

  // ================================
  // ESTATÍSTICAS E DASHBOARDS
  // ================================

  @ApiOperation({
    summary: 'Dashboard do sistema (SUPER_ADMIN)',
    description: 'Retorna estatísticas globais do sistema.',
  })
  @ApiResponse({
    status: 200,
    description: 'Estatísticas globais retornadas com sucesso',
    schema: {
      type: 'object',
      properties: {
        companies: {
          type: 'object',
          properties: {
            total: { type: 'number', example: 50 },
            active: { type: 'number', example: 45 },
            byPlan: {
              type: 'object',
              properties: {
                FREE: { type: 'number', example: 30 },
                BASIC: { type: 'number', example: 10 },
                PRO: { type: 'number', example: 8 },
                ENTERPRISE: { type: 'number', example: 2 },
              },
            },
          },
        },
        users: {
          type: 'object',
          properties: {
            total: { type: 'number', example: 250 },
            active: { type: 'number', example: 230 },
            newThisMonth: { type: 'number', example: 15 },
          },
        },
        tickets: {
          type: 'object',
          properties: {
            total: { type: 'number', example: 1500 },
            openToday: { type: 'number', example: 25 },
            resolvedToday: { type: 'number', example: 30 },
          },
        },
        sessions: {
          type: 'object',
          properties: {
            total: { type: 'number', example: 75 },
            connected: { type: 'number', example: 65 },
            disconnected: { type: 'number', example: 10 },
          },
        },
      },
    },
  })
  @ApiForbiddenResponse({ description: 'Acesso negado - requer SUPER_ADMIN' })
  @Roles('SUPER_ADMIN')
  @Get('dashboard')
  async getSystemDashboard(@CurrentUser() user: CurrentUserPayload) {
    return await this.adminService.getSystemDashboard();
  }

  @ApiOperation({
    summary: 'Estatísticas de uma empresa',
    description: 'Retorna estatísticas detalhadas de uma empresa específica.',
  })
  @ApiParam({
    name: 'companyId',
    description: 'ID da empresa',
    example: 'clq1234567890abcdef',
  })
  @ApiResponse({
    status: 200,
    description: 'Estatísticas da empresa retornadas com sucesso',
  })
  @ApiNotFoundResponse({ description: 'Empresa não encontrada' })
  @ApiForbiddenResponse({ description: 'Acesso negado' })
  @Roles('SUPER_ADMIN', 'COMPANY_OWNER', 'COMPANY_ADMIN')
  @Get('companies/:companyId/stats')
  async getCompanyStats(
    @CurrentUser() user: CurrentUserPayload,
    @Param('companyId') companyId: string,
  ) {
    // Verificar se o usuário tem acesso a esta empresa
    await this.adminService.validateCompanyAccess(user, companyId);
    return await this.adminService.getCompanyStats(companyId);
  }

  // ================================
  // LIMPEZA E MANUTENÇÃO
  // ================================

  @ApiOperation({
    summary: 'Limpeza manual de tokens (SUPER_ADMIN)',
    description: 'Executa limpeza manual de tokens expirados e sessões.',
  })
  @ApiResponse({
    status: 200,
    description: 'Limpeza executada com sucesso',
    schema: {
      type: 'object',
      properties: {
        deletedRefreshTokens: { type: 'number', example: 25 },
        deletedSessions: { type: 'number', example: 10 },
        activeRefreshTokens: { type: 'number', example: 150 },
        activeSessions: { type: 'number', example: 75 },
      },
    },
  })
  @ApiForbiddenResponse({ description: 'Acesso negado - requer SUPER_ADMIN' })
  @Roles('SUPER_ADMIN')
  @Post('cleanup/tokens')
  @HttpCode(HttpStatus.OK)
  async cleanupTokens(@CurrentUser() user: CurrentUserPayload) {
    return await this.adminService.manualTokenCleanup();
  }
}
