import { Module } from '@nestjs/common';
import { QueueModule } from '../queue/queue.module';
import { SessionGateway } from '../util/session.gateway';
import { SessionController } from './session.controller';
import { SessionService } from './session.service';

@Module({
  imports: [QueueModule],
  controllers: [SessionController],
  providers: [SessionService, SessionGateway],
  exports: [SessionService, SessionGateway],
})
export class SessionModule {}
