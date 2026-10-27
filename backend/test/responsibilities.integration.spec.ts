import { randomUUID } from 'node:crypto';
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
import { hashPassword } from '../src/infrastructure/security/password';
import { createFixture, createHarness } from './fixtures';

const harness = createHarness();
const password = 'Responsibility-Test-2026!';
let passwordHash: string;
let app: NestExpressApplication;
const client = () => request.agent(app.getHttpServer());
let admin: ReturnType<typeof client>;
let operator: ReturnType<typeof client>;
let adminId: string; let operatorId: string; let projectId: string;
let token: string; let operatorToken: string;
const root = () => `/api/v1/projects/${projectId}/responsibilities`;
const ajv = new Ajv({ strict: false }); addFormats(ajv);
const contract: unknown = JSON.parse(readFileSync(resolve(__dirname, '../../docs/openapi.json'), 'utf8'));
if (!contract || typeof contract !== 'object' || Array.isArray(contract)) throw new Error('Invalid contract');
ajv.addSchema(contract, 'contract');
const matches = (schema: string, body: unknown) => {
  const validate = ajv.compile({ $ref: `contract#/components/schemas/${schema}` });
  expect({ valid: validate(body), errors: validate.errors }).toEqual({ valid: true, errors: null });
};
const login = async (agent: ReturnType<typeof client>, email: string): Promise<string> => {
  const csrf = await agent.get('/api/v1/auth/csrf').expect(200);
  const result = await agent.post('/api/v1/auth/login').set('X-CSRF-Token', csrf.body.csrfToken).send({ email, password }).expect(200);
  const value: unknown = result.body.csrfToken;
  if (typeof value !== 'string') throw new Error('Missing token'); return value;
};
const grant = (id = operatorId, path = root()) => admin.post(path).set('X-CSRF-Token', token).send({ operatorId: id });
const revoke = (id: string, path = root()) => admin.delete(`${path}/${id}`).set('X-CSRF-Token', token);
beforeAll(async () => {
  process.env.APP_ENV = 'test'; process.env.APP_ORIGIN = 'http://frontend';
  process.env.SESSION_SECRET = 'responsibility-isolated-integration-secret-2026';
  passwordHash = await hashPassword(password);
});
beforeEach(async () => {
  await harness.clear();
  app = await NestFactory.create<NestExpressApplication>(AppModule, { bodyParser: false, logger: false });
  configureHttp(app); configureSession(app); await app.init();
  adminId = (await harness.first.user.create({ data: { name: 'Admin', email: 'admin@responsibility.test', role: 'admin', passwordHash } })).id;
  operatorId = (await harness.first.user.create({ data: { name: 'Operator', email: 'operator@responsibility.test', role: 'operator', passwordHash } })).id;
  projectId = (await harness.first.project.create({ data: { name: 'Responsibility project' } })).id;
  admin = client(); operator = client();
  token = await login(admin, 'admin@responsibility.test'); operatorToken = await login(operator, 'operator@responsibility.test');
});
afterEach(async () => { await app?.close(); });
afterAll(async () => { await harness.clear(); await harness.close(); });

it('enforces authentication, Admin role, CSRF and origin for all three operations', async () => {
  await client().get(root()).expect(401);
  await client().post(root()).send({ operatorId }).expect(401);
  await client().delete(`${root()}/${randomUUID()}`).expect(401);
  await operator.get(root()).expect(403);
  await operator.post(root()).set('X-CSRF-Token', operatorToken).send({ operatorId }).expect(403);
  await operator.delete(`${root()}/${randomUUID()}`).set('X-CSRF-Token', operatorToken).expect(403);
  await admin.post(root()).send({ operatorId }).expect(403);
  await admin.delete(`${root()}/${randomUUID()}`).expect(403);
  await admin.post(root()).set('X-CSRF-Token', token).set('Origin', 'http://untrusted.test').send({ operatorId }).expect(403);
  expect(await harness.second.projectResponsibility.count()).toBe(0);
});

