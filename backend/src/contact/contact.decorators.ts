import { applyDecorators } from '@nestjs/common';
import {
  ApiBadRequestResponse,
  ApiBearerAuth,
  ApiConflictResponse,
  ApiForbiddenResponse,
  ApiNotFoundResponse,
  ApiOperation,
  ApiParam,
  ApiQuery,
  ApiResponse,
  ApiUnauthorizedResponse,
} from '@nestjs/swagger';

export const ContactSwaggerEndpoint = {
  Create: () =>
    applyDecorators(
      ApiOperation({
        summary: 'Criar novo contato',
        description: 'Cria um novo contato para a empresa.',
      }),
      ApiResponse({
        status: 201,
        description: 'Contato criado com sucesso',
        schema: {
          type: 'object',
          properties: {
            id: { type: 'string', example: 'clq1234567890abcdef' },
            phoneNumber: { type: 'string', example: '+5511999999999' },
            name: { type: 'string', example: 'João Silva' },
            whatsappSession: {
              type: 'object',
              properties: {
                id: { type: 'string', example: 'clq9876543210fedcba' },
                name: { type: 'string', example: 'Sessão Principal' },
              },
            },
            _count: {
              type: 'object',
              properties: {
                messages: { type: 'number', example: 0 },
                tickets: { type: 'number', example: 0 },
              },
            },
          },
        },
      }),
      ApiConflictResponse({
        description: 'Contato com este número já existe nesta empresa',
      }),
      ApiBadRequestResponse({
        description:
          'Sessão do WhatsApp não encontrada ou não pertence à empresa',
      }),
      ApiUnauthorizedResponse({
        description: 'Token inválido ou usuário não autenticado',
      }),
      ApiBearerAuth(),
    ),

  FindAll: () =>
    applyDecorators(
      ApiOperation({
        summary: 'Listar contatos da empresa',
        description:
          'Retorna todos os contatos da empresa com filtros opcionais.',
      }),
      ApiQuery({
        name: 'messagingSessionId',
        required: false,
        description: 'Filtrar por sessão do WhatsApp',
        type: 'string',
      }),
      ApiQuery({
        name: 'isBlocked',
        required: false,
        description: 'Filtrar por status de bloqueio',
        type: 'boolean',
      }),
      ApiResponse({
        status: 200,
        description: 'Lista de contatos retornada com sucesso',
        schema: {
          type: 'object',
          properties: {
            contacts: {
              type: 'array',
              items: {
                type: 'object',
                properties: {
                  id: { type: 'string', example: 'clq1234567890abcdef' },
                  phoneNumber: { type: 'string', example: '+5511999999999' },
                  name: { type: 'string', example: 'João Silva' },
                  lastMessage: {
                    type: 'string',
                    example: 'Olá, gostaria de informações...',
                  },
                  lastMessageAt: { type: 'string', format: 'date-time' },
                  isBlocked: { type: 'boolean', example: false },
                  _count: {
                    type: 'object',
                    properties: {
                      messages: { type: 'number', example: 15 },
                      tickets: { type: 'number', example: 2 },
                    },
                  },
                },
              },
            },
            total: { type: 'number', example: 10 },
            hasMore: { type: 'boolean', example: false },
          },
        },
      }),
      ApiUnauthorizedResponse({
        description: 'Token inválido ou usuário não autenticado',
      }),
      ApiBearerAuth(),
    ),

  GetRecentContacts: () =>
    applyDecorators(
      ApiOperation({
        summary: 'Buscar contatos recentes',
        description: 'Retorna os contatos que enviaram mensagens recentemente.',
      }),
      ApiQuery({
        name: 'limit',
        required: false,
        description: 'Número máximo de contatos a retornar',
        type: 'number',
        example: 20,
      }),
      ApiResponse({
        status: 200,
        description: 'Contatos recentes retornados com sucesso',
        schema: {
          type: 'array',
          items: {
            type: 'object',
            properties: {
              id: { type: 'string', example: 'clq1234567890abcdef' },
              phoneNumber: { type: 'string', example: '+5511999999999' },
              name: { type: 'string', example: 'João Silva' },
              lastMessageAt: { type: 'string', format: 'date-time' },
              isBlocked: { type: 'boolean', example: false },
            },
          },
        },
      }),
      ApiUnauthorizedResponse({
        description: 'Token inválido ou usuário não autenticado',
      }),
      ApiBearerAuth(),
    ),

  SearchContacts: () =>
    applyDecorators(
      ApiOperation({
        summary: 'Pesquisar contatos',
        description: 'Pesquisa contatos por nome ou número de telefone.',
      }),
      ApiQuery({
        name: 'q',
        required: true,
        description: 'Termo de pesquisa (nome ou número)',
        type: 'string',
        example: 'João',
      }),
      ApiResponse({
        status: 200,
        description: 'Resultados da pesquisa retornados com sucesso',
        schema: {
          type: 'array',
          items: {
            type: 'object',
            properties: {
              id: { type: 'string', example: 'clq1234567890abcdef' },
              phoneNumber: { type: 'string', example: '+5511999999999' },
              name: { type: 'string', example: 'João Silva' },
              isBlocked: { type: 'boolean', example: false },
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
        summary: 'Buscar contato por ID',
        description:
          'Retorna os detalhes completos de um contato, incluindo mensagens e tickets.',
      }),
      ApiParam({
        name: 'id',
        description: 'ID do contato',
        example: 'clq1234567890abcdef',
      }),
      ApiResponse({
        status: 200,
        description: 'Contato encontrado com sucesso',
        schema: {
          type: 'object',
          properties: {
            id: { type: 'string', example: 'clq1234567890abcdef' },
            phoneNumber: { type: 'string', example: '+5511999999999' },
            name: { type: 'string', example: 'João Silva' },
            messages: {
              type: 'array',
              description: 'Últimas 50 mensagens',
              items: { type: 'object' },
            },
            tickets: {
              type: 'array',
              description: 'Tickets em aberto',
              items: { type: 'object' },
            },
          },
        },
      }),
      ApiNotFoundResponse({ description: 'Contato não encontrado' }),
      ApiForbiddenResponse({ description: 'Acesso negado a este contato' }),
      ApiUnauthorizedResponse({
        description: 'Token inválido ou usuário não autenticado',
      }),
      ApiBearerAuth(),
    ),

  GetByPhoneNumber: () =>
    applyDecorators(
      ApiOperation({
        summary: 'Buscar contato por número',
        description: 'Busca um contato pelo número de telefone.',
      }),
      ApiParam({
        name: 'phoneNumber',
        description: 'Número de telefone',
        example: '+5511999999999',
      }),
      ApiResponse({
        status: 200,
        description: 'Contato encontrado com sucesso',
        schema: {
          type: 'object',
          properties: {
            id: { type: 'string', example: 'clq1234567890abcdef' },
            phoneNumber: { type: 'string', example: '+5511999999999' },
            name: { type: 'string', example: 'João Silva' },
            isBlocked: { type: 'boolean', example: false },
          },
        },
      }),
      ApiNotFoundResponse({ description: 'Contato não encontrado' }),
      ApiUnauthorizedResponse({
        description: 'Token inválido ou usuário não autenticado',
      }),
      ApiBearerAuth(),
    ),

  Update: () =>
    applyDecorators(
      ApiOperation({
        summary: 'Atualizar contato',
        description: 'Atualiza os dados de um contato existente.',
      }),
      ApiParam({
        name: 'id',
        description: 'ID do contato',
        example: 'clq1234567890abcdef',
      }),
      ApiResponse({
        status: 200,
        description: 'Contato atualizado com sucesso',
        schema: {
          type: 'object',
          properties: {
            id: { type: 'string', example: 'clq1234567890abcdef' },
            phoneNumber: { type: 'string', example: '+5511999999999' },
            name: { type: 'string', example: 'João Silva' },
            isBlocked: { type: 'boolean', example: false },
            tags: { type: 'string', example: '["vip", "cliente-fiel"]' },
            customFields: {
              type: 'string',
              example: '{"empresa": "Tech Corp"}',
            },
          },
        },
      }),
      ApiNotFoundResponse({ description: 'Contato não encontrado' }),
      ApiForbiddenResponse({ description: 'Acesso negado a este contato' }),
      ApiUnauthorizedResponse({
        description: 'Token inválido ou usuário não autenticado',
      }),
      ApiBearerAuth(),
    ),

  Block: () =>
    applyDecorators(
      ApiOperation({
        summary: 'Bloquear contato',
        description: 'Bloqueia um contato para não receber mensagens.',
      }),
      ApiParam({
        name: 'id',
        description: 'ID do contato',
        example: 'clq1234567890abcdef',
      }),
      ApiResponse({
        status: 200,
        description: 'Contato bloqueado com sucesso',
        schema: {
          type: 'object',
          properties: {
            id: { type: 'string', example: 'clq1234567890abcdef' },
            phoneNumber: { type: 'string', example: '+5511999999999' },
            name: { type: 'string', example: 'João Silva' },
            isBlocked: { type: 'boolean', example: true },
          },
        },
      }),
      ApiNotFoundResponse({ description: 'Contato não encontrado' }),
      ApiForbiddenResponse({ description: 'Acesso negado a este contato' }),
      ApiUnauthorizedResponse({
        description: 'Token inválido ou usuário não autenticado',
      }),
      ApiBearerAuth(),
    ),

  Unblock: () =>
    applyDecorators(
      ApiOperation({
        summary: 'Desbloquear contato',
        description: 'Desbloqueia um contato para receber mensagens novamente.',
      }),
      ApiParam({
        name: 'id',
        description: 'ID do contato',
        example: 'clq1234567890abcdef',
      }),
      ApiResponse({
        status: 200,
        description: 'Contato desbloqueado com sucesso',
        schema: {
          type: 'object',
          properties: {
            id: { type: 'string', example: 'clq1234567890abcdef' },
            phoneNumber: { type: 'string', example: '+5511999999999' },
            name: { type: 'string', example: 'João Silva' },
            isBlocked: { type: 'boolean', example: false },
          },
        },
      }),
      ApiNotFoundResponse({ description: 'Contato não encontrado' }),
      ApiForbiddenResponse({ description: 'Acesso negado a este contato' }),
      ApiUnauthorizedResponse({
        description: 'Token inválido ou usuário não autenticado',
      }),
      ApiBearerAuth(),
    ),
};
