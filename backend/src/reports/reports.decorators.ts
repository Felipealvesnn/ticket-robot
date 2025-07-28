import { applyDecorators } from '@nestjs/common';
import {
  ApiBearerAuth,
  ApiForbiddenResponse,
  ApiInternalServerErrorResponse,
  ApiOperation,
  ApiQuery,
  ApiResponse,
  ApiUnauthorizedResponse,
} from '@nestjs/swagger';

export class ReportsSwaggerEndpoint {
  static GetOverviewStats() {
    return applyDecorators(
      ApiOperation({
        summary: 'Obter estatísticas de visão geral',
        description:
          'Retorna estatísticas gerais do sistema incluindo total de mensagens, tickets, contatos e dados de performance por período.',
      }),
      ApiBearerAuth(),
      ApiQuery({
        name: 'startDate',
        required: false,
        type: String,
        description: 'Data de início do período (ISO string)',
        example: '2024-01-01T00:00:00.000Z',
      }),
      ApiQuery({
        name: 'endDate',
        required: false,
        type: String,
        description: 'Data de fim do período (ISO string)',
        example: '2024-12-31T23:59:59.999Z',
      }),
      ApiQuery({
        name: 'sessionId',
        required: false,
        type: String,
        description: 'Filtrar por sessão específica',
      }),
      ApiQuery({
        name: 'userId',
        required: false,
        type: String,
        description: 'Filtrar por usuário específico',
      }),
      ApiResponse({
        status: 200,
        description: 'Estatísticas obtidas com sucesso',
        schema: {
          type: 'object',
          properties: {
            totalMessages: { type: 'number', example: 1500 },
            totalTickets: { type: 'number', example: 320 },
            totalContacts: { type: 'number', example: 180 },
            averageResponseTime: { type: 'number', example: 45.5 },
            messagesByDay: {
              type: 'array',
              items: {
                type: 'object',
                properties: {
                  date: { type: 'string', example: '2024-01-15' },
                  count: { type: 'number', example: 25 },
                },
              },
            },
            ticketsByStatus: {
              type: 'object',
              properties: {
                open: { type: 'number', example: 45 },
                closed: { type: 'number', example: 275 },
                pending: { type: 'number', example: 0 },
              },
            },
          },
        },
      }),
      ApiUnauthorizedResponse({
        description: 'Token inválido ou usuário não autenticado',
      }),
      ApiForbiddenResponse({
        description: 'Usuário não tem permissão para acessar relatórios',
      }),
      ApiInternalServerErrorResponse({
        description: 'Erro interno do servidor',
      }),
    );
  }

  static GetMessageReport() {
    return applyDecorators(
      ApiOperation({
        summary: 'Obter relatório detalhado de mensagens',
        description:
          'Retorna lista paginada de mensagens com filtros aplicados, incluindo informações de contato, sessão e timestamps.',
      }),
      ApiBearerAuth(),
      ApiQuery({
        name: 'startDate',
        required: false,
        type: String,
        description: 'Data de início do período',
      }),
      ApiQuery({
        name: 'endDate',
        required: false,
        type: String,
        description: 'Data de fim do período',
      }),
      ApiQuery({
        name: 'sessionId',
        required: false,
        type: String,
        description: 'Filtrar por sessão específica',
      }),
      ApiQuery({
        name: 'userId',
        required: false,
        type: String,
        description: 'Filtrar por usuário específico',
      }),
      ApiQuery({
        name: 'page',
        required: false,
        type: String,
        description: 'Número da página',
        example: '1',
      }),
      ApiQuery({
        name: 'limit',
        required: false,
        type: String,
        description: 'Itens por página',
        example: '50',
      }),
      ApiResponse({
        status: 200,
        description: 'Relatório de mensagens obtido com sucesso',
        schema: {
          type: 'object',
          properties: {
            data: {
              type: 'array',
              items: {
                type: 'object',
                properties: {
                  id: { type: 'string', example: 'clq1234567890abcdef' },
                  body: { type: 'string', example: 'Olá, como posso ajudar?' },
                  timestamp: { type: 'string', format: 'date-time' },
                  isMe: { type: 'boolean', example: false },
                  contact: {
                    type: 'object',
                    properties: {
                      name: { type: 'string', example: 'João Silva' },
                      number: { type: 'string', example: '5511999999999' },
                    },
                  },
                  session: {
                    type: 'object',
                    properties: {
                      name: { type: 'string', example: 'WhatsApp Business' },
                    },
                  },
                },
              },
            },
            total: { type: 'number', example: 1500 },
            page: { type: 'number', example: 1 },
            limit: { type: 'number', example: 50 },
            totalPages: { type: 'number', example: 30 },
          },
        },
      }),
      ApiUnauthorizedResponse({
        description: 'Token inválido ou usuário não autenticado',
      }),
      ApiForbiddenResponse({
        description: 'Usuário não tem permissão para acessar relatórios',
      }),
      ApiInternalServerErrorResponse({
        description: 'Erro interno do servidor',
      }),
    );
  }

