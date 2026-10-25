import { Inject, Injectable } from '@nestjs/common';
import type { CanActivate, ExecutionContext } from '@nestjs/common';
import { Reflector } from '@nestjs/core';
import type { Response } from 'express';
import { timingSafeEqual } from 'node:crypto';
import { DatabaseService } from '../../infrastructure/database/database.service';
import { configuration } from '../../infrastructure/configuration';
import { ApiError } from '../../infrastructure/http/api-error';
import { LOGIN_ROUTE, PUBLIC_ROUTE, REQUIRED_ROLES } from './auth.metadata';
import type { IdentityRequest, Role } from './auth.types';
import { SessionService } from './session.service';
import { LoginRateLimit } from './login-rate-limit';

const csrfMatches = (actual: string | undefined, expected: string | undefined): boolean => {
  if (!actual || !expected || actual.length !== expected.length || actual.length > 512) return false;
  const first = Buffer.from(actual);
  const second = Buffer.from(expected);
  return first.length === second.length && timingSafeEqual(first, second);
};

@Injectable()
export class AuthGuard implements CanActivate {
  private readonly origin = configuration().origin;
  constructor(
    @Inject(Reflector) private readonly reflector: Reflector,
    @Inject(DatabaseService) private readonly database: DatabaseService,
    @Inject(SessionService) private readonly sessions: SessionService,
    @Inject(LoginRateLimit) private readonly limiter: LoginRateLimit,
  ) {}

  async canActivate(context: ExecutionContext): Promise<boolean> {
    const req = context.switchToHttp().getRequest<IdentityRequest>();
    const res = context.switchToHttp().getResponse<Response>();
    const targets = [context.getHandler(), context.getClass()];
    const isPublic = this.reflector.getAllAndOverride<boolean>(PUBLIC_ROUTE, targets);
    const isLogin = this.reflector.getAllAndOverride<boolean>(LOGIN_ROUTE, targets);
    if (isLogin) this.limiter.check(req.ip ?? req.socket.remoteAddress ?? 'unknown', res);
    if (this.sessions.valid(req)) {
      this.sessions.pinExpiration(req);
      if (req.session.userId) req.identity = await this.database.user.findUnique({
        where: { id: req.session.userId }, select: { id: true, name: true, email: true, role: true },
      }) ?? undefined;
    } else if (req.session.absoluteExpiresAt !== undefined || req.headers.cookie?.includes('obraflow.sid=')) {
      if (isPublic && !isLogin) await this.sessions.initialize(req);
      else await this.sessions.destroy(req, res);
    }
    if (!isPublic && !req.identity) throw new ApiError(401, 'UNAUTHENTICATED', 'Entre para continuar.');
    if (['POST', 'PUT', 'PATCH', 'DELETE'].includes(req.method)) {
      if (req.headers.origin !== undefined && req.headers.origin !== this.origin) {
        throw new ApiError(403, 'FORBIDDEN', 'Origem não autorizada.');
      }
      if (!req.session || !this.sessions.valid(req) || !csrfMatches(req.get('X-CSRF-Token'), req.session.csrfToken)) {
        throw new ApiError(403, 'CSRF_INVALID', 'Atualize a sessão antes de enviar novamente.');
      }
    }
    const roles = this.reflector.getAllAndOverride<Role[]>(REQUIRED_ROLES, targets);
    if (roles && (!req.identity || !roles.includes(req.identity.role))) {
      throw new ApiError(403, 'FORBIDDEN', 'Operação não permitida.');
    }
    return true;
  }
}
