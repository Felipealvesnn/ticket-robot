/* eslint-disable prettier/prettier */
import { Controller, Get, Param, Post } from '@nestjs/common';
import { ConversationService } from './conversation.service';

@Controller('conversation')
export class ConversationController {
  constructor(private readonly conversationService: ConversationService) {}

  /**
   * 🔥 Endpoint para fechar tickets inativos manualmente (teste)
   */
  @Post('close-inactive-tickets/:companyId')
  async closeInactiveTickets(@Param('companyId') companyId: string) {
    return await this.conversationService.closeInactiveTickets(companyId);
  }

  /**
   * 📊 Estatísticas de tickets ativos
   */
  @Get('stats/:companyId')
  async getActiveTicketsStats(@Param('companyId') companyId: string) {
    return await this.conversationService.getActiveTicketsStats(companyId);
  }
}
