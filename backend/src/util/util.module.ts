import { Global, Module } from '@nestjs/common';
import { ConfigModule, ConfigService } from '@nestjs/config';
import { JwtModule } from '@nestjs/jwt';
import { SessionGateway } from './session.gateway';

@Global() // ✨ Torna disponível em toda aplicação
@Module({
  imports: [
    JwtModule.registerAsync({
      imports: [ConfigModule],
      useFactory: (configService: ConfigService) => ({
        secret: configService.get<string>('JWT_SECRET'),
        signOptions: {
          expiresIn:
            configService.get<string>('JWT_ACCESS_EXPIRES_IN') || '15m',
        },
      }),
      inject: [ConfigService],
    }),
  ],
  providers: [SessionGateway],
  exports: [SessionGateway],
})
export class UtilModule {}
