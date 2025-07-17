import { Injectable } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';

interface Activity {
  id: string;
  type: 'success' | 'info' | 'warning' | 'error';
  icon: 'message' | 'user' | 'session' | 'flow';
  action: string;
  time: string;
  createdAt: Date;
}

@Injectable()
export class DashboardService {
  constructor(private readonly prisma: PrismaService) {}

  async getStats(companyId: string) {
    // Buscar sessões ativas
    const activeSessions = await this.prisma.messagingSession.count({
      where: {
        companyId,
        status: 'CONNECTED',
        isActive: true,
      },
    });

    // Buscar mensagens de hoje e ontem
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    const yesterday = new Date(today);
    yesterday.setDate(yesterday.getDate() - 1);

    const [messagesToday, messagesYesterday] = await Promise.all([
      this.prisma.message.count({
        where: {
          companyId,
          createdAt: {
            gte: today,
          },
        },
      }),
      this.prisma.message.count({
        where: {
          companyId,
          createdAt: {
            gte: yesterday,
            lt: today,
          },
        },
      }),
    ]);

    // Calcular mudança percentual de mensagens
    const messagePercentageChange =
      messagesYesterday > 0
        ? ((messagesToday - messagesYesterday) / messagesYesterday) * 100
        : messagesToday > 0
          ? 100
          : 0;

    // Buscar contatos
    const thisMonth = new Date();
    thisMonth.setDate(1);
    thisMonth.setHours(0, 0, 0, 0);
    const lastMonth = new Date(thisMonth);
    lastMonth.setMonth(lastMonth.getMonth() - 1);

    const [totalContacts, contactsThisMonth, contactsLastMonth] =
      await Promise.all([
        this.prisma.contact.count({
          where: { companyId },
        }),
        this.prisma.contact.count({
          where: {
            companyId,
            createdAt: { gte: thisMonth },
          },
        }),
        this.prisma.contact.count({
          where: {
            companyId,
            createdAt: {
              gte: lastMonth,
              lt: thisMonth,
            },
          },
        }),
      ]);

    // Calcular mudança percentual de contatos
    const contactPercentageChange =
      contactsLastMonth > 0
        ? ((contactsThisMonth - contactsLastMonth) / contactsLastMonth) * 100
        : contactsThisMonth > 0
          ? 100
          : 0;

    // Buscar automações ativas (chatFlows)
    const activeFlows = await this.prisma.chatFlow.count({
      where: {
        companyId,
        isActive: true,
      },
    });

    // Buscar tickets de hoje e ontem
    const [
      ticketsOpenedToday,
      ticketsClosedToday,
      ticketsInProgress,
      ticketsOpenedYesterday,
    ] = await Promise.all([
      // Tickets criados hoje
      this.prisma.ticket.count({
        where: {
          companyId,
          createdAt: { gte: today },
        },
      }),
      // Tickets criados hoje E fechados hoje (para taxa de resolução correta)
      this.prisma.ticket.count({
        where: {
          companyId,
          createdAt: { gte: today },
          closedAt: { gte: today },
        },
      }),
      // Tickets em andamento (criados hoje mas ainda não fechados)
      this.prisma.ticket.count({
        where: {
          companyId,
          createdAt: { gte: today },
          closedAt: null,
        },
      }),
      // Tickets criados ontem para comparação
      this.prisma.ticket.count({
        where: {
          companyId,
          createdAt: {
            gte: yesterday,
            lt: today,
          },
        },
      }),
    ]);

    // Calcular taxa de resolução e mudança percentual
    const resolutionRate =
      ticketsOpenedToday > 0
        ? (ticketsClosedToday / ticketsOpenedToday) * 100
        : 0;

    const ticketPercentageChange =
      ticketsOpenedYesterday > 0
        ? ((ticketsOpenedToday - ticketsOpenedYesterday) /
            ticketsOpenedYesterday) *
          100
        : ticketsOpenedToday > 0
          ? 100
          : 0;

    return {
      sessions: activeSessions,
      messagesInfo: {
        today: messagesToday,
        yesterday: messagesYesterday,
        percentageChange: Math.round(messagePercentageChange * 10) / 10,
      },
      contactsInfo: {
        total: totalContacts,
        thisMonth: contactsThisMonth,
        percentageChange: Math.round(contactPercentageChange * 10) / 10,
      },
      ticketsInfo: {
        todayOpened: ticketsOpenedToday,
        todayClosed: ticketsClosedToday,
        inProgress: ticketsInProgress,
        resolutionRate: Math.round(resolutionRate * 10) / 10,
        percentageChange: Math.round(ticketPercentageChange * 10) / 10,
      },
      automations: activeFlows,
    };
  }

