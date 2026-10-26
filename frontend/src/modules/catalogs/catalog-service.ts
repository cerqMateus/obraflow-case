import { z } from 'zod';
import { http } from '../../shared/api-client';

export const projectSchema = z.object({ id: z.uuid(), name: z.string(), rulesRevision: z.number().int().nonnegative() });
const supplierSchema = z.object({ id: z.uuid(), name: z.string() });
const userSchema = supplierSchema.extend({ email: z.email(), role: z.enum(['admin', 'operator']) });
const metaSchema = z.object({ page: z.number().int(), pageSize: z.number().int(), total: z.number().int(), totalPages: z.number().int() });
const pageSchema = <T extends z.ZodType>(schema: T) => z.object({ data: z.array(schema), meta: metaSchema });
export type Project = z.infer<typeof projectSchema>;
export interface CatalogFilters { page: number; pageSize?: number; search?: string }
export interface UserFilters extends CatalogFilters { role?: 'admin' | 'operator' }

const queryString = (filters: CatalogFilters | UserFilters): string => {
  const params = new URLSearchParams({ page: String(filters.page), pageSize: String(filters.pageSize ?? 20) });
  if (filters.search) params.set('search', filters.search);
  if ('role' in filters && filters.role) params.set('role', filters.role);
  return params.toString();
};

export const catalogService = {
  projects: (filters: CatalogFilters, signal?: AbortSignal) => http.request(`/projects?${queryString(filters)}`, pageSchema(projectSchema), { signal: signal ?? null }),
  project: (id: string, signal?: AbortSignal) => http.request(`/projects/${encodeURIComponent(id)}`, projectSchema, { signal: signal ?? null }),
  suppliers: (filters: CatalogFilters, signal?: AbortSignal) => http.request(`/suppliers?${queryString(filters)}`, pageSchema(supplierSchema), { signal: signal ?? null }),
  users: (filters: UserFilters, signal?: AbortSignal) => http.request(`/users?${queryString(filters)}`, pageSchema(userSchema), { signal: signal ?? null }),
};
