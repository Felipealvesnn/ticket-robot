import { Global, Module } from '@nestjs/common';
import { SessionGateway } from './session.gateway';

@Global() // ✨ Torna disponível em toda aplicação
@Module({
  providers: [SessionGateway],
  exports: [SessionGateway],
})
export class UtilModule {}
