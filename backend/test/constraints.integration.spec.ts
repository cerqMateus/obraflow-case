import { randomUUID } from 'node:crypto';
import { createFixture, createHarness } from './fixtures';

const harness = createHarness();
beforeEach(() => harness.clear());
afterAll(() => harness.close());

describe('Database constraints', () => {
  it.each([
    ['quantity', '0', '23514'], ['quantity', '-0.001', '23514'], ['quantity', '1000000.000', '22003'],
    ['unitPrice', '-0.01', '23514'], ['unitPrice', '10000000000.00', '22003'],
    ['total', '-0.01', '23514'], ['total', '10000000000000000.00', '22003'],
    ['position', '0', '23514'], ['position', '101', '23514'],
  ])('rejects %s=%s', async (column, value, code) => {
    const { order } = await createFixture(harness.first);
    // Column comes exclusively from the fixed test matrix; values are parameterized.
    await expect(harness.pool.query(`UPDATE "OrderItem" SET "${column}" = $1 WHERE "orderId" = $2`,
      [value, order.id])).rejects.toMatchObject({ code });
  });

  it('preserves exact decimal limits and documents PostgreSQL scale coercion', async () => {
    const f = await createFixture(harness.first);
    await harness.pool.query('UPDATE "OrderItem" SET quantity=$1, "unitPrice"=$2, total=$3 WHERE "orderId"=$4',
      ['999999.999', '9999999999.99', '9999999999999999.99', f.order.id]);
    const item = await harness.first.orderItem.findFirstOrThrow();
    expect(item.quantity.toFixed(3)).toBe('999999.999');
    expect(item.unitPrice.toFixed(2)).toBe('9999999999.99');
    expect(item.total.toFixed(2)).toBe('9999999999999999.99');
    await harness.pool.query('UPDATE "OrderItem" SET quantity=$1 WHERE "orderId"=$2', ['1.2345', f.order.id]);
    expect((await harness.first.orderItem.findFirstOrThrow()).quantity.toFixed(3)).toBe('1.235');
  });

  it('refuses duplicate positions/operators, invalid foreign keys, normalized emails and roles', async () => {
    const f = await createFixture(harness.first);
    await expect(harness.first.ruleStep.create({ data: { ruleId: f.rule.id, responsibilityId: f.responsibility.id, position: 1 } })).rejects.toMatchObject({ code: 'P2002' });
    await expect(harness.first.ruleStep.create({ data: { ruleId: f.rule.id, responsibilityId: f.responsibility.id, position: 2 } })).rejects.toMatchObject({ code: 'P2002' });
    const step = f.order.steps[0];
    const item = f.order.items[0];
    if (!step || !item) throw new Error('Fixture has no chain or item.');
    await expect(harness.first.approvalStep.create({ data: {
      orderId: f.order.id, responsibilityId: f.responsibility.id, assignedOperatorId: f.operator.id,
      operatorNameSnapshot: f.operator.name, position: 2, status: 'waiting',
    } })).rejects.toMatchObject({ code: 'P2002' });
    await expect(harness.first.orderItem.create({ data: {
      orderId: f.order.id, position: 1, description: 'Duplicate position', quantity: '1', unit: 'un', unitPrice: '0', total: '0',
    } })).rejects.toMatchObject({ code: 'P2002' });
    await expect(harness.first.approvalStep.update({ where: { id: step.id }, data: { responsibilityId: randomUUID() } })).rejects.toMatchObject({ code: 'P2003' });
    await expect(harness.pool.query('UPDATE "User" SET email=$1 WHERE id=$2', [' Operator@fixture.test ', f.operator.id])).rejects.toMatchObject({ code: '23514' });
    await expect(harness.pool.query('UPDATE "User" SET role=$1 WHERE id=$2', ['approver', f.operator.id])).rejects.toMatchObject({ code: '22P02' });
    await expect(harness.first.user.create({ data: { name: 'Duplicate', email: f.operator.email, passwordHash: 'fixture', role: 'operator' } })).rejects.toMatchObject({ code: 'P2002' });
  });

  it('requires complete revocations and decision fields consistent with status', async () => {
    const f = await createFixture(harness.first);
    await expect(harness.first.projectResponsibility.update({ where: { id: f.responsibility.id }, data: { active: false } })).rejects.toThrow();
    await expect(harness.first.approvalRule.update({ where: { id: f.rule.id }, data: { lowerExclusive: '10000.00' } })).rejects.toThrow();
    await expect(harness.first.purchaseOrder.update({ where: { id: f.order.id }, data: { status: 'approved' } })).rejects.toThrow();
    await expect(harness.first.approvalStep.updateMany({ data: { status: 'rejected', decidedById: f.operator.id, decidedAt: new Date() } })).rejects.toThrow();
    await harness.first.approvalStep.updateMany({ data: { status: 'approved', decidedById: f.operator.id, decidedAt: new Date() } });
    await harness.first.purchaseOrder.update({ where: { id: f.order.id }, data: { status: 'approved', currentStepPosition: null, version: 2 } });
  });
});
