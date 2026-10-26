import { Inject, Injectable } from '@nestjs/common';
import { DatabaseService } from '../../infrastructure/database/database.service';
import { ApiError } from '../../infrastructure/http/api-error';
import { literalSearch } from '../../infrastructure/http/catalog-query';
import type { CatalogQuery, ProjectInput } from '../../infrastructure/http/catalog-query';
import { projectPage } from '../../infrastructure/http/pagination';

const publicProject = { id: true, name: true, rulesRevision: true } as const;
export interface ProjectDto { id: string; name: string; rulesRevision: number }

@Injectable()
export class ProjectsService {
  constructor(@Inject(DatabaseService) private readonly database: DatabaseService) {}

  async list(query: CatalogQuery) {
    const where = query.search === undefined ? {} : { name: { contains: literalSearch(query.search), mode: 'insensitive' as const } };
    return this.database.$transaction(async (tx) => {
      const total = await tx.project.count({ where });
      const offset = (query.page - 1) * query.pageSize;
      const rows = offset >= total ? [] : await tx.project.findMany({ where, select: publicProject,
        orderBy: [{ name: 'asc' }, { id: 'asc' }], skip: offset, take: query.pageSize });
      return projectPage(rows, total, query, (row) => row);
    }, { isolationLevel: 'RepeatableRead' });
  }

  create(input: ProjectInput): Promise<ProjectDto> {
    return this.database.project.create({ data: { name: input.name }, select: publicProject });
  }

  async get(id: string): Promise<ProjectDto> {
    const project = await this.database.project.findUnique({ where: { id }, select: publicProject });
    if (!project) throw new ApiError(404, 'RESOURCE_NOT_FOUND', 'Obra não encontrada.');
    return project;
  }

  update(id: string, input: ProjectInput): Promise<ProjectDto> {
    // Updating only the live name preserves revisions and historical order snapshots.
    return this.database.project.update({ where: { id }, data: { name: input.name }, select: publicProject });
  }
}
