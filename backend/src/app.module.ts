import { Module } from '@nestjs/common';
import { HealthController } from './infrastructure/health.controller';
import { DatabaseModule } from './infrastructure/database/database.module';
import { AuthModule } from './modules/auth/auth.module';

@Module({ imports: [DatabaseModule, AuthModule], controllers: [HealthController] })
export class AppModule {}
