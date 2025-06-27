import { Injectable, Logger } from '@nestjs/common';
import { Cron, CronExpression } from '@nestjs/schedule';
import { ConversationService } from '../conversation/conversation.service';
import { PrismaService } from '../prisma/prisma.service';

@Injectable()
export class TicketSchedulerService {
  private readonly logger = new Logger(TicketSchedulerService.name);

  constructor(
    private readonly prisma: PrismaService,
    private readonly conversationService: ConversationService,
  ) {}

  /**
   * 🕐 Job que roda a cada 10 minutos para verificar tickets inativos
   * Fecha tickets que estão sem atividade há mais de 15 minutos
   */
  @Cron(CronExpression.EVERY_10_MINUTES)
  async handleInactiveTicketsClosure(): Promise<void> {
    try {
      this.logger.debug(
        '🔍 Verificando tickets inativos para fechamento automático...',
      );

      // Buscar todas as empresas que têm tickets ativos
      const companies = await this.prisma.ticket.findMany({
        where: {
          status: {
            in: ['OPEN', 'IN_PROGRESS', 'WAITING_CUSTOMER'],
          },
        },
        select: {
          companyId: true,
        },
        distinct: ['companyId'],
      });

      let totalClosed = 0;

      // Processar cada empresa
      for (const company of companies) {
        const result = await this.conversationService.closeInactiveTickets(
          company.companyId,
        );

        totalClosed += result.closedCount;

        if (result.closedCount > 0) {
          this.logger.log(
            `✅ Empresa ${company.companyId}: ${result.closedCount} tickets fechados automaticamente`,
          );
        }
      }

      if (totalClosed > 0) {
        this.logger.log(
          `🎯 Total de tickets fechados automaticamente: ${totalClosed}`,
        );
      } else {
        this.logger.debug(
          '✨ Nenhum ticket inativo encontrado para fechamento',
        );
      }
    } catch (error) {
      this.logger.error(
        '❌ Erro no job de fechamento automático de tickets:',
        error,
      );
    }
  }

  /**
   * 📊 Job que roda a cada hora para gerar estatísticas de tickets
   * Útil para monitoramento e métricas
   */
  @Cron(CronExpression.EVERY_HOUR)
  async generateTicketStats(): Promise<void> {
    try {
      this.logger.debug('📊 Gerando estatísticas de tickets...');

      const stats = await this.prisma.ticket.groupBy({
        by: ['companyId', 'status'],
        _count: {
          id: true,
        },
      });

      // Log das estatísticas por empresa
      const companiesStats = new Map<string, any>();

      for (const stat of stats) {
        if (!companiesStats.has(stat.companyId)) {
          companiesStats.set(stat.companyId, {});
        }
        companiesStats.get(stat.companyId)[stat.status] = stat._count.id;
      }

      for (const [companyId, companyStats] of companiesStats) {
        this.logger.log(
          `📈 Empresa ${companyId}: ${JSON.stringify(companyStats)}`,
        );
      }
    } catch (error) {
      this.logger.error('❌ Erro ao gerar estatísticas de tickets:', error);
    }
  }

