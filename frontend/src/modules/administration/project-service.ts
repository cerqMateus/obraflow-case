import { z } from 'zod';
import { http } from '../../shared/api-client';
import { projectSchema } from '../catalogs';

export const projectInputSchema = z.object({ name: z.string().trim().min(1, 'Informe o nome da obra.').max(120, 'Use até 120 caracteres.') });
export type ProjectInput = z.infer<typeof projectInputSchema>;
export const projectService = {
  create: (input: ProjectInput) => http.request('/projects', projectSchema, { method: 'POST', body: JSON.stringify(input) }),
  update: (id: string, input: ProjectInput) => http.request(`/projects/${encodeURIComponent(id)}`, projectSchema, { method: 'PATCH', body: JSON.stringify(input) }),
};
