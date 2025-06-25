import { Module } from '@nestjs/common';
import { ConversationModule } from '../conversation/conversation.module';
import { FlowModule } from '../flow/flow.module';
import { QueueModule } from '../queue/queue.module';
import { SessionController } from './session.controller';
import { SessionService } from './session.service';

@Module({
  imports: [QueueModule, FlowModule, ConversationModule], // ✅ Adicionado ConversationModule
  controllers: [SessionController],
  providers: [SessionService], // ✅ SessionGateway vem do @Global UtilModule
  exports: [SessionService],
})
export class SessionModule {}
