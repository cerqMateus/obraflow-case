import { useQuery } from '@tanstack/react-query';
import { useSession } from '../auth';
import { catalogService } from './catalog-service';
import type { CatalogFilters, UserFilters } from './catalog-service';

export const useProjects = (filters: CatalogFilters) => {
  const { session } = useSession();
  return useQuery({ queryKey: ['catalogs', session?.user.id, 'projects', filters],
    queryFn: ({ signal }) => catalogService.projects(filters, signal), enabled: Boolean(session) });
};
export const useProject = (id: string) => {
  const { session } = useSession();
  return useQuery({ queryKey: ['catalogs', session?.user.id, 'project', id],
    queryFn: ({ signal }) => catalogService.project(id, signal), enabled: Boolean(session) && Boolean(id) });
};
export const useSuppliers = (filters: CatalogFilters) => {
  const { session } = useSession();
  return useQuery({ queryKey: ['catalogs', session?.user.id, 'suppliers', filters],
    queryFn: ({ signal }) => catalogService.suppliers(filters, signal), enabled: Boolean(session) });
};
export const useUsers = (filters: UserFilters) => {
  const { session } = useSession();
  return useQuery({ queryKey: ['catalogs', session?.user.id, 'users', filters],
    queryFn: ({ signal }) => catalogService.users(filters, signal), enabled: session?.user.role === 'admin' });
};
