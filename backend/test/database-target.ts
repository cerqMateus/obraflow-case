import type { Pool } from 'pg';

export const assertTestUrl = (env: NodeJS.ProcessEnv): URL => {
  if (env.COMPOSE_PROJECT_NAME !== 'obraflow-test' || env.NODE_ENV !== 'test' || !env.TEST_DATABASE_URL) {
    throw new Error('Refusing fixtures: explicit obraflow-test environment is required.');
  }
  const url = new URL(env.TEST_DATABASE_URL);
  if (url.protocol !== 'postgresql:' || url.hostname !== 'postgres' || (url.port && url.port !== '5432') ||
    url.pathname !== '/obraflow_test' || url.search || url.hash ||
    env.DATABASE_URL !== env.TEST_DATABASE_URL || env.POSTGRES_DB !== 'obraflow_test') {
    throw new Error('Refusing fixtures: database URL is not the isolated test destination.');
  }
  return url;
};

export const assertConnectedTestDatabase = async (pool: Pool): Promise<void> => {
  const expected = assertTestUrl(process.env);
  const result = await pool.query<{ database: string; username: string; port: number; schema: string }>(
    'SELECT current_database() AS database, current_user AS username, inet_server_port() AS port, current_schema() AS schema');
  const target = result.rows[0];
  if (!target || target.database !== 'obraflow_test' || target.username !== decodeURIComponent(expected.username) ||
    target.port !== 5432 || target.schema !== 'public') {
    throw new Error('Refusing fixtures: effective database does not match the test destination.');
  }
};
