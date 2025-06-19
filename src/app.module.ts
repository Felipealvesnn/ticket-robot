import { Module } from '@nestjs/common';

import { SessionModule } from './session/session.module';
import { MessageModule } from './message/message.module';

@Module({
  imports: [SessionModule, MessageModule],
})
export class AppModule {}
