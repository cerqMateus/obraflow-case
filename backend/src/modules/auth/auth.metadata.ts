import { createParamDecorator, SetMetadata, UnauthorizedException } from '@nestjs/common';
import type { ExecutionContext } from '@nestjs/common';
import type { Identity, IdentityRequest, Role } from './auth.types';

export const PUBLIC_ROUTE = 'auth:public';
export const REQUIRED_ROLES = 'auth:roles';
export const LOGIN_ROUTE = 'auth:login';
export const Public = () => SetMetadata(PUBLIC_ROUTE, true);
export const Roles = (...roles: Role[]) => SetMetadata(REQUIRED_ROLES, roles);
export const LoginRoute = () => SetMetadata(LOGIN_ROUTE, true);
export const CurrentIdentity = createParamDecorator((_data: unknown, context: ExecutionContext): Identity => {
  const identity = context.switchToHttp().getRequest<IdentityRequest>().identity;
  if (!identity) throw new UnauthorizedException();
  return identity;
});
