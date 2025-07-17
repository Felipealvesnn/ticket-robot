import { applyDecorators } from '@nestjs/common';
import {
  ApiBadRequestResponse,
  ApiBearerAuth,
  ApiConflictResponse,
  ApiOperation,
  ApiResponse,
  ApiUnauthorizedResponse,
} from '@nestjs/swagger';

export class AuthSwaggerEndpoint {
  static Login() {
    return applyDecorators(
      ApiOperation({
        summary: 'Fazer login no sistema',
        description:
          'Autentica o usuário e retorna tokens de acesso e refresh. Se for o primeiro login, indicará necessidade de trocar a senha.',
      }),
      ApiResponse({
        status: 200,
        description: 'Login realizado com sucesso',
        schema: {
          type: 'object',
          properties: {
            user: {
              type: 'object',
              properties: {
                id: { type: 'string', example: 'clq1234567890abcdef' },
                email: { type: 'string', example: 'admin@ticketrobot.com' },
                name: { type: 'string', example: 'Administrador Sistema' },
                isFirstLogin: { type: 'boolean', example: true },
              },
            },
            company: {
              type: 'object',
              properties: {
                id: { type: 'string', example: 'clq9876543210fedcba' },
                name: { type: 'string', example: 'Minha Empresa LTDA' },
                slug: { type: 'string', example: 'minha-empresa' },
              },
            },
            tokens: {
              type: 'object',
              properties: {
                accessToken: {
                  type: 'string',
                  example: 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...',
                },
                refreshToken: {
                  type: 'string',
                  example: 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...',
                },
              },
            },
            role: {
              type: 'object',
              properties: {
                name: { type: 'string', example: 'COMPANY_OWNER' },
                permissions: {
                  type: 'array',
                  items: { type: 'string' },
                  example: ['manage_company', 'manage_users', 'view_reports'],
                },
              },
            },
            isFirstLogin: {
              type: 'boolean',
              example: true,
              description: 'Indica se o usuário precisa trocar a senha',
            },
          },
        },
      }),
      ApiUnauthorizedResponse({
        description: 'Email ou senha inválidos',
        schema: {
          type: 'object',
          properties: {
            statusCode: { type: 'number', example: 401 },
            message: { type: 'string', example: 'Email ou senha inválidos' },
            error: { type: 'string', example: 'Unauthorized' },
          },
        },
      }),
      ApiBadRequestResponse({
        description: 'Dados de entrada inválidos',
        schema: {
          type: 'object',
          properties: {
            statusCode: { type: 'number', example: 400 },
            message: {
              type: 'array',
              items: { type: 'string' },
              example: [
                'email must be an email',
                'password must be longer than or equal to 6 characters',
              ],
            },
            error: { type: 'string', example: 'Bad Request' },
          },
        },
      }),
    );
  }

  static Register() {
    return applyDecorators(
      ApiOperation({
        summary: 'Registrar novo usuário',
        description:
          'Cria uma nova conta de usuário com senha padrão "123". O usuário precisará trocar a senha no primeiro login.',
      }),
      ApiResponse({
        status: 201,
        description: 'Usuário criado com sucesso',
        schema: {
          type: 'object',
          properties: {
            user: {
              type: 'object',
              properties: {
                id: { type: 'string', example: 'clq1234567890abcdef' },
                email: { type: 'string', example: 'usuario@empresa.com' },
                name: { type: 'string', example: 'João Silva' },
                isFirstLogin: { type: 'boolean', example: true },
                createdAt: { type: 'string', format: 'date-time' },
              },
            },
            message: {
              type: 'string',
              example: 'Usuário criado com sucesso. Senha inicial: 123',
            },
          },
        },
      }),
      ApiConflictResponse({
        description: 'Email já está em uso',
        schema: {
          type: 'object',
          properties: {
            statusCode: { type: 'number', example: 409 },
            message: { type: 'string', example: 'Email já está em uso' },
            error: { type: 'string', example: 'Conflict' },
          },
        },
      }),
      ApiBadRequestResponse({
        description: 'Dados de entrada inválidos',
        schema: {
          type: 'object',
          properties: {
            statusCode: { type: 'number', example: 400 },
            message: {
              type: 'array',
              items: { type: 'string' },
              example: [
                'email must be an email',
                'password must be longer than or equal to 6 characters',
              ],
            },
            error: { type: 'string', example: 'Bad Request' },
          },
        },
      }),
    );
  }

