import { randomBytes } from 'node:crypto';
import { readFileSync, writeFileSync } from 'node:fs';

const template = readFileSync(new URL('../.env.example', import.meta.url), 'utf8');
const environment = template
  .replace('REPLACE_WITH_RANDOM_HEX', randomBytes(32).toString('hex'))
  .replace('REPLACE_WITH_ANOTHER_RANDOM_HEX', randomBytes(48).toString('hex'));

// Exclusive creation preserves existing credentials and stable session secrets.
writeFileSync(new URL('../.env', import.meta.url), environment, { flag: 'wx', mode: 0o600 });
console.log('.env criado com segredos locais aleatórios.');
