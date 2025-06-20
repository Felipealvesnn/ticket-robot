/* eslint-disable prettier/prettier */
import {
  Controller,
  Get,
  Post,
  Body,
  Patch,
  Param,
  Delete,
  UseGuards,
  HttpCode,
  HttpStatus,
} from '@nestjs/common';
import {
  ApiTags,
  ApiOperation,
  ApiResponse,
  ApiBearerAuth,
  ApiParam,
  ApiUnauthorizedResponse,
  ApiBadRequestResponse,
  ApiConflictResponse,
  ApiNotFoundResponse,
} from '@nestjs/swagger';
import { CompanyService } from './company.service';
import {
  CreateCompanyDto,
  UpdateCompanyDto,
  AddUserToCompanyDto,
  CreateCompanyWithUserDto,
} from './dto/company.dto';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { CurrentUser } from '../auth/decorators/current-user.decorator';

@ApiTags('Empresas')
@Controller('company')
export class CompanyController {
  constructor(private readonly companyService: CompanyService) {}

  @ApiOperation({
    summary: 'Criar nova empresa',
    description:
      'Cria uma nova empresa no sistema. Apenas para usuários autenticados.',
  })
  @ApiResponse({
    status: 201,
    description: 'Empresa criada com sucesso',
    schema: {
      type: 'object',
      properties: {
        id: { type: 'string', example: 'clq1234567890abcdef' },
        name: { type: 'string', example: 'Minha Empresa LTDA' },
        slug: { type: 'string', example: 'minha-empresa' },
        plan: { type: 'string', example: 'FREE' },
        isActive: { type: 'boolean', example: true },
        createdAt: { type: 'string', format: 'date-time' },
        companyUsers: {
          type: 'array',
          items: { type: 'object' },
        },
        _count: {
          type: 'object',
          properties: {
            companyUsers: { type: 'number', example: 0 },
          },
        },
      },
    },
  })
  @ApiConflictResponse({
    description: 'Slug da empresa já está em uso',
    schema: {
      type: 'object',
      properties: {
        statusCode: { type: 'number', example: 409 },
        message: { type: 'string', example: 'Slug da empresa já está em uso' },
        error: { type: 'string', example: 'Conflict' },
      },
    },
  })
  @ApiBadRequestResponse({
    description: 'Dados de entrada inválidos',
  })
  @ApiUnauthorizedResponse({
    description: 'Token inválido ou usuário não autenticado',
  })
  @ApiBearerAuth()
  @Post()
  @UseGuards(JwtAuthGuard)
  @HttpCode(HttpStatus.CREATED)
  async create(@Body() createCompanyDto: CreateCompanyDto) {
    return await this.companyService.create(createCompanyDto);
  }

  @ApiOperation({
    summary: 'Listar todas as empresas',
    description: 'Retorna uma lista de todas as empresas ativas no sistema.',
  })
  @ApiResponse({
    status: 200,
    description: 'Lista de empresas retornada com sucesso',
    schema: {
      type: 'array',
      items: {
        type: 'object',
        properties: {
          id: { type: 'string', example: 'clq1234567890abcdef' },
          name: { type: 'string', example: 'Minha Empresa LTDA' },
          slug: { type: 'string', example: 'minha-empresa' },
          plan: { type: 'string', example: 'FREE' },
          isActive: { type: 'boolean', example: true },
          createdAt: { type: 'string', format: 'date-time' },
          _count: {
            type: 'object',
            properties: {
              companyUsers: { type: 'number', example: 5 },
            },
          },
        },
      },
    },
  })
  @ApiUnauthorizedResponse({
    description: 'Token inválido ou usuário não autenticado',
  })
  @ApiBearerAuth()
  @Get()
  @UseGuards(JwtAuthGuard)
  async findAll() {
    return await this.companyService.findAll();
  }

