import { assertTestUrl } from './database-target';
import { databaseUrl } from '../src/infrastructure/database/database-url';

const url = 'postgresql://test:fixture@postgres:5432/obraflow_test';
const environment = { COMPOSE_PROJECT_NAME: 'obraflow-test', NODE_ENV: 'test', POSTGRES_DB: 'obraflow_test',
  TEST_DATABASE_URL: url, DATABASE_URL: url };

describe('Test destination guard', () => {
  it('accepts only the explicitly isolated project and database', () => {
    expect(assertTestUrl(environment).pathname).toBe('/obraflow_test');
  });
  it.each([
    { COMPOSE_PROJECT_NAME: 'obraflow' }, { NODE_ENV: 'development' }, { TEST_DATABASE_URL: '' },
    { DATABASE_URL: 'postgresql://test:fixture@postgres:5432/obraflow' }, { POSTGRES_DB: 'obraflow' },
    ...['localhost:5432/obraflow_test', 'postgres:5433/obraflow_test', 'postgres:5432/obraflow',
      'postgres:5432/obraflow_test?schema=work'].map((target) => ({
      TEST_DATABASE_URL: `postgresql://test:fixture@${target}`, DATABASE_URL: `postgresql://test:fixture@${target}`,
    })),
  ])('refuses unsafe configuration before connecting: %o', (override) => {
    expect(() => assertTestUrl({ ...environment, ...override })).toThrow('Refusing fixtures');
  });
});

describe('Database configuration', () => {
  it('encodes credentials without changing the destination', () => {
    const target = new URL(databaseUrl({ POSTGRES_DB: 'obraflow', POSTGRES_USER: 'a@b', POSTGRES_PASSWORD: 'a:/?#@' }));
    expect(target.hostname).toBe('postgres');
    expect(decodeURIComponent(target.password)).toBe('a:/?#@');
  });
  it('fails on incomplete configuration', () => expect(() => databaseUrl({})).toThrow('incomplete'));
});
