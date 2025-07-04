import { Injectable, Logger } from '@nestjs/common';
import { Cron, CronExpression } from '@nestjs/schedule';
import { PrismaService } from '../../prisma/prisma.service';

@Injectable()
export class CleanupTokensTask {
  private readonly logger = new Logger(CleanupTokensTask.name);

  constructor(private readonly prisma: PrismaService) {}

  /**
   * Executa diariamente às 2:00 AM para limpar tokens expirados e revogados
   */
  @Cron(CronExpression.EVERY_DAY_AT_2AM)
  async cleanupExpiredTokens() {
    this.logger.log('🧹 Iniciando limpeza de tokens expirados...');

    try {
      const now = new Date();

      // Remover refresh tokens expirados ou revogados há mais de 7 dias
      const sevenDaysAgo = new Date();
      sevenDaysAgo.setDate(sevenDaysAgo.getDate() - 7);

      const deletedRefreshTokens = await this.prisma.refreshToken.deleteMany({
        where: {
          OR: [
            // Tokens expirados
            { expiresAt: { lt: now } },
            // Tokens revogados há mais de 7 dias
            {
              isRevoked: true,
              createdAt: { lt: sevenDaysAgo },
            },
          ],
        },
      });

      // Remover sessões expiradas há mais de 1 dia
      const oneDayAgo = new Date();
      oneDayAgo.setDate(oneDayAgo.getDate() - 1);

      const deletedSessions = await this.prisma.session.deleteMany({
        where: {
          expiresAt: { lt: oneDayAgo },
        },
      });

      this.logger.log(
        `✅ Limpeza concluída: ${deletedRefreshTokens.count} refresh tokens e ${deletedSessions.count} sessões removidos`,
      );

      // Log estatísticas atuais
      const activeRefreshTokens = await this.prisma.refreshToken.count({
        where: {
          isRevoked: false,
          expiresAt: { gt: now },
        },
      });

      const activeSessions = await this.prisma.session.count({
        where: {
          expiresAt: { gt: now },
        },
      });

      this.logger.log(
        `📊 Tokens ativos: ${activeRefreshTokens} refresh tokens, ${activeSessions} sessões`,
      );
    } catch (error) {
      this.logger.error('❌ Erro na limpeza de tokens:', error);
    }
  }

  /**
   * Método para limpeza manual (pode ser chamado via endpoint admin)
   */
  async manualCleanup(): Promise<{
    deletedRefreshTokens: number;
    deletedSessions: number;
    activeRefreshTokens: number;
    activeSessions: number;
  }> {
    this.logger.log('🧹 Limpeza manual de tokens iniciada...');

    const now = new Date();
    const oneDayAgo = new Date();
    oneDayAgo.setDate(oneDayAgo.getDate() - 1);

    // Remover refresh tokens expirados ou revogados
    const deletedRefreshTokens = await this.prisma.refreshToken.deleteMany({
      where: {
        OR: [{ expiresAt: { lt: now } }, { isRevoked: true }],
      },
    });

    // Remover sessões expiradas
    const deletedSessions = await this.prisma.session.deleteMany({
      where: {
        expiresAt: { lt: oneDayAgo },
      },
    });

    // Contar tokens ativos
    const activeRefreshTokens = await this.prisma.refreshToken.count({
      where: {
        isRevoked: false,
        expiresAt: { gt: now },
      },
    });

    const activeSessions = await this.prisma.session.count({
      where: {
        expiresAt: { gt: now },
      },
    });

    this.logger.log(
      `✅ Limpeza manual concluída: ${deletedRefreshTokens.count} refresh tokens e ${deletedSessions.count} sessões removidos`,
    );

    return {
      deletedRefreshTokens: deletedRefreshTokens.count,
      deletedSessions: deletedSessions.count,
      activeRefreshTokens,
      activeSessions,
    };
  }

  /**
   * Revoga todos os tokens de um usuário específico
   */
  async revokeAllUserTokens(userId: string): Promise<void> {
    this.logger.log(`🚫 Revogando todos os tokens do usuário ${userId}`);

    await Promise.all([
      // Revogar refresh tokens
      this.prisma.refreshToken.updateMany({
        where: {
          userId,
          isRevoked: false,
        },
        data: { isRevoked: true },
      }),
      // Remover sessões
      this.prisma.session.deleteMany({
        where: { userId },
      }),
    ]);

    this.logger.log(`✅ Todos os tokens do usuário ${userId} foram revogados`);
  }
}
