import { applyDecorators } from '@nestjs/common';
import {
  ApiBadRequestResponse,
  ApiForbiddenResponse,
  ApiNotFoundResponse,
  ApiOperation,
  ApiParam,
  ApiQuery,
  ApiResponse,
  ApiUnauthorizedResponse,
} from '@nestjs/swagger';

// Decorators personalizados para o TicketController
export const TicketSwaggerEndpoint = {
  CreateTicket: () =>
    applyDecorators(
      ApiOperation({
        summary: 'Criar novo ticket',
        description: 'Cria um novo ticket de atendimento para a empresa.',
      }),
      ApiResponse({
        status: 201,
        description: 'Ticket criado com sucesso',
      }),
      ApiBadRequestResponse({
        description: 'Dados inválidos fornecidos',
      }),
      ApiUnauthorizedResponse({
        description: 'Token de autenticação inválido',
      }),
      ApiForbiddenResponse({
        description: 'Acesso negado - permissões insuficientes',
      }),
    ),

  FindAllTickets: () =>
    applyDecorators(
      ApiOperation({
        summary: 'Listar todos os tickets',
        description:
          'Retorna uma lista paginada de todos os tickets da empresa com filtros opcionais.',
      }),
      ApiQuery({
        name: 'page',
        required: false,
        description: 'Página atual (padrão: 1)',
      }),
      ApiQuery({
        name: 'limit',
        required: false,
        description: 'Itens por página (padrão: 10)',
      }),
      ApiQuery({
        name: 'status',
        required: false,
        description: 'Filtrar por status do ticket',
      }),
      ApiQuery({
        name: 'priority',
        required: false,
        description: 'Filtrar por prioridade',
      }),
      ApiQuery({
        name: 'assignedTo',
        required: false,
        description: 'Filtrar por usuário atribuído',
      }),
      ApiResponse({
        status: 200,
        description: 'Lista de tickets retornada com sucesso',
      }),
    ),

  GetTicketById: () =>
    applyDecorators(
      ApiOperation({
        summary: 'Obter ticket por ID',
        description: 'Retorna os detalhes completos de um ticket específico.',
      }),
      ApiParam({
        name: 'id',
        description: 'ID único do ticket',
        example: 'clq1234567890abcdef',
      }),
      ApiResponse({
        status: 200,
        description: 'Ticket encontrado com sucesso',
      }),
      ApiNotFoundResponse({
        description: 'Ticket não encontrado',
      }),
    ),

  UpdateTicket: () =>
    applyDecorators(
      ApiOperation({
        summary: 'Atualizar ticket',
        description: 'Atualiza informações de um ticket existente.',
      }),
      ApiParam({
        name: 'id',
        description: 'ID único do ticket',
        example: 'clq1234567890abcdef',
      }),
      ApiResponse({
        status: 200,
        description: 'Ticket atualizado com sucesso',
      }),
      ApiNotFoundResponse({
        description: 'Ticket não encontrado',
      }),
      ApiBadRequestResponse({
        description: 'Dados inválidos fornecidos',
      }),
    ),

  AssignTicket: () =>
    applyDecorators(
      ApiOperation({
        summary: 'Atribuir ticket a usuário',
        description: 'Atribui um ticket a um usuário específico.',
      }),
      ApiParam({
        name: 'id',
        description: 'ID único do ticket',
        example: 'clq1234567890abcdef',
      }),
      ApiResponse({
        status: 200,
        description: 'Ticket atribuído com sucesso',
      }),
      ApiNotFoundResponse({
        description: 'Ticket ou usuário não encontrado',
      }),
    ),

  CloseTicket: () =>
    applyDecorators(
      ApiOperation({
        summary: 'Fechar ticket',
        description: 'Fecha um ticket existente.',
      }),
      ApiParam({
        name: 'id',
        description: 'ID único do ticket',
        example: 'clq1234567890abcdef',
      }),
      ApiResponse({
        status: 200,
        description: 'Ticket fechado com sucesso',
      }),
      ApiNotFoundResponse({
        description: 'Ticket não encontrado',
      }),
    ),

  GetTicketStats: () =>
    applyDecorators(
      ApiOperation({
        summary: 'Estatísticas de tickets',
        description: 'Retorna estatísticas detalhadas dos tickets da empresa.',
      }),
      ApiResponse({
        status: 200,
        description: 'Estatísticas obtidas com sucesso',
      }),
    ),

  GetTicketHistory: () =>
    applyDecorators(
      ApiOperation({
        summary: 'Histórico do ticket',
        description: 'Retorna o histórico de alterações de um ticket.',
      }),
      ApiParam({
        name: 'id',
        description: 'ID único do ticket',
        example: 'clq1234567890abcdef',
      }),
      ApiResponse({
        status: 200,
        description: 'Histórico obtido com sucesso',
      }),
      ApiNotFoundResponse({
        description: 'Ticket não encontrado',
      }),
    ),

  AddComment: () =>
    applyDecorators(
      ApiOperation({
        summary: 'Adicionar comentário',
        description: 'Adiciona um comentário a um ticket.',
      }),
      ApiParam({
        name: 'id',
        description: 'ID único do ticket',
        example: 'clq1234567890abcdef',
      }),
      ApiResponse({
        status: 201,
        description: 'Comentário adicionado com sucesso',
      }),
      ApiNotFoundResponse({
        description: 'Ticket não encontrado',
      }),
    ),

  GetComments: () =>
    applyDecorators(
      ApiOperation({
        summary: 'Obter comentários',
        description: 'Retorna todos os comentários de um ticket.',
      }),
      ApiParam({
        name: 'id',
        description: 'ID único do ticket',
        example: 'clq1234567890abcdef',
      }),
      ApiResponse({
        status: 200,
        description: 'Comentários obtidos com sucesso',
      }),
      ApiNotFoundResponse({
        description: 'Ticket não encontrado',
      }),
    ),
};
