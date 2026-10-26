import { NestFactory } from '@nestjs/core';
import type { NestExpressApplication } from '@nestjs/platform-express';
import request from 'supertest';
import Ajv from 'ajv';
import addFormats from 'ajv-formats';
import { readFileSync } from 'node:fs';
import { resolve } from 'node:path';
import { AppModule } from '../src/app.module';
import { configureHttp } from '../src/infrastructure/http/configure-http';
import { configureSession } from '../src/modules/auth/configure-session';
import { hashPassword, verifyPassword } from '../src/infrastructure/security/password';
import { createHarness, createFixture } from './fixtures';

const harness = createHarness();
const password = 'Catalog-Fixture-2026!';
let app: NestExpressApplication;
const client = () => request.agent(app.getHttpServer());
type Client = ReturnType<typeof client>;
let admin: Client;
let operator: Client;
let token: string;
let operatorToken: string;
const ajv = new Ajv({ strict: false });
addFormats(ajv);
const contract: unknown = JSON.parse(readFileSync(resolve(__dirname, '../../docs/openapi.json'), 'utf8'));
if (!contract || typeof contract !== 'object' || Array.isArray(contract)) throw new Error('Invalid contract');
ajv.addSchema(contract, 'contract');
const matches = (schema: string, body: unknown) => {
  const validate = ajv.compile({ $ref: `contract#/components/schemas/${schema}` });
  expect({ valid: validate(body), errors: validate.errors }).toEqual({ valid: true, errors: null });
};
const login = async (agent: Client, email: string): Promise<string> => {
  const bootstrap = await agent.get('/api/v1/auth/csrf').expect(200);
  const response = await agent.post('/api/v1/auth/login').set('X-CSRF-Token', bootstrap.body.csrfToken)
    .send({ email, password }).expect(200);
  const value: unknown = response.body.csrfToken;
  if (typeof value !== 'string') throw new Error('Missing token');
  return value;
};
beforeAll(async () => {
  process.env.APP_ENV = 'test'; process.env.APP_ORIGIN = 'http://frontend';
  process.env.SESSION_SECRET = 'catalog-integration-fixed-secret-isolated-tests-2026';
  await harness.clear();
  const passwordHash = await hashPassword(password);
  await harness.first.user.createMany({ data: ['admin', 'operator'].map((role) => ({
    name: role, email: `${role}@catalog.test`, role: role === 'admin' ? 'admin' as const : 'operator' as const, passwordHash,
  })) });
  app = await NestFactory.create<NestExpressApplication>(AppModule, { bodyParser: false, logger: false });
  configureHttp(app); configureSession(app); await app.init();
  admin = client(); operator = client();
  token = await login(admin, 'admin@catalog.test'); operatorToken = await login(operator, 'operator@catalog.test');
});
afterAll(async () => { await app?.close(); await harness.clear(); await harness.close(); });

it('enforces authentication, direct role restrictions and CSRF across all operations', async () => {
  for (const resource of ['users', 'projects', 'suppliers']) {
    await client().get(`/api/v1/${resource}`).expect(401);
    await client().post(`/api/v1/${resource}`).send({ name: 'Denied' }).expect(401);
    await operator.post(`/api/v1/${resource}`).set('X-CSRF-Token', operatorToken).send({ name: 'Denied' }).expect(403);
    await admin.post(`/api/v1/${resource}`).send({ name: 'Denied' }).expect(403);
  }
  await operator.get('/api/v1/users').expect(403);
  await operator.patch('/api/v1/projects/00000000-0000-4000-8000-000000000099').set('X-CSRF-Token', operatorToken).send({ name: 'Denied' }).expect(403);
  await client().get('/api/v1/projects/00000000-0000-4000-8000-000000000099').expect(401);
  await client().patch('/api/v1/projects/00000000-0000-4000-8000-000000000099').send({ name: 'Denied' }).expect(401);
  await admin.post('/api/v1/projects').set('X-CSRF-Token', token).set('Origin', 'http://untrusted.test').send({ name: 'Denied' }).expect(403);
});

