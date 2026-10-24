import { Injectable } from '@nestjs/common';
import type { OnApplicationShutdown } from '@nestjs/common';
import { Pool } from 'pg';

@Injectable()
export class DatabaseProbe implements OnApplicationShutdown {
  private readonly pool = new Pool({
    host: process.env.POSTGRES_HOST ?? 'postgres',
    database: process.env.POSTGRES_DB,
    user: process.env.POSTGRES_USER,
    password: process.env.POSTGRES_PASSWORD,
    max: 2,
    connectionTimeoutMillis: 2000,
    query_timeout: 2000,
    idleTimeoutMillis: 10000,
  });

  constructor() {
    // Idle connection failures must not terminate the process or disclose credentials.
    this.pool.on('error', () => undefined);
  }

  async check(): Promise<void> {
    await this.pool.query('SELECT 1');
  }

  async onApplicationShutdown(): Promise<void> {
    await this.pool.end();
  }
}
