import { Inject, Injectable } from '@nestjs/common';
import type { Prisma } from '../../../generated/prisma';
import { DatabaseService } from '../../infrastructure/database/database.service';
import { ApiError } from '../../infrastructure/http/api-error';
import { projectPage } from '../../infrastructure/http/pagination';
import type { ResponsibilityQuery } from './responsibilities.dto';

const person = { id: true, name: true } as const;
const publicResponsibility = {
  id: true, projectId: true, operator: { select: person }, active: true,
  grantedBy: { select: person }, grantedAt: true, revokedBy: { select: person }, revokedAt: true,
} as const;

// This lock is the serialization point shared with future rule/order mutations.
const lockProject = async (tx: Prisma.TransactionClient, id: string): Promise<number> => {
  const rows = await tx.$queryRaw<{ rulesRevision: number }[]>`
    SELECT "rulesRevision" FROM "Project" WHERE id = ${id}::uuid FOR UPDATE`;
  const project = rows[0];
  if (!project) throw new ApiError(404, 'RESOURCE_NOT_FOUND', 'Obra não encontrada.');
  return project.rulesRevision;
};

const assertUnused = async (tx: Prisma.TransactionClient, id: string): Promise<void> => {
  const rules = { steps: { some: { responsibilityId: id } } };
  const orders: Prisma.PurchaseOrderWhereInput = {
    status: 'pending', steps: { some: { responsibilityId: id, status: { in: ['pending', 'waiting'] } } },
  };
  const ruleCount = await tx.approvalRule.count({ where: rules });
  const pendingOrderCount = await tx.purchaseOrder.count({ where: orders });
  if (!ruleCount && !pendingOrderCount) return;
  const ruleRows = await tx.approvalRule.findMany({ where: rules, select: { id: true }, orderBy: { id: 'asc' }, take: 10 });
  const orderRows = await tx.purchaseOrder.findMany({ where: orders, select: { id: true }, orderBy: { id: 'asc' }, take: 10 });
  throw new ApiError(409, 'RESPONSIBILITY_IN_USE', 'Responsabilidade em uso em regras ou pedidos pendentes.', [], {
    ruleCount, pendingOrderCount, ruleIds: ruleRows.map((row) => row.id), orderIds: orderRows.map((row) => row.id),
    truncated: ruleCount > 10 || pendingOrderCount > 10,
  });
};

@Injectable()
export class ResponsibilitiesService {
  constructor(@Inject(DatabaseService) private readonly database: DatabaseService) {}

  async list(projectId: string, query: ResponsibilityQuery) {
    return this.database.$transaction(async (tx) => {
      if (!await tx.project.findUnique({ where: { id: projectId }, select: { id: true } })) {
        throw new ApiError(404, 'RESOURCE_NOT_FOUND', 'Obra não encontrada.');
      }
      const where = { projectId, ...(query.active === undefined ? {} : { active: query.active }),
        ...(query.operatorId === undefined ? {} : { operatorId: query.operatorId }) };
      const total = await tx.projectResponsibility.count({ where });
      const offset = (query.page - 1) * query.pageSize;
      const rows = offset >= total ? [] : await tx.projectResponsibility.findMany({ where, select: publicResponsibility,
        orderBy: [{ grantedAt: 'desc' }, { id: 'asc' }], skip: offset, take: query.pageSize });
      return projectPage(rows, total, query, (row) => row);
    }, { isolationLevel: 'RepeatableRead' });
  }

  async grant(projectId: string, operatorId: string, actorId: string) {
    return this.database.$transaction(async (tx) => {
      await lockProject(tx, projectId);
      const operator = await tx.user.findUnique({ where: { id: operatorId }, select: { role: true } });
      if (!operator) throw new ApiError(404, 'RESOURCE_NOT_FOUND', 'Operador não encontrado.');
      if (operator.role !== 'operator') throw new ApiError(400, 'INVALID_OPERATOR_ROLE', 'Selecione um Operador.');
      if (await tx.projectResponsibility.findFirst({ where: { projectId, operatorId, active: true }, select: { id: true } })) {
        throw new ApiError(409, 'RESPONSIBILITY_ALREADY_ACTIVE', 'O Operador já tem responsabilidade ativa nesta obra.');
      }
      const responsibility = await tx.projectResponsibility.create({
        data: { projectId, operatorId, grantedById: actorId }, select: publicResponsibility,
      });
      const project = await tx.project.update({ where: { id: projectId }, data: { rulesRevision: { increment: 1 } }, select: { rulesRevision: true } });
      return { responsibility, revision: project.rulesRevision };
    });
  }

  async revoke(projectId: string, id: string, actorId: string): Promise<number> {
    return this.database.$transaction(async (tx) => {
      const revision = await lockProject(tx, projectId);
      const responsibility = await tx.projectResponsibility.findFirst({ where: { id, projectId }, select: { active: true } });
      if (!responsibility) throw new ApiError(404, 'RESOURCE_NOT_FOUND', 'Responsabilidade não encontrada nesta obra.');
      if (!responsibility.active) return revision;
      await assertUnused(tx, id);
      await tx.projectResponsibility.update({ where: { id }, data: { active: false, revokedById: actorId, revokedAt: new Date() } });
      const project = await tx.project.update({ where: { id: projectId }, data: { rulesRevision: { increment: 1 } }, select: { rulesRevision: true } });
      return project.rulesRevision;
    });
  }
}
