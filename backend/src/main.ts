import 'reflect-metadata';
import { NestFactory } from '@nestjs/core';
import type { NestExpressApplication } from '@nestjs/platform-express';
import { AppModule } from './app.module';
import { configuration } from './infrastructure/configuration';
import { configureHttp } from './infrastructure/http/configure-http';
import { configureDocumentation } from './infrastructure/http/documentation';

const bootstrap = async (): Promise<void> => {
  const config = configuration();
  const app = await NestFactory.create<NestExpressApplication>(AppModule, { bodyParser: false, logger: false });
  configureHttp(app);
  configureDocumentation(app);
  app.enableShutdownHooks();
  await app.listen(config.port, '0.0.0.0');
};

bootstrap().catch(() => {
  console.error('Não foi possível iniciar o backend.');
  process.exitCode = 1;
});
