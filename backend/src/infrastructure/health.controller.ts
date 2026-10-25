import { Controller, Get, Inject, ServiceUnavailableException } from '@nestjs/common';
import { DatabaseService } from './database/database.service';
import { expectedMigrations } from './database/expected-migrations';
import { Public } from '../modules/auth/auth.metadata';

@Controller()
@Public()
export class HealthController {
  constructor(@Inject(DatabaseService) private readonly database: DatabaseService) {}

  @Get('health/live')
  live(): { status: string } {
    return { status: 'ok' };
  }

  // Temporary public infrastructure probe; no domain operations or private data.
  @Get(['health/ready', 'api/technical-status'])
  async ready(): Promise<{ status: string }> {
    try {
      const migrations = await this.database.$queryRaw<{ migration_name: string }[]>`
        SELECT migration_name FROM "_prisma_migrations"
        WHERE finished_at IS NOT NULL AND rolled_back_at IS NULL`;
      if (!expectedMigrations.every((name) => migrations.some((row) => row.migration_name === name))) {
        throw new Error('Migrations pending.');
      }
      return { status: 'ok' };
    } catch {
      throw new ServiceUnavailableException('Serviço indisponível.');
    }
  }
}
