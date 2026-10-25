import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { MemoryRouter, Route, Routes } from 'react-router';
import { expect, it, vi } from 'vitest';
import { AppShell } from './AppShell';

vi.mock('../modules/auth', () => ({ useSession: () => ({
  session: { user: { name: 'Amanda', role: 'operator' } }, logout: vi.fn(), loggingOut: false, logoutError: null,
}) }));

it('moves focus to content when selecting a mobile navigation link', async () => {
  const user = userEvent.setup();
  render(<MemoryRouter initialEntries={['/pedidos']}><Routes>
    <Route element={<AppShell />}><Route path="/pedidos" element={<h1>Pedidos</h1>} /></Route>
  </Routes></MemoryRouter>);
  await user.click(screen.getByRole('button', { name: 'Alternar navegação' }));
  expect(screen.getByRole('button', { name: 'Alternar navegação' })).toHaveAttribute('aria-expanded', 'true');
  await user.click(screen.getByRole('link', { name: 'Pedidos' }));
  expect(screen.getByRole('main')).toHaveFocus();
  expect(screen.getByRole('button', { name: 'Alternar navegação' })).toHaveAttribute('aria-expanded', 'false');
});