  async getRecentActivities(companyId: string) {
    // Buscar mensagens recentes
    const recentMessages = await this.prisma.message.findMany({
      where: { companyId },
      orderBy: { createdAt: 'desc' },
      take: 5,
      include: {
        contact: true,
      },
    });

    // Buscar sessões recentes
    const recentSessions = await this.prisma.messagingSession.findMany({
      where: { companyId },
      orderBy: { updatedAt: 'desc' },
      take: 3,
    });

    const activities: Activity[] = [];

    // Adicionar atividades de mensagens
    recentMessages.forEach((message) => {
      const timeAgo = this.getTimeAgo(message.createdAt);
      activities.push({
        id: `message-${message.id}`,
        type: message.direction === 'OUTGOING' ? 'info' : 'success',
        icon: 'message',
        action:
          message.direction === 'OUTGOING'
            ? `Mensagem enviada para ${message.contact?.name || message.contact?.phoneNumber}`
            : `Nova mensagem recebida de ${message.contact?.name || message.contact?.phoneNumber}`,
        time: timeAgo,
        createdAt: message.createdAt,
      });
    });

    // Adicionar atividades de sessões
    recentSessions.forEach((session) => {
      const timeAgo = this.getTimeAgo(session.updatedAt);
      activities.push({
        id: `session-${session.id}`,
        type: session.status === 'CONNECTED' ? 'success' : 'warning',
        icon: 'session',
        action: `Sessão ${session.name} ${session.status === 'CONNECTED' ? 'conectada' : 'desconectada'}`,
        time: timeAgo,
        createdAt: session.updatedAt,
      });
    });

    // Ordenar por data e retornar os mais recentes
    return activities
      .sort(
        (a, b) =>
          new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime(),
      )
      .slice(0, 8)
      .map((activity) => ({
        id: activity.id,
        type: activity.type,
        icon: activity.icon,
        action: activity.action,
        time: activity.time,
      }));
  }

  async getChartData(companyId: string) {
    const days = ['Dom', 'Seg', 'Ter', 'Qua', 'Qui', 'Sex', 'Sáb'];
    const chartData: Array<{ day: string; value: number; messages: number }> =
      [];

    for (let i = 6; i >= 0; i--) {
      const date = new Date();
      date.setDate(date.getDate() - i);
      date.setHours(0, 0, 0, 0);
      const nextDay = new Date(date);
      nextDay.setDate(nextDay.getDate() + 1);

      const messagesCount = await this.prisma.message.count({
        where: {
          companyId,
          createdAt: {
            gte: date,
            lt: nextDay,
          },
        },
      });

      chartData.push({
        day: days[date.getDay()],
        value: Math.min(100, Math.max(10, messagesCount * 2)), // Normalizar para 10-100
        messages: messagesCount,
      });
    }

    return chartData;
  }

