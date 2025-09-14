import { NestFactory } from '@nestjs/core';
import { ValidationPipe } from '@nestjs/common';
import { SwaggerModule, DocumentBuilder } from '@nestjs/swagger';
import { AppModule } from './app.module';

async function bootstrap() {
  const app = await NestFactory.create(AppModule);
  
  app.useGlobalPipes(new ValidationPipe());
  app.enableCors();

  const config = new DocumentBuilder()
    .setTitle('Ventprom Packer API')
    .setDescription('API for 3D truck packing optimization')
    .setVersion('1.0')
    .build();
  const document = SwaggerModule.createDocument(app, config);
  SwaggerModule.setup('api', app, document);

  // Bind to 0.0.0.0 so the server is reachable from Docker host
  await app.listen(3001, '0.0.0.0');
  console.log('API server running on http://localhost:3001');
}
bootstrap();








