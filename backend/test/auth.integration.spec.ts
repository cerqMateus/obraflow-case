import { NestFactory } from '@nestjs/core';
import type { NestExpressApplication } from '@nestjs/platform-express';
import request from 'supertest';
import { configureHttp } from '../src/infrastructure/http/configure-http';
import { configureSession } from '../src/modules/auth/configure-session';
import { hashPassword } from '../src/infrastructure/security/password';
import { ANONYMOUS_TTL, AUTHENTICATED_TTL } from '../src/modules/auth/session.service';
import { AuthTestModule } from './auth-fixture';
import { createHarness } from './fixtures';
import { assertTestUrl } from './database-target';
import { expectAuthContract } from './auth-contract';

const harness = createHarness();
const password = 'Fixture-Password-2026!';
const origin = 'http://frontend';
let app: NestExpressApplication;
let operatorId: string;
const start = async (): Promise<NestExpressApplication> => {
  const application = await NestFactory.create<NestExpressApplication>(AuthTestModule, { bodyParser: false, logger: false });
  configureHttp(application);
  configureSession(application);
  await application.init();
  return application;
};
const client = () => request.agent(app.getHttpServer());
type Client = ReturnType<typeof client>;
const bootstrap = async (agent: Client) => (await agent.get('/api/v1/auth/csrf').expect(200)).body;
const login = async (agent: Client, email = 'operator@auth.test') => {
  const bootstrapResponse = await bootstrap(agent);
  return agent.post('/api/v1/auth/login').set('Origin', origin).set('X-CSRF-Token', bootstrapResponse.csrfToken)
    .send({ email, password }).expect(200);
};
const cookieHeader = (response: request.Response): string => {
  const cookies: unknown = response.headers['set-cookie'];
  if (!Array.isArray(cookies) || typeof cookies[0] !== 'string') throw new Error('Expected session cookie.');
  return cookies[0];
};
const cookieOf = (response: request.Response): string => cookieHeader(response).split(';')[0] ?? '';
const rows = () => harness.pool.query<{ sess: { absoluteExpiresAt: number; authenticatedAt?: number }; expire: Date }>(
  'SELECT sess, expire FROM session ORDER BY expire');

beforeAll(async () => {
  assertTestUrl(process.env);
  process.env.APP_ENV = 'test';
  process.env.APP_ORIGIN = origin;
  process.env.SESSION_SECRET = 'auth-integration-fixed-secret-for-isolated-tests-2026';
  await harness.clear();
  const passwordHash = await hashPassword(password);
  for (const role of ['admin', 'operator'] as const) {
    const user = await harness.first.user.create({ data: { name: `Auth ${role}`, email: `${role}@auth.test`, role, passwordHash } });
    if (role === 'operator') operatorId = user.id;
  }
});
beforeEach(async () => {
  await harness.pool.query('DELETE FROM session');
  app = await start();
});
afterEach(async () => { await app?.close(); });
afterAll(async () => { await harness.clear(); await harness.close(); });