  static GetContactReport() {
    return applyDecorators(
      ApiOperation({
        summary: 'Obter relatório de contatos',
        description:
          'Retorna lista paginada de contatos com estatísticas de interação, número de mensagens e últimas atividades.',
      }),
      ApiBearerAuth(),
      ApiQuery({
        name: 'startDate',
        required: false,
        type: String,
        description: 'Data de início do período',
      }),
      ApiQuery({
        name: 'endDate',
        required: false,
        type: String,
        description: 'Data de fim do período',
      }),
      ApiQuery({
        name: 'sessionId',
        required: false,
        type: String,
        description: 'Filtrar por sessão específica',
      }),
      ApiQuery({
        name: 'userId',
        required: false,
        type: String,
        description: 'Filtrar por usuário específico',
      }),
      ApiQuery({
        name: 'page',
        required: false,
        type: String,
        description: 'Número da página',
        example: '1',
      }),
      ApiQuery({
        name: 'limit',
        required: false,
        type: String,
        description: 'Itens por página',
        example: '50',
      }),
      ApiResponse({
        status: 200,
        description: 'Relatório de contatos obtido com sucesso',
        schema: {
          type: 'object',
          properties: {
            data: {
              type: 'array',
              items: {
                type: 'object',
                properties: {
                  id: { type: 'string', example: 'clq1234567890abcdef' },
                  name: { type: 'string', example: 'João Silva' },
                  number: { type: 'string', example: '5511999999999' },
                  lastInteraction: { type: 'string', format: 'date-time' },
                  messageCount: { type: 'number', example: 15 },
                  ticketCount: { type: 'number', example: 3 },
                },
              },
            },
            total: { type: 'number', example: 180 },
            page: { type: 'number', example: 1 },
            limit: { type: 'number', example: 50 },
            totalPages: { type: 'number', example: 4 },
          },
        },
      }),
      ApiUnauthorizedResponse({
        description: 'Token inválido ou usuário não autenticado',
      }),
      ApiForbiddenResponse({
        description: 'Usuário não tem permissão para acessar relatórios',
      }),
      ApiInternalServerErrorResponse({
        description: 'Erro interno do servidor',
      }),
    );
  }

