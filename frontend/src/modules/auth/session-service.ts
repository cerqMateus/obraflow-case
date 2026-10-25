import { z } from 'zod';
import { ApiError, http } from '../../shared/api-client';

export const sessionSchema = z.object({
  user: z.object({ id: z.string().uuid(), name: z.string(), email: z.string().email(), role: z.enum(['admin', 'operator']) }),
  expiresAt: z.string().datetime(), csrfToken: z.string().min(1),
});
export type Session = z.infer<typeof sessionSchema>;
export const loginSchema = z.object({
  email: z.string().trim().toLowerCase().max(254, 'Use até 254 caracteres.').email('Informe um e-mail válido.'),
  password: z.string().min(1, 'Informe sua senha.').max(128, 'Use até 128 caracteres.'),
});
export type LoginInput = z.infer<typeof loginSchema>;
const csrfSchema = z.object({ csrfToken: z.string(), authenticated: z.boolean(), expiresAt: z.string().datetime() });

export const sessionService = {
  async current(signal?: AbortSignal): Promise<Session | null> {
    try {
      const session = await http.request('/auth/me', sessionSchema, { signal: signal ?? null });
      http.setCsrfToken(session.csrfToken);
      return session;
    } catch (error) {
      if (error instanceof ApiError && error.status === 401) return null;
      throw error;
    }
  },
  async login(input: LoginInput): Promise<Session> {
    const csrf = await http.request('/auth/csrf', csrfSchema);
    http.setCsrfToken(csrf.csrfToken);
    // An uncertain previous login may already have succeeded; reconcile through the server.
    if (csrf.authenticated) {
      const current = await sessionService.current();
      if (current) return current;
      throw new ApiError(401, 'UNAUTHENTICATED', 'A sessão expirou. Entre novamente.');
    }
    const session = await http.request('/auth/login', sessionSchema, { method: 'POST', body: JSON.stringify(input) });
    http.setCsrfToken(session.csrfToken);
    return session;
  },
  async logout(): Promise<void> { await http.request('/auth/logout', z.undefined(), { method: 'POST' }); },
};
