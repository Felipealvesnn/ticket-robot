import { Module } from '@nestjs/common';
import { QueueModule } from '../queue/queue.module';
import { SessionController } from './session.controller';
import { SessionService } from './session.service';

@Module({
  imports: [QueueModule], // ✅ Sem forwardRef, dependência linear
  controllers: [SessionController],
  providers: [SessionService], // ✅ SessionGateway vem do @Global UtilModule
  exports: [SessionService],
})
export class SessionModule {}
