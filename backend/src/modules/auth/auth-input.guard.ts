import { Injectable } from '@nestjs/common';
import type { CanActivate, ExecutionContext } from '@nestjs/common';
import type { Request } from 'express';
import { ApiError } from '../../infrastructure/http/api-error';

@Injectable()
export class AuthInputGuard implements CanActivate {
  canActivate(context: ExecutionContext): boolean {
    const req = context.switchToHttp().getRequest<Request>();
    if (Object.keys(req.query).length > 0 ||
      (!req.path.endsWith('/login') && req.body !== undefined &&
        (Array.isArray(req.body) || Object.keys(req.body).length > 0))) {
      throw new ApiError(400, 'VALIDATION_ERROR', 'Esta operação não aceita os campos enviados.');
    }
    return true;
  }
}
