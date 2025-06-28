import { Module } from '@nestjs/common';
import { BusinessHoursModule } from '../business-hours/business-hours.module';
import { MediaModule } from '../media/media.module';
import { PrismaModule } from '../prisma/prisma.module';
import { FlowStateService } from './flow-state.service';
import { FlowController } from './flow.controller';
import { FlowService } from './flow.service';

@Module({
  imports: [PrismaModule, BusinessHoursModule, MediaModule],
  controllers: [FlowController],
  providers: [FlowService, FlowStateService],
  exports: [FlowService, FlowStateService],
})
export class FlowModule {}
