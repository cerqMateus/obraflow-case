import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { describe, expect, it, vi } from 'vitest';
import { LoginForm } from './LoginForm';
import { ApiError } from '../../../../shared/api-client';

const { login } = vi.hoisted(() => ({ login: vi.fn() }));
vi.mock('../../SessionProvider', () => ({ useSession: () => ({ login, retry: vi.fn() }) }));

describe('Login form', () => {
  it('validates fields, focuses the first error and supports password managers', async () => {
    const user = userEvent.setup();
    render(<LoginForm />);
    await user.click(screen.getByRole('button', { name: 'Entrar' }));
    expect(await screen.findByText('Informe um e-mail válido.')).toBeVisible();
    expect(screen.getByLabelText('E-mail')).toHaveFocus();
    expect(screen.getByLabelText('Senha')).toHaveAttribute('autocomplete', 'current-password');
    expect(login).not.toHaveBeenCalled();
    await user.click(screen.getByRole('button', { name: 'Mostrar senha' }));
    expect(screen.getByLabelText('Senha')).toHaveAttribute('type', 'text');
  });
  it('distinguishes invalid credentials and lets the user correct them', async () => {
    login.mockRejectedValueOnce(new ApiError(401, 'INVALID_CREDENTIALS', 'Inválido'));
    const user = userEvent.setup();
    render(<LoginForm />);
    await user.type(screen.getByLabelText('E-mail'), 'AMANDA@example.test');
    await user.type(screen.getByLabelText('Senha'), 'incorrect');
    await user.click(screen.getByRole('button', { name: 'Entrar' }));
    expect(await screen.findByRole('alert')).toHaveTextContent('E-mail ou senha inválidos');
    expect(login).toHaveBeenCalledWith({ email: 'amanda@example.test', password: 'incorrect' });
    expect(screen.getByLabelText('E-mail')).toHaveValue('AMANDA@example.test');
  });
  it('announces pending state and blocks a duplicate submission', async () => {
    let finish: (() => void) | undefined;
    login.mockImplementationOnce(() => new Promise<void>((resolve) => { finish = resolve; }));
    const user = userEvent.setup();
    render(<LoginForm />);
    await user.type(screen.getByLabelText('E-mail'), 'amanda@example.test');
    await user.type(screen.getByLabelText('Senha'), 'password');
    await user.dblClick(screen.getByRole('button', { name: 'Entrar' }));
    expect(screen.getByRole('button', { name: 'Entrando…' })).toBeDisabled();
    expect(login).toHaveBeenCalledOnce();
    finish?.();
  });
});