  @ApiOperation({
    summary: 'Buscar empresa por ID',
    description:
      'Retorna os detalhes de uma empresa específica, incluindo usuários e roles.',
  })
  @ApiParam({
    name: 'id',
    description: 'ID da empresa',
    example: 'clq1234567890abcdef',
  })
  @ApiResponse({
    status: 200,
    description: 'Empresa encontrada com sucesso',
    schema: {
      type: 'object',
      properties: {
        id: { type: 'string', example: 'clq1234567890abcdef' },
        name: { type: 'string', example: 'Minha Empresa LTDA' },
        slug: { type: 'string', example: 'minha-empresa' },
        plan: { type: 'string', example: 'FREE' },
        isActive: { type: 'boolean', example: true },
        createdAt: { type: 'string', format: 'date-time' },
        companyUsers: {
          type: 'array',
          items: {
            type: 'object',
            properties: {
              user: {
                type: 'object',
                properties: {
                  id: { type: 'string', example: 'clq9876543210fedcba' },
                  email: { type: 'string', example: 'usuario@empresa.com' },
                  name: { type: 'string', example: 'João Silva' },
                },
              },
              role: {
                type: 'object',
                properties: {
                  id: { type: 'string', example: 'clq5555555555555555' },
                  name: { type: 'string', example: 'COMPANY_OWNER' },
                },
              },
            },
          },
        },
      },
    },
  })
  @ApiNotFoundResponse({
    description: 'Empresa não encontrada',
    schema: {
      type: 'object',
      properties: {
        statusCode: { type: 'number', example: 404 },
        message: { type: 'string', example: 'Empresa não encontrada' },
        error: { type: 'string', example: 'Not Found' },
      },
    },
  })
  @ApiUnauthorizedResponse({
    description: 'Token inválido ou usuário não autenticado',
  })
  @ApiBearerAuth()
  @Get(':id')
  @UseGuards(JwtAuthGuard)
  async findOne(@Param('id') id: string) {
    return await this.companyService.findOne(id);
  }

  @ApiOperation({
    summary: 'Buscar empresa por slug',
    description: 'Retorna os detalhes de uma empresa usando seu slug único.',
  })
  @ApiParam({
    name: 'slug',
    description: 'Slug da empresa',
    example: 'minha-empresa',
  })
  @ApiResponse({
    status: 200,
    description: 'Empresa encontrada com sucesso',
  })
  @ApiNotFoundResponse({
    description: 'Empresa não encontrada',
  })
  @ApiUnauthorizedResponse({
    description: 'Token inválido ou usuário não autenticado',
  })
  @ApiBearerAuth()
  @Get('slug/:slug')
  @UseGuards(JwtAuthGuard)
  async findBySlug(@Param('slug') slug: string) {
    return await this.companyService.findBySlug(slug);
  }

  @ApiOperation({
    summary: 'Atualizar empresa',
    description: 'Atualiza os dados de uma empresa existente.',
  })
  @ApiParam({
    name: 'id',
    description: 'ID da empresa',
    example: 'clq1234567890abcdef',
  })
  @ApiResponse({
    status: 200,
    description: 'Empresa atualizada com sucesso',
  })
  @ApiNotFoundResponse({
    description: 'Empresa não encontrada',
  })
  @ApiUnauthorizedResponse({
    description: 'Token inválido ou usuário não autenticado',
  })
  @ApiBearerAuth()
  @Patch(':id')
  @UseGuards(JwtAuthGuard)
  async update(
    @Param('id') id: string,
    @Body() updateCompanyDto: UpdateCompanyDto,
  ) {
    return await this.companyService.update(id, updateCompanyDto);
  }

  @ApiOperation({
    summary: 'Remover empresa',
    description: 'Remove uma empresa do sistema (soft delete).',
  })
  @ApiParam({
    name: 'id',
    description: 'ID da empresa',
    example: 'clq1234567890abcdef',
  })
  @ApiResponse({
    status: 200,
    description: 'Empresa removida com sucesso',
    schema: {
      type: 'object',
      properties: {
        message: { type: 'string', example: 'Empresa removida com sucesso' },
      },
    },
  })
  @ApiNotFoundResponse({
    description: 'Empresa não encontrada',
  })
  @ApiUnauthorizedResponse({
    description: 'Token inválido ou usuário não autenticado',
  })
  @ApiBearerAuth()
  @Delete(':id')
  @UseGuards(JwtAuthGuard)
  async remove(@Param('id') id: string) {
    return await this.companyService.remove(id);
  }

  @ApiOperation({
    summary: 'Adicionar usuário à empresa',
    description:
      'Adiciona um usuário existente à empresa com um role específico.',
  })
  @ApiParam({
    name: 'id',
    description: 'ID da empresa',
    example: 'clq1234567890abcdef',
  })
  @ApiResponse({
    status: 201,
    description: 'Usuário adicionado à empresa com sucesso',
    schema: {
      type: 'object',
      properties: {
        message: {
          type: 'string',
          example: 'Usuário adicionado à empresa com sucesso',
        },
        companyUser: {
          type: 'object',
          properties: {
            user: {
              type: 'object',
              properties: {
                id: { type: 'string', example: 'clq9876543210fedcba' },
                email: { type: 'string', example: 'usuario@empresa.com' },
                name: { type: 'string', example: 'João Silva' },
              },
            },
            role: {
              type: 'object',
              properties: {
                id: { type: 'string', example: 'clq5555555555555555' },
                name: { type: 'string', example: 'MANAGER' },
              },
            },
          },
        },
      },
    },
  })
  @ApiConflictResponse({
    description: 'Usuário já pertence a esta empresa',
  })
  @ApiNotFoundResponse({
    description: 'Empresa, usuário ou role não encontrado',
  })
  @ApiUnauthorizedResponse({
    description: 'Token inválido ou usuário não autenticado',
  })
  @ApiBearerAuth()
  @Post(':id/users')
  @UseGuards(JwtAuthGuard)
  @HttpCode(HttpStatus.CREATED)
  async addUser(
    @Param('id') id: string,
    @Body() addUserDto: AddUserToCompanyDto,
  ) {
    return await this.companyService.addUser(id, addUserDto);
  }

