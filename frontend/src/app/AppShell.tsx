import { useState } from 'react';
import { NavLink, Outlet } from 'react-router';
import { LogOut, Menu, ClipboardList } from 'lucide-react';
import { useSession } from '../modules/auth';
import { Button } from '../shared/components/ui/button';
export const AppShell = () => {
  const { session, logout, loggingOut, logoutError } = useSession();
  const [expanded, setExpanded] = useState(false);
  if (!session) return null;
  return <div className="min-h-dvh md:grid md:grid-cols-[14rem_1fr]">
    <a href="#main-content" className="sr-only rounded-md bg-background p-3 focus:not-sr-only focus:fixed focus:left-4 focus:top-4 focus:z-50">Pular para o conteúdo</a>
    <aside className="flex min-w-0 flex-col border-b border-border bg-background p-4 md:min-h-dvh md:border-b-0 md:border-r md:p-6">
      <div className="flex items-center justify-between gap-3">
        <p className="text-2xl font-semibold tracking-tight">ObraFlow<span className="text-primary">.</span></p>
        <Button variant="ghost" className="px-3 md:hidden" aria-label="Alternar navegação" aria-expanded={expanded}
          aria-controls="navigation" onClick={() => setExpanded(!expanded)}><Menu size={20} aria-hidden="true" /></Button>
      </div>
      <div id="navigation" className={`${expanded ? 'flex' : 'hidden'} min-w-0 flex-1 flex-col md:flex`}>
        <p className="mt-2 text-xs text-muted-foreground">Dokimos · Aprovações</p>
        <nav aria-label="Principal" className="mt-10 space-y-4">
          <NavLink to="/pedidos" onClick={() => {
            setExpanded(false);
            document.getElementById('main-content')?.focus();
          }} className={({ isActive }) => `flex min-h-11 items-center gap-3 rounded-lg px-3 text-sm font-semibold ${isActive ? 'bg-muted' : 'hover:bg-muted'}`}>
            <ClipboardList size={18} aria-hidden="true" /> Pedidos
          </NavLink>
          {session.user.role === 'admin' && <NavLink to="/admin/obras" onClick={() => {
            setExpanded(false); document.getElementById('main-content')?.focus();
          }} className={({ isActive }) => `flex min-h-11 items-center rounded-lg px-3 text-sm font-semibold ${isActive ? 'bg-muted' : 'hover:bg-muted'}`}>Obras</NavLink>}
        </nav>
        <div className="mt-auto pt-10">
          <p className="break-words text-sm font-semibold">{session.user.name}</p>
          <p className="mt-1 text-sm text-muted-foreground">{session.user.role === 'admin' ? 'Admin' : 'Operador'}</p>
          <Button variant="ghost" disabled={loggingOut} onClick={() => { void logout().catch(() => undefined); }} className="mt-4 px-0">
            <LogOut size={16} aria-hidden="true" />{loggingOut ? 'Saindo…' : 'Sair'}
          </Button>
          {logoutError && <p role="alert" className="mt-3 text-sm leading-6 text-destructive">Não foi possível confirmar a saída. Tente sair novamente ou recarregue para consultar a sessão.</p>}
        </div>
      </div>
    </aside>
    <main id="main-content" tabIndex={-1} className="min-w-0 px-4 py-8 outline-none sm:p-8 lg:p-12"><Outlet /></main>
  </div>;
};
