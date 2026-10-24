import { Controller, Get, Inject, ServiceUnavailableException } from '@nestjs/common';
import { DatabaseProbe } from './database-probe';

@Controller()
export class HealthController {
  constructor(@Inject(DatabaseProbe) private readonly database: DatabaseProbe) {}

  @Get('health/live')
  live(): { status: string } {
    return { status: 'ok' };
  }

  // Temporary public infrastructure probe; no domain operations or private data.
  @Get(['health/ready', 'api/technical-status'])
  async ready(): Promise<{ status: string }> {
    try {
      await this.database.check();
      return { status: 'ok' };
    } catch {
      throw new ServiceUnavailableException('Serviço indisponível.');
    }
  }
}
