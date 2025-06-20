/* eslint-disable prettier/prettier */
import {
  Controller,
  Post,
  Body,
  HttpCode,
  HttpStatus,
  UseGuards,
  Get,
  Request,
} from '@nestjs/common';
import {
  ApiTags,
  ApiOperation,
  ApiResponse,
  ApiBearerAuth,
  ApiBody,
  ApiUnauthorizedResponse,
  ApiBadRequestResponse,
  ApiConflictResponse,
} from '@nestjs/swagger';
import { AuthService } from './auth.service';
import {
  LoginDto,
  RegisterDto,
  RefreshTokenDto,
  ChangeCompanyDto,
  FirstLoginPasswordDto,
} from './dto/auth.dto';
import { JwtAuthGuard } from './guards/jwt-auth.guard';
import { CurrentUser } from './decorators/current-user.decorator';

@ApiTags('Autenticação')
@Controller('auth')
export class AuthController {
  constructor(private readonly authService: AuthService) {}
  @ApiOperation({
    summary: 'Fazer login no sistema',
    description:
      'Autentica o usuário e retorna tokens de acesso e refresh. Se for o primeiro login, indicará necessidade de trocar a senha.',
  })
  @ApiResponse({
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
      },
    },
  })
  @ApiUnauthorizedResponse({
    description: 'Email ou senha inválidos',
    schema: {
      type: 'object',
      properties: {
        statusCode: { type: 'number', example: 401 },
        message: { type: 'string', example: 'Email ou senha inválidos' },
        error: { type: 'string', example: 'Unauthorized' },
      },
    },
  })
  @ApiBadRequestResponse({
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
  })
  @Post('login')
  @HttpCode(HttpStatus.OK)
  async login(@Body() loginDto: LoginDto) {
    return await this.authService.login(loginDto);
  }
  @ApiOperation({
    summary: 'Registrar nova conta',
    description:
      'Cria uma nova conta de usuário com empresa. O usuário será automaticamente definido como COMPANY_OWNER da empresa criada.',
  })
  @ApiResponse({
    status: 201,
    description: 'Usuário e empresa criados com sucesso',
    schema: {
      type: 'object',
      properties: {
        user: {
          type: 'object',
          properties: {
            id: { type: 'string', example: 'clq1234567890abcdef' },
            email: { type: 'string', example: 'usuario@empresa.com' },
            name: { type: 'string', example: 'João Silva' },
            isFirstLogin: { type: 'boolean', example: false },
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
      },
    },
  })
  @ApiConflictResponse({
    description: 'Email ou slug da empresa já existe',
    schema: {
      type: 'object',
      properties: {
        statusCode: { type: 'number', example: 409 },
        message: { type: 'string', example: 'Email já está em uso' },
        error: { type: 'string', example: 'Conflict' },
      },
    },
  })
  @ApiBadRequestResponse({
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
  })
  @Post('register')
  @HttpCode(HttpStatus.CREATED)
  async register(@Body() registerDto: RegisterDto) {
    return await this.authService.register(registerDto);
  }
  @ApiOperation({
    summary: 'Renovar token de acesso',
    description:
      'Renova o access token usando o refresh token. Use este endpoint quando o access token expirar.',
  })
  @ApiResponse({
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
  })
  @ApiUnauthorizedResponse({
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
  })
  @Post('refresh')
  @HttpCode(HttpStatus.OK)
  async refreshToken(@Body() refreshTokenDto: RefreshTokenDto) {
    return await this.authService.refreshToken(refreshTokenDto);
  }
  @ApiOperation({
    summary: 'Trocar contexto de empresa',
    description:
      'Permite ao usuário trocar para outra empresa da qual ele faz parte. Retorna novos tokens com o contexto da nova empresa.',
  })
  @ApiBearerAuth()
  @ApiResponse({
    status: 200,
    description: 'Contexto de empresa alterado com sucesso',
    schema: {
      type: 'object',
      properties: {
        user: {
          type: 'object',
          properties: {
            id: { type: 'string', example: 'clq1234567890abcdef' },
            email: { type: 'string', example: 'usuario@empresa.com' },
            name: { type: 'string', example: 'João Silva' },
          },
        },
        company: {
          type: 'object',
          properties: {
            id: { type: 'string', example: 'clq9876543210fedcba' },
            name: { type: 'string', example: 'Nova Empresa LTDA' },
            slug: { type: 'string', example: 'nova-empresa' },
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
            name: { type: 'string', example: 'MANAGER' },
            permissions: {
              type: 'array',
              items: { type: 'string' },
              example: ['view_reports', 'manage_tickets'],
            },
          },
        },
      },
    },
  })
  @ApiUnauthorizedResponse({
    description: 'Token inválido ou usuário não autenticado',
  })
  @ApiBadRequestResponse({
    description: 'Usuário não pertence à empresa especificada',
    schema: {
      type: 'object',
      properties: {
        statusCode: { type: 'number', example: 400 },
        message: {
          type: 'string',
          example: 'Usuário não pertence a esta empresa',
        },
        error: { type: 'string', example: 'Bad Request' },
      },
    },
  })
  @Post('change-company')
  @UseGuards(JwtAuthGuard)
  @HttpCode(HttpStatus.OK)
  async changeCompany(
    @CurrentUser() user: any,
    @Body() changeCompanyDto: ChangeCompanyDto,
  ) {
    return await this.authService.changeCompany(user.userId, changeCompanyDto);
  }
  @ApiOperation({
    summary: 'Fazer logout',
    description:
      'Invalida o token atual e faz logout do usuário. O token não poderá mais ser usado.',
  })
  @ApiBearerAuth()
  @ApiResponse({
    status: 200,
    description: 'Logout realizado com sucesso',
    schema: {
      type: 'object',
      properties: {
        message: { type: 'string', example: 'Logout realizado com sucesso' },
      },
    },
  })
  @ApiUnauthorizedResponse({
    description: 'Token inválido ou usuário não autenticado',
  })
  @Post('logout')
  @UseGuards(JwtAuthGuard)
  @HttpCode(HttpStatus.OK)
  async logout(@Request() req: any) {
    const token = req.headers.authorization?.replace('Bearer ', '');
    await this.authService.logout(token);
    return { message: 'Logout realizado com sucesso' };
  }
  @ApiOperation({
    summary: 'Trocar senha no primeiro login',
    description:
      'Permite ao usuário trocar a senha temporária no primeiro login. Após a troca, o flag isFirstLogin será definido como false.',
  })
  @ApiBearerAuth()
  @ApiResponse({
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
  })
  @ApiUnauthorizedResponse({
    description: 'Token inválido ou senha atual incorreta',
    schema: {
      type: 'object',
      properties: {
        statusCode: { type: 'number', example: 401 },
        message: { type: 'string', example: 'Senha atual incorreta' },
        error: { type: 'string', example: 'Unauthorized' },
      },
    },
  })
  @ApiBadRequestResponse({
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
  })
  @Post('change-first-login-password')
  @UseGuards(JwtAuthGuard)
  @HttpCode(HttpStatus.OK)
  async changeFirstLoginPassword(
    @CurrentUser() user: any,
    @Body() firstLoginPasswordDto: FirstLoginPasswordDto,
  ) {
    return await this.authService.changeFirstLoginPassword(
      user.userId,
      firstLoginPasswordDto,
    );
  }
  @ApiOperation({
    summary: 'Obter perfil do usuário atual',
    description:
      'Retorna as informações do usuário autenticado, incluindo dados da empresa atual e permissões.',
  })
  @ApiBearerAuth()
  @ApiResponse({
    status: 200,
    description: 'Perfil do usuário retornado com sucesso',
    schema: {
      type: 'object',
      properties: {
        userId: { type: 'string', example: 'clq1234567890abcdef' },
        email: { type: 'string', example: 'usuario@empresa.com' },
        companyId: { type: 'string', example: 'clq9876543210fedcba' },
        roleName: { type: 'string', example: 'COMPANY_OWNER' },
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
          },
        },
        company: {
          type: 'object',
          nullable: true,
          properties: {
            id: { type: 'string', example: 'clq9876543210fedcba' },
            name: { type: 'string', example: 'Minha Empresa LTDA' },
            slug: { type: 'string', example: 'minha-empresa' },
          },
        },
      },
    },
  })
  @ApiUnauthorizedResponse({
    description: 'Token inválido ou usuário não autenticado',
  })
  @Get('me')
  @UseGuards(JwtAuthGuard)
  async getProfile(@CurrentUser() user: any) {
    return {
      userId: user.userId,
      email: user.email,
      companyId: user.companyId,
      roleName: user.roleName,
      permissions: user.permissions,
      user: {
        id: user.user.id,
        email: user.user.email,
        name: user.user.name,
        avatar: user.user.avatar,
      },
      company: user.company
        ? {
            id: user.company.id,
            name: user.company.name,
            slug: user.company.slug,
          }
        : null,
    };
  }
}