  static RefreshToken() {
    return applyDecorators(
      ApiOperation({
        summary: 'Renovar token de acesso',
        description:
          'Renova o access token usando o refresh token. Use este endpoint quando o access token expirar.',
      }),
      ApiResponse({
        status: 200,
        description: 'Token renovado com sucesso',
        schema: {
          type: 'object',
          properties: {
            accessToken: {
              type: 'string',
              example: 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...',
            },
            refreshToken: {
              type: 'string',
              example: 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...',
            },
          },
        },
      }),
      ApiUnauthorizedResponse({
        description: 'Refresh token inválido ou expirado',
        schema: {
          type: 'object',
          properties: {
            statusCode: { type: 'number', example: 401 },
            message: {
              type: 'string',
              example: 'Refresh token inválido ou expirado',
            },
            error: { type: 'string', example: 'Unauthorized' },
          },
        },
      }),
    );
  }

  static Logout() {
    return applyDecorators(
      ApiOperation({
        summary: 'Fazer logout',
        description:
          'Invalida o token atual e faz logout do usuário. O token não poderá mais ser usado.',
      }),
      ApiBearerAuth(),
      ApiResponse({
        status: 200,
        description: 'Logout realizado com sucesso',
        schema: {
          type: 'object',
          properties: {
            message: {
              type: 'string',
              example: 'Logout realizado com sucesso',
            },
          },
        },
      }),
      ApiUnauthorizedResponse({
        description: 'Token inválido ou usuário não autenticado',
      }),
    );
  }

  static ChangePassword() {
    return applyDecorators(
      ApiOperation({
        summary: 'Trocar senha do usuário',
        description:
          'Permite ao usuário trocar sua senha. Funciona tanto para primeiro login quanto para trocas posteriores.',
      }),
      ApiBearerAuth(),
      ApiResponse({
        status: 200,
        description: 'Senha alterada com sucesso',
        schema: {
          type: 'object',
          properties: {
            message: {
              type: 'string',
              example: 'Senha alterada com sucesso. Faça login novamente.',
            },
          },
        },
      }),
      ApiUnauthorizedResponse({
        description: 'Token inválido ou senha atual incorreta',
        schema: {
          type: 'object',
          properties: {
            statusCode: { type: 'number', example: 401 },
            message: { type: 'string', example: 'Senha atual incorreta' },
            error: { type: 'string', example: 'Unauthorized' },
          },
        },
      }),
      ApiConflictResponse({
        description: 'Nova senha deve ser diferente da atual',
        schema: {
          type: 'object',
          properties: {
            statusCode: { type: 'number', example: 409 },
            message: {
              type: 'string',
              example: 'A nova senha deve ser diferente da senha atual',
            },
            error: { type: 'string', example: 'Conflict' },
          },
        },
      }),
    );
  }

