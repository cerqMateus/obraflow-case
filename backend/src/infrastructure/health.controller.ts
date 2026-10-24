import { Controller, Get, Inject, ServiceUnavailableException } from '@nestjs/common';
import { DatabaseService } from './database/database.service';

@Controller()
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
      await this.database.$queryRaw`SELECT 1`;
      return { status: 'ok' };
    } catch {
      throw new ServiceUnavailableException('Serviço indisponível.');
    }
  }
}
