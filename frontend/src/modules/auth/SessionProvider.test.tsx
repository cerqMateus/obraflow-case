import { act, render, screen, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { afterEach, describe, expect, it, vi } from 'vitest';
import { SessionProvider, useSession } from './SessionProvider';
import { sessionService } from './session-service';
import type { Session } from './session-service';

vi.mock('./session-service', () => ({ sessionService: { current: vi.fn(), login: vi.fn(), logout: vi.fn() } }));
const session: Session = { user: { id: 'account-a', name: 'Amanda', email: 'amanda@example.test', role: 'operator' },
  csrfToken: 'test-token', expiresAt: new Date(Date.now() + 60_000).toISOString() };
const Probe = () => {
  const value = useSession();
  return <>
    <p>{value.loading ? 'Loading' : value.error ? 'Unavailable' : value.session?.user.name ?? 'Anonymous'}</p>
    <button onClick={value.retry}>Retry</button>
    <button onClick={() => { void value.logout(); }}>Logout</button>
    <button onClick={() => { void value.login({ email: 'amanda@example.test', password: 'test' }); }}>Login</button>
  </>;
};
const setup = (): QueryClient => {
  const client = new QueryClient({ defaultOptions: { queries: { retry: false }, mutations: { retry: false } } });
  render(<QueryClientProvider client={client}><SessionProvider><Probe /></SessionProvider></QueryClientProvider>);
  return client;
};
afterEach(() => { vi.useRealTimers(); });

describe('Session lifecycle', () => {
  it('distinguishes unavailable communication from an anonymous session and recovers', async () => {
    vi.mocked(sessionService.current).mockRejectedValueOnce(new Error('offline')).mockResolvedValueOnce(null);
    setup();
    expect(await screen.findByText('Unavailable')).toBeVisible();
    await userEvent.click(screen.getByText('Retry'));
    expect(await screen.findByText('Anonymous')).toBeVisible();
  });
  it('clears account data and cancels late queries on logout and login', async () => {
    vi.mocked(sessionService.current).mockResolvedValue(session);
    vi.mocked(sessionService.logout).mockResolvedValue();
    vi.mocked(sessionService.login).mockResolvedValue({ ...session, user: { ...session.user, name: 'João', id: 'account-b' } });
    const client = setup();
    await screen.findByText('Amanda');
    client.setQueryData(['private', 'account-a', 'orders'], ['private-order']);
    let finish: ((value: string[]) => void) | undefined;
    const pending = client.fetchQuery({ queryKey: ['private', 'account-a', 'late'],
      queryFn: () => new Promise<string[]>((resolve) => { finish = resolve; }) }).catch(() => undefined);
    await userEvent.click(screen.getByText('Logout'));
    await screen.findByText('Anonymous');
    finish?.(['old-result']);
    await pending;
    expect(client.getQueryData(['private', 'account-a', 'orders'])).toBeUndefined();
    expect(client.getQueryData(['private', 'account-a', 'late'])).toBeUndefined();
    await userEvent.click(screen.getByText('Login'));
    await screen.findByText('João');
    expect(client.getQueryCache().getAll().map((entry) => entry.queryKey)).toEqual([['session']]);
  });
  it('removes private content at the absolute expiration without user activity', async () => {
    vi.mocked(sessionService.current).mockResolvedValue(session);
    const client = setup();
    await screen.findByText('Amanda');
    await waitFor(() => expect(client.getQueryData(['session'])).toBeDefined());
    vi.useFakeTimers();
    await act(async () => { client.setQueryData(['session'], { ...session, expiresAt: new Date(Date.now() + 10).toISOString() }); });
    await act(async () => { await vi.advanceTimersByTimeAsync(20); });
    expect(screen.getByText('Anonymous')).toBeVisible();
  });
});
