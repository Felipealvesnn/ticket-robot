import { applyDecorators } from '@nestjs/common';
import { ApiOperation, ApiResponse } from '@nestjs/swagger';

// Decorators personalizados para o DashboardController
export const DashboardSwaggerEndpoint = {
  GetStats: () =>
    applyDecorators(
      ApiOperation({
        summary: '📊 Obter estatísticas do dashboard',
        description:
          'Retorna estatísticas da empresa como sessões ativas, mensagens do dia, contatos e automações.',
      }),
      ApiResponse({
        status: 200,
        description: 'Estatísticas obtidas com sucesso',
        schema: {
          type: 'object',
          properties: {
            sessions: {
              type: 'number',
              example: 3,
              description: 'Número de sessões ativas',
            },
            messagesInfo: {
              type: 'object',
              properties: {
                today: {
                  type: 'number',
                  example: 247,
                  description: 'Mensagens enviadas hoje',
                },
                yesterday: {
                  type: 'number',
                  example: 203,
                  description: 'Mensagens enviadas ontem',
                },
                percentageChange: {
                  type: 'number',
                  example: 21.7,
                  description: 'Mudança percentual',
                },
              },
            },
            contactsInfo: {
              type: 'object',
              properties: {
                total: {
                  type: 'number',
                  example: 1542,
                  description: 'Total de contatos',
                },
                thisMonth: {
                  type: 'number',
                  example: 123,
                  description: 'Novos contatos este mês',
                },
                percentageChange: {
                  type: 'number',
                  example: 8.5,
                  description: 'Mudança percentual',
                },
              },
            },
            ticketsInfo: {
              type: 'object',
              properties: {
                today: {
                  type: 'number',
                  example: 42,
                  description: 'Tickets criados hoje',
                },
                closed: {
                  type: 'number',
                  example: 38,
                  description: 'Tickets fechados hoje',
                },
                resolutionRate: {
                  type: 'number',
                  example: 90.5,
                  description: 'Taxa de resolução em %',
                },
                percentageChange: {
                  type: 'number',
                  example: 15.2,
                  description: 'Mudança percentual',
                },
              },
            },
            automations: {
              type: 'number',
              example: 5,
              description: 'Número de automações ativas',
            },
          },
        },
      }),
    ),

  GetRecentActivities: () =>
    applyDecorators(
      ApiOperation({
        summary: '📋 Obter atividades recentes',
        description: 'Retorna as atividades mais recentes da empresa.',
      }),
      ApiResponse({
        status: 200,
        description: 'Atividades obtidas com sucesso',
        schema: {
          type: 'array',
          items: {
            type: 'object',
            properties: {
              id: { type: 'string', example: '1' },
              type: {
                type: 'string',
                example: 'success',
                enum: ['success', 'info', 'warning', 'error'],
              },
              icon: {
                type: 'string',
                example: 'message',
                enum: ['message', 'user', 'session', 'flow'],
              },
              action: {
                type: 'string',
                example: 'Nova mensagem enviada para +55 11 99999-9999',
              },
              time: { type: 'string', example: '2 minutos atrás' },
            },
          },
        },
      }),
    ),

  GetChartData: () =>
    applyDecorators(
      ApiOperation({
        summary: '📈 Obter dados do gráfico',
        description:
          'Retorna dados de atividade dos últimos 7 dias para o gráfico.',
      }),
      ApiResponse({
        status: 200,
        description: 'Dados do gráfico obtidos com sucesso',
        schema: {
          type: 'array',
          items: {
            type: 'object',
            properties: {
              day: { type: 'string', example: 'Seg' },
              value: {
                type: 'number',
                example: 85,
                description: 'Percentual de atividade',
              },
              messages: {
                type: 'number',
                example: 42,
                description: 'Número de mensagens',
              },
            },
          },
        },
      }),
    ),

  GetAgentPerformance: () =>
    applyDecorators(
      ApiOperation({
        summary: '👥 Obter performance dos atendentes',
        description:
          'Retorna ranking dos atendentes com tickets resolvidos e tempo médio de resolução.',
      }),
      ApiResponse({
        status: 200,
        description: 'Performance dos atendentes obtida com sucesso',
        schema: {
          type: 'array',
          items: {
            type: 'object',
            properties: {
              agentId: { type: 'string', example: 'clq1234567890abcdef' },
              agentName: { type: 'string', example: 'João Silva' },
              ticketsResolved: {
                type: 'number',
                example: 15,
                description: 'Tickets resolvidos hoje',
              },
              averageResolutionTime: {
                type: 'string',
                example: '2h 30min',
                description: 'Tempo médio de resolução',
              },
              responseTime: {
                type: 'string',
                example: '5min',
                description: 'Tempo médio de primeira resposta',
              },
            },
          },
        },
      }),
    ),

  GetSystemStatus: () =>
    applyDecorators(
      ApiOperation({
        summary: '🔧 Obter status do sistema',
        description:
          'Retorna o status do sistema e informações de conectividade.',
      }),
      ApiResponse({
        status: 200,
        description: 'Status do sistema obtido com sucesso',
        schema: {
          type: 'object',
          properties: {
            isOnline: { type: 'boolean', example: true },
            uptime: { type: 'string', example: '99.9%' },
            latency: { type: 'string', example: '12ms' },
            lastChecked: { type: 'string', example: '2025-07-17T10:30:00Z' },
          },
        },
      }),
    ),

  GetActivities: () =>
    applyDecorators(
      ApiOperation({
        summary: '🔄 Obter atividades recentes (alias)',
        description:
          'Retorna as atividades mais recentes da empresa. Alias para /recent-activities.',
      }),
      ApiResponse({
        status: 200,
        description: 'Atividades obtidas com sucesso',
        schema: {
          type: 'array',
          items: {
            type: 'object',
            properties: {
              id: { type: 'string' },
              type: {
                type: 'string',
                enum: ['success', 'info', 'warning', 'error'],
              },
              icon: { type: 'string' },
              action: { type: 'string' },
              time: { type: 'string' },
            },
          },
        },
      }),
    ),

  GetDashboard: () =>
    applyDecorators(
      ApiOperation({
        summary: '🎯 Obter dados completos do dashboard',
        description:
          'Retorna todas as informações necessárias para o dashboard em uma única requisição optimizada.',
      }),
      ApiResponse({
        status: 200,
        description: 'Dados do dashboard obtidos com sucesso',
        schema: {
          type: 'object',
          properties: {
            stats: {
              type: 'object',
              properties: {
                sessions: { type: 'number', example: 3 },
                messages: { type: 'number', example: 127 },
                contacts: { type: 'number', example: 1234 },
                automations: { type: 'number', example: 8 },
              },
            },
            activities: {
              type: 'array',
              items: {
                type: 'object',
                properties: {
                  id: { type: 'string' },
                  type: {
                    type: 'string',
                    enum: ['success', 'info', 'warning', 'error'],
                  },
                  icon: { type: 'string' },
                  action: { type: 'string' },
                  time: { type: 'string' },
                },
              },
            },
            systemStatus: {
              type: 'object',
              properties: {
                isOnline: { type: 'boolean' },
                uptime: { type: 'string' },
                latency: { type: 'string' },
              },
            },
            chartData: {
              type: 'array',
              items: {
                type: 'object',
                properties: {
                  day: { type: 'string' },
                  value: { type: 'number' },
                  messages: { type: 'number' },
                },
              },
            },
          },
        },
      }),
    ),
};
