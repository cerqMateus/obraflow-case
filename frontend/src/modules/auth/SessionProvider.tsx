import { createContext, useContext, useEffect } from 'react';
import type { ReactNode } from 'react';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { ApiError, http } from '../../shared/api-client';
import { sessionService } from './session-service';
import type { LoginInput, Session } from './session-service';

interface SessionContextValue {
  session: Session | null | undefined;
  loading: boolean;
  error: Error | null;
  retry: () => void;
  login: (input: LoginInput) => Promise<void>;
  logout: () => Promise<void>;
  loggingOut: boolean;
  logoutError: Error | null;
}
const SessionContext = createContext<SessionContextValue | undefined>(undefined);
export const sessionKey = ['session'] as const;

export const SessionProvider = ({ children }: { children: ReactNode }) => {
  const client = useQueryClient();
  const query = useQuery({ queryKey: sessionKey, queryFn: ({ signal }) => sessionService.current(signal),
    retry: false, staleTime: 30_000 });

  useEffect(() => {
    const expire = () => {
      http.reset();
      void client.cancelQueries();
      client.removeQueries({ predicate: (entry) => entry.queryKey[0] !== 'session' });
      client.setQueryData(sessionKey, null);
    };
    http.setExpirationHandler(expire);
    const expiresAt = query.data?.expiresAt;
    const timeout = expiresAt ? window.setTimeout(expire, Math.max(0, Date.parse(expiresAt) - Date.now())) : undefined;
    return () => { window.clearTimeout(timeout); http.setExpirationHandler(() => undefined); };
  }, [client, query.data?.expiresAt]);

  const loginMutation = useMutation({ retry: false, mutationFn: sessionService.login,
    onSuccess: async (session) => {
      http.reset();
      http.setCsrfToken(session.csrfToken);
      await client.cancelQueries();
      client.clear();
      client.setQueryData(sessionKey, session);
    } });
  const logoutMutation = useMutation({ retry: false, mutationFn: sessionService.logout,
    onSuccess: async () => {
      http.reset();
      await client.cancelQueries();
      client.clear();
      client.setQueryData(sessionKey, null);
    },
    onError: (error) => {
      if (error instanceof ApiError && error.status === 401) client.setQueryData(sessionKey, null);
    } });

  return <SessionContext.Provider value={{ session: query.data, loading: query.isPending,
    error: query.error, retry: () => { void query.refetch(); },
    login: async (input) => { await loginMutation.mutateAsync(input); },
    logout: async () => { await logoutMutation.mutateAsync(); },
    loggingOut: logoutMutation.isPending, logoutError: logoutMutation.error }}>
    {children}
  </SessionContext.Provider>;
};

export const useSession = (): SessionContextValue => {
  const context = useContext(SessionContext);
  if (!context) throw new Error('SessionProvider required.');
  return context;
};
