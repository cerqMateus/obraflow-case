import { Module } from '@nestjs/common';
import { HealthController } from './infrastructure/health.controller';
import { DatabaseModule } from './infrastructure/database/database.module';

@Module({ imports: [DatabaseModule], controllers: [HealthController] })
export class AppModule {}
