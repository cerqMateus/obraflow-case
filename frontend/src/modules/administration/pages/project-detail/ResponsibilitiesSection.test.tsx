import { render, screen, within, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { MemoryRouter } from 'react-router';
import { beforeAll, beforeEach, expect, it, vi } from 'vitest';
import { ApiError } from '../../../../shared/api-client';
import { ResponsibilitiesSection } from './ResponsibilitiesSection';
import type * as ResponsibilityModule from '../../responsibility-service';
import type * as CatalogModule from '../../../catalogs/catalog-service';

const { list, users, grant, revoke } = vi.hoisted(() => ({ list: vi.fn(), users: vi.fn(), grant: vi.fn(), revoke: vi.fn() }));
vi.mock('../../../auth', () => ({ useSession: () => ({ session: { user: { id: 'admin', role: 'admin' } } }) }));
vi.mock('../../responsibility-service', async (original) => {
  const module = await original<typeof ResponsibilityModule>();
  return { ...module, responsibilityService: { list, grant, revoke } };
});
vi.mock('../../../catalogs/catalog-service', async (original) => {
  const module = await original<typeof CatalogModule>();
  return { ...module, catalogService: { ...module.catalogService, users } };
});
const projectId = '00000000-0000-4000-8000-000000000010';
const operatorId = '00000000-0000-4000-8000-000000000002';
const responsibility = { id: '00000000-0000-4000-8000-000000000030', projectId, operator: { id: operatorId, name: 'Amanda' },
  active: true, grantedBy: { id: 'admin', name: 'Admin' }, grantedAt: '2026-10-26T12:00:00Z', revokedAt: null, revokedBy: null };
const meta = { page: 1, pageSize: 20, total: 1, totalPages: 1 };
const mount = (url = '/') => {
  const client = new QueryClient({ defaultOptions: { queries: { retry: false }, mutations: { retry: false } } });
  render(<QueryClientProvider client={client}><MemoryRouter initialEntries={[url]}><ResponsibilitiesSection projectId={projectId} projectName="Horizonte" /></MemoryRouter></QueryClientProvider>);
  return client;
};
beforeAll(() => { HTMLDialogElement.prototype.showModal = function () { this.setAttribute('open', ''); }; });
beforeEach(() => {
  vi.resetAllMocks();
  list.mockResolvedValue({ data: [responsibility], meta });
  users.mockResolvedValue({ data: [{ id: operatorId, name: 'Amanda', email: 'amanda@test.test', role: 'operator' }], meta });
});

it('uses URL filters and pagination, shows empty and failure recovery', async () => {
  list.mockRejectedValueOnce(new ApiError(503, 'UNAVAILABLE', 'Unavailable'));
  const user = userEvent.setup(); mount('/?active=false&responsibilityPage=2');
  expect(await screen.findByRole('alert')).toHaveTextContent('Não foi possível consultar');
  expect(list.mock.calls[0]?.[1]).toEqual({ page: 2, active: false });
  list.mockResolvedValue({ data: [], meta: { ...meta, total: 0, totalPages: 0 } });
  await user.click(screen.getByRole('button', { name: 'Tentar novamente' }));
  await screen.findByText(/Nenhum vínculo encontrado/);
  await user.selectOptions(screen.getByLabelText('Situação do vínculo'), 'true');
  await waitFor(() => expect(list.mock.calls.at(-1)?.[1]).toEqual({ page: 1, active: true }));
});

it('opens revoke confirmation with person/project and returns focus on cancel', async () => {
  const user = userEvent.setup(); mount();
  const trigger = await screen.findByRole('button', { name: 'Revogar Amanda' }); await user.click(trigger);
  expect(screen.getByRole('dialog')).toHaveTextContent('Revogar o vínculo de Amanda com Horizonte?');
  expect(screen.getByRole('button', { name: 'Cancelar' })).toHaveFocus();
  await user.click(screen.getByRole('button', { name: 'Cancelar' })); expect(trigger).toHaveFocus(); expect(revoke).not.toHaveBeenCalled();
});

it('keeps link and confirmation on conflict, showing complete counts and bounded IDs without invented names', async () => {
  revoke.mockRejectedValue(new ApiError(409, 'RESPONSIBILITY_IN_USE', 'Responsabilidade em uso.', undefined, [], {
    ruleCount: 12, pendingOrderCount: 15, ruleIds: ['rule-id'], orderIds: ['order-id'], truncated: true,
  }));
  const user = userEvent.setup(); mount(); await user.click(await screen.findByRole('button', { name: 'Revogar Amanda' }));
  await user.click(screen.getByRole('button', { name: 'Confirmar revogação' }));
  expect(await screen.findByRole('alert')).toHaveTextContent('12 faixa(s) e 15 pedido(s)');
  expect(screen.getByRole('alert')).toHaveTextContent('IDs das faixas: rule-id'); expect(screen.getByRole('alert')).toHaveTextContent('IDs dos pedidos: order-id');
  expect(screen.getByRole('alert')).toHaveTextContent('até 10 IDs'); expect(screen.getByRole('dialog')).toBeVisible();
  expect(screen.getByRole('button', { name: 'Revogar Amanda' })).toBeInTheDocument(); expect(revoke).toHaveBeenCalledTimes(1);
});

it('awaits confirmed revoke and invalidates links and configuration revision', async () => {
  let finish: (() => void) | undefined;
  revoke.mockImplementation(() => new Promise<void>((resolve) => { finish = resolve; }));
  const user = userEvent.setup(); const client = mount(); const invalidate = vi.spyOn(client, 'invalidateQueries');
  await user.click(await screen.findByRole('button', { name: 'Revogar Amanda' })); await user.click(screen.getByRole('button', { name: 'Confirmar revogação' }));
  expect(screen.getByRole('button', { name: 'Revogando…' })).toBeDisabled(); expect(screen.getByRole('button', { name: 'Cancelar' })).toBeDisabled();
  expect(screen.getByRole('dialog')).toBeVisible(); finish?.();
  await screen.findByText('Responsabilidade revogada.'); expect(screen.queryByRole('dialog')).not.toBeInTheDocument();
  expect(invalidate).toHaveBeenCalledWith({ queryKey: ['approval-rules', 'admin', projectId] });
  expect(invalidate).toHaveBeenCalledWith({ queryKey: ['catalogs', 'admin', 'project', projectId] });
});

it('paginates/searches only operators and grants a selection beyond the first page', async () => {
  users.mockImplementation(({ page }: { page: number }) => Promise.resolve({ data: page === 1 ? [] : [{ id: operatorId, name: 'Amanda', email: 'amanda@test.test', role: 'operator' }], meta: { ...meta, page, total: 21, totalPages: 2 } }));
  grant.mockResolvedValue(responsibility);
  const user = userEvent.setup(); mount(); await user.click(screen.getByRole('button', { name: 'Adicionar responsável' }));
  const dialog = within(screen.getByRole('dialog'));
  await user.click(await dialog.findByRole('button', { name: 'Próxima' }));
  await user.click(await dialog.findByRole('radio', { name: /Amanda/ }));
  await user.click(dialog.getByRole('button', { name: 'Adicionar responsável' }));
  await screen.findByText('Responsabilidade concedida.'); expect(grant).toHaveBeenCalledWith(projectId, { operatorId });
  expect(users.mock.calls.at(-1)?.[0]).toEqual({ role: 'operator', page: 2, search: '' });
  await user.click(screen.getByRole('button', { name: 'Adicionar responsável' }));
  await user.type(screen.getByLabelText('Buscar Operador'), 'Amanda');
  await waitFor(() => expect(users.mock.calls.at(-1)?.[0]).toEqual({ role: 'operator', page: 1, search: 'Amanda' }));
});

it('validates missing selection, handles selector failures and preserves choice after uncertain mutation', async () => {
  users.mockRejectedValueOnce(new Error('Network failure'));
  grant.mockRejectedValue(new ApiError(0, 'NETWORK_ERROR', 'Network failure'));
  const user = userEvent.setup(); mount(); await user.click(screen.getByRole('button', { name: 'Adicionar responsável' }));
  const dialog = within(screen.getByRole('dialog'));
  await dialog.findByText('Não foi possível carregar os operadores.'); await user.click(dialog.getByRole('button', { name: 'Tentar novamente' }));
  await user.click(dialog.getByRole('button', { name: 'Adicionar responsável' }));
  expect(await dialog.findByText('Selecione um Operador.')).toBeVisible(); expect(grant).not.toHaveBeenCalled();
  await user.click(await dialog.findByRole('radio', { name: /Amanda/ })); await user.click(dialog.getByRole('button', { name: 'Adicionar responsável' }));
  await dialog.findByText(/Consulte os vínculos antes de tentar novamente/); expect(dialog.getByRole('radio', { name: /Amanda/ })).toBeChecked();
  expect(grant).toHaveBeenCalledTimes(1);
});
