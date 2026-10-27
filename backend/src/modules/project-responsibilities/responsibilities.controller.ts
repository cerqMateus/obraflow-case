import { Body, Controller, Delete, Get, HttpCode, Inject, Param, Post, Query, Res } from '@nestjs/common';
import type { Response } from 'express';
import { UuidPipe } from '../../infrastructure/http/uuid.pipe';
import { CurrentIdentity, Roles } from '../auth/auth.metadata';
import type { Identity } from '../auth/auth.types';
import { GrantResponsibilityInput, ResponsibilityQuery } from './responsibilities.dto';
import { ResponsibilitiesService } from './responsibilities.service';

@Roles('admin')
@Controller('projects/:projectId/responsibilities')
export class ResponsibilitiesController {
  constructor(@Inject(ResponsibilitiesService) private readonly responsibilities: ResponsibilitiesService) {}

  @Get()
  list(@Param('projectId', UuidPipe) projectId: string, @Query() query: ResponsibilityQuery) {
    return this.responsibilities.list(projectId, query);
  }

  @Post()
  async grant(@Param('projectId', UuidPipe) projectId: string, @Body() input: GrantResponsibilityInput,
    @CurrentIdentity() actor: Identity, @Res({ passthrough: true }) response: Response) {
    const result = await this.responsibilities.grant(projectId, input.operatorId, actor.id);
    response.setHeader('X-Rules-Revision', result.revision);
    return result.responsibility;
  }

  @Delete(':responsibilityId') @HttpCode(204)
  async revoke(@Param('projectId', UuidPipe) projectId: string, @Param('responsibilityId', UuidPipe) id: string,
    @CurrentIdentity() actor: Identity, @Res({ passthrough: true }) response: Response): Promise<void> {
    response.setHeader('X-Rules-Revision', await this.responsibilities.revoke(projectId, id, actor.id));
  }
}