  static GetPerformanceReport() {
    return applyDecorators(
      ApiOperation({
        summary: 'Obter relatório de performance',
        description:
          'Retorna métricas de performance do sistema incluindo tempo de resposta, taxa de resolução e produtividade por agente.',
      }),
      ApiBearerAuth(),
      ApiQuery({
        name: 'startDate',
        required: false,
        type: String,
        description: 'Data de início do período',
      }),
      ApiQuery({
        name: 'endDate',
        required: false,
        type: String,
        description: 'Data de fim do período',
      }),
      ApiQuery({
        name: 'sessionId',
        required: false,
        type: String,
        description: 'Filtrar por sessão específica',
      }),
      ApiQuery({
        name: 'userId',
        required: false,
        type: String,
        description: 'Filtrar por usuário específico',
      }),
      ApiResponse({
        status: 200,
        description: 'Relatório de performance obtido com sucesso',
        schema: {
          type: 'object',
          properties: {
            averageResponseTime: { type: 'number', example: 45.5 },
            resolutionRate: { type: 'number', example: 85.7 },
            totalTicketsResolved: { type: 'number', example: 275 },
            agentPerformance: {
              type: 'array',
              items: {
                type: 'object',
                properties: {
                  agentId: { type: 'string', example: 'clq1234567890abcdef' },
                  agentName: { type: 'string', example: 'Maria Santos' },
                  ticketsHandled: { type: 'number', example: 45 },
                  averageResponseTime: { type: 'number', example: 35.2 },
                  resolutionRate: { type: 'number', example: 92.1 },
                },
              },
            },
            responseTimeByHour: {
              type: 'array',
              items: {
                type: 'object',
                properties: {
                  hour: { type: 'number', example: 14 },
                  avgResponseTime: { type: 'number', example: 32.5 },
                },
              },
            },
          },
        },
      }),
      ApiUnauthorizedResponse({
        description: 'Token inválido ou usuário não autenticado',
      }),
      ApiForbiddenResponse({
        description: 'Usuário não tem permissão para acessar relatórios',
      }),
      ApiInternalServerErrorResponse({
        description: 'Erro interno do servidor',
      }),
    );
  }

  static ExportToPDF() {
    return applyDecorators(
      ApiOperation({
        summary: 'Exportar relatório em PDF',
        description:
          'Gera e retorna um arquivo PDF com os dados do relatório aplicando os filtros especificados.',
      }),
      ApiBearerAuth(),
      ApiQuery({
        name: 'startDate',
        required: false,
        type: String,
        description: 'Data de início do período',
      }),
      ApiQuery({
        name: 'endDate',
        required: false,
        type: String,
        description: 'Data de fim do período',
      }),
      ApiQuery({
        name: 'sessionId',
        required: false,
        type: String,
        description: 'Filtrar por sessão específica',
      }),
      ApiQuery({
        name: 'userId',
        required: false,
        type: String,
        description: 'Filtrar por usuário específico',
      }),
      ApiResponse({
        status: 200,
        description: 'PDF gerado com sucesso',
        content: {
          'application/pdf': {
            schema: {
              type: 'string',
              format: 'binary',
            },
          },
        },
      }),
      ApiUnauthorizedResponse({
        description: 'Token inválido ou usuário não autenticado',
      }),
      ApiForbiddenResponse({
        description: 'Usuário não tem permissão para exportar relatórios',
      }),
      ApiInternalServerErrorResponse({
        description: 'Erro ao gerar PDF',
      }),
    );
  }

  static ExportToExcel() {
    return applyDecorators(
      ApiOperation({
        summary: 'Exportar relatório em Excel',
        description:
          'Gera e retorna um arquivo Excel (.xlsx) com os dados do relatório aplicando os filtros especificados.',
      }),
      ApiBearerAuth(),
      ApiQuery({
        name: 'startDate',
        required: false,
        type: String,
        description: 'Data de início do período',
      }),
      ApiQuery({
        name: 'endDate',
        required: false,
        type: String,
        description: 'Data de fim do período',
      }),
      ApiQuery({
        name: 'sessionId',
        required: false,
        type: String,
        description: 'Filtrar por sessão específica',
      }),
      ApiQuery({
        name: 'userId',
        required: false,
        type: String,
        description: 'Filtrar por usuário específico',
      }),
      ApiResponse({
        status: 200,
        description: 'Excel gerado com sucesso',
        content: {
          'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet': {
            schema: {
              type: 'string',
              format: 'binary',
            },
          },
        },
      }),
      ApiUnauthorizedResponse({
        description: 'Token inválido ou usuário não autenticado',
      }),
      ApiForbiddenResponse({
        description: 'Usuário não tem permissão para exportar relatórios',
      }),
      ApiInternalServerErrorResponse({
        description: 'Erro ao gerar Excel',
      }),
    );
  }
}