it('creates, persists and renames a project without inventing rules or changing historical data', async () => {
  const response = await admin.post('/api/v1/projects').set('X-CSRF-Token', token).send({ name: '  Horizonte  ' }).expect(201);
  matches('Project', response.body);
  expect(response.headers.location).toBe(`/api/v1/projects/${response.body.id}`);
  expect(response.body).toMatchObject({ name: 'Horizonte', rulesRevision: 0 });
  expect(await harness.first.approvalRule.count({ where: { projectId: response.body.id } })).toBe(0);
  expect(await harness.first.projectResponsibility.count({ where: { projectId: response.body.id } })).toBe(0);
  const path = `/api/v1/projects/${response.body.id}`;
  const updated = await admin.patch(path).set('X-CSRF-Token', token).send({ name: 'Horizonte II' }).expect(200);
  matches('Project', updated.body);
  expect((await operator.get(path).expect(200)).body).toEqual(updated.body);
  expect(updated.body.rulesRevision).toBe(0);
  const fixture = await createFixture(harness.first);
  await admin.patch(`/api/v1/projects/${fixture.project.id}`).set('X-CSRF-Token', token).send({ name: 'New live name' }).expect(200);
  const stored = await harness.second.purchaseOrder.findUniqueOrThrow({ where: { id: fixture.order.id } });
  expect(stored.projectNameSnapshot).toBe(fixture.project.name);
  expect(stored.rulesRevisionSnapshot).toBe(fixture.order.rulesRevisionSnapshot);
});

it('normalizes user email, hashes password, projects safe fields and resolves concurrent duplicates as 409', async () => {
  const input = { name: '  Nova pessoa  ', email: '  NEW@CATALOG.TEST  ', password, role: 'operator' };
  const responses = await Promise.all([admin, admin].map((agent) => agent.post('/api/v1/users').set('X-CSRF-Token', token).send(input)));
  expect(responses.map((response) => response.status).sort()).toEqual([201, 409]);
  const created = responses.find((response) => response.status === 201);
  matches('User', created?.body);
  expect(created?.body).toMatchObject({ name: 'Nova pessoa', email: 'new@catalog.test' });
  expect(responses.find((response) => response.status === 409)?.body.error.code).toBe('EMAIL_ALREADY_EXISTS');
  const stored = await harness.second.user.findUniqueOrThrow({ where: { email: 'new@catalog.test' } });
  expect(await verifyPassword(password, stored.passwordHash)).toBe(true);
  expect(JSON.stringify(created?.body)).not.toMatch(/password|scrypt/);
  const list = await admin.get('/api/v1/users?role=operator&search=NEW%40CATALOG').expect(200);
  matches('UserPage', list.body); expect(list.body.meta.total).toBe(1);
  expect(Object.keys(list.body.data[0]).sort()).toEqual(['email', 'id', 'name', 'role']);
  expect((await admin.get('/api/v1/users?role=admin&search=NEW%40CATALOG').expect(200)).body.meta.total).toBe(0);
});

