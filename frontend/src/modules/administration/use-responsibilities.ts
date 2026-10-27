import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { useSession } from '../auth';
import { ApiError } from '../../shared/api-client';
import { responsibilityService } from './responsibility-service';
import type { GrantInput, ResponsibilityFilters } from './responsibility-service';

export const useResponsibilities = (projectId: string, filters: ResponsibilityFilters) => {
  const { session } = useSession();
  return useQuery({ queryKey: ['responsibilities', session?.user.id, projectId, filters],
    queryFn: ({ signal }) => responsibilityService.list(projectId, filters, signal), enabled: session?.user.role === 'admin' });
};

const useRefreshResponsibilities = (projectId: string) => {
  const client = useQueryClient();
  const { session } = useSession();
  return async () => {
    await Promise.all([
      client.invalidateQueries({ queryKey: ['responsibilities', session?.user.id, projectId] }),
      client.invalidateQueries({ queryKey: ['catalogs', session?.user.id, 'project', projectId] }),
      client.invalidateQueries({ queryKey: ['catalogs', session?.user.id, 'projects'] }),
      client.invalidateQueries({ queryKey: ['approval-rules', session?.user.id, projectId] }),
    ]);
  };
};

export const useGrantResponsibility = (projectId: string) => {
  const refresh = useRefreshResponsibilities(projectId);
  return useMutation({ retry: false, mutationFn: (input: GrantInput) => responsibilityService.grant(projectId, input),
    onSuccess: refresh, onError: async (error) => { if (error instanceof ApiError && error.status === 409) await refresh(); } });
};
export const useRevokeResponsibility = (projectId: string) => {
  const refresh = useRefreshResponsibilities(projectId);
  return useMutation({ retry: false, mutationFn: (id: string) => responsibilityService.revoke(projectId, id),
    onSuccess: refresh, onError: async (error) => { if (error instanceof ApiError && error.status === 409) await refresh(); } });
};
