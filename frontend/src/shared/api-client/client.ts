import { z } from 'zod';

const fieldErrorSchema = z.object({ path: z.string(), code: z.string(), message: z.string() });
const errorSchema = z.object({ error: z.object({ code: z.string(), message: z.string(),
  fields: z.array(fieldErrorSchema).default([]), details: z.record(z.string(), z.unknown()).default({}), requestId: z.string() }) });

export class ApiError extends Error {
  constructor(public readonly status: number, public readonly code: string,
    message: string, public readonly requestId?: string,
    public readonly fields: z.infer<typeof fieldErrorSchema>[] = [],
    public readonly details: Record<string, unknown> = {}) { super(message); }
}

export class HttpClient {
  private csrfToken: string | undefined;
  private generation = 0;
  private onExpired: () => void = () => undefined;

  setExpirationHandler(handler: () => void): void { this.onExpired = handler; }
  setCsrfToken(token: string): void { this.csrfToken = token; }
  reset(): void { this.generation += 1; this.csrfToken = undefined; }

  async request<T>(path: string, schema: z.ZodType<T>, options: RequestInit = {}): Promise<T> {
    if (!path.startsWith('/') || path.startsWith('//')) throw new Error('Invalid API path.');
    const generation = this.generation;
    const headers = new Headers(options.headers);
    if (options.body) headers.set('Content-Type', 'application/json');
    if (options.method && options.method !== 'GET' && this.csrfToken) {
      headers.set('X-CSRF-Token', this.csrfToken);
    }
    let response: Response;
    try {
      response = await fetch(`/api/v1${path}`, { ...options, headers, credentials: 'same-origin', cache: 'no-store' });
    } catch (error) {
      if (error instanceof DOMException && error.name === 'AbortError') throw error;
      throw new ApiError(0, 'NETWORK_ERROR', 'Não foi possível comunicar com o servidor. Tente novamente.');
    }
    const body: unknown = response.status === 204 ? undefined : await response.json().catch(() => undefined);
    if (generation !== this.generation) throw new DOMException('Session changed', 'AbortError');
    if (!response.ok) {
      const parsed = errorSchema.safeParse(body);
      const error = parsed.success ? new ApiError(response.status, parsed.data.error.code,
        parsed.data.error.message, parsed.data.error.requestId, parsed.data.error.fields, parsed.data.error.details)
        : new ApiError(response.status, 'INVALID_RESPONSE', 'O servidor retornou uma resposta inesperada. Tente novamente.');
      if (response.status === 401 && error.code !== 'INVALID_CREDENTIALS') this.onExpired();
      throw error;
    }
    const parsed = schema.safeParse(body);
    if (!parsed.success) throw new ApiError(0, 'INVALID_RESPONSE', 'O servidor retornou dados inesperados. Tente novamente.');
    return parsed.data;
  }
}

export const http = new HttpClient();
