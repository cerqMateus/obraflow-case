export const databaseUrl = (env: NodeJS.ProcessEnv = process.env): string => {
  if (env.DATABASE_URL) return env.DATABASE_URL;
  const { POSTGRES_DB, POSTGRES_USER, POSTGRES_PASSWORD } = env;
  if (!POSTGRES_DB || !POSTGRES_USER || !POSTGRES_PASSWORD) {
    throw new Error('Database configuration is incomplete.');
  }
  const url = new URL('postgresql://postgres:5432');
  url.hostname = env.POSTGRES_HOST ?? 'postgres';
  url.username = POSTGRES_USER;
  url.password = POSTGRES_PASSWORD;
  url.pathname = `/${POSTGRES_DB}`;
  return url.toString();
};