  static ChangeFirstLoginPassword() {
    return applyDecorators(
      ApiOperation({
        summary: 'Trocar senha no primeiro login',
        description:
          'Permite ao usuário trocar a senha temporária no primeiro login. Após a troca, o flag isFirstLogin será definido como false.',
      }),
      ApiBearerAuth(),
      ApiResponse({
        status: 200,
        description: 'Senha alterada com sucesso',
        schema: {
          type: 'object',
          properties: {
            message: { type: 'string', example: 'Senha alterada com sucesso' },
            user: {
              type: 'object',
              properties: {
                id: { type: 'string', example: 'clq1234567890abcdef' },
                email: { type: 'string', example: 'admin@ticketrobot.com' },
                name: { type: 'string', example: 'Administrador Sistema' },
                isFirstLogin: { type: 'boolean', example: false },
              },
            },
            tokens: {
              type: 'object',
              properties: {
                accessToken: {
                  type: 'string',
                  example: 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...',
                },
                refreshToken: {
                  type: 'string',
                  example: 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...',
                },
              },
            },
          },
        },
      }),
      ApiUnauthorizedResponse({
        description: 'Token inválido ou senha atual incorreta',
        schema: {
          type: 'object',
          properties: {
            statusCode: { type: 'number', example: 401 },
            message: { type: 'string', example: 'Senha atual incorreta' },
            error: { type: 'string', example: 'Unauthorized' },
          },
        },
      }),
      ApiBadRequestResponse({
        description:
          'Dados de entrada inválidos ou usuário não está em primeiro login',
        schema: {
          type: 'object',
          properties: {
            statusCode: { type: 'number', example: 400 },
            message: {
              type: 'string',
              example: 'Usuário não está em primeiro login',
            },
            error: { type: 'string', example: 'Bad Request' },
          },
        },
      }),
    );
  }

  static Verify() {
    return applyDecorators(
      ApiOperation({
        summary: 'Verificar token e obter perfil do usuário',
        description:
          'Verifica se o token é válido e retorna os dados do usuário autenticado',
      }),
      ApiBearerAuth(),
      ApiResponse({
        status: 200,
        description: 'Token válido, dados do usuário retornados',
        schema: {
          type: 'object',
          properties: {
            userId: { type: 'string', example: 'clq1234567890abcdef' },
            email: { type: 'string', example: 'usuario@empresa.com' },
            companyId: {
              type: 'string',
              nullable: true,
              example: 'clq9876543210fedcba',
            },
            roleName: {
              type: 'string',
              nullable: true,
              example: 'COMPANY_OWNER',
            },
            permissions: {
              type: 'array',
              items: { type: 'string' },
              example: ['manage_company', 'manage_users', 'view_reports'],
            },
            user: {
              type: 'object',
              properties: {
                id: { type: 'string', example: 'clq1234567890abcdef' },
                email: { type: 'string', example: 'usuario@empresa.com' },
                name: { type: 'string', example: 'João Silva' },
                avatar: {
                  type: 'string',
                  nullable: true,
                  example: 'https://exemplo.com/avatar.jpg',
                },
                companies: {
                  type: 'array',
                  items: {
                    type: 'object',
                    properties: {
                      id: { type: 'string' },
                      name: { type: 'string' },
                      slug: { type: 'string' },
                      role: {
                        type: 'object',
                        properties: {
                          id: { type: 'string' },
                          name: { type: 'string' },
                          permissions: {
                            type: 'array',
                            items: { type: 'string' },
                          },
                        },
                      },
                    },
                  },
                },
                currentCompany: {
                  type: 'object',
                  nullable: true,
                  properties: {
                    id: { type: 'string' },
                    name: { type: 'string' },
                    slug: { type: 'string' },
                    role: {
                      type: 'object',
                      properties: {
                        id: { type: 'string' },
                        name: { type: 'string' },
                        permissions: {
                          type: 'array',
                          items: { type: 'string' },
                        },
                      },
                    },
                  },
                },
              },
            },
            currentCompany: {
              type: 'object',
              nullable: true,
              properties: {
                id: { type: 'string', example: 'clq9876543210fedcba' },
                name: { type: 'string', example: 'Minha Empresa LTDA' },
                slug: { type: 'string', example: 'minha-empresa' },
                role: {
                  type: 'object',
                  properties: {
                    id: { type: 'string' },
                    name: { type: 'string' },
                    permissions: { type: 'array', items: { type: 'string' } },
                  },
                },
              },
            },
          },
        },
      }),
      ApiUnauthorizedResponse({
        description: 'Token inválido ou usuário não autenticado',
      }),
    );
  }
}
