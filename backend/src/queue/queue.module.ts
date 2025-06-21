/* eslint-disable prettier/prettier */
import { BullModule } from '@nestjs/bull';
import { Module } from '@nestjs/common';
import { ConfigModule, ConfigService } from '@nestjs/config';
import { AllConfigType } from '../config/config.interface';
import { MessageQueueService } from './message-queue.service';

@Module({
  imports: [
    BullModule.forRootAsync({
      imports: [ConfigModule],
      useFactory: (configService: ConfigService<AllConfigType>) => ({
        redis: {
          host: configService.get('redis.host', { infer: true }),
          port: configService.get('redis.port', { infer: true }),
          password: configService.get('redis.password', { infer: true }),
        },
      }),
      inject: [ConfigService],
    }),
    BullModule.registerQueue({
      name: 'message-delivery',
    }),
  ],
  providers: [MessageQueueService], // ✅ SessionGateway vem do @Global UtilModule
  exports: [MessageQueueService],
})
export class QueueModule {}
