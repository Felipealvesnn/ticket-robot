import { Module } from '@nestjs/common';
import { ConfigModule } from '@nestjs/config';

import { SessionModule } from './session/session.module';
import { MessageModule } from './message/message.module';
import configuration from './config/configuration';

@Module({
  imports: [
    ConfigModule.forRoot({
      load: [configuration],
      isGlobal: true, // Torna as configurações disponíveis globalmente
      envFilePath: '.env', // Caminho para o arquivo .env
      cache: true, // Cacheia as variáveis para melhor performance
    }),
    SessionModule,
    MessageModule,
  ],
})
export class AppModule {}