  /**
   * 🧹 Job que roda diariamente à meia-noite para limpeza geral
   * Remove dados antigos e otimiza performance
   */
  @Cron(CronExpression.EVERY_DAY_AT_MIDNIGHT)
  async dailyCleanup(): Promise<void> {
    try {
      this.logger.log('🧹 Iniciando limpeza diária...');

      // Limpar histórico de fluxos muito antigos (mais de 30 dias)
      const thirtyDaysAgo = new Date();
      thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 30);

      const deletedFlowHistory =
        await this.prisma.contactFlowHistory.deleteMany({
          where: {
            createdAt: {
              lt: thirtyDaysAgo,
            },
          },
        });

      this.logger.log(
        `🗑️ Removidos ${deletedFlowHistory.count} registros antigos de histórico de fluxo`,
      );

      // Atualizar estatísticas de uso
      await this.generateCompanyUsageStats();

      this.logger.log('✅ Limpeza diária concluída com sucesso');
    } catch (error) {
      this.logger.error('❌ Erro na limpeza diária:', error);
    }
  }

  /**
   * 📊 Gerar estatísticas de uso por empresa
   */
  private async generateCompanyUsageStats(): Promise<void> {
    try {
      const yesterday = new Date();
      yesterday.setDate(yesterday.getDate() - 1);
      yesterday.setHours(0, 0, 0, 0);

      const today = new Date();
      today.setHours(0, 0, 0, 0);

      // Contadores por empresa nas últimas 24h
      const messageStats = await this.prisma.message.groupBy({
        by: ['companyId', 'direction', 'isFromBot'],
        where: {
          createdAt: {
            gte: yesterday,
            lt: today,
          },
        },
        _count: {
          id: true,
        },
      });

      this.logger.log('📈 Estatísticas de mensagens (últimas 24h):');
      for (const stat of messageStats) {
        const type = stat.isFromBot ? 'Bot' : 'Humano';
        this.logger.log(
          `   Empresa ${stat.companyId} - ${stat.direction} (${type}): ${stat._count.id} mensagens`,
        );
      }
    } catch (error) {
      this.logger.error('❌ Erro ao gerar estatísticas de uso:', error);
    }
  }

  /**
   * 🔧 Método manual para forçar fechamento de tickets inativos
   * Útil para testes ou execução manual
   */
  async forceCloseInactiveTickets(companyId?: string): Promise<{
    success: boolean;
    closedCount: number;
    message: string;
  }> {
    try {
      this.logger.log(
        `🔧 Fechamento manual de tickets inativos iniciado${companyId ? ` para empresa ${companyId}` : ' (todas as empresas)'}`,
      );

      const result =
        await this.conversationService.closeInactiveTickets(companyId);

      return {
        success: true,
        closedCount: result.closedCount,
        message: `${result.closedCount} tickets fechados com sucesso`,
      };
    } catch (error) {
      this.logger.error('❌ Erro no fechamento manual de tickets:', error);
      return {
        success: false,
        closedCount: 0,
        message: 'Erro ao fechar tickets inativos',
      };
    }
  }

  /**
   * 📊 Obter estatísticas em tempo real
   */
  async getRealTimeStats(): Promise<{
    totalActiveTickets: number;
    ticketsAboutToClose: number;
    averageResponseTime: number;
  }> {
    try {
      // Tickets ativos total
      const totalActiveTickets = await this.prisma.ticket.count({
        where: {
          status: {
            in: ['OPEN', 'IN_PROGRESS', 'WAITING_CUSTOMER'],
          },
        },
      });

      // Tickets que vão fechar em breve (próximos 5 minutos)
      const fiveMinutesFromNow = new Date();
      fiveMinutesFromNow.setMinutes(fiveMinutesFromNow.getMinutes() + 5);

      const fifteenMinutesAgo = new Date();
      fifteenMinutesAgo.setMinutes(fifteenMinutesAgo.getMinutes() - 15);

      const ticketsAboutToClose = await this.prisma.ticket.count({
        where: {
          status: {
            in: ['OPEN', 'IN_PROGRESS', 'WAITING_CUSTOMER'],
          },
          updatedAt: {
            gte: fifteenMinutesAgo,
            lte: fiveMinutesFromNow,
          },
        },
      });

      return {
        totalActiveTickets,
        ticketsAboutToClose,
        averageResponseTime: 0, // TODO: Implementar cálculo de tempo médio de resposta
      };
    } catch (error) {
      this.logger.error('❌ Erro ao obter estatísticas em tempo real:', error);
      return {
        totalActiveTickets: 0,
        ticketsAboutToClose: 0,
        averageResponseTime: 0,
      };
    }
  }
}
