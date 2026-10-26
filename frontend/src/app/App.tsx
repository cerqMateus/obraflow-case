import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { BrowserRouter, Navigate, Route, Routes } from 'react-router';
import { LoginPage, SessionProvider } from '../modules/auth';
import { ProjectsPage, ProjectDetailPage } from '../modules/administration';
import { AdminGate } from './AdminGate';
import { AppShell } from './AppShell';
import { SessionGate } from './SessionGate';
import { UnavailablePage } from './UnavailablePage';

export const createQueryClient = (): QueryClient => new QueryClient({ defaultOptions: {
  queries: { retry: false }, mutations: { retry: false },
} });
const queryClient = createQueryClient();
export const App = () => (
  <QueryClientProvider client={queryClient}>
    <SessionProvider><BrowserRouter><Routes>
      <Route element={<SessionGate />}>
        <Route path="/login" element={<LoginPage />} />
        <Route element={<AppShell />}>
          <Route element={<AdminGate />}>
            <Route path="/admin/obras" element={<ProjectsPage />} />
            <Route path="/admin/obras/:projectId" element={<ProjectDetailPage />} />
          </Route>
          {['/pedidos', '/pedidos/novo', '/pedidos/:orderId', '/admin/alcadas'].map((path) =>
            <Route key={path} path={path} element={<UnavailablePage />} />)}
          <Route path="*" element={<Navigate to="/pedidos" replace />} />
        </Route>
      </Route>
    </Routes></BrowserRouter></SessionProvider>
  </QueryClientProvider>
);
