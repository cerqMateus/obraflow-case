import { Module } from '@nestjs/common';
import { HealthController } from './infrastructure/health.controller';
import { DatabaseModule } from './infrastructure/database/database.module';
import { AuthModule } from './modules/auth/auth.module';
import { UsersModule } from './modules/users/users.module';
import { ProjectsModule } from './modules/projects/projects.module';
import { SuppliersModule } from './modules/suppliers/suppliers.module';

@Module({ imports: [DatabaseModule, AuthModule, UsersModule, ProjectsModule, SuppliersModule], controllers: [HealthController] })
export class AppModule {}
