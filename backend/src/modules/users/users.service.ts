import { Inject, Injectable } from '@nestjs/common';
import { DatabaseService } from '../../infrastructure/database/database.service';
import { literalSearch } from '../../infrastructure/http/catalog-query';
import { projectPage } from '../../infrastructure/http/pagination';
import { hashPassword } from '../../infrastructure/security/password';
import type { CreateUserInput, UsersQuery } from './users.dto';
import type { Identity } from '../auth/auth.types';

const publicUser = { id: true, name: true, email: true, role: true } as const;

@Injectable()
export class UsersService {
  constructor(@Inject(DatabaseService) private readonly database: DatabaseService) {}

  async list(query: UsersQuery) {
    const contains = query.search === undefined ? undefined : literalSearch(query.search);
    const where = { ...(query.role === undefined ? {} : { role: query.role }), ...(contains === undefined ? {} : { OR: [
      { name: { contains, mode: 'insensitive' as const } },
      { email: { contains, mode: 'insensitive' as const } },
    ] }) };
    return this.database.$transaction(async (tx) => {
      const total = await tx.user.count({ where });
      const offset = (query.page - 1) * query.pageSize;
      const rows = offset >= total ? [] : await tx.user.findMany({ where, select: publicUser,
        orderBy: [{ name: 'asc' }, { id: 'asc' }], skip: offset, take: query.pageSize });
      return projectPage(rows, total, query, (row) => row);
    }, { isolationLevel: 'RepeatableRead' });
  }

  async create(input: CreateUserInput): Promise<Identity> {
    const passwordHash = await hashPassword(input.password);
    return this.database.user.create({ data: { name: input.name, email: input.email, role: input.role, passwordHash }, select: publicUser });
  }
}
