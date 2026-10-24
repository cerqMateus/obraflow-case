import type { PrismaClient } from '../../../generated/prisma';
import { hashPassword } from '../security/password';

export const DEMO_PASSWORD = 'ObraFlow-Demo-2026!';
const USERS = [
  { id: '00000000-0000-4000-8000-000000000001', name: 'Admin (demonstração)', email: 'admin@demo.obraflow.test', role: 'admin' },
  { id: '00000000-0000-4000-8000-000000000002', name: 'Amanda', email: 'amanda@demo.obraflow.test', role: 'operator' },
  { id: '00000000-0000-4000-8000-000000000003', name: 'João', email: 'joao@demo.obraflow.test', role: 'operator' },
  { id: '00000000-0000-4000-8000-000000000004', name: 'Beatriz', email: 'beatriz@demo.obraflow.test', role: 'operator' },
] as const;
const SUPPLIERS = [
  { id: '00000000-0000-4000-8000-000000000020', name: 'Materiais Horizonte (demonstração)' },
  { id: '00000000-0000-4000-8000-000000000021', name: 'Suprimentos Escola (demonstração)' },
];

export const seedBase = async (database: PrismaClient): Promise<void> => {
  await database.$transaction(async (tx) => {
    // Serializes concurrent explicit seed runs without locking domain operations.
    await tx.$queryRaw`SELECT pg_advisory_xact_lock(20261024, 2)::text`;
    for (const user of USERS) {
      const existing = await tx.user.findFirst({ where: { OR: [{ id: user.id }, { email: user.email }] } });
      if (existing) {
        if (existing.id !== user.id || existing.email !== user.email || existing.name !== user.name || existing.role !== user.role) {
          throw new Error('Base seed conflicts with an existing account; no data was changed.');
        }
      } else await tx.user.create({ data: { ...user, passwordHash: await hashPassword(DEMO_PASSWORD) } });
    }
    for (const supplier of SUPPLIERS) {
      const existing = await tx.supplier.findUnique({ where: { id: supplier.id } });
      if (existing && existing.name !== supplier.name) {
        throw new Error('Base seed conflicts with an existing supplier; no data was changed.');
      }
      if (!existing) await tx.supplier.create({ data: supplier });
    }
  }, { maxWait: 10000, timeout: 30000 });
};
