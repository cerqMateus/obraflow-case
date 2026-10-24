import { databaseUrl } from './database/database-url';

export interface Configuration {
  port: number;
  origin: string;
  secureCookie: boolean;
  environment: 'local' | 'test' | 'production';
}

// Errors name the setting, never its value (URLs may contain credentials).
export const configuration = (env: NodeJS.ProcessEnv = process.env): Configuration => {
  const environment = env.APP_ENV;
  if (environment !== 'local' && environment !== 'test' && environment !== 'production') {
    throw new Error('Invalid APP_ENV.');
  }
  const db = new URL(databaseUrl(env));
  if (!['postgresql:', 'postgres:'].includes(db.protocol) || !db.hostname || !db.username ||
    !db.password || db.pathname.length < 2) throw new Error('Invalid database configuration.');
  const secret = env.SESSION_SECRET;
  if (!secret || secret.length < 32 || /placeholder|change.?me|replace|example/i.test(secret)) {
    throw new Error('Invalid SESSION_SECRET.');
  }
  const origin = new URL(env.APP_ORIGIN ?? '');
  if (!['https:', 'http:'].includes(origin.protocol) || origin.username || origin.password ||
    origin.origin !== env.APP_ORIGIN || (environment === 'production' && origin.protocol !== 'https:')) {
    throw new Error('Invalid APP_ORIGIN.');
  }
  const secureCookie = origin.protocol === 'https:';
  if (!secureCookie && !['localhost', '127.0.0.1', '[::1]', 'frontend'].includes(origin.hostname)) {
    throw new Error('HTTP requires a local APP_ORIGIN.');
  }
  if (env.COOKIE_SECURE !== undefined && env.COOKIE_SECURE !== String(secureCookie)) {
    throw new Error('Incompatible COOKIE_SECURE.');
  }
  const rawPort = env.PORT ?? '3000';
  if (!/^[1-9]\d{0,4}$/.test(rawPort) || Number(rawPort) > 65535) throw new Error('Invalid PORT.');
  if (env.NODE_ENV && !['production', 'development', 'test'].includes(env.NODE_ENV)) {
    throw new Error('Invalid NODE_ENV.');
  }
  return { environment, port: Number(rawPort), origin: origin.origin, secureCookie };
};