it('grants two operators and a shared operator across projects, with safe contract projections and revisions', async () => {
  const second = await harness.first.user.create({ data: { name: 'Second', email: 'second@test.test', role: 'operator', passwordHash } });
  const other = await harness.first.project.create({ data: { name: 'Other project' } });
  const first = await grant().expect(201); matches('Responsibility', first.body);
  expect(first.headers['x-rules-revision']).toBe('1'); expect(first.headers.location).toBeUndefined();
  expect(first.body).toMatchObject({ projectId, operator: { id: operatorId }, active: true, grantedBy: { id: adminId }, revokedAt: null, revokedBy: null });
  expect((await grant(second.id).expect(201)).headers['x-rules-revision']).toBe('2');
  expect((await grant(operatorId, `/api/v1/projects/${other.id}/responsibilities`).expect(201)).headers['x-rules-revision']).toBe('1');
  const page = await admin.get(root()).expect(200); matches('ResponsibilityPage', page.body);
  expect(page.body.meta.total).toBe(2); expect(JSON.stringify(page.body)).not.toMatch(/passwordHash|email|session/);
  expect((await harness.second.project.findUniqueOrThrow({ where: { id: projectId } })).rulesRevision).toBe(2);
});

it('refuses Admin recipients, unknown references, cross-project links, malformed input and derived fields', async () => {
  expect((await grant(adminId).expect(400)).body.error.code).toBe('INVALID_OPERATOR_ROLE');
  await grant(randomUUID()).expect(404);
  await grant(operatorId, `/api/v1/projects/${randomUUID()}/responsibilities`).expect(404);
  const active = await grant().expect(201);
  expect((await grant().expect(409)).body.error.code).toBe('RESPONSIBILITY_ALREADY_ACTIVE');
  const other = await harness.first.project.create({ data: { name: 'Other' } });
  await revoke(active.body.id, `/api/v1/projects/${other.id}/responsibilities`).expect(404);
  await revoke(randomUUID()).expect(404);
  for (const body of [{}, { operatorId: 'invalid' }, { operatorId, active: true }, { operatorId, grantedById: adminId }]) {
    await admin.post(root()).set('X-CSRF-Token', token).send(body).expect(400);
  }
  for (const query of ['active=1', 'active=', 'active=true&active=false', 'operatorId=no', 'page=0', 'pageSize=101', 'unknown=true']) {
    await admin.get(`${root()}?${query}`).expect(400);
  }
  await admin.get(`/api/v1/projects/${randomUUID()}/responsibilities`).expect(404);
  await admin.get('/api/v1/projects/invalid/responsibilities').expect(400);
  expect((await harness.second.project.findUniqueOrThrow({ where: { id: projectId } })).rulesRevision).toBe(1);
});

it('paginates and filters including revoked history when active is omitted', async () => {
  const first = await grant().expect(201); await revoke(first.body.id).expect(204); await grant().expect(201);
  const all = await admin.get(`${root()}?pageSize=1&page=2&operatorId=${operatorId}`).expect(200);
  matches('ResponsibilityPage', all.body); expect(all.body.meta).toEqual({ page: 2, pageSize: 1, total: 2, totalPages: 2 });
  expect((await admin.get(`${root()}?active=true`).expect(200)).body.data).toHaveLength(1);
  expect((await admin.get(`${root()}?active=false`).expect(200)).body.data[0].id).toBe(first.body.id);
  expect((await admin.get(`${root()}?operatorId=${randomUUID()}`).expect(200)).body.meta.total).toBe(0);
  expect((await admin.get(`${root()}?page=999999999999`).expect(200)).body.data).toEqual([]);
});

it('serializes simultaneous grants on independent connections and increments only once', async () => {
  const otherAdmin = client(); const otherToken = await login(otherAdmin, 'admin@responsibility.test');
  const result = await Promise.all([grant(), otherAdmin.post(root()).set('X-CSRF-Token', otherToken).send({ operatorId })]);
  expect(result.map((entry) => entry.status).sort()).toEqual([201, 409]);
  expect(result.find((entry) => entry.status === 409)?.body.error.code).toBe('RESPONSIBILITY_ALREADY_ACTIVE');
  expect(await harness.second.projectResponsibility.count()).toBe(1);
  expect((await harness.second.project.findUniqueOrThrow({ where: { id: projectId } })).rulesRevision).toBe(1);
});

