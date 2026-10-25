import { Link, useLocation } from 'react-router';
import { useSession } from '../modules/auth';
export const UnavailablePage = () => {
  const { pathname } = useLocation();
  const { session } = useSession();
  const forbidden = (pathname.startsWith('/admin') && session?.user.role !== 'admin') ||
    (pathname === '/pedidos/novo' && session?.user.role !== 'operator');
  return <>
    <h1 className="text-3xl font-semibold tracking-tight">{forbidden ? 'Acesso restrito' : pathname === '/pedidos' ? 'Pedidos' : 'Página indisponível'}</h1>
    <div className="mt-10 max-w-xl border-t border-border pt-8">
      <h2 className="text-lg font-semibold">{forbidden ? 'Esta área não está disponível para seu perfil' : 'Esta área está em implementação'}</h2>
      <p className="mt-3 text-base leading-7 text-muted-foreground">{forbidden
        ? 'Você pode continuar na área de pedidos.'
        : 'Seu acesso foi confirmado. A consulta e as ações de pedidos serão disponibilizadas em uma próxima etapa.'}</p>
      {pathname !== '/pedidos' && <Link to="/pedidos" className="mt-6 inline-flex min-h-11 items-center text-sm font-semibold underline underline-offset-4">Voltar para pedidos</Link>}
    </div>
  </>;
};
