import { Module } from '@nestjs/common';
import { ConfigModule } from '@nestjs/config';
import { ScheduleModule } from '@nestjs/schedule';

import { AdminModule } from './admin/admin.module';
import { AuthModule } from './auth/auth.module';
import { BusinessHoursModule } from './business-hours/business-hours.module';
import { CompanyModule } from './company/company.module';
import configuration from './config/configuration';
import { ContactModule } from './contact/contact.module';
import { ConversationModule } from './conversation/conversation.module';
import { FlowModule } from './flow/flow.module';
import { IgnoredContactsModule } from './ignored-contacts/ignored-contacts.module';
import { MediaModule } from './media/media.module';
import { MessageModule } from './message/message.module';
import { PrismaModule } from './prisma/prisma.module';
import { RolesModule } from './roles/roles.module';
import { SessionModule } from './session/session.module';
import { TicketModule } from './ticket/ticket.module';
import { UsersModule } from './users/users.module';
import { UtilModule } from './util/util.module';

@Module({
  imports: [
    ConfigModule.forRoot({
      load: [configuration],
      isGlobal: true, // Torna as configurações disponíveis globalmente
      envFilePath: '.env', // Caminho para o arquivo .env
      cache: true, // Cacheia as variáveis para melhor performance
    }),
    ScheduleModule.forRoot(), // 🕐 Habilita o sistema de agendamento
    PrismaModule,
    UtilModule, // ✨ Módulo global com SessionGateway
    AuthModule,
    AdminModule,
    RolesModule,
    UsersModule,
    CompanyModule,
    FlowModule,
    TicketModule,
    ContactModule,
    ConversationModule,
    BusinessHoursModule,
    SessionModule,
    MessageModule,
    MediaModule,
    IgnoredContactsModule,
  ],
})
export class AppModule {}
