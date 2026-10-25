import { Inject, Injectable } from '@nestjs/common';
import type { Request, Response } from 'express';
import { DatabaseService } from '../../infrastructure/database/database.service';
import { verifyPassword } from '../../infrastructure/security/password';
import { ApiError } from '../../infrastructure/http/api-error';
import { SessionService } from './session.service';
import type { CsrfResponse, Identity, IdentityRequest, SessionResponse } from './auth.types';
import type { LoginInput } from './login.dto';

// Valid fixed-format dummy hash makes absent accounts perform the same expensive derivation.
const DUMMY_HASH = `scrypt$131072$8$1$${'0'.repeat(32)}$${'0'.repeat(128)}`;

@Injectable()
export class AuthService {
  constructor(
    @Inject(DatabaseService) private readonly database: DatabaseService,
    @Inject(SessionService) private readonly sessions: SessionService,
  ) {}

  async csrf(req: IdentityRequest): Promise<CsrfResponse> {
    if (!req.session || !this.sessions.valid(req)) await this.sessions.initialize(req);
    return { ...this.context(req), authenticated: Boolean(req.identity) };
  }

  async login(req: IdentityRequest, input: LoginInput): Promise<SessionResponse> {
    if (req.identity) throw new ApiError(409, 'SESSION_ALREADY_AUTHENTICATED', 'Saia antes de entrar com outra conta.');
    const account = await this.database.user.findUnique({ where: { email: input.email },
      select: { id: true, name: true, email: true, role: true, passwordHash: true } });
    const valid = await verifyPassword(input.password, account?.passwordHash ?? DUMMY_HASH);
    if (!account || !valid) throw new ApiError(401, 'INVALID_CREDENTIALS', 'E-mail ou senha inválidos.');
    await this.sessions.initialize(req, account.id);
    const user: Identity = { id: account.id, name: account.name, email: account.email, role: account.role };
    return { user, ...this.context(req) };
  }

  me(req: Request, user: Identity): SessionResponse { return { user, ...this.context(req) }; }

  async logout(req: Request, res: Response): Promise<void> { await this.sessions.destroy(req, res); }

  private context(req: Request): { expiresAt: string; csrfToken: string } {
    const { absoluteExpiresAt, csrfToken } = req.session;
    if (!absoluteExpiresAt || !csrfToken) throw new ApiError(401, 'UNAUTHENTICATED', 'Entre para continuar.');
    return { expiresAt: new Date(absoluteExpiresAt).toISOString(), csrfToken };
  }
}
