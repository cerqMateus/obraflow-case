import { render, screen, waitFor, within } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { MemoryRouter } from 'react-router';
import { beforeAll, describe, expect, it, vi } from 'vitest';
import { ProjectsPage } from './ProjectsPage';
import { ApiError } from '../../../../shared/api-client';
import type * as CatalogModule from '../../../catalogs/catalog-service';
import type * as ProjectModule from '../../project-service';

const { list, create, update } = vi.hoisted(() => ({ list: vi.fn(), create: vi.fn(), update: vi.fn() }));
vi.mock('../../../auth', () => ({ useSession: () => ({ session: { user: { id: 'admin', role: 'admin' } } }) }));
vi.mock('../../../catalogs/catalog-service', async (original) => {
  const module = await original<typeof CatalogModule>();
  return { ...module, catalogService: { ...module.catalogService, projects: list } };
});
vi.mock('../../project-service', async (original) => {
  const module = await original<typeof ProjectModule>();
  return { ...module, projectService: { create, update } };
});
const project = { id: '00000000-0000-4000-8000-000000000010', name: 'Horizonte', rulesRevision: 0 };
const page = { data: [project], meta: { page: 1, pageSize: 20, total: 21, totalPages: 2 } };
const mount = (url = '/admin/obras') => render(<QueryClientProvider client={new QueryClient({ defaultOptions: { queries: { retry: false }, mutations: { retry: false } } })}>
  <MemoryRouter initialEntries={[url]}><ProjectsPage /></MemoryRouter>
</QueryClientProvider>);
beforeAll(() => {
  HTMLDialogElement.prototype.showModal = function () { this.setAttribute('open', ''); };
});

