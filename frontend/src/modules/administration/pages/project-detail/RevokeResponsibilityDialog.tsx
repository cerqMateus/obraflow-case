import { ApiError } from '../../../../shared/api-client';
import { Button } from '../../../../shared/components/ui/button';
import { usageSchema } from '../../responsibility-service';
import type { Responsibility } from '../../responsibility-service';
import { useRevokeResponsibility } from '../../use-responsibilities';
import { ResponsibilityDialog } from './ResponsibilityDialog';

interface Props { responsibility: Responsibility; projectName: string; onClose: () => void; onSaved: () => void }
export const RevokeResponsibilityDialog = ({ responsibility, projectName, onClose, onSaved }: Props) => {
  const revoke = useRevokeResponsibility(responsibility.projectId);
  const usage = revoke.error instanceof ApiError && revoke.error.code === 'RESPONSIBILITY_IN_USE'
    ? usageSchema.safeParse(revoke.error.details) : null;
  return <ResponsibilityDialog title="Revogar responsabilidade" description={`Revogar o vínculo de ${responsibility.operator.name} com ${projectName}? O histórico será preservado.`}
    pending={revoke.isPending} onClose={onClose}>
    {revoke.error && <div role="alert" className="space-y-3 text-sm">
      <p className="text-destructive">{revoke.error instanceof ApiError && revoke.error.status > 0 ? revoke.error.message : 'Não foi possível confirmar a revogação. Consulte os vínculos antes de tentar novamente.'}</p>
      {usage?.success && <><p>{usage.data.ruleCount} faixa(s) e {usage.data.pendingOrderCount} pedido(s) pendente(s) impedem a revogação.</p>
        {usage.data.ruleIds.length > 0 && <p className="break-all">IDs das faixas: {usage.data.ruleIds.join(', ')}</p>}
        {usage.data.orderIds.length > 0 && <p className="break-all">IDs dos pedidos: {usage.data.orderIds.join(', ')}</p>}
        {usage.data.truncated && <p>Exibindo até 10 IDs por grupo. As contagens incluem todos os impedimentos.</p>}
        <p>Remova o vínculo das regras e conclua as etapas em andamento antes de revogar.</p></>}
    </div>}
    <Button className="mt-4" disabled={revoke.isPending} onClick={() => revoke.mutate(responsibility.id, { onSuccess: onSaved })}>
      {revoke.isPending ? 'Revogando…' : 'Confirmar revogação'}</Button>
  </ResponsibilityDialog>;
};
