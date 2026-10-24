import { spawnSync } from 'node:child_process';
import { databaseUrl } from '../src/infrastructure/database/database-url';

process.env.DATABASE_URL = process.argv[2] === 'generate'
  ? 'postgresql://generate:generate@localhost:5432/generate' : databaseUrl();
const result = spawnSync(process.execPath, [require.resolve('prisma/build/index.js'), ...process.argv.slice(2)], {
  stdio: 'inherit', env: process.env,
});
process.exitCode = result.status ?? 1;
