import { useMutation, useQueryClient } from '@tanstack/react-query';
import { useSession } from '../auth';
import { ApiError } from '../../shared/api-client';
import { projectService } from './project-service';
import type { ProjectInput } from './project-service';

export const useSaveProject = (id?: string) => {
  const client = useQueryClient();
  const { session } = useSession();
  const identity = session?.user.id;
  return useMutation({ retry: false,
    mutationFn: (input: ProjectInput) => id ? projectService.update(id, input) : projectService.create(input),
    onSuccess: async (project) => {
      client.setQueryData(['catalogs', identity, 'project', project.id], project);
      await client.invalidateQueries({ queryKey: ['catalogs', identity, 'projects'] });
    },
    onError: async (error) => {
      if (error instanceof ApiError && error.status === 409) {
        await client.invalidateQueries({ queryKey: ['catalogs', identity, 'projects'] });
        if (id) await client.invalidateQueries({ queryKey: ['catalogs', identity, 'project', id] });
      }
    },
  });
};
