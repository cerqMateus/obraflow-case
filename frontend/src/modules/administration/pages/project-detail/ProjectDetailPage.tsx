import { useState } from 'react';
import { Link, useParams } from 'react-router';
import { useProject } from '../../../catalogs';
import { Button } from '../../../../shared/components/ui/button';
import { ApiError } from '../../../../shared/api-client';
import { ProjectPanel } from '../../components/ProjectPanel';
import { ResponsibilitiesSection } from './ResponsibilitiesSection';

export const ProjectDetailPage = () => {
  const { projectId = '' } = useParams();
  const query = useProject(projectId);
  const [editing, setEditing] = useState(false);
  const [confirmation, setConfirmation] = useState('');
  return <section className="mx-auto max-w-5xl">
    <Link to="/admin/obras" className="inline-flex min-h-11 items-center text-sm underline underline-offset-4">Voltar para obras</Link>
    {query.isPending ? <p role="status" className="mt-8">Carregando obra…</p>
      : query.isError ? <div className="mt-8 space-y-4"><h1 className="text-3xl font-semibold">{query.error instanceof ApiError && query.error.status === 404 ? 'Obra não encontrada' : 'Não foi possível consultar a obra'}</h1>
        <Button variant="outline" onClick={() => { void query.refetch(); }}>Tentar novamente</Button></div>
        : <><header className="mt-6 flex flex-wrap items-start justify-between gap-5">
          <div className="min-w-0"><h1 className="break-words text-3xl font-semibold tracking-tight">{query.data.name}</h1>
            <p className="mt-3 text-sm text-muted-foreground">Revisão de alçadas: {query.data.rulesRevision}</p></div>
          <Button variant="outline" onClick={() => { setConfirmation(''); setEditing(true); }}>Editar nome</Button>
        </header>
        <p role="status" className="mt-5 text-sm">{confirmation}</p>
        <ResponsibilitiesSection key={projectId} projectId={projectId} projectName={query.data.name} />
        {editing && <ProjectPanel project={query.data} onClose={() => setEditing(false)} onSaved={() => { setEditing(false); setConfirmation('Nome da obra atualizado.'); }} />}
      </>}
  </section>;
};
