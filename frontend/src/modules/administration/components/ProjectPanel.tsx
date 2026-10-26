import { useEffect, useRef } from 'react';
import type { KeyboardEvent } from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { X } from 'lucide-react';
import { ApiError } from '../../../shared/api-client';
import { Button } from '../../../shared/components/ui/button';
import { Input } from '../../../shared/components/ui/input';
import type { Project } from '../../catalogs';
import { projectInputSchema } from '../project-service';
import type { ProjectInput } from '../project-service';
import { useSaveProject } from '../use-save-project';

interface ProjectPanelProps { project?: Project | undefined; onClose: () => void; onSaved: (project: Project) => void }

const containFocus = (event: KeyboardEvent<HTMLDialogElement>): void => {
  if (event.key !== 'Tab') return;
  const controls = event.currentTarget.querySelectorAll<HTMLElement>('button:not([disabled]), input:not([disabled])');
  const first = controls.item(0);
  const last = controls.item(controls.length - 1);
  if (event.shiftKey && document.activeElement === first) {
    event.preventDefault(); last?.focus();
  } else if (!event.shiftKey && document.activeElement === last) {
    event.preventDefault(); first?.focus();
  }
};

export const ProjectPanel = ({ project, onClose, onSaved }: ProjectPanelProps) => {
  const dialog = useRef<HTMLDialogElement>(null);
  const save = useSaveProject(project?.id);
  const { register, handleSubmit, setError, setFocus, formState: { errors, isSubmitting } } = useForm<ProjectInput>({
    resolver: zodResolver(projectInputSchema), defaultValues: { name: project?.name ?? '' },
  });
  useEffect(() => {
    const trigger = document.activeElement;
    dialog.current?.showModal();
    setFocus('name');
    return () => { if (trigger instanceof HTMLElement && trigger.isConnected) trigger.focus(); };
  }, [setFocus]);
  const submit = async (input: ProjectInput): Promise<void> => {
    try { onSaved(await save.mutateAsync(input)); }
    catch (error) {
      if (error instanceof ApiError) {
        const field = error.fields.find((entry) => entry.path === 'name');
        if (field) setError('name', { message: field.message }, { shouldFocus: true });
      }
    }
  };
  const message = save.error instanceof ApiError && save.error.status === 409
    ? 'Os dados mudaram. Confira a obra atualizada antes de salvar novamente. Seu texto foi preservado.'
    : save.error instanceof ApiError && [400, 403, 404].includes(save.error.status)
      ? save.error.message
      : 'Não foi possível confirmar a gravação. Consulte a lista antes de tentar novamente. Seu texto foi preservado.';
  return <dialog ref={dialog} aria-labelledby="project-panel-title" aria-describedby="project-panel-description"
    onKeyDown={containFocus}
    onCancel={(event) => { event.preventDefault(); if (!isSubmitting) onClose(); }}
    className="fixed inset-y-0 left-auto right-0 m-0 h-dvh max-h-dvh w-full max-w-md border-0 border-l border-border bg-background p-6 text-foreground backdrop:bg-foreground/30 sm:p-8">
    <div className="flex items-center justify-between gap-4">
      <h2 id="project-panel-title" className="text-2xl font-semibold tracking-tight">{project ? 'Editar obra' : 'Nova obra'}</h2>
      <Button variant="ghost" aria-label="Fechar painel" disabled={isSubmitting} onClick={onClose} className="px-3"><X size={20} aria-hidden="true" /></Button>
    </div>
    <p id="project-panel-description" className="mt-3 text-sm leading-6 text-muted-foreground">{project ? 'Atualize o nome. O histórico dos pedidos é preservado.' : 'Cadastre a obra para preparar seu fluxo de aprovações.'}</p>
    <form onSubmit={handleSubmit(submit)} noValidate aria-busy={isSubmitting} className="mt-8 space-y-6">
      <div className="space-y-2">
        <label htmlFor="project-name" className="block text-sm font-semibold">Nome da obra</label>
        <Input id="project-name" autoComplete="off" maxLength={120} readOnly={isSubmitting}
          aria-invalid={Boolean(errors.name)} aria-describedby={errors.name ? 'project-name-error' : undefined} {...register('name')} />
        {errors.name && <p id="project-name-error" className="text-sm text-destructive">{errors.name.message}</p>}
      </div>
      {save.error && <p role="alert" className="text-sm leading-6 text-destructive">{message}</p>}
      <div className="flex flex-wrap gap-3">
        <Button type="submit" disabled={isSubmitting}>{isSubmitting ? 'Salvando…' : project ? 'Salvar alterações' : 'Cadastrar obra'}</Button>
        <Button type="button" variant="outline" disabled={isSubmitting} onClick={onClose}>Cancelar</Button>
      </div>
    </form>
  </dialog>;
};
