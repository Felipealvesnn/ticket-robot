import { Module } from '@nestjs/common';
import { SessionService } from './session.service';
import { SessionController } from './session.controller';
import { SessionGateway } from '../util/session.gateway';

@Module({
  controllers: [SessionController],
  providers: [SessionService, SessionGateway],
  exports: [SessionService, SessionGateway],
})
export class SessionModule {}
