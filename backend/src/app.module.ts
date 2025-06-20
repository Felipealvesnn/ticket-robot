import { Module } from '@nestjs/common';
import { ConfigModule } from '@nestjs/config';

import { SessionModule } from './session/session.module';
import { MessageModule } from './message/message.module';
import { AuthModule } from './auth/auth.module';
import { CompanyModule } from './company/company.module';
import { FlowModule } from './flow/flow.module';
import { TicketModule } from './ticket/ticket.module';
import { ContactModule } from './contact/contact.module';
import { PrismaModule } from './prisma/prisma.module';
import configuration from './config/configuration';

@Module({
  imports: [
    ConfigModule.forRoot({
      load: [configuration],
      isGlobal: true, // Torna as configurações disponíveis globalmente
      envFilePath: '.env', // Caminho para o arquivo .env
      cache: true, // Cacheia as variáveis para melhor performance
    }),
    PrismaModule,
    AuthModule,
    CompanyModule,
    FlowModule,
    TicketModule,
    ContactModule,
    SessionModule,
    MessageModule,
  ],
})
export class AppModule {}
