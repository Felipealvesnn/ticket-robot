import { NestFactory } from '@nestjs/core';
import { AppModule } from './app.module';
import { DocumentBuilder, SwaggerModule } from '@nestjs/swagger';
import { ConfigService } from '@nestjs/config';
import { ValidationPipe } from '@nestjs/common';

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
  const configService = app.get(ConfigService);

  // Configuração do Swagger
  const config = new DocumentBuilder()
    .setTitle('🤖 Ticket Robot API')
    .setDescription(
      'API para automação de WhatsApp com geração de QR Code e gerenciamento de sessões',
    )
    .setVersion('1.0')
    .addTag('Sessões WhatsApp', 'Gerenciamento de sessões do WhatsApp')
    .addTag('Mensagens', 'Envio e recebimento de mensagens')
    .build();

  const documentFactory = () => SwaggerModule.createDocument(app, config);
  SwaggerModule.setup('api', app, documentFactory);

  // Porta configurável via .env
  const port = configService.get<number>('app.port', 3000);

  await app.listen(port);

  console.log(`🚀 Aplicação rodando em: http://localhost:${port}`);
  console.log(`📚 Swagger UI disponível em: http://localhost:${port}/api`);
  console.log(
    `🗄️ Banco de dados: ${configService.get('database.host')}:${configService.get('database.port')}`,
  );
}
bootstrap();
