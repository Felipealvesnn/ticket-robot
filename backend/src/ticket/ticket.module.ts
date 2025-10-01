import { Module, forwardRef } from '@nestjs/common';
import { ConversationModule } from '../conversation/conversation.module';
import { PrismaModule } from '../prisma/prisma.module';
import { QueueModule } from '../queue/queue.module';
import { SessionModule } from '../session/session.module';
import { TicketSchedulerService } from './ticket-scheduler.service';
import { TicketController } from './ticket.controller';
import { TicketService } from './ticket.service';

@Module({
  imports: [
    PrismaModule,
    QueueModule,
    forwardRef(() => ConversationModule), // Evitar dependência circular
    forwardRef(() => SessionModule), // Para envio de mensagens via WhatsApp
  ],
  controllers: [TicketController],
  providers: [TicketService, TicketSchedulerService],
  exports: [TicketService, TicketSchedulerService],
})
export class TicketModule {}
