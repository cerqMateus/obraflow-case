import { Injectable } from '@nestjs/common';
import type { OnApplicationShutdown } from '@nestjs/common';
import session from 'express-session';
import connectPgSimple from 'connect-pg-simple';
import { Pool } from 'pg';
import { randomBytes } from 'node:crypto';
import type { Request, Response, RequestHandler } from 'express';
import { configuration } from '../../infrastructure/configuration';
import { databaseUrl } from '../../infrastructure/database/database-url';

export const SESSION_COOKIE = 'obraflow.sid';
export const ANONYMOUS_TTL = 15 * 60 * 1000;
export const AUTHENTICATED_TTL = 8 * 60 * 60 * 1000;

@Injectable()
export class SessionService implements OnApplicationShutdown {
  private readonly config = configuration();
  private readonly pool = new Pool({ connectionString: databaseUrl() });
  private readonly store = new (connectPgSimple(session))({
    pool: this.pool, tableName: 'session', createTableIfMissing: false, disableTouch: true,
    errorLog: () => console.error(JSON.stringify({ event: 'session_store_error' })),
  });
  readonly middleware: RequestHandler = session({
    name: SESSION_COOKIE, secret: process.env.SESSION_SECRET ?? '', store: this.store,
    resave: false, saveUninitialized: false, rolling: false,
    cookie: { httpOnly: true, secure: this.config.secureCookie, sameSite: 'lax', path: '/' },
  });

  valid(req: Request): boolean {
    return Boolean(req.session) && typeof req.session.absoluteExpiresAt === 'number' &&
      req.session.absoluteExpiresAt > Date.now() && typeof req.session.csrfToken === 'string';
  }

  // express-session touches cookies even with rolling:false. Pin that touch to the absolute deadline.
  pinExpiration(req: Request): void {
    req.session.touch = () => {
      if (req.session.absoluteExpiresAt) req.session.cookie.expires = new Date(req.session.absoluteExpiresAt);
      return req.session;
    };
    req.session.touch();
  }

  async initialize(req: Request, userId?: string): Promise<void> {
    if (!req.session) throw new Error('Session middleware must initialize the request.');
    await new Promise<void>((resolve, reject) => req.session.regenerate((error: unknown) => error ? reject(error) : resolve()));
    const now = Date.now();
    req.session.absoluteExpiresAt = now + (userId ? AUTHENTICATED_TTL : ANONYMOUS_TTL);
    req.session.csrfToken = randomBytes(32).toString('hex');
    if (userId) { req.session.userId = userId; req.session.authenticatedAt = now; }
    this.pinExpiration(req);
    await new Promise<void>((resolve, reject) => req.session.save((error: unknown) => error ? reject(error) : resolve()));
  }

  async destroy(req: Request, res: Response): Promise<void> {
    await new Promise<void>((resolve, reject) => req.session.destroy((error: unknown) => error ? reject(error) : resolve()));
    res.clearCookie(SESSION_COOKIE, { httpOnly: true, secure: this.config.secureCookie, sameSite: 'lax', path: '/' });
  }

  async onApplicationShutdown(): Promise<void> {
    this.store.close();
    await this.pool.end();
  }
}
