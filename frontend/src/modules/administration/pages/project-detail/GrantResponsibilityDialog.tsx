import { useState } from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { useUsers } from '../../../catalogs';
import { ApiError } from '../../../../shared/api-client';
import { Button } from '../../../../shared/components/ui/button';
import { Input } from '../../../../shared/components/ui/input';
import { grantSchema } from '../../responsibility-service';
import type { GrantInput } from '../../responsibility-service';
import { useGrantResponsibility } from '../../use-responsibilities';
import { ResponsibilityDialog } from './ResponsibilityDialog';

interface Props { projectId: string; projectName: string; onClose: () => void; onSaved: () => void }
export const GrantResponsibilityDialog = ({ projectId, projectName, onClose, onSaved }: Props) => {
  const [search, setSearch] = useState(''); const [page, setPage] = useState(1);
  const users = useUsers({ role: 'operator', page, search });
  const save = useGrantResponsibility(projectId);
  const { register, handleSubmit, setError, formState: { errors } } = useForm<GrantInput>({ resolver: zodResolver(grantSchema) });
  const submit = async (input: GrantInput): Promise<void> => {
    try { await save.mutateAsync(input); onSaved(); }
    catch (error) {
      if (error instanceof ApiError) {
        const field = error.fields.find((entry) => entry.path === 'operatorId');
        if (field) setError('operatorId', { message: field.message }, { shouldFocus: true });
      }
    }
  };
  return <ResponsibilityDialog title="Adicionar responsável" description={`Selecione um Operador para ${projectName}. O vínculo habilita sua participação nas regras de aprovação.`}
    pending={save.isPending} onClose={onClose}>
    <form onSubmit={handleSubmit(submit)} noValidate className="space-y-4">
      <div className="space-y-2"><label htmlFor="operator-search" className="block text-sm font-semibold">Buscar Operador</label>
        <Input id="operator-search" type="search" maxLength={120} disabled={save.isPending} value={search}
          onChange={(event) => { setSearch(event.target.value); setPage(1); }} /></div>
      <fieldset disabled={save.isPending} aria-describedby={errors.operatorId ? 'operator-error' : undefined}>
        <legend className="mb-2 text-sm font-semibold">Operador</legend>
        {users.isPending ? <p role="status">Carregando operadores…</p>
          : users.isError ? <div><p role="alert">Não foi possível carregar os operadores.</p><Button type="button" variant="outline" onClick={() => { void users.refetch(); }}>Tentar novamente</Button></div>
            : users.data.data.length === 0 ? <p>Nenhum Operador encontrado nesta página.</p>
              : <div className="divide-y divide-border">{users.data.data.map((user) => <label key={user.id} className="flex min-h-11 cursor-pointer items-center gap-3 py-3">
                <input type="radio" value={user.id} aria-invalid={Boolean(errors.operatorId)} {...register('operatorId')} className="size-4 shrink-0 accent-primary focus-visible:outline-2 focus-visible:outline-ring" />
                <span className="min-w-0 break-words text-sm"><span className="font-semibold">{user.name}</span><span className="block text-muted-foreground">{user.email}</span></span>
              </label>)}</div>}
      </fieldset>
      {errors.operatorId && <p id="operator-error" role="alert" className="text-sm text-destructive">{errors.operatorId.message}</p>}
      {users.data && !users.isError && <nav aria-label="Paginação de operadores" className="flex flex-wrap items-center gap-2">
        <span className="w-full text-sm text-muted-foreground">Página {page} de {Math.max(1, users.data.meta.totalPages)}</span>
        <Button type="button" variant="outline" disabled={page <= 1 || users.isFetching || save.isPending} onClick={() => setPage(page - 1)}>Anterior</Button>
        <Button type="button" variant="outline" disabled={page >= users.data.meta.totalPages || users.isFetching || save.isPending} onClick={() => setPage(page + 1)}>Próxima</Button>
      </nav>}
      {save.error && <p role="alert" className="text-sm text-destructive">{save.error instanceof ApiError && save.error.status > 0 ? save.error.message : 'Não foi possível confirmar a concessão. Consulte os vínculos antes de tentar novamente.'}</p>}
      <Button type="submit" disabled={save.isPending}>{save.isPending ? 'Adicionando…' : 'Adicionar responsável'}</Button>
    </form>
  </ResponsibilityDialog>;
};