describe('PostgreSQL authentication over HTTP', () => {
  it('requires bootstrap and authenticates before checking private CSRF', async () => {
    const agent = client();
    const noBootstrap = await agent.post('/api/v1/auth/login').send({ email: 'operator@auth.test', password }).expect(403);
    expect(noBootstrap.body.error.code).toBe('CSRF_INVALID');
    for (const path of ['/api/v1/auth/logout', '/api/v1/auth-probe/operator']) {
      const response = await agent.post(path).expect(401);
      expect(response.body.error.code).toBe('UNAUTHENTICATED');
    }
    await agent.get('/api/v1/auth/me').expect(401);
    await agent.get('/api/v1/auth-probe/private').set('X-Demo-User-Id', operatorId).set('X-Role', 'admin').expect(401);
    expect((await rows()).rowCount).toBe(0);
  });

  it('reuses anonymous bootstrap without extending its absolute deadline', async () => {
    const agent = client();
    const first = await agent.get('/api/v1/auth/csrf').expect(200);
    expectAuthContract('Csrf', first.body);
    const cookie = cookieHeader(first);
    expect(cookie).toMatch(/HttpOnly/);
    expect(cookie).toMatch(/SameSite=Lax/);
    expect(cookie).toMatch(/Path=\//);
    expect(cookie).not.toMatch(/Domain=|Secure/);
    expect(first.headers['cache-control']).toBe('no-store');
    expect(Date.parse(first.body.expiresAt) - Date.now()).toBeLessThanOrEqual(ANONYMOUS_TTL);
    const second = await agent.get('/api/v1/auth/csrf').expect(200);
    expect(second.body).toEqual(first.body);
    expect(second.headers['set-cookie']).toBeUndefined();
    const stored = (await rows()).rows[0];
    // connect-pg-simple rounds its cleanup timestamp up to a second; JSON remains authoritative.
    expect(stored?.expire.getTime()).toBe(Math.ceil(Date.parse(first.body.expiresAt) / 1000) * 1000);
    expect(stored?.sess.absoluteExpiresAt).toBe(Date.parse(first.body.expiresAt));
  });

  it('rotates ID and CSRF, rejects old contexts, and preserves the authenticated deadline', async () => {
    const agent = client();
    const anonymous = await agent.get('/api/v1/auth/csrf').expect(200);
    const oldCookie = cookieOf(anonymous);
    const response = await agent.post('/api/v1/auth/login').set('X-CSRF-Token', anonymous.body.csrfToken)
      .send({ email: '  OPERATOR@AUTH.TEST  ', password }).expect(200);
    const token: string = response.body.csrfToken;
    expectAuthContract('Session', response.body);
    expect(cookieOf(response)).not.toBe(oldCookie);
    expect(token).not.toBe(anonymous.body.csrfToken);
    expect(Object.keys(response.body).sort()).toEqual(['csrfToken', 'expiresAt', 'user']);
    expect(Object.keys(response.body.user).sort()).toEqual(['email', 'id', 'name', 'role']);
    expect(response.body.user.role).toBe('operator');
    expect(response.body.user.id).toBe(operatorId);
    const stored = (await rows()).rows[0];
    expect((await rows()).rowCount).toBe(1);
    expect(stored?.expire.getTime()).toBe(Math.ceil(Date.parse(response.body.expiresAt) / 1000) * 1000);
    expect((stored?.sess.absoluteExpiresAt ?? 0) - (stored?.sess.authenticatedAt ?? 0)).toBe(AUTHENTICATED_TTL);
    await request(app.getHttpServer()).get('/api/v1/auth/me').set('Cookie', oldCookie).expect(401);
    await request(app.getHttpServer()).post('/api/v1/auth/login').set('Cookie', oldCookie)
      .set('X-CSRF-Token', anonymous.body.csrfToken).send({ email: 'operator@auth.test', password }).expect(403);
    await agent.post('/api/v1/auth/logout').set('X-CSRF-Token', anonymous.body.csrfToken).expect(403);
    const me = await agent.get('/api/v1/auth/me').expect(200);
    expectAuthContract('Session', me.body);
    expect(me.body).toEqual(response.body);
    expect((await bootstrap(agent)).expiresAt).toBe(response.body.expiresAt);
    await agent.post('/api/v1/auth-probe/operator').set('X-CSRF-Token', token).expect(201);
    expect((await rows()).rows[0]?.expire).toEqual(stored?.expire);
    const conflict = await agent.post('/api/v1/auth/login').set('X-CSRF-Token', token)
      .send({ email: 'admin@auth.test', password }).expect(409);
    expect(conflict.body.error.code).toBe('SESSION_ALREADY_AUTHENTICATED');
  });

  it('rejects foreign origins and tokens from another session without changing identity', async () => {
    const agent = client();
    const other = client();
    const foreign = await bootstrap(other);
    const response = await login(agent);
    const token: string = response.body.csrfToken;
    const wrongOrigin = await agent.post('/api/v1/auth/logout').set('Origin', 'https://foreign.test')
      .set('X-CSRF-Token', token).expect(403);
    expect(wrongOrigin.body.error.code).toBe('FORBIDDEN');
    for (const invalid of [foreign.csrfToken, 'wrong-token', 'é'.repeat(64)]) {
      const result = await agent.post('/api/v1/auth/logout').set('X-CSRF-Token', invalid).expect(403);
      expect(result.body.error.code).toBe('CSRF_INVALID');
    }
    await agent.post('/api/v1/auth/logout').expect(403);
    expect((await agent.get('/api/v1/auth/me').expect(200)).body.user.id).toBe(operatorId);
    const otherOrigin = await other.post('/api/v1/auth/login').set('Origin', 'null')
      .set('X-CSRF-Token', foreign.csrfToken).send({ email: 'operator@auth.test', password }).expect(403);
    expect(otherOrigin.body.error.code).toBe('FORBIDDEN');
  });

  it('resolves roles from persisted identity and rejects forged input', async () => {
    const operator = client();
    const admin = client();
    const op = await login(operator);
    const ad = await login(admin, 'admin@auth.test');
    await operator.get('/api/v1/auth-probe/admin').set('X-Role', 'admin').expect(403);
    const result = await admin.get('/api/v1/auth-probe/admin').expect(200);
    expect(result.body.role).toBe('admin');
    await admin.post('/api/v1/auth-probe/operator').set('X-CSRF-Token', ad.body.csrfToken).expect(403);
    const identity = await operator.post('/api/v1/auth-probe/operator').set('X-CSRF-Token', op.body.csrfToken)
      .set('X-Role', 'admin').set('X-Demo-User-Id', ad.body.user.id).send({ role: 'admin' }).expect(201);
    expect(identity.body.id).toBe(operatorId);
    const anonymous = client();
    const boot = await bootstrap(anonymous);
    const forged = await anonymous.post('/api/v1/auth/login').set('X-CSRF-Token', boot.csrfToken)
      .send({ email: 'operator@auth.test', password, role: 'admin' }).expect(400);
    expect(forged.body.error.code).toBe('VALIDATION_ERROR');
    await operator.get('/api/v1/auth/me?role=admin').expect(400);
    await operator.post('/api/v1/auth/logout').set('X-CSRF-Token', op.body.csrfToken).send({ userId: ad.body.user.id }).expect(400);
  });

  it('uses generic credential errors, strict fields, and preserves password whitespace', async () => {
    const agent = client();
    const boot = await bootstrap(agent);
    const bodies: unknown[] = [];
    for (const input of [{ email: 'missing@auth.test', password }, { email: 'operator@auth.test', password: 'wrong' },
      { email: 'operator@auth.test', password: ` ${password} ` }]) {
      const response = await agent.post('/api/v1/auth/login').set('X-CSRF-Token', boot.csrfToken).send(input).expect(401);
      bodies.push({ ...response.body.error, requestId: 'redacted' });
    }
    expect(bodies[0]).toEqual(bodies[1]);
    expect(bodies[0]).toEqual(bodies[2]);
    for (const input of [{ email: 'invalid', password }, { email: 'operator@auth.test', password: '' },
      { email: 1, password }, { email: 'operator@auth.test', password: 'a'.repeat(129) }]) {
      await agent.post('/api/v1/auth/login').set('X-CSRF-Token', boot.csrfToken).send(input).expect(400);
    }
  });

  it('enforces persisted expiration even if the store row and cookie are still valid', async () => {
    const agent = client();
    const authenticated = await login(agent);
    await harness.pool.query(`UPDATE session SET sess = jsonb_set(sess::jsonb, '{absoluteExpiresAt}', to_jsonb($1::bigint))::json`, [Date.now() - 1]);
    const expired = await agent.post('/api/v1/auth/logout').set('X-CSRF-Token', authenticated.body.csrfToken).expect(401);
    expect(expired.body.error.code).toBe('UNAUTHENTICATED');
    expect(cookieHeader(expired)).toContain('Expires=Thu, 01 Jan 1970');
    expect((await rows()).rowCount).toBe(0);
    const boot = await bootstrap(agent);
    await harness.pool.query(`UPDATE session SET sess = jsonb_set(sess::jsonb, '{absoluteExpiresAt}', to_jsonb($1::bigint))::json`, [Date.now() - 1]);
    const invalidBootstrap = await agent.post('/api/v1/auth/login').set('X-CSRF-Token', boot.csrfToken)
      .send({ email: 'operator@auth.test', password }).expect(403);
    expect(invalidBootstrap.body.error.code).toBe('CSRF_INVALID');
    const renewed = await bootstrap(agent);
    expect(renewed.csrfToken).not.toBe(boot.csrfToken);
  });

  it('preserves a session across application restart and invalidates the old cookie on logout', async () => {
    const agent = client();
    const response = await login(agent);
    const cookie = cookieOf(response);
    await app.close();
    app = await start();
    const me = await request(app.getHttpServer()).get('/api/v1/auth/me').set('Cookie', cookie).expect(200);
    expect(me.body).toEqual(response.body);
    const logout = await request(app.getHttpServer()).post('/api/v1/auth/logout').set('Cookie', cookie)
      .set('X-CSRF-Token', response.body.csrfToken).expect(204);
    expect(logout.text).toBe('');
    expect(cookieHeader(logout)).toContain('Expires=Thu, 01 Jan 1970');
    expect((await rows()).rowCount).toBe(0);
    await request(app.getHttpServer()).get('/api/v1/auth/me').set('Cookie', cookie).expect(401);
    await request(app.getHttpServer()).post('/api/v1/auth/logout').set('Cookie', cookie)
      .set('X-CSRF-Token', response.body.csrfToken).expect(401);
  });

  it('limits the eleventh login attempt despite forged forwarding headers', async () => {
    for (let attempt = 0; attempt < 10; attempt += 1) {
      const response = await request(app.getHttpServer()).post('/api/v1/auth/login')
        .set('X-Forwarded-For', `198.51.100.${attempt + 1}`).send({}).expect(403);
      expect(response.body.error.code).toBe('CSRF_INVALID');
    }
    const limited = await request(app.getHttpServer()).post('/api/v1/auth/login')
      .set('X-Forwarded-For', '203.0.113.1').send({}).expect(429);
    expect(limited.body.error.code).toBe('LOGIN_RATE_LIMITED');
    expect(Number(limited.headers['retry-after'])).toBeGreaterThan(0);
    expect(Number(limited.headers['retry-after'])).toBeLessThanOrEqual(900);
    expect(limited.headers['cache-control']).toBe('no-store');
  });

  it('uses Secure cookies over HTTPS and trusts only explicitly configured proxy IPs', async () => {
    await app.close();
    process.env.APP_ORIGIN = 'https://obraflow.test';
    process.env.TRUST_PROXY_IPS = '::ffff:127.0.0.1,127.0.0.1,::1';
    try {
      app = await start();
      const secure = await request(app.getHttpServer()).get('/api/v1/auth/csrf')
        .set('X-Forwarded-Proto', 'https').expect(200);
      expect(cookieHeader(secure)).toContain('Secure');
      expect(cookieHeader(secure)).toContain('HttpOnly');
      for (let attempt = 0; attempt < 10; attempt += 1) {
        await request(app.getHttpServer()).post('/api/v1/auth/login').set('X-Forwarded-For', '198.51.100.1').send({}).expect(403);
      }
      await request(app.getHttpServer()).post('/api/v1/auth/login').set('X-Forwarded-For', '198.51.100.1').send({}).expect(429);
      await request(app.getHttpServer()).post('/api/v1/auth/login').set('X-Forwarded-For', '198.51.100.2').send({}).expect(403);
    } finally {
      process.env.APP_ORIGIN = origin;
      delete process.env.TRUST_PROXY_IPS;
    }
  });
});
