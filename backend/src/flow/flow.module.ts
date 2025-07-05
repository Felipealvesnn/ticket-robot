import { Module, forwardRef } from '@nestjs/common';
import { BusinessHoursModule } from '../business-hours/business-hours.module';
import { MediaModule } from '../media/media.module';
import { PrismaModule } from '../prisma/prisma.module';
import { SessionModule } from '../session/session.module';
import { WebhookModule } from '../webhook/webhook.module';
import { FlowStateService } from './flow-state.service';
import { FlowController } from './flow.controller';
import { FlowService } from './flow.service';

@Module({
  imports: [
    PrismaModule,
    BusinessHoursModule,
    MediaModule,
    WebhookModule,
    forwardRef(() => SessionModule),
  ],
  controllers: [FlowController],
  providers: [FlowService, FlowStateService],
  exports: [FlowService, FlowStateService],
})
export class FlowModule {}