describe('Projects administration', () => {
  it('paginates and searches on the server, retaining URL filters after saving', async () => {
    list.mockResolvedValue(page); update.mockResolvedValue({ ...project, name: 'Horizonte II' });
    const user = userEvent.setup(); mount('/admin/obras?search=Horizonte&page=2');
    await screen.findByRole('link', { name: 'Horizonte' });
    expect(list.mock.calls[0]?.[0]).toEqual({ page: 2, search: 'Horizonte' });
    await user.click(screen.getByRole('button', { name: 'Editar Horizonte' }));
    expect(screen.getByLabelText('Nome da obra')).toHaveFocus();
    await user.tab({ shift: true }); expect(screen.getByRole('button', { name: 'Fechar painel' })).toHaveFocus();
    await user.tab({ shift: true }); expect(screen.getByRole('button', { name: 'Cancelar' })).toHaveFocus();
    await user.tab(); expect(screen.getByRole('button', { name: 'Fechar painel' })).toHaveFocus();
    await user.clear(screen.getByLabelText('Nome da obra')); await user.type(screen.getByLabelText('Nome da obra'), 'Horizonte II');
    await user.click(screen.getByRole('button', { name: 'Salvar alterações' }));
    await screen.findByText('Obra Horizonte II atualizada.');
    expect(update).toHaveBeenCalledWith(project.id, { name: 'Horizonte II' });
    expect(list.mock.lastCall?.[0]).toEqual({ page: 2, search: 'Horizonte' });
    await user.click(screen.getByRole('button', { name: 'Anterior' }));
    await waitFor(() => expect(list.mock.lastCall?.[0]).toEqual({ page: 1, search: 'Horizonte' }));
    await user.clear(screen.getByLabelText('Buscar obra')); await user.type(screen.getByLabelText('Buscar obra'), 'Outra');
    await waitFor(() => expect(list.mock.lastCall?.[0]).toEqual({ page: 1, search: 'Outra' }));
  });

  it('validates blank names, preserves input on failure and never inserts a fictitious project', async () => {
    list.mockResolvedValue({ ...page, data: [], meta: { ...page.meta, total: 0, totalPages: 0 } });
    create.mockRejectedValue(new ApiError(0, 'NETWORK_ERROR', 'Offline'));
    const user = userEvent.setup(); mount();
    await screen.findByText('Nenhuma obra cadastrada');
    const trigger = screen.getByRole('button', { name: 'Nova obra' }); await user.click(trigger);
    await user.click(screen.getByRole('button', { name: 'Cadastrar obra' }));
    expect(await screen.findByText('Informe o nome da obra.')).toBeVisible();
    expect(create).not.toHaveBeenCalled();
    await user.type(screen.getByLabelText('Nome da obra'), 'Nova obra segura');
    await user.click(screen.getByRole('button', { name: 'Cadastrar obra' }));
    expect(await screen.findByRole('alert')).toHaveTextContent('Consulte a lista');
    expect(screen.getByLabelText('Nome da obra')).toHaveValue('Nova obra segura');
    expect(screen.queryByRole('link', { name: 'Nova obra segura' })).not.toBeInTheDocument();
    await user.click(screen.getByRole('button', { name: 'Cancelar' })); expect(trigger).toHaveFocus();
  });

  it('maps server field errors and preserves the name', async () => {
    list.mockResolvedValue(page);
    create.mockRejectedValue(new ApiError(400, 'VALIDATION_ERROR', 'Revise os campos.', undefined, [{ path: 'name', code: 'INVALID_VALUE', message: 'Nome recusado pelo servidor.' }]));
    const user = userEvent.setup(); mount(); await user.click(screen.getByRole('button', { name: 'Nova obra' }));
    await user.type(screen.getByLabelText('Nome da obra'), 'Minha obra'); await user.click(screen.getByRole('button', { name: 'Cadastrar obra' }));
    expect(await screen.findByText('Nome recusado pelo servidor.')).toBeVisible();
    expect(screen.getByLabelText('Nome da obra')).toHaveValue('Minha obra');
    expect(screen.getByLabelText('Nome da obra')).toHaveFocus();
  });

  it('blocks repeated submission while waiting and confirms only persisted response', async () => {
    list.mockResolvedValue(page);
    let finish: ((value: typeof project) => void) | undefined;
    create.mockImplementation(() => new Promise<typeof project>((resolve) => { finish = resolve; }));
    const user = userEvent.setup(); mount(); await user.click(screen.getByRole('button', { name: 'Nova obra' }));
    await user.type(screen.getByLabelText('Nome da obra'), 'Digitado'); await user.dblClick(screen.getByRole('button', { name: 'Cadastrar obra' }));
    expect(create).toHaveBeenCalledOnce(); expect(screen.getByRole('button', { name: 'Salvando…' })).toBeDisabled();
    expect(within(screen.getByRole('dialog')).getByRole('button', { name: 'Cancelar' })).toBeDisabled();
    finish?.({ ...project, name: 'Nome persistido' });
    expect(await screen.findByText('Obra Nome persistido cadastrada.')).toBeVisible();
    expect(screen.queryByRole('dialog')).not.toBeInTheDocument();
  });

  it('distinguishes loading, recoverable failure, no search results and pages beyond the end', async () => {
    list.mockImplementationOnce(() => new Promise(() => undefined)); const first = mount();
    expect(screen.getByText('Carregando obras…')).toBeVisible(); first.unmount();
    list.mockRejectedValueOnce(new Error('offline')).mockResolvedValue({ ...page, data: [], meta: { ...page.meta, total: 0 } });
    const user = userEvent.setup(); const second = mount('/admin/obras?search=Inexistente');
    expect(await screen.findByRole('alert')).toHaveTextContent('Não foi possível carregar');
    await user.click(screen.getByRole('button', { name: 'Tentar novamente' })); expect(await screen.findByText('Nenhuma obra encontrada')).toBeVisible();
    second.unmount(); mount('/admin/obras?page=99'); expect(await screen.findByText('Nenhuma obra nesta página')).toBeVisible();
  });
});
