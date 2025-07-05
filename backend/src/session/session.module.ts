import { Module, forwardRef } from '@nestjs/common';
import { ConversationModule } from '../conversation/conversation.module';
import { FlowModule } from '../flow/flow.module';
import { IgnoredContactsModule } from '../ignored-contacts/ignored-contacts.module';
import { MediaModule } from '../media/media.module';
import { QueueModule } from '../queue/queue.module';
import { SessionController } from './session.controller';
import { SessionService } from './session.service';

@Module({
  imports: [
    QueueModule,
    forwardRef(() => FlowModule),
    ConversationModule,
    IgnoredContactsModule,
    MediaModule,
  ],
  controllers: [SessionController],
  providers: [SessionService],
  exports: [SessionService],
})
export class SessionModule {}
