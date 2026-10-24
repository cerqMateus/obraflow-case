import { DatabaseService } from '../src/infrastructure/database/database.service';
import { seedBase } from '../src/infrastructure/database/seed-base';

const database = new DatabaseService();
seedBase(database)
  .then(() => console.log('Base demonstration accounts and suppliers are ready.'))
  .catch((error: unknown) => {
    console.error(error instanceof Error && error.message.startsWith('Base seed conflicts')
      ? error.message : 'Base seed failed; no credentials or database details are logged.');
    process.exitCode = 1;
  })
  .finally(() => database.$disconnect());
