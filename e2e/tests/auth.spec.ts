import { expect, test } from '@playwright/test';
import type { Page } from '@playwright/test';

const login = async (page: Page, email: string): Promise<void> => {
  await page.getByLabel('E-mail', { exact: true }).fill(email);
  await page.getByLabel('Senha', { exact: true }).fill('ObraFlow-Demo-2026!');
  await page.getByRole('button', { name: 'Entrar', exact: true }).click();
  await expect(page).toHaveURL('/pedidos');
};
const openNavigation = async (page: Page): Promise<void> => {
  const toggle = page.getByRole('button', { name: 'Alternar navegação' });
  if (await toggle.isVisible() && await toggle.getAttribute('aria-expanded') === 'false') await toggle.click();
};
const noOverflow = async (page: Page): Promise<void> => {
  expect(await page.evaluate(() => document.documentElement.scrollWidth <= window.innerWidth)).toBe(true);
};

test('deep link, invalid credentials, real login, reload, logout and account switch', async ({ page, context }, info) => {
  await page.goto('/admin/obras');
  await expect(page).toHaveURL('/login');
  await expect(page.getByRole('heading', { name: 'Entre na sua conta' })).toBeVisible();
  await page.evaluate(() => document.fonts.ready);
  await noOverflow(page);
  await page.screenshot({ path: `evidence/login-${info.project.name}.png`, fullPage: true });

  // Keyboard reaches both fields, password visibility and the primary action.
  await page.keyboard.press('Tab');
  await expect(page.getByLabel('E-mail', { exact: true })).toBeFocused();
  await page.keyboard.type('admin@demo.obraflow.test');
  await page.keyboard.press('Tab');
  await expect(page.getByLabel('Senha', { exact: true })).toBeFocused();
  await page.keyboard.type('incorrect-password');
  await page.keyboard.press('Tab');
  await expect(page.getByRole('button', { name: 'Mostrar senha' })).toBeFocused();
  await page.keyboard.press('Tab');
  await page.keyboard.press('Enter');
  await expect(page.getByRole('alert')).toContainText('E-mail ou senha inválidos');

  const requestPromise = page.waitForRequest((request) => request.url().endsWith('/auth/login') && request.method() === 'POST');
  await login(page, 'admin@demo.obraflow.test');
  const request = await requestPromise;
  expect(await request.headerValue('x-csrf-token')).toBeTruthy();
  const cookie = (await context.cookies()).find((entry) => entry.name === 'obraflow.sid');
  expect(cookie).toMatchObject({ httpOnly: true, sameSite: 'Lax', path: '/' });
  await page.reload();
  await openNavigation(page);
  await expect(page.getByText('Admin (demonstração)', { exact: true })).toBeVisible();
  await expect(page.getByText('Admin', { exact: true })).toBeVisible();
  await expect(page.getByText('Obras e alçadas', { exact: true })).toBeVisible();
  await expect(page.getByRole('button', { name: 'Novo pedido' })).toHaveCount(0);
  await noOverflow(page);
  await page.screenshot({ path: `evidence/shell-admin-${info.project.name}.png`, fullPage: true });
  expect(await page.evaluate(() => ({ local: Object.keys(localStorage), session: Object.keys(sessionStorage) }))).toEqual({ local: [], session: [] });
  await page.getByRole('button', { name: 'Sair', exact: true }).click();
  await expect(page).toHaveURL('/login');
  expect((await page.request.get('/api/v1/auth/me')).status()).toBe(401);
  await login(page, 'amanda@demo.obraflow.test');
  await openNavigation(page);
  await expect(page.getByText('Amanda', { exact: true })).toBeVisible();
  await expect(page.getByText('Operador', { exact: true })).toBeVisible();
  await expect(page.getByText('Admin (demonstração)', { exact: true })).toHaveCount(0);
  await expect(page.getByText('Obras e alçadas', { exact: true })).toHaveCount(0);
  await page.goto('/admin/alcadas');
  await expect(page.getByRole('heading', { name: 'Acesso restrito' })).toBeVisible();
  await page.goto('/pedidos');
  await noOverflow(page);
  await page.screenshot({ path: `evidence/shell-operator-${info.project.name}.png`, fullPage: true });
  await openNavigation(page);
  await page.getByRole('button', { name: 'Sair', exact: true }).click();
  await expect(page).toHaveURL('/login');
});

test('a server-side session invalidation removes private content', async ({ page }) => {
  await page.goto('/login');
  await login(page, 'joao@demo.obraflow.test');
  const csrf = await page.request.get('/api/v1/auth/me');
  const body: unknown = await csrf.json();
  if (!body || typeof body !== 'object' || !('csrfToken' in body) || typeof body.csrfToken !== 'string') throw new Error('Invalid session response');
  expect((await page.request.post('/api/v1/auth/logout', { headers: { 'X-CSRF-Token': body.csrfToken, Origin: 'http://frontend' } })).status()).toBe(204);
  await page.reload();
  await expect(page).toHaveURL('/login');
  await expect(page.getByText('João', { exact: true })).toHaveCount(0);
});
