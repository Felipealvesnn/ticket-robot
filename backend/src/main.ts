import { ValidationPipe } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { NestFactory } from '@nestjs/core';
import { DocumentBuilder, SwaggerModule } from '@nestjs/swagger';
import { AppModule } from './app.module';
import { AllConfigType } from './config/config.interface';

async function bootstrap() {
  const app = await NestFactory.create(AppModule);

  // Habilita validação global
  app.useGlobalPipes(
    new ValidationPipe({
      whitelist: true, // Remove propriedades não definidas no DTO
      forbidNonWhitelisted: true, // Rejeita requisições com propriedades extras
      transform: true, // Aplica transformações definidas no DTO
      transformOptions: {
        enableImplicitConversion: true, // Converte tipos automaticamente
      },
    }),
  );

  // Obtém o ConfigService para acessar variáveis de ambiente
  const configService = app.get(ConfigService<AllConfigType>);

  // Configuração global de CORS
  app.enableCors({
    origin: configService.get('frontend.url', { infer: true }),
    methods: ['GET', 'POST', 'PUT', 'DELETE', 'PATCH'],
    credentials: true,
  });

  // Configuração do Swagger
  const config = new DocumentBuilder()
    .setTitle('🤖 Ticket Robot API')
    .setDescription(
      'API para automação de WhatsApp com sistema de tickets, chatbot e gestão multi-tenant',
    )
    .setVersion('1.0')
    .addBearerAuth(
      {
        type: 'http',
        scheme: 'bearer',
        bearerFormat: 'JWT',
        name: 'JWT',
        description: 'Token JWT para autenticação',
        in: 'header',
      },
      'JWT-auth',
    )
    .build();

  const documentFactory = () => SwaggerModule.createDocument(app, config);
  SwaggerModule.setup('api', app, documentFactory);

  // Porta configurável via .env
  const port = configService.get('app.port', { infer: true }) || 3000;

  await app.listen(port);

  console.log(`🚀 Aplicação rodando em: http://localhost:${port}`);
  console.log(`📚 Swagger UI disponível em: http://localhost:${port}/api`);
  console.log(
    `🗄️ Banco de dados: ${configService.get('database.host', { infer: true })}:${configService.get('database.port', { infer: true })}`,
  );
}

void bootstrap();
