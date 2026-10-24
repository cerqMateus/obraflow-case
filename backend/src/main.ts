import 'reflect-metadata';
import { NestFactory } from '@nestjs/core';
import { AppModule } from './app.module';

const bootstrap = async (): Promise<void> => {
  const app = await NestFactory.create(AppModule);
  app.enableShutdownHooks();
  await app.listen(3000, '0.0.0.0');
};

bootstrap().catch(() => {
  console.error('Não foi possível iniciar o backend.');
  process.exitCode = 1;
});
