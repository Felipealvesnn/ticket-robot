import { Module } from '@nestjs/common';
import { ConfigModule } from '@nestjs/config';

import { AuthModule } from './auth/auth.module';
import { BusinessHoursModule } from './business-hours/business-hours.module';
import { CompanyModule } from './company/company.module';
import configuration from './config/configuration';
import { ContactModule } from './contact/contact.module';
import { FlowModule } from './flow/flow.module';
import { MessageModule } from './message/message.module';
import { PrismaModule } from './prisma/prisma.module';
import { SessionModule } from './session/session.module';
import { TicketModule } from './ticket/ticket.module';
import { UtilModule } from './util/util.module';

@Module({
  imports: [
    ConfigModule.forRoot({
      load: [configuration],
      isGlobal: true, // Torna as configurações disponíveis globalmente
      envFilePath: '.env', // Caminho para o arquivo .env
      cache: true, // Cacheia as variáveis para melhor performance
    }),
    PrismaModule,
    UtilModule, // ✨ Módulo global com SessionGateway
    AuthModule,
    CompanyModule,
    FlowModule,
    TicketModule,
    ContactModule,
    BusinessHoursModule,
    SessionModule,
    MessageModule,
  ],
})
export class AppModule {}
