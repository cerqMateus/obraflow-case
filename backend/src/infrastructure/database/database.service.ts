import { Injectable } from '@nestjs/common';
import type { OnModuleInit, OnApplicationShutdown } from '@nestjs/common';
import { PrismaClient } from '../../../generated/prisma';
import type { Prisma } from '../../../generated/prisma';
import { databaseUrl } from './database-url';

// Pass this client explicitly to every collaborator inside an atomic use case.
export type TransactionContext = Prisma.TransactionClient;

@Injectable()
export class DatabaseService extends PrismaClient implements OnModuleInit, OnApplicationShutdown {
  constructor() {
    super({ datasources: { db: { url: databaseUrl() } } });
  }

  async onModuleInit(): Promise<void> {
    await this.$connect();
  }

  async onApplicationShutdown(): Promise<void> {
    await this.$disconnect();
  }
}