it('preserves the original revocation and revision on repeated/concurrent DELETE and creates a fresh grant', async () => {
  const first = await grant().expect(201);
  const responses = await Promise.all([revoke(first.body.id), revoke(first.body.id)]);
  expect(responses.map((entry) => entry.status)).toEqual([204, 204]);
  for (const response of responses) { expect(response.text).toBe(''); expect(response.headers['x-rules-revision']).toBe('2'); }
  const revoked = await harness.second.projectResponsibility.findUniqueOrThrow({ where: { id: first.body.id } });
  expect(revoked).toMatchObject({ active: false, revokedById: adminId }); expect(revoked.revokedAt).toBeInstanceOf(Date);
  await revoke(first.body.id).expect(204);
  expect(await harness.second.projectResponsibility.findUniqueOrThrow({ where: { id: first.body.id } })).toEqual(revoked);
  const next = await grant().expect(201); expect(next.body.id).not.toBe(first.body.id); expect(next.headers['x-rules-revision']).toBe('3');
});

it('blocks all current rule references and pending/waiting order steps without any partial writes', async () => {
  const fixture = await createFixture(harness.first);
  const path = `/api/v1/projects/${fixture.project.id}/responsibilities`;
  const before = await harness.second.projectResponsibility.findUniqueOrThrow({ where: { id: fixture.responsibility.id } });
  const conflict = await revoke(fixture.responsibility.id, path).expect(409);
  expect(conflict.body.error.code).toBe('RESPONSIBILITY_IN_USE');
  expect(conflict.body.error.details).toEqual({ ruleCount: 1, pendingOrderCount: 1, ruleIds: [fixture.rule.id], orderIds: [fixture.order.id], truncated: false });
  await harness.first.approvalRule.delete({ where: { id: fixture.rule.id } });
  const response = await revoke(fixture.responsibility.id, path).expect(409);
  expect(response.body.error.details).toMatchObject({ ruleCount: 0, pendingOrderCount: 1 });
  await harness.first.approvalStep.updateMany({ where: { orderId: fixture.order.id }, data: { status: 'waiting', position: 2 } });
  const current = await harness.first.projectResponsibility.create({ data: { projectId: fixture.project.id, operatorId, grantedById: adminId } });
  await harness.first.approvalStep.create({ data: { orderId: fixture.order.id, responsibilityId: current.id,
    assignedOperatorId: operatorId, operatorNameSnapshot: 'Operator', position: 1, status: 'pending' } });
  expect((await revoke(fixture.responsibility.id, path).expect(409)).body.error.details).toMatchObject({ ruleCount: 0, pendingOrderCount: 1 });
  expect(await harness.second.projectResponsibility.findUniqueOrThrow({ where: { id: before.id } })).toEqual(before);
  expect((await harness.second.project.findUniqueOrThrow({ where: { id: fixture.project.id } })).rulesRevision).toBe(0);
  expect((await harness.second.purchaseOrder.findUniqueOrThrow({ where: { id: fixture.order.id } })).version).toBe(1);
});

it('returns complete counts with at most ten deterministic distinct IDs per blocking group', async () => {
  const fixture = await createFixture(harness.first);
  for (let index = 0; index < 11; index += 1) {
    await harness.first.approvalRule.create({ data: { projectId: fixture.project.id, upperInclusive: String(100 + index),
      steps: { create: { responsibilityId: fixture.responsibility.id, position: 1 } } } });
    await harness.first.purchaseOrder.create({ data: {
      projectId: fixture.project.id, supplierId: fixture.supplier.id, requesterId: fixture.operator.id,
      rulesRevisionSnapshot: 0, projectNameSnapshot: 'Snapshot', supplierNameSnapshot: 'Supplier', orderDate: new Date('2026-10-26'), total: '0',
      items: { create: { position: 1, description: 'Fixture zero-value item', quantity: '1', unit: 'un', unitPrice: '0', total: '0' } },
      steps: { create: { responsibilityId: fixture.responsibility.id, assignedOperatorId: fixture.operator.id, operatorNameSnapshot: 'Operator', position: 1, status: 'pending' } },
    } });
  }
  const response = await revoke(fixture.responsibility.id, `/api/v1/projects/${fixture.project.id}/responsibilities`).expect(409);
  expect(response.body.error.details).toMatchObject({ ruleCount: 12, pendingOrderCount: 12, truncated: true });
  expect(response.body.error.details.ruleIds).toHaveLength(10); expect(response.body.error.details.orderIds).toHaveLength(10);
  expect(new Set(response.body.error.details.orderIds).size).toBe(10);
});

