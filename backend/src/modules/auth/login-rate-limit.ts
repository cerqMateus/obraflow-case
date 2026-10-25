import { Injectable } from '@nestjs/common';
import type { Response } from 'express';
import { ApiError } from '../../infrastructure/http/api-error';

const WINDOW_MS = 15 * 60 * 1000;
@Injectable()
export class LoginRateLimit {
  private readonly attempts = new Map<string, { count: number; expiresAt: number }>();

  check(ip: string, response: Pick<Response, 'setHeader'>): void {
    const now = Date.now();
    for (const [key, value] of this.attempts) if (value.expiresAt <= now) this.attempts.delete(key);
    const window = this.attempts.get(ip) ?? { count: 0, expiresAt: now + WINDOW_MS };
    this.attempts.set(ip, window);
    if (window.count >= 10) {
      response.setHeader('Retry-After', Math.ceil((window.expiresAt - now) / 1000));
      throw new ApiError(429, 'LOGIN_RATE_LIMITED', 'Muitas tentativas. Aguarde antes de tentar novamente.');
    }
    window.count += 1;
  }
}
