import { NestFactory } from '@nestjs/core';
import type { NestExpressApplication } from '@nestjs/platform-express';
import request from 'supertest';
import { Pool } from 'pg';
import { configureHttp } from '../src/infrastructure/http/configure-http';
import { configureDocumentation } from '../src/infrastructure/http/documentation';
import { assertConnectedTestDatabase, assertTestUrl } from './database-target';
import { HttpTestModule } from './http-fixture';

let app: NestExpressApplication;
let pool: Pool;
beforeAll(async () => {
  assertTestUrl(process.env);
  pool = new Pool({ connectionString: process.env.TEST_DATABASE_URL });
  await assertConnectedTestDatabase(pool);
  app = await NestFactory.create<NestExpressApplication>(HttpTestModule, { bodyParser: false, logger: false });
  configureHttp(app);
  configureDocumentation(app);
  await app.init();
});
afterAll(async () => { await app?.close(); await pool?.end(); });

describe('HTTP boundary with real PostgreSQL', () => {
  it.each([{ amount: 1 }, { amount: '1', total: '1' }, { amount: null }, { amount: '1e2' }])(
    'rejects wrong types and extra fields: %j', async (input) => {
      const response = await request(app.getHttpServer()).post('/api/v1/probe').send(input).expect(400);
      expect(response.body.error.code).toBe('VALIDATION_ERROR');
      expect(response.body.error.fields.length).toBeGreaterThan(0);
    });
  it('preserves decimal strings and does not wrap successful responses', async () => {
    const response = await request(app.getHttpServer()).post('/api/v1/probe').send({ amount: '9999999999.99' }).expect(201);
    expect(response.body).toEqual({ amount: '9999999999.99' });
  });
  it.each(['page=1&page=2', 'page=1.2', 'page=1e2', 'page=0', 'page=-1', 'page=01',
    'pageSize=101', 'pageSize=true', 'page=9007199254740992', 'unknown=x', 'page[x]=1',
    'active=1', 'active=TRUE', 'active=false&active=true'])('rejects query %s', async (query) => {
    const response = await request(app.getHttpServer()).get(`/api/v1/probe?${query}`).expect(400);
    expect(response.body.error.code).toBe('VALIDATION_ERROR');
  });
  it('uses explicit pagination defaults and accepts valid pages', async () => {
    expect((await request(app.getHttpServer()).get('/api/v1/probe').expect(200)).body).toEqual({ page: 1, pageSize: 20 });
    expect((await request(app.getHttpServer()).get('/api/v1/probe?page=3&pageSize=100').expect(200)).body)
      .toEqual({ page: 3, pageSize: 100 });
    expect((await request(app.getHttpServer()).get('/api/v1/probe?active=false').expect(200)).body.active).toBe(false);
  });
  it('accepts exactly 1 MiB of JSON without the former 100 KiB limit', async () => {
    const amount = '1'.repeat(1024 * 1024 - Buffer.byteLength(JSON.stringify({ amount: '' })));
    await request(app.getHttpServer()).post('/api/v1/probe').send({ amount }).expect(201);
  });
  it('rejects invalid UUIDs', async () => {
    await request(app.getHttpServer()).get('/api/v1/probe/uuid/not-an-id').expect(400);
    await request(app.getHttpServer()).get('/api/v1/probe/uuid/00000000-0000-4000-8000-000000000900').expect(200);
  });
  it.each([
    ['application/json', '{broken', 400, 'VALIDATION_ERROR'],
    ['text/plain', 'text', 415, 'UNSUPPORTED_MEDIA_TYPE'],
    ['application/json; charset=invalid', '{}', 415, 'UNSUPPORTED_MEDIA_TYPE'],
    ['application/json', JSON.stringify({ amount: 'x'.repeat(1024 * 1024) }), 413, 'PAYLOAD_TOO_LARGE'],
  ])('normalizes parser errors (%s, status %s)', async (type, body, status, code) => {
    const response = await request(app.getHttpServer()).post('/api/v1/probe').set('Content-Type', type).send(body).expect(status);
    expect(response.body.error.code).toBe(code);
    expect(response.body.error.requestId).toBe(response.headers['x-request-id']);
    expect(response.headers['cache-control']).toBe('no-store');
  });
  it('generates correlation IDs and redacts unexpected errors and logs', async () => {
    const log = jest.spyOn(console, 'error').mockImplementation(() => undefined);
    try {
      const response = await request(app.getHttpServer()).get('/api/v1/probe/failure').set('X-Request-Id', 'untrusted-secret').expect(500);
      expect(response.body.error).toEqual({ code: 'INTERNAL_ERROR', message: 'Não foi possível concluir a operação.',
        fields: [], details: {}, requestId: response.headers['x-request-id'] });
      expect(response.headers['x-request-id']).toMatch(/^[\da-f-]{36}$/);
      expect(JSON.stringify(log.mock.calls)).not.toMatch(/password|secret|SQL|SELECT|token/);
      expect(JSON.stringify(log.mock.calls)).toContain(response.headers['x-request-id']);
    } finally { log.mockRestore(); }
  });
  it('leaves 204 empty and private unimplemented endpoints unavailable', async () => {
    const response = await request(app.getHttpServer()).post('/api/v1/probe/empty').expect(204);
    expect(response.text).toBe('');
    await request(app.getHttpServer()).get('/api/v1/users').expect(404);
  });
  it('exposes minimal health and planned documentation without business data', async () => {
    for (const path of ['/health/live', '/health/ready', '/api/technical-status']) {
      const response = await request(app.getHttpServer()).get(path).expect(200);
      expect(response.body).toEqual({ status: 'ok' });
    }
    const response = await request(app.getHttpServer()).get('/api/docs/').expect(200);
    expect(response.text).toContain('ObraFlow — contrato planejado');
    const initialization = await request(app.getHttpServer()).get('/api/docs/swagger-ui-init.js').expect(200);
    expect(initialization.text).toContain('"supportedSubmitMethods": []');
    const document = await request(app.getHttpServer()).get('/api/docs/openapi.json').expect(200);
    expect(document.body.info.description).toContain('não representa endpoints implementados');
    expect(Object.keys(document.body.paths)).not.toContain('/probe');
  });
  it('refuses readiness when an expected migration is missing, then recovers', async () => {
    await assertConnectedTestDatabase(pool);
    const name = '202610240002_constraints';
    await pool.query('UPDATE "_prisma_migrations" SET rolled_back_at = now() WHERE migration_name = $1', [name]);
    try {
      const log = jest.spyOn(console, 'error').mockImplementation(() => undefined);
      try { await request(app.getHttpServer()).get('/health/ready').expect(503); }
      finally { log.mockRestore(); }
      await request(app.getHttpServer()).get('/health/live').expect(200);
    } finally {
      await pool.query('UPDATE "_prisma_migrations" SET rolled_back_at = NULL WHERE migration_name = $1', [name]);
    }
    await request(app.getHttpServer()).get('/health/ready').expect(200);
  });
});
