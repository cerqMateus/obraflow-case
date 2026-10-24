import { spawnSync } from 'node:child_process';
import { createFixture, createHarness } from './fixtures';
import { seedBase, DEMO_PASSWORD } from '../src/infrastructure/database/seed-base';
import { verifyPassword } from '../src/infrastructure/security/password';
import { assertConnectedTestDatabase } from './database-target';

const harness = createHarness();
const { first, second, pool } = harness;
beforeEach(() => harness.clear());
afterAll(() => harness.close());

describe('Versioned PostgreSQL persistence', () => {
  it('checks the effective database and refuses a work URL before clearing fixtures', async () => {
    await createFixture(first);
    const original = process.env.DATABASE_URL;
    try {
      process.env.DATABASE_URL = 'postgresql://work:work@postgres:5432/obraflow';
      await expect(harness.clear()).rejects.toThrow('Refusing fixtures');
    } finally { process.env.DATABASE_URL = original; }
    expect(await first.purchaseOrder.count()).toBe(1);
    await assertConnectedTestDatabase(pool);
  });

  it('reapplies migrations without changing persisted records or running seed', async () => {
    await createFixture(first);
    const before = await first.purchaseOrder.findMany({ include: { items: true, steps: true } });
    const result = spawnSync(process.execPath, [require.resolve('prisma/build/index.js'), 'migrate', 'deploy'], {
      env: process.env, encoding: 'utf8',
    });
    expect(result.status).toBe(0);
    expect(await first.purchaseOrder.findMany({ include: { items: true, steps: true } })).toEqual(before);
    expect(await first.user.count()).toBe(2);
  });

  it('checks effective SQL identity again before every fixture cleanup', async () => {
    await createFixture(first);
    const original = process.env.TEST_DATABASE_URL;
    if (!original) throw new Error('Missing test URL.');
    const otherUser = new URL(original);
    otherUser.username = 'unexpected_test_user';
    try {
      process.env.TEST_DATABASE_URL = otherUser.toString();
      process.env.DATABASE_URL = otherUser.toString();
      await expect(harness.clear()).rejects.toThrow('effective database');
    } finally {
      process.env.TEST_DATABASE_URL = original;
      process.env.DATABASE_URL = original;
    }
    expect(await first.purchaseOrder.count()).toBe(1);
  });

  it('uses independent connections to enforce one active responsibility per pair', async () => {
    const f = await createFixture(first);
    const project = await first.project.create({ data: { name: 'Second fixture project' } });
    const data = { projectId: project.id, operatorId: f.operator.id, grantedById: f.admin.id };
    const results = await Promise.allSettled([
      first.projectResponsibility.create({ data }), second.projectResponsibility.create({ data }),
    ]);
    expect(results.filter((r) => r.status === 'fulfilled')).toHaveLength(1);
    expect(results.filter((r) => r.status === 'rejected')).toHaveLength(1);
    for (const result of results) {
      if (result.status === 'rejected') expect(result.reason).toMatchObject({ code: 'P2002' });
    }
    expect(await first.projectResponsibility.count({ where: { operatorId: f.operator.id, active: true } })).toBe(2);
    await first.projectResponsibility.updateMany({ where: { projectId: project.id }, data: {
      active: false, revokedById: f.admin.id, revokedAt: new Date(),
    } });
    await expect(first.projectResponsibility.create({ data })).resolves.toMatchObject(data);
  });

  it('keeps snapshots and order steps after rule deletion and blocks historical deletes', async () => {
    const f = await createFixture(first);
    await first.approvalRule.delete({ where: { id: f.rule.id } });
    const preserved = await first.purchaseOrder.findUniqueOrThrow({ where: { id: f.order.id }, include: { steps: true } });
    expect(preserved.sourceRuleId).toBeNull();
    expect(preserved.upperSnapshot?.toFixed(2)).toBe('10000.00');
    expect(preserved.steps).toEqual(f.order.steps);
    await expect(first.user.delete({ where: { id: f.operator.id } })).rejects.toMatchObject({ code: 'P2003' });
    await expect(first.project.delete({ where: { id: f.project.id } })).rejects.toMatchObject({ code: 'P2003' });
    await expect(first.supplier.delete({ where: { id: f.supplier.id } })).rejects.toMatchObject({ code: 'P2003' });
    await expect(first.purchaseOrder.delete({ where: { id: f.order.id } })).rejects.toMatchObject({ code: 'P2003' });
  });

  it('rolls back all writes sharing an explicit transaction context', async () => {
    await expect(first.$transaction(async (tx) => {
      await tx.project.create({ data: { name: 'Must roll back' } });
      await tx.project.create({ data: { name: 'Invalid', rulesRevision: -1 } });
    })).rejects.toThrow();
    expect(await first.project.count()).toBe(0);
  });

  it('generates unique references on concurrent connections independently of row counts', async () => {
    const f = await createFixture(first);
    const data = {
      projectId: f.project.id, supplierId: f.supplier.id, requesterId: f.operator.id,
      rulesRevisionSnapshot: 1, projectNameSnapshot: f.project.name, supplierNameSnapshot: f.supplier.name,
      orderDate: f.order.orderDate, total: '0.00', sourceRuleId: f.rule.id, upperSnapshot: '10000.00',
      items: { create: { position: 1, description: 'Free fixture item', quantity: '1.000', unit: 'un', unitPrice: '0.00', total: '0.00' } },
      steps: { create: { responsibilityId: f.responsibility.id, assignedOperatorId: f.operator.id,
        operatorNameSnapshot: f.operator.name, position: 1, status: 'pending' as const } },
    };
    const orders = await Promise.all([first.purchaseOrder.create({ data }), second.purchaseOrder.create({ data })]);
    expect(new Set([f.order.reference, ...orders.map((order) => order.reference)]).size).toBe(3);
    expect(orders.every((order) => /^PO-\d+$/.test(order.reference))).toBe(true);
  });

  it('runs the base seed explicitly, preserves existing password hashes and refuses conflicts atomically', async () => {
    await seedBase(first);
    await first.user.updateMany({ where: { role: 'admin' }, data: { passwordHash: 'existing-changed-password-hash' } });
    const before = await first.user.findMany({ orderBy: { id: 'asc' } });
    expect(before).toHaveLength(4);
    for (const user of before.filter((user) => user.role === 'operator')) {
      expect(await verifyPassword(DEMO_PASSWORD, user.passwordHash)).toBe(true);
    }
    expect(await first.supplier.count()).toBe(2);
    expect(await first.project.count()).toBe(0);
    await seedBase(first);
    expect(await first.user.findMany({ orderBy: { id: 'asc' } })).toEqual(before);
    await first.user.updateMany({ where: { role: 'admin' }, data: { name: 'Existing custom name' } });
    await expect(seedBase(first)).rejects.toThrow('conflicts');
    expect(await first.user.count()).toBe(4);
    expect(await first.supplier.count()).toBe(2);
  });

  it('rolls back newly inserted seed accounts when a later account conflicts', async () => {
    await first.user.create({ data: { id: '00000000-0000-4000-8000-000000000004', name: 'Existing user',
      email: 'beatriz@demo.obraflow.test', role: 'operator', passwordHash: 'preserve-me' } });
    await expect(seedBase(first)).rejects.toThrow('conflicts');
    expect(await first.user.count()).toBe(1);
    expect(await first.supplier.count()).toBe(0);
  });

  it('persists the session store physical layout without runtime schema creation', async () => {
    const expiry = new Date('2026-10-24T20:00:00.000Z');
    await first.session.create({ data: { sid: 'fictional-fixture-session',
      sess: { cookie: { expires: expiry.toISOString() }, userId: 'fictional', csrfToken: 'fixture-only' }, expire: expiry } });
    const session = await second.session.findUniqueOrThrow({ where: { sid: 'fictional-fixture-session' } });
    expect(session.expire).toEqual(expiry);
    expect(session.sess).toMatchObject({ userId: 'fictional' });
  });
});