it('paginates, filters, sorts and validates all three catalogs on the server', async () => {
  await harness.first.project.createMany({ data: Array.from({ length: 23 }, (_, index) => ({ name: `Page ${String(index).padStart(2, '0')}` })) });
  await harness.first.supplier.createMany({ data: Array.from({ length: 23 }, (_, index) => ({ name: `Supply ${String(index).padStart(2, '0')}` })) });
  const users = await harness.first.user.findFirstOrThrow();
  await harness.first.user.createMany({ data: Array.from({ length: 23 }, (_, index) => ({
    name: `Person ${String(index).padStart(2, '0')}`, email: `page${index}@catalog.test`, role: 'operator', passwordHash: users.passwordHash,
  })) });
  for (const [resource, search, schema] of [['projects', 'PAGE', 'ProjectPage'], ['suppliers', 'SUPPLY', 'SupplierPage'], ['users', 'PERSON', 'UserPage']]) {
    const response = await admin.get(`/api/v1/${resource}?search=${search}&page=2&pageSize=20`).expect(200);
    matches(schema ?? '', response.body);
    expect(response.body.meta).toEqual({ page: 2, pageSize: 20, total: 23, totalPages: 2 });
    expect(response.body.data).toHaveLength(3);
    expect(response.body.data[0].name).toMatch(/20$/);
    expect((await admin.get(`/api/v1/${resource}?search=${search}&page=99`).expect(200)).body.data).toEqual([]);
    expect((await admin.get(`/api/v1/${resource}?page=9007199254740991&pageSize=100`).expect(200)).body.data).toEqual([]);
    for (const query of ['page=0', 'page=1.5', 'page=1e2', 'pageSize=101', 'search=', 'search=a&search=b', 'extra=true', 'search=' + 'a'.repeat(resource === 'suppliers' ? 161 : 121)]) {
      await admin.get(`/api/v1/${resource}?${query}`).expect(400);
    }
  }
  for (const resource of ['projects', 'suppliers']) await operator.get(`/api/v1/${resource}`).expect(200);
  expect((await admin.get('/api/v1/projects?search=%25').expect(200)).body.meta.total).toBe(0);
});

it('validates create/update boundaries, unknown fields, invalid IDs and missing resources', async () => {
  for (const [resource, limit, schema] of [['projects', 120, 'Project'], ['suppliers', 160, 'Supplier']] as const) {
    const valid = await admin.post(`/api/v1/${resource}`).set('X-CSRF-Token', token).send({ name: 'a'.repeat(limit) }).expect(201);
    matches(schema, valid.body);
    if (resource === 'suppliers') expect(valid.headers.location).toBeUndefined();
    for (const body of [{}, { name: '  ' }, { name: null }, { name: 123 }, { name: 'a'.repeat(limit + 1) }, { name: 'valid', extra: true }]) {
      await admin.post(`/api/v1/${resource}`).set('X-CSRF-Token', token).send(body).expect(400);
      if (resource === 'projects') await admin.patch(`/api/v1/projects/${valid.body.id}`).set('X-CSRF-Token', token).send(body).expect(400);
    }
  }
  const validUser = { name: 'Name', email: 'boundary@catalog.test', password, role: 'operator' };
  for (const extra of [{ role: 'manager' }, { role: null }, { email: 'invalid' }, { password: 'a'.repeat(11) }, { password: 'a'.repeat(129) }, { name: ' ' }, { extra: true }]) {
    await admin.post('/api/v1/users').set('X-CSRF-Token', token).send({ ...validUser, ...extra }).expect(400);
  }
  await admin.get('/api/v1/users?role=manager').expect(400);
  for (const [id, status] of [['not-a-uuid', 400], ['00000000-0000-4000-8000-000000000099', 404]] as const) {
    await operator.get(`/api/v1/projects/${id}`).expect(status);
    await admin.patch(`/api/v1/projects/${id}`).set('X-CSRF-Token', token).send({ name: 'Missing' }).expect(status);
  }
});

it('accepts exact user limits for both roles without trimming passwords', async () => {
  const maximumEmail = `${'a'.repeat(64)}@${'b'.repeat(63)}.${'c'.repeat(63)}.${'d'.repeat(56)}.test`;
  expect(maximumEmail).toHaveLength(254);
  for (const input of [
    { name: 'A', email: 'minimum@catalog.test', password: ' 1234567890 ', role: 'admin' },
    { name: 'a'.repeat(120), email: maximumEmail, password: 'a'.repeat(128), role: 'operator' },
  ]) {
    const response = await admin.post('/api/v1/users').set('X-CSRF-Token', token).send(input).expect(201);
    matches('User', response.body); expect(response.body.role).toBe(input.role);
    expect(response.headers.location).toBeUndefined();
    const stored = await harness.second.user.findUniqueOrThrow({ where: { email: input.email } });
    expect(await verifyPassword(input.password, stored.passwordHash)).toBe(true);
  }
  await admin.post('/api/v1/users').set('X-CSRF-Token', token)
    .send({ name: 'A', email: `a${maximumEmail}`, password, role: 'admin' }).expect(400);
});
