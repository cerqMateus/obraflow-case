import { useEffect, useRef } from 'react';
import type { KeyboardEvent, ReactNode } from 'react';
import { Button } from '../../../../shared/components/ui/button';

interface Props { title: string; description: string; pending: boolean; onClose: () => void; children: ReactNode }
const containFocus = (event: KeyboardEvent<HTMLDialogElement>): void => {
  if (event.key !== 'Tab') return;
  const controls = event.currentTarget.querySelectorAll<HTMLElement>('button:not(:disabled), input:not(:disabled), select:not(:disabled), [tabindex="0"]');
  const first = controls.item(0); const last = controls.item(controls.length - 1);
  if (event.shiftKey && document.activeElement === first) { event.preventDefault(); last?.focus(); }
  else if (!event.shiftKey && document.activeElement === last) { event.preventDefault(); first?.focus(); }
};
export const ResponsibilityDialog = ({ title, description, pending, onClose, children }: Props) => {
  const ref = useRef<HTMLDialogElement>(null);
  useEffect(() => {
    const trigger = document.activeElement;
    ref.current?.showModal();
    ref.current?.querySelector<HTMLElement>('[data-initial-focus]')?.focus();
    return () => {
      if (trigger instanceof HTMLElement && trigger.isConnected) trigger.focus();
      else document.querySelector<HTMLElement>('[data-responsibility-add]')?.focus();
    };
  }, []);
  return <dialog ref={ref} aria-labelledby="responsibility-dialog-title" aria-describedby="responsibility-dialog-description"
    onKeyDown={containFocus} onCancel={(event) => { event.preventDefault(); if (!pending) onClose(); }}
    className="fixed inset-0 m-auto max-h-[90dvh] w-[calc(100%-2rem)] max-w-xl overflow-y-auto rounded-lg border border-border bg-background p-5 text-foreground backdrop:bg-foreground/30 sm:p-8">
    <h2 id="responsibility-dialog-title" className="text-2xl font-semibold tracking-tight">{title}</h2>
    <p id="responsibility-dialog-description" className="mt-3 break-words text-sm leading-6 text-muted-foreground">{description}</p>
    <div className="mt-6" aria-busy={pending}>{children}</div>
    <Button data-initial-focus variant="outline" disabled={pending} onClick={onClose} className="mt-5">Cancelar</Button>
  </dialog>;
};
