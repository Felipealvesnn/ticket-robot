import { Module } from '@nestjs/common';
import { PrismaModule } from '../prisma/prisma.module';
import { IgnoredContactsController } from './ignored-contacts.controller';
import { IgnoredContactsService } from './ignored-contacts.service';

@Module({
  imports: [PrismaModule],
  controllers: [IgnoredContactsController],
  providers: [IgnoredContactsService],
  exports: [IgnoredContactsService],
})
export class IgnoredContactsModule {}