  async getAgentPerformance(companyId: string) {
    const today = new Date();
    today.setHours(0, 0, 0, 0);

    // ✅ IMPLEMENTAÇÃO FINAL: Usando apenas tabela TicketAgent (múltiplos agentes por ticket)
    const ticketsWithAgents = await this.prisma.ticket.findMany({
      where: {
        companyId,
        closedAt: { gte: today },
        // Buscar tickets que tenham pelo menos um agente ativo
        agents: {
          some: {
            isActive: true,
          },
        },
      },
      include: {
        agents: {
          where: { isActive: true },
          include: {
            user: {
              select: { id: true, name: true },
            },
          },
        },
      },
    });

    // Agrupar por agente e calcular métricas
    const agentStats = new Map();

    ticketsWithAgents.forEach((ticket) => {
      // Para cada ticket, processar todos os agentes que participaram
      ticket.agents.forEach((ticketAgent) => {
        const agentId = ticketAgent.user.id;
        const agentName = ticketAgent.user.name;

        if (!agentId || !agentName) return;

        if (!agentStats.has(agentId)) {
          agentStats.set(agentId, {
            agentId,
            agentName,
            ticketsResolved: 0,
            totalResolutionTime: 0,
            totalResponseTime: 0,
          });
        }

        const stats = agentStats.get(agentId);
        stats.ticketsResolved++;

        // Calcular tempo de resolução (se houver dados)
        if (ticket.createdAt && ticket.closedAt) {
          const resolutionTime =
            ticket.closedAt.getTime() - ticket.createdAt.getTime();
          stats.totalResolutionTime += resolutionTime;
        }

        // Calcular tempo de primeira resposta (se houver dados)
        if (ticket.firstResponseAt && ticket.createdAt) {
          const responseTime =
            ticket.firstResponseAt.getTime() - ticket.createdAt.getTime();
          stats.totalResponseTime += responseTime;
        }
      });
    });

    // Converter para array e calcular médias
    const performance = Array.from(agentStats.values())
      .map((stats) => ({
        agentId: stats.agentId,
        agentName: stats.agentName,
        ticketsResolved: stats.ticketsResolved,
        averageResolutionTime: this.formatDuration(
          stats.totalResolutionTime / stats.ticketsResolved,
        ),
        responseTime: this.formatDuration(
          stats.totalResponseTime / stats.ticketsResolved,
        ),
      }))
      .sort((a, b) => b.ticketsResolved - a.ticketsResolved)
      .slice(0, 10); // Top 10 agentes

    return performance;
  }

  private formatDuration(milliseconds: number): string {
    if (!milliseconds || isNaN(milliseconds)) return '0min';

    const hours = Math.floor(milliseconds / (1000 * 60 * 60));
    const minutes = Math.floor((milliseconds % (1000 * 60 * 60)) / (1000 * 60));

    if (hours > 0) {
      return `${hours}h ${minutes}min`;
    }
    return `${minutes}min`;
  }

  getSystemStatus() {
    // Simular verificação de status do sistema
    const uptime = process.uptime();
    const uptimeHours = Math.floor(uptime / 3600);
    const uptimeMinutes = Math.floor((uptime % 3600) / 60);

    return {
      isOnline: true,
      uptime: `${uptimeHours}h ${uptimeMinutes}m`,
      latency: '12ms',
      lastChecked: new Date().toISOString(),
    };
  }

  async getDashboard(companyId: string) {
    // Buscar todos os dados em paralelo para melhor performance
    const [stats, activities, systemStatus, chartData] = await Promise.all([
      this.getStats(companyId),
      this.getRecentActivities(companyId),
      this.getSystemStatus(),
      this.getChartData(companyId),
    ]);

    // Transformar dados para formato esperado pelo frontend
    const transformedStats = {
      sessions: stats.sessions,
      messages: stats.messagesInfo.today,
      contacts: stats.contactsInfo.total,
      automations: stats.automations,
    };

    return {
      stats: transformedStats,
      activities,
      systemStatus,
      chartData,
    };
  }

  private getTimeAgo(date: Date): string {
    const now = new Date();
    const diffInSeconds = Math.floor((now.getTime() - date.getTime()) / 1000);

    if (diffInSeconds < 60) {
      return `${diffInSeconds} segundos atrás`;
    } else if (diffInSeconds < 3600) {
      const minutes = Math.floor(diffInSeconds / 60);
      return `${minutes} minuto${minutes > 1 ? 's' : ''} atrás`;
    } else if (diffInSeconds < 86400) {
      const hours = Math.floor(diffInSeconds / 3600);
      return `${hours} hora${hours > 1 ? 's' : ''} atrás`;
    } else {
      const days = Math.floor(diffInSeconds / 86400);
      return `${days} dia${days > 1 ? 's' : ''} atrás`;
    }
  }
}
