import { Pool } from 'pg';
import { PrismaClient } from '../generated/prisma';
import { assertConnectedTestDatabase, assertTestUrl } from './database-target';

export const createHarness = () => {
  const url = assertTestUrl(process.env).toString();
  const pool = new Pool({ connectionString: url, max: 4 });
  const first = new PrismaClient({ datasources: { db: { url } } });
  const second = new PrismaClient({ datasources: { db: { url } } });
  const clear = async (): Promise<void> => {
    await assertConnectedTestDatabase(pool);
    await pool.query('TRUNCATE "ApprovalStep", "OrderItem", "PurchaseOrder", "RuleStep", "ApprovalRule", "ProjectResponsibility", "Project", "Supplier", "User", "session"');
  };
  return { pool, first, second, clear, close: async () => {
    await Promise.all([first.$disconnect(), second.$disconnect(), pool.end()]);
  } };
};

export const createFixture = async (database: PrismaClient) => {
  const admin = await database.user.create({ data: { name: 'Fixture admin', email: 'admin@fixture.test', role: 'admin', passwordHash: 'fixture-only-no-login' } });
  const operator = await database.user.create({ data: { name: 'Fixture operator', email: 'operator@fixture.test', role: 'operator', passwordHash: 'fixture-only-no-login' } });
  const project = await database.project.create({ data: { name: 'Fixture project' } });
  const supplier = await database.supplier.create({ data: { name: 'Fixture supplier' } });
  const responsibility = await database.projectResponsibility.create({ data: { projectId: project.id, operatorId: operator.id, grantedById: admin.id } });
  const rule = await database.approvalRule.create({ data: { projectId: project.id, upperInclusive: '10000.00', steps: { create: { responsibilityId: responsibility.id, position: 1 } } } });
  const order = await database.purchaseOrder.create({ data: {
    projectId: project.id, supplierId: supplier.id, requesterId: operator.id, sourceRuleId: rule.id,
    rulesRevisionSnapshot: 1, upperSnapshot: '10000.00', projectNameSnapshot: project.name,
    supplierNameSnapshot: supplier.name, orderDate: new Date('2026-10-24'), total: '12.35',
    items: { create: { position: 1, description: 'Fixture item', quantity: '1.235', unit: 'un', unitPrice: '10.00', total: '12.35' } },
    steps: { create: { responsibilityId: responsibility.id, assignedOperatorId: operator.id,
      operatorNameSnapshot: operator.name, position: 1, status: 'pending' } },
  }, include: { items: true, steps: true } });
  return { admin, operator, project, supplier, responsibility, rule, order };
};
