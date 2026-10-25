import type { Request } from 'express';

export type Role = 'admin' | 'operator';
export interface Identity { id: string; name: string; email: string; role: Role }
export interface SessionResponse { user: Identity; expiresAt: string; csrfToken: string }
export interface CsrfResponse { authenticated: boolean; expiresAt: string; csrfToken: string }
export interface IdentityRequest extends Request { identity?: Identity | undefined }

declare module 'express-session' {
  interface SessionData {
    userId?: string;
    csrfToken?: string;
    absoluteExpiresAt?: number;
    authenticatedAt?: number;
  }
}
