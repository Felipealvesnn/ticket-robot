import { Module } from '@nestjs/common';
import { PrismaModule } from '../prisma/prisma.module';
import { FlowStateService } from './flow-state.service';
import { FlowController } from './flow.controller';
import { FlowService } from './flow.service';

@Module({
  imports: [PrismaModule],
  controllers: [FlowController],
  providers: [FlowService, FlowStateService],
  exports: [FlowService, FlowStateService],
})
export class FlowModule {}
