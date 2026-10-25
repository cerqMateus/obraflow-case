import { describe, expect, it, vi } from 'vitest';
import { z } from 'zod';
import { ApiError, HttpClient } from './client';

describe('HTTP session boundary', () => {
  it('sends cookies and in-memory CSRF only to the relative API', async () => {
    const fetcher = vi.fn().mockResolvedValue(new Response(null, { status: 204 }));
    vi.stubGlobal('fetch', fetcher);
    const client = new HttpClient();
    client.setCsrfToken('test-csrf');
    await client.request('/auth/logout', z.undefined(), { method: 'POST' });
    expect(fetcher).toHaveBeenCalledWith('/api/v1/auth/logout', expect.objectContaining({ credentials: 'same-origin', cache: 'no-store' }));
    expect(new Headers(fetcher.mock.calls[0]?.[1].headers).get('X-CSRF-Token')).toBe('test-csrf');
  });
  it('rejects a late response after an identity boundary', async () => {
    let finish: ((value: Response) => void) | undefined;
    vi.stubGlobal('fetch', vi.fn(() => new Promise<Response>((resolve) => { finish = resolve; })));
    const client = new HttpClient();
    const pending = client.request('/private', z.object({ name: z.string() }));
    client.reset();
    finish?.(Response.json({ name: 'previous account' }));
    await expect(pending).rejects.toMatchObject({ name: 'AbortError' });
  });
  it('expires private context on 401 and preserves the contract error', async () => {
    vi.stubGlobal('fetch', vi.fn().mockResolvedValue(Response.json({ error: {
      code: 'UNAUTHENTICATED', message: 'Entre para continuar.', requestId: 'request-test',
    } }, { status: 401 })));
    const client = new HttpClient();
    const expire = vi.fn();
    client.setExpirationHandler(expire);
    await expect(client.request('/auth/me', z.unknown())).rejects.toBeInstanceOf(ApiError);
    expect(expire).toHaveBeenCalledOnce();
  });
  it('does not turn malformed success into fake data or retry network mutations', async () => {
    const fetcher = vi.fn().mockRejectedValue(new TypeError('offline'));
    vi.stubGlobal('fetch', fetcher);
    await expect(new HttpClient().request('/auth/login', z.unknown(), { method: 'POST' })).rejects.toMatchObject({ code: 'NETWORK_ERROR' });
    expect(fetcher).toHaveBeenCalledOnce();
    fetcher.mockResolvedValue(Response.json({ invalid: true }));
    await expect(new HttpClient().request('/auth/me', z.object({ user: z.string() }))).rejects.toMatchObject({ code: 'INVALID_RESPONSE' });
  });
});
