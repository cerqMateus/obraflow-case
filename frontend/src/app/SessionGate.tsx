import { Navigate, Outlet, useLocation } from 'react-router';
import { useSession } from '../modules/auth';
import { Button } from '../shared/components/ui/button';
export const SessionGate = () => {
  const { session, loading, error, retry } = useSession();
  const location = useLocation();
  if (loading) return <main className="grid min-h-dvh place-items-center p-6"><p role="status">Consultando sua sessão…</p></main>;
  if (error) return <main className="flex min-h-dvh flex-col items-center justify-center gap-5 p-6 text-center">
    <h1 className="text-2xl font-semibold">Não foi possível consultar sua sessão</h1>
    <p role="alert" className="max-w-md text-muted-foreground">Confira a conexão e tente novamente. Seu acesso ainda não foi confirmado.</p>
    <Button onClick={retry}>Tentar novamente</Button>
  </main>;
  if (!session && location.pathname !== '/login') return <Navigate to="/login" replace />;
  if (session && location.pathname === '/login') return <Navigate to="/pedidos" replace />;
  return <Outlet />;
};