it.each(['approved', 'rejected'] as const)('allows final %s orders and preserves snapshots and decision records', async (status) => {
  const f = await createFixture(harness.first);
  await harness.first.approvalStep.updateMany({ where: { orderId: f.order.id }, data: {
    status, decidedAt: new Date(), decidedById: f.operator.id, rejectionReason: status === 'rejected' ? 'Fixture rejection' : null,
  } });
  await harness.first.purchaseOrder.update({ where: { id: f.order.id }, data: { status, currentStepPosition: null } });
  const blocked = await revoke(f.responsibility.id, `/api/v1/projects/${f.project.id}/responsibilities`).expect(409);
  expect(blocked.body.error.details).toMatchObject({ ruleCount: 1, pendingOrderCount: 0 });
  await harness.first.approvalRule.delete({ where: { id: f.rule.id } });
  const before = await harness.second.purchaseOrder.findUniqueOrThrow({ where: { id: f.order.id }, include: { steps: true, items: true } });
  await revoke(f.responsibility.id, `/api/v1/projects/${f.project.id}/responsibilities`).expect(204);
  expect(await harness.second.purchaseOrder.findUniqueOrThrow({ where: { id: f.order.id }, include: { steps: true, items: true } })).toEqual(before);
});

it('allows a completed step in a still-pending order when no current rule references it', async () => {
  const f = await createFixture(harness.first);
  await harness.first.approvalRule.delete({ where: { id: f.rule.id } });
  await harness.first.approvalStep.updateMany({ where: { orderId: f.order.id }, data: { status: 'approved', decidedAt: new Date(), decidedById: f.operator.id } });
  const current = await harness.first.projectResponsibility.create({ data: { projectId: f.project.id, operatorId, grantedById: adminId } });
  await harness.first.approvalStep.create({ data: { orderId: f.order.id, responsibilityId: current.id,
    assignedOperatorId: operatorId, operatorNameSnapshot: 'Operator', position: 2, status: 'pending' } });
  await harness.first.purchaseOrder.update({ where: { id: f.order.id }, data: { currentStepPosition: 2, version: 2 } });
  await revoke(f.responsibility.id, `/api/v1/projects/${f.project.id}/responsibilities`).expect(204);
  expect((await harness.second.purchaseOrder.findUniqueOrThrow({ where: { id: f.order.id } })).status).toBe('pending');
});

it('allows a skipped future step after another operator rejected the order', async () => {
  const f = await createFixture(harness.first);
  await harness.first.approvalRule.delete({ where: { id: f.rule.id } });
  await harness.first.approvalStep.updateMany({ where: { orderId: f.order.id }, data: { status: 'skipped', position: 2 } });
  const current = await harness.first.projectResponsibility.create({ data: { projectId: f.project.id, operatorId, grantedById: adminId } });
  await harness.first.approvalStep.create({ data: { orderId: f.order.id, responsibilityId: current.id,
    assignedOperatorId: operatorId, operatorNameSnapshot: 'Operator', position: 1, status: 'rejected',
    decidedById: operatorId, decidedAt: new Date(), rejectionReason: 'Fixture rejection' } });
  await harness.first.purchaseOrder.update({ where: { id: f.order.id }, data: { status: 'rejected', currentStepPosition: null, version: 2 } });
  const before = await harness.second.approvalStep.findMany({ where: { orderId: f.order.id }, orderBy: { position: 'asc' } });
  await revoke(f.responsibility.id, `/api/v1/projects/${f.project.id}/responsibilities`).expect(204);
  expect(await harness.second.approvalStep.findMany({ where: { orderId: f.order.id }, orderBy: { position: 'asc' } })).toEqual(before);
});
