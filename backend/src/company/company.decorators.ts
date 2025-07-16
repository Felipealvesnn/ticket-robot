import { applyDecorators } from '@nestjs/common';
import {
  ApiBadRequestResponse,
  ApiBearerAuth,
  ApiConflictResponse,
  ApiNotFoundResponse,
  ApiOperation,
  ApiParam,
  ApiResponse,
  ApiUnauthorizedResponse,
} from '@nestjs/swagger';

export const CompanySwaggerEndpoint = {
  Create: () =>
    applyDecorators(
      ApiOperation({
        summary: 'Criar nova empresa',
        description:
          'Cria uma nova empresa no sistema. Apenas para usuários autenticados.',
      }),
      ApiResponse({
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
      }),
      ApiConflictResponse({
        description: 'Slug da empresa já está em uso',
        schema: {
          type: 'object',
          properties: {
            statusCode: { type: 'number', example: 409 },
            message: {
              type: 'string',
              example: 'Slug da empresa já está em uso',
            },
            error: { type: 'string', example: 'Conflict' },
          },
        },
      }),
      ApiBadRequestResponse({
        description: 'Dados de entrada inválidos',
      }),
      ApiUnauthorizedResponse({
        description: 'Token inválido ou usuário não autenticado',
      }),
      ApiBearerAuth(),
    ),

  FindAll: () =>
    applyDecorators(
      ApiOperation({
        summary: 'Listar todas as empresas',
        description:
          'Retorna uma lista de todas as empresas ativas no sistema.',
      }),
      ApiResponse({
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
      }),
      ApiUnauthorizedResponse({
        description: 'Token inválido ou usuário não autenticado',
      }),
      ApiBearerAuth(),
    ),

  FindOne: () =>
    applyDecorators(
      ApiOperation({
        summary: 'Buscar empresa por ID',
        description:
          'Retorna os detalhes de uma empresa específica, incluindo usuários e roles.',
      }),
      ApiParam({
        name: 'id',
        description: 'ID da empresa',
        example: 'clq1234567890abcdef',
      }),
      ApiResponse({
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
      }),
      ApiNotFoundResponse({
        description: 'Empresa não encontrada',
        schema: {
          type: 'object',
          properties: {
            statusCode: { type: 'number', example: 404 },
            message: { type: 'string', example: 'Empresa não encontrada' },
            error: { type: 'string', example: 'Not Found' },
          },
        },
      }),
      ApiUnauthorizedResponse({
        description: 'Token inválido ou usuário não autenticado',
      }),
      ApiBearerAuth(),
    ),

  FindBySlug: () =>
    applyDecorators(
      ApiOperation({
        summary: 'Buscar empresa por slug',
        description:
          'Retorna os detalhes de uma empresa usando seu slug único.',
      }),
      ApiParam({
        name: 'slug',
        description: 'Slug da empresa',
        example: 'minha-empresa',
      }),
      ApiResponse({
        status: 200,
        description: 'Empresa encontrada com sucesso',
      }),
      ApiNotFoundResponse({
        description: 'Empresa não encontrada',
      }),
      ApiUnauthorizedResponse({
        description: 'Token inválido ou usuário não autenticado',
      }),
      ApiBearerAuth(),
    ),

  Update: () =>
    applyDecorators(
      ApiOperation({
        summary: 'Atualizar empresa',
        description: 'Atualiza os dados de uma empresa existente.',
      }),
      ApiParam({
        name: 'id',
        description: 'ID da empresa',
        example: 'clq1234567890abcdef',
      }),
      ApiResponse({
        status: 200,
        description: 'Empresa atualizada com sucesso',
      }),
      ApiNotFoundResponse({
        description: 'Empresa não encontrada',
      }),
      ApiUnauthorizedResponse({
        description: 'Token inválido ou usuário não autenticado',
      }),
      ApiBearerAuth(),
    ),

  Remove: () =>
    applyDecorators(
      ApiOperation({
        summary: 'Remover empresa',
        description: 'Remove uma empresa do sistema (soft delete).',
      }),
      ApiParam({
        name: 'id',
        description: 'ID da empresa',
        example: 'clq1234567890abcdef',
      }),
      ApiResponse({
        status: 200,
        description: 'Empresa removida com sucesso',
        schema: {
          type: 'object',
          properties: {
            message: {
              type: 'string',
              example: 'Empresa removida com sucesso',
            },
          },
        },
      }),
      ApiNotFoundResponse({
        description: 'Empresa não encontrada',
      }),
      ApiUnauthorizedResponse({
        description: 'Token inválido ou usuário não autenticado',
      }),
      ApiBearerAuth(),
    ),

  AddUser: () =>
    applyDecorators(
      ApiOperation({
        summary: 'Adicionar usuário à empresa',
        description:
          'Adiciona um usuário existente à empresa com um role específico.',
      }),
      ApiParam({
        name: 'id',
        description: 'ID da empresa',
        example: 'clq1234567890abcdef',
      }),
      ApiResponse({
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
      }),
      ApiConflictResponse({
        description: 'Usuário já pertence a esta empresa',
      }),
      ApiNotFoundResponse({
        description: 'Empresa, usuário ou role não encontrado',
      }),
      ApiUnauthorizedResponse({
        description: 'Token inválido ou usuário não autenticado',
      }),
      ApiBearerAuth(),
    ),

  RemoveUser: () =>
    applyDecorators(
      ApiOperation({
        summary: 'Remover usuário da empresa',
        description: 'Remove um usuário da empresa (soft delete).',
      }),
      ApiParam({
        name: 'id',
        description: 'ID da empresa',
        example: 'clq1234567890abcdef',
      }),
      ApiParam({
        name: 'userId',
        description: 'ID do usuário',
        example: 'clq9876543210fedcba',
      }),
      ApiResponse({
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
      }),
      ApiNotFoundResponse({
        description: 'Usuário não está associado a esta empresa',
      }),
      ApiUnauthorizedResponse({
        description: 'Token inválido ou usuário não autenticado',
      }),
      ApiBearerAuth(),
    ),

  GetMyCompanies: () =>
    applyDecorators(
      ApiOperation({
        summary: 'Listar empresas do usuário atual',
        description:
          'Retorna todas as empresas das quais o usuário autenticado faz parte.',
      }),
      ApiResponse({
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
      }),
      ApiUnauthorizedResponse({
        description: 'Token inválido ou usuário não autenticado',
      }),
      ApiBearerAuth(),
    ),

  CreateWithUser: () =>
    applyDecorators(
      ApiOperation({
        summary: 'Criar empresa com usuário proprietário',
        description:
          'Cria uma nova empresa no sistema junto com um usuário proprietário. Endpoint público para registro inicial.',
      }),
      ApiResponse({
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
      }),
      ApiConflictResponse({
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
      }),
      ApiBadRequestResponse({
        description:
          'Dados de entrada inválidos ou role COMPANY_OWNER não encontrado',
      }),
    ),
};
