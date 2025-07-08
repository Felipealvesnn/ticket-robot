import { Module, forwardRef } from '@nestjs/common';
import { BusinessHoursModule } from '../business-hours/business-hours.module';
import { FlowModule } from '../flow/flow.module';
import { PrismaModule } from '../prisma/prisma.module';
import { ConversationController } from './conversation.controller';
import { ConversationService } from './conversation.service';

@Module({
  imports: [PrismaModule, FlowModule, BusinessHoursModule],
  controllers: [ConversationController],
  providers: [ConversationService],
  exports: [ConversationService],
})
export class ConversationModule {}
