import { Module } from '@nestjs/common';
import { DatabaseModule } from '../../infrastructure/database/database.module';
import { ResponsibilitiesController } from './responsibilities.controller';
import { ResponsibilitiesService } from './responsibilities.service';

@Module({ imports: [DatabaseModule], controllers: [ResponsibilitiesController], providers: [ResponsibilitiesService] })
export class ResponsibilitiesModule {}
