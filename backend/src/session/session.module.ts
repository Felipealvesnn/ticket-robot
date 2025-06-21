import { Module } from '@nestjs/common';
import { SessionGateway } from '../util/session.gateway';
import { SessionController } from './session.controller';
import { SessionService } from './session.service';

@Module({
  imports: [],
  controllers: [SessionController],
  providers: [SessionService, SessionGateway],
  exports: [SessionService, SessionGateway],
})
export class SessionModule {}
