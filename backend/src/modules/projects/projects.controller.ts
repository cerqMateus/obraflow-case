import { Body, Controller, Get, Inject, Param, Patch, Post, Query, Res } from '@nestjs/common';
import type { Response } from 'express';
import { CatalogQuery, ProjectInput } from '../../infrastructure/http/catalog-query';
import { UuidPipe } from '../../infrastructure/http/uuid.pipe';
import { Roles } from '../auth/auth.metadata';
import { ProjectsService } from './projects.service';

@Controller('projects')
export class ProjectsController {
  constructor(@Inject(ProjectsService) private readonly projects: ProjectsService) {}
  @Get() list(@Query() query: CatalogQuery) { return this.projects.list(query); }
  @Roles('admin') @Post()
  async create(@Body() input: ProjectInput, @Res({ passthrough: true }) response: Response) {
    const project = await this.projects.create(input);
    response.location(`/api/v1/projects/${project.id}`);
    return project;
  }
  @Get(':projectId') get(@Param('projectId', UuidPipe) id: string) { return this.projects.get(id); }
  @Roles('admin') @Patch(':projectId')
  update(@Param('projectId', UuidPipe) id: string, @Body() input: ProjectInput) { return this.projects.update(id, input); }
}
