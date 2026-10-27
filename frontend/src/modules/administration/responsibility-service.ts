import { z } from 'zod';
import { http } from '../../shared/api-client';

const person = z.object({ id: z.uuid(), name: z.string() });
const responsibilitySchema = z.object({ id: z.uuid(), projectId: z.uuid(), operator: person, active: z.boolean(),
  grantedBy: person, grantedAt: z.iso.datetime(), revokedBy: person.nullable(), revokedAt: z.iso.datetime().nullable() });
const pageSchema = z.object({ data: z.array(responsibilitySchema), meta: z.object({
  page: z.number().int(), pageSize: z.number().int(), total: z.number().int(), totalPages: z.number().int(),
}) });
export type Responsibility = z.infer<typeof responsibilitySchema>;
export interface ResponsibilityFilters { page: number; active?: boolean }
export const grantSchema = z.object({ operatorId: z.uuid('Selecione um Operador.') });
export type GrantInput = z.infer<typeof grantSchema>;
export const usageSchema = z.object({ ruleCount: z.number().int().nonnegative(), pendingOrderCount: z.number().int().nonnegative(),
  ruleIds: z.array(z.string()), orderIds: z.array(z.string()), truncated: z.boolean() });
const path = (projectId: string) => `/projects/${encodeURIComponent(projectId)}/responsibilities`;
export const responsibilityService = {
  list: (projectId: string, filters: ResponsibilityFilters, signal?: AbortSignal) => {
    const params = new URLSearchParams({ page: String(filters.page), pageSize: '20' });
    if (filters.active !== undefined) params.set('active', String(filters.active));
    return http.request(`${path(projectId)}?${params}`, pageSchema, { signal: signal ?? null });
  },
  grant: (projectId: string, input: GrantInput) => http.request(path(projectId), responsibilitySchema, { method: 'POST', body: JSON.stringify(input) }),
  revoke: (projectId: string, id: string) => http.request(`${path(projectId)}/${encodeURIComponent(id)}`, z.undefined(), { method: 'DELETE' }),
};