  @ApiOperation({
    summary: 'Remover usuário da empresa',
    description: 'Remove um usuário da empresa (soft delete).',
  })
  @ApiParam({
    name: 'id',
    description: 'ID da empresa',
    example: 'clq1234567890abcdef',
  })
  @ApiParam({
    name: 'userId',
    description: 'ID do usuário',
    example: 'clq9876543210fedcba',
  })
  @ApiResponse({
    status: 200,
    description: 'Usuário removido da empresa com sucesso',
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
  @ApiNotFoundResponse({
    description: 'Usuário não está associado a esta empresa',
  })
  @ApiUnauthorizedResponse({
    description: 'Token inválido ou usuário não autenticado',
  })
  @ApiBearerAuth()
  @Delete(':id/users/:userId')
  @UseGuards(JwtAuthGuard)
  async removeUser(@Param('id') id: string, @Param('userId') userId: string) {
    return await this.companyService.removeUser(id, userId);
  }

  @ApiOperation({
    summary: 'Listar empresas do usuário atual',
    description:
      'Retorna todas as empresas das quais o usuário autenticado faz parte.',
  })
  @ApiResponse({
    status: 200,
    description: 'Empresas do usuário retornadas com sucesso',
    schema: {
      type: 'array',
      items: {
        type: 'object',
        properties: {
          company: {
            type: 'object',
            properties: {
              id: { type: 'string', example: 'clq1234567890abcdef' },
              name: { type: 'string', example: 'Minha Empresa LTDA' },
              slug: { type: 'string', example: 'minha-empresa' },
              plan: { type: 'string', example: 'FREE' },
            },
          },
          role: {
            type: 'object',
            properties: {
              id: { type: 'string', example: 'clq5555555555555555' },
              name: { type: 'string', example: 'COMPANY_OWNER' },
            },
          },
        },
      },
    },
  })
  @ApiUnauthorizedResponse({
    description: 'Token inválido ou usuário não autenticado',
  })
  @ApiBearerAuth()
  @Get('my/companies')
  @UseGuards(JwtAuthGuard)
  async getMyCompanies(@CurrentUser() user: any) {
    return await this.companyService.getUserCompanies(user.userId);
  }

  @ApiOperation({
    summary: 'Criar empresa com usuário proprietário',
    description:
      'Cria uma nova empresa no sistema junto com um usuário proprietário. Endpoint público para registro inicial.',
  })
  @ApiResponse({
    status: 201,
    description: 'Empresa e usuário proprietário criados com sucesso',
    schema: {
      type: 'object',
      properties: {
        message: {
          type: 'string',
          example: 'Empresa e usuário proprietário criados com sucesso',
        },
        user: {
          type: 'object',
          properties: {
            id: { type: 'string', example: 'clq1234567890abcdef' },
            email: { type: 'string', example: 'proprietario@empresa.com' },
            name: { type: 'string', example: 'João Silva' },
            avatar: { type: 'string', nullable: true, example: null },
          },
        },
        company: {
          type: 'object',
          properties: {
            id: { type: 'string', example: 'clq9876543210fedcba' },
            name: { type: 'string', example: 'Minha Empresa LTDA' },
            slug: { type: 'string', example: 'minha-empresa' },
            plan: { type: 'string', example: 'FREE' },
          },
        },
        role: {
          type: 'object',
          properties: {
            id: { type: 'string', example: 'clq5555555555555555' },
            name: { type: 'string', example: 'COMPANY_OWNER' },
          },
        },
      },
    },
  })
  @ApiConflictResponse({
    description: 'Email ou slug da empresa já está em uso',
    schema: {
      type: 'object',
      properties: {
        statusCode: { type: 'number', example: 409 },
        message: {
          type: 'string',
          example: 'Email já está em uso',
        },
        error: { type: 'string', example: 'Conflict' },
      },
    },
  })
  @ApiBadRequestResponse({
    description:
      'Dados de entrada inválidos ou role COMPANY_OWNER não encontrado',
  })
  @Post('with-user')
  @HttpCode(HttpStatus.CREATED)
  async createWithUser(
    @Body() createCompanyWithUserDto: CreateCompanyWithUserDto,
  ) {
    return await this.companyService.createWithUser(createCompanyWithUserDto);
  }
}
