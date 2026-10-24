import { readdirSync } from 'node:fs';
import { resolve } from 'node:path';

// Read the packaged migration directories, so readiness evolves with versioned migrations.
export const expectedMigrations = readdirSync(resolve(__dirname, '../../../prisma/migrations'), { withFileTypes: true })
  .filter((entry) => entry.isDirectory()).map((entry) => entry.name);
