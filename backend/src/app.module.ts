import { Module } from '@nestjs/common';
import { HealthController } from './infrastructure/health.controller';
import { DatabaseProbe } from './infrastructure/database-probe';

@Module({ controllers: [HealthController], providers: [DatabaseProbe] })
export class AppModule {}
