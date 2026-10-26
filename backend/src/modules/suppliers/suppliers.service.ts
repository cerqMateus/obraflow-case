import { Inject, Injectable } from '@nestjs/common';
import { DatabaseService } from '../../infrastructure/database/database.service';
import { literalSearch } from '../../infrastructure/http/catalog-query';
import type { SupplierInput, SupplierQuery } from '../../infrastructure/http/catalog-query';
import { projectPage } from '../../infrastructure/http/pagination';

const publicSupplier = { id: true, name: true } as const;

@Injectable()
export class SuppliersService {
  constructor(@Inject(DatabaseService) private readonly database: DatabaseService) {}

  async list(query: SupplierQuery) {
    const where = query.search === undefined ? {} : { name: { contains: literalSearch(query.search), mode: 'insensitive' as const } };
    return this.database.$transaction(async (tx) => {
      const total = await tx.supplier.count({ where });
      const offset = (query.page - 1) * query.pageSize;
      const rows = offset >= total ? [] : await tx.supplier.findMany({ where, select: publicSupplier,
        orderBy: [{ name: 'asc' }, { id: 'asc' }], skip: offset, take: query.pageSize });
      return projectPage(rows, total, query, (row) => row);
    }, { isolationLevel: 'RepeatableRead' });
  }

  create(input: SupplierInput): Promise<{ id: string; name: string }> {
    return this.database.supplier.create({ data: { name: input.name }, select: publicSupplier });
  }
}
