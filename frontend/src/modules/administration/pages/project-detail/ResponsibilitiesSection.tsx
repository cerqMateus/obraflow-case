import { useState } from 'react';
import { useSearchParams } from 'react-router';
import { Button } from '../../../../shared/components/ui/button';
import type { Responsibility } from '../../responsibility-service';
import { useResponsibilities } from '../../use-responsibilities';
import { GrantResponsibilityDialog } from './GrantResponsibilityDialog';
import { RevokeResponsibilityDialog } from './RevokeResponsibilityDialog';

interface Props { projectId: string; projectName: string }
const formatInstant = (value: string) => new Intl.DateTimeFormat('pt-BR', { dateStyle: 'short', timeStyle: 'short' }).format(new Date(value));
export const ResponsibilitiesSection = ({ projectId, projectName }: Props) => {
  const [params, setParams] = useSearchParams();
  const rawPage = params.get('responsibilityPage') ?? '1';
  const page = /^[1-9]\d*$/.test(rawPage) && Number.isSafeInteger(Number(rawPage)) ? Number(rawPage) : 1;
  const active = params.get('active') === 'true' ? true : params.get('active') === 'false' ? false : undefined;
  const query = useResponsibilities(projectId, { page, ...(active === undefined ? {} : { active }) });
  const [dialog, setDialog] = useState<'grant' | Responsibility | null>(null);
  const [message, setMessage] = useState('');
  const change = (key: string, value: string) => setParams((previous) => {
    const next = new URLSearchParams(previous); next.set(key, value);
    if (key === 'active') next.delete('responsibilityPage'); return next;
  });
  return <section aria-labelledby="responsibilities-title" className="mt-8 border-t border-border pt-6">
    <header className="flex flex-wrap items-center justify-between gap-4"><h2 id="responsibilities-title" className="text-xl font-semibold">Responsáveis por esta obra</h2>
      <Button data-responsibility-add onClick={() => { setMessage(''); setDialog('grant'); }}>Adicionar responsável</Button></header>
    <p className="mt-3 max-w-2xl text-sm leading-6 text-muted-foreground">O vínculo permite participar das alçadas. Cada Operador acessa apenas pedidos próprios ou de cuja cadeia participa.</p>
    <div className="mt-5 flex flex-wrap items-center gap-3"><label htmlFor="responsibility-status" className="text-sm font-semibold">Situação do vínculo</label>
      <select id="responsibility-status" value={active === undefined ? '' : String(active)} onChange={(event) => change('active', event.target.value)}
        className="min-h-11 max-w-full rounded-lg border border-input bg-background px-3 text-sm focus-visible:outline-2 focus-visible:outline-ring">
        <option value="">Todos</option><option value="true">Ativos</option><option value="false">Revogados</option>
      </select></div>
    <p role="status" className="mt-4 text-sm">{message}</p>
    <div aria-busy={query.isFetching} className="mt-3 border-y border-border">
      {query.isPending ? <p role="status" className="py-8">Carregando responsáveis…</p>
        : query.isError ? <div className="space-y-3 py-6"><p role="alert">Não foi possível consultar os vínculos.</p><Button variant="outline" onClick={() => { void query.refetch(); }}>Tentar novamente</Button></div>
          : query.data.data.length === 0 ? <p className="py-8 text-muted-foreground">Nenhum vínculo encontrado nesta página. Ajuste o filtro ou adicione um responsável.</p>
            : <ul className="divide-y divide-border">{query.data.data.map((entry) => <li key={entry.id} className="flex flex-wrap items-start justify-between gap-4 py-5">
              <div className="min-w-0 flex-1 break-words"><p className="font-semibold">{entry.operator.name}</p><p className="mt-1 text-sm">{entry.active ? 'Ativo' : 'Revogado'}</p>
                <p className="mt-2 text-xs leading-5 text-muted-foreground">Concedido por {entry.grantedBy.name} em {formatInstant(entry.grantedAt)}</p>
                {entry.revokedAt && <p className="text-xs leading-5 text-muted-foreground">Revogado por {entry.revokedBy?.name} em {formatInstant(entry.revokedAt)}</p>}</div>
              {entry.active && <Button variant="outline" aria-label={`Revogar ${entry.operator.name}`} onClick={() => { setMessage(''); setDialog(entry); }}>Revogar</Button>}
            </li>)}</ul>}
    </div>
    <p className="mt-2 text-xs text-muted-foreground">Horários em {Intl.DateTimeFormat().resolvedOptions().timeZone}.</p>
    {query.data && !query.isError && <nav aria-label="Paginação de vínculos" className="mt-4 flex flex-wrap items-center justify-between gap-3">
      <p className="text-sm text-muted-foreground">{query.data.meta.total} vínculo(s) · Página {page} de {Math.max(1, query.data.meta.totalPages)}</p>
      <div className="flex gap-2"><Button variant="outline" disabled={page <= 1 || query.isFetching} onClick={() => change('responsibilityPage', String(page - 1))}>Anterior</Button>
        <Button variant="outline" disabled={page >= query.data.meta.totalPages || query.isFetching} onClick={() => change('responsibilityPage', String(page + 1))}>Próxima</Button></div>
    </nav>}
    {dialog === 'grant' && <GrantResponsibilityDialog projectId={projectId} projectName={projectName} onClose={() => setDialog(null)} onSaved={() => { setDialog(null); setMessage('Responsabilidade concedida.'); }} />}
    {dialog && dialog !== 'grant' && <RevokeResponsibilityDialog responsibility={dialog} projectName={projectName} onClose={() => setDialog(null)} onSaved={() => { setDialog(null); setMessage('Responsabilidade revogada.'); }} />}
  </section>;
};
