import { useState } from 'react';
import { Link, useSearchParams } from 'react-router';
import { Plus } from 'lucide-react';
import { useProjects } from '../../../catalogs';
import type { Project } from '../../../catalogs';
import { Button } from '../../../../shared/components/ui/button';
import { Input } from '../../../../shared/components/ui/input';
import { ProjectPanel } from '../../components/ProjectPanel';

export const ProjectsPage = () => {
  const [params, setParams] = useSearchParams();
  const rawPage = params.get('page') ?? '1';
  const page = /^[1-9]\d*$/.test(rawPage) && Number.isSafeInteger(Number(rawPage)) ? Number(rawPage) : 1;
  const search = params.get('search') ?? '';
  const query = useProjects({ page, search });
  const [panel, setPanel] = useState<Project | 'new' | null>(null);
  const [confirmation, setConfirmation] = useState('');
  const changePage = (next: number) => setParams((previous) => {
    const updated = new URLSearchParams(previous); updated.set('page', String(next)); return updated;
  });
  const saved = (project: Project) => {
    setConfirmation(panel === 'new' ? `Obra ${project.name} cadastrada.` : `Obra ${project.name} atualizada.`);
    setPanel(null);
  };
  return <section aria-labelledby="projects-title" className="mx-auto max-w-5xl">
    <header className="flex flex-wrap items-start justify-between gap-5">
      <div><h1 id="projects-title" className="text-3xl font-semibold tracking-tight">Obras</h1>
        <p className="mt-3 text-muted-foreground">Organize as obras da empresa.</p></div>
      <Button onClick={() => { setConfirmation(''); setPanel('new'); }}><Plus size={18} aria-hidden="true" />Nova obra</Button>
    </header>
    <div className="mt-8 max-w-md space-y-2">
      <label htmlFor="project-search" className="block text-sm font-semibold">Buscar obra</label>
      <Input id="project-search" type="search" maxLength={120} value={search} onChange={(event) => setParams((previous) => {
        const updated = new URLSearchParams(previous); updated.delete('page');
        if (event.target.value) updated.set('search', event.target.value); else updated.delete('search'); return updated;
      }, { replace: true })} />
    </div>
    <p role="status" className="mt-4 text-sm">{confirmation}</p>
    <div className="mt-4 border-y border-border" aria-busy={query.isFetching}>
      {query.isPending ? <p role="status" className="py-10 text-muted-foreground">Carregando obras…</p>
        : query.isError ? <div className="space-y-4 py-8"><p role="alert">Não foi possível carregar as obras.</p><Button variant="outline" onClick={() => { void query.refetch(); }}>Tentar novamente</Button></div>
          : query.data.data.length === 0 ? <div className="py-10"><h2 className="font-semibold">{search ? 'Nenhuma obra encontrada' : page > 1 ? 'Nenhuma obra nesta página' : 'Nenhuma obra cadastrada'}</h2>
            <p className="mt-2 text-sm text-muted-foreground">{search ? 'Tente outro nome ou limpe a busca.' : page > 1 ? 'Volte para uma página anterior.' : 'Cadastre a primeira obra para começar.'}</p></div>
            : <ul className="divide-y divide-border">{query.data.data.map((project) => <li key={project.id} className="flex flex-wrap items-center justify-between gap-4 py-5">
              <div className="min-w-0 flex-1"><Link to={`/admin/obras/${project.id}`} className="break-words font-semibold underline-offset-4 hover:underline">{project.name}</Link>
                <p className="mt-1 text-sm text-muted-foreground">Revisão de alçadas: {project.rulesRevision}</p></div>
              <Button variant="ghost" aria-label={`Editar ${project.name}`} onClick={() => { setConfirmation(''); setPanel(project); }}>Editar</Button>
            </li>)}</ul>}
    </div>
    {query.data && !query.isError && <nav aria-label="Paginação de obras" className="mt-5 flex flex-wrap items-center justify-between gap-3">
      <p className="text-sm text-muted-foreground">{query.data.meta.total} {query.data.meta.total === 1 ? 'obra' : 'obras'} · Página {page} de {Math.max(1, query.data.meta.totalPages)}</p>
      <div className="flex gap-2"><Button variant="outline" disabled={page <= 1 || query.isFetching} onClick={() => changePage(page - 1)}>Anterior</Button>
        <Button variant="outline" disabled={page >= query.data.meta.totalPages || query.isFetching} onClick={() => changePage(page + 1)}>Próxima</Button></div>
    </nav>}
    {panel && <ProjectPanel project={panel === 'new' ? undefined : panel} onClose={() => setPanel(null)} onSaved={saved} />}
  </section>;
};
