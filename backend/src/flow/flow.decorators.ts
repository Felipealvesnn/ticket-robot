import { applyDecorators } from '@nestjs/common';
import {
  ApiBadRequestResponse,
  ApiBearerAuth,
  ApiForbiddenResponse,
  ApiNotFoundResponse,
  ApiOperation,
  ApiParam,
  ApiResponse,
  ApiUnauthorizedResponse,
} from '@nestjs/swagger';

export const FlowSwaggerEndpoint = {
  Create: () =>
    applyDecorators(
      ApiOperation({
        summary: 'Criar novo fluxo de chat',
        description: 'Cria um novo fluxo de chat para a empresa do usuário.',
      }),
      ApiResponse({
        status: 201,
        description: 'Fluxo criado com sucesso',
        schema: {
          type: 'object',
          properties: {
            id: { type: 'string', example: 'clq1234567890abcdef' },
            name: { type: 'string', example: 'Atendimento Inicial' },
            description: {
              type: 'string',
              example: 'Fluxo para captar informações iniciais',
            },
            isActive: { type: 'boolean', example: false },
            createdAt: { type: 'string', format: 'date-time' },
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
        summary: 'Listar fluxos da empresa',
        description: 'Retorna todos os fluxos de chat da empresa do usuário.',
      }),
      ApiResponse({
        status: 200,
        description: 'Lista de fluxos retornada com sucesso',
        schema: {
          type: 'array',
          items: {
            type: 'object',
            properties: {
              id: { type: 'string', example: 'clq1234567890abcdef' },
              name: { type: 'string', example: 'Atendimento Inicial' },
              description: {
                type: 'string',
                example: 'Fluxo para captar informações iniciais',
              },
              isActive: { type: 'boolean', example: true },
              createdAt: { type: 'string', format: 'date-time' },
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
        summary: 'Buscar fluxo por ID',
        description: 'Retorna os detalhes de um fluxo específico.',
      }),
      ApiParam({
        name: 'id',
        description: 'ID do fluxo',
        example: 'clq1234567890abcdef',
      }),
      ApiResponse({
        status: 200,
        description: 'Fluxo encontrado com sucesso',
        schema: {
          type: 'object',
          properties: {
            id: { type: 'string', example: 'clq1234567890abcdef' },
            name: { type: 'string', example: 'Atendimento Inicial' },
            description: {
              type: 'string',
              example: 'Fluxo para captar informações iniciais',
            },
            nodes: { type: 'string', example: '[{"id":"1","type":"input"}]' },
            edges: {
              type: 'string',
              example: '[{"id":"e1-2","source":"1","target":"2"}]',
            },
            triggers: { type: 'string', example: '["oi", "olá"]' },
            isActive: { type: 'boolean', example: true },
            createdAt: { type: 'string', format: 'date-time' },
          },
        },
      }),
      ApiNotFoundResponse({
        description: 'Fluxo não encontrado',
      }),
      ApiForbiddenResponse({
        description: 'Acesso negado a este fluxo',
      }),
      ApiUnauthorizedResponse({
        description: 'Token inválido ou usuário não autenticado',
      }),
      ApiBearerAuth(),
    ),

  Update: () =>
    applyDecorators(
      ApiOperation({
        summary: 'Atualizar fluxo',
        description: 'Atualiza os dados de um fluxo existente.',
      }),
      ApiParam({
        name: 'id',
        description: 'ID do fluxo',
        example: 'clq1234567890abcdef',
      }),
      ApiResponse({
        status: 200,
        description: 'Fluxo atualizado com sucesso',
      }),
      ApiNotFoundResponse({
        description: 'Fluxo não encontrado',
      }),
      ApiForbiddenResponse({
        description: 'Acesso negado a este fluxo',
      }),
      ApiUnauthorizedResponse({
        description: 'Token inválido ou usuário não autenticado',
      }),
      ApiBearerAuth(),
    ),

  Remove: () =>
    applyDecorators(
      ApiOperation({
        summary: 'Remover fluxo',
        description: 'Remove um fluxo de chat.',
      }),
      ApiParam({
        name: 'id',
        description: 'ID do fluxo',
        example: 'clq1234567890abcdef',
      }),
      ApiResponse({
        status: 200,
        description: 'Fluxo removido com sucesso',
        schema: {
          type: 'object',
          properties: {
            message: { type: 'string', example: 'Fluxo removido com sucesso' },
          },
        },
      }),
      ApiNotFoundResponse({
        description: 'Fluxo não encontrado',
      }),
      ApiForbiddenResponse({
        description: 'Acesso negado a este fluxo',
      }),
      ApiUnauthorizedResponse({
        description: 'Token inválido ou usuário não autenticado',
      }),
      ApiBearerAuth(),
    ),

  ToggleActive: () =>
    applyDecorators(
      ApiOperation({
        summary: 'Alternar status ativo do fluxo',
        description: 'Ativa ou desativa um fluxo de chat.',
      }),
      ApiParam({
        name: 'id',
        description: 'ID do fluxo',
        example: 'clq1234567890abcdef',
      }),
      ApiResponse({
        status: 200,
        description: 'Status do fluxo alterado com sucesso',
      }),
      ApiNotFoundResponse({
        description: 'Fluxo não encontrado',
      }),
      ApiForbiddenResponse({
        description: 'Acesso negado a este fluxo',
      }),
      ApiUnauthorizedResponse({
        description: 'Token inválido ou usuário não autenticado',
      }),
      ApiBearerAuth(),
    ),

  GetActiveFlows: () =>
    applyDecorators(
      ApiOperation({
        summary: 'Buscar fluxos ativos',
        description:
          'Retorna todos os fluxos ativos da empresa (para uso do chatbot).',
      }),
      ApiResponse({
        status: 200,
        description: 'Fluxos ativos retornados com sucesso',
        schema: {
          type: 'array',
          items: {
            type: 'object',
            properties: {
              id: { type: 'string', example: 'clq1234567890abcdef' },
              name: { type: 'string', example: 'Atendimento Inicial' },
              triggers: { type: 'string', example: '["oi", "olá"]' },
              nodes: { type: 'string', example: '[{"id":"1","type":"input"}]' },
              edges: {
                type: 'string',
                example: '[{"id":"e1-2","source":"1","target":"2"}]',
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
};
