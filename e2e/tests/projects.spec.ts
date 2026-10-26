import { expect, test } from '@playwright/test';
import type { Page } from '@playwright/test';

const login = async (page: Page, email: string): Promise<void> => {
  await page.goto('/login');
  await page.getByLabel('E-mail', { exact: true }).fill(email);
  await page.getByLabel('Senha', { exact: true }).fill('ObraFlow-Demo-2026!');
  await page.getByRole('button', { name: 'Entrar', exact: true }).click();
  await expect(page).toHaveURL('/pedidos');
};
const token = async (page: Page): Promise<string> => {
  const body: unknown = await (await page.request.get('/api/v1/auth/me')).json();
  if (!body || typeof body !== 'object' || !('csrfToken' in body) || typeof body.csrfToken !== 'string') throw new Error('Missing CSRF token');
  return body.csrfToken;
};

test('Admin creates and edits a persisted project; operator reads without assignment and cannot manage', async ({ page }, info) => {
  await login(page, 'admin@demo.obraflow.test');
  await page.goto('/admin/obras');
  const name = `Obra E2E ${info.project.name} ${Date.now()}`;
  await page.getByRole('button', { name: 'Nova obra' }).click();
  const input = page.getByLabel('Nome da obra'); await expect(input).toBeFocused();
  await input.fill(name);
  await page.keyboard.press('Shift+Tab'); await expect(page.getByRole('button', { name: 'Fechar painel' })).toBeFocused();
  await page.keyboard.press('Shift+Tab'); await expect(page.getByRole('button', { name: 'Cancelar' })).toBeFocused();
  await page.keyboard.press('Escape'); await expect(page.getByRole('dialog')).toHaveCount(0);
  await expect(page.getByRole('button', { name: 'Nova obra' })).toBeFocused();
  await page.getByRole('button', { name: 'Nova obra' }).click(); await input.fill(name);
  await page.screenshot({ path: `evidence/project-panel-${info.project.name}.png`, fullPage: true });
  await page.getByRole('button', { name: 'Cadastrar obra' }).click();
  await expect(page.getByText(`Obra ${name} cadastrada.`, { exact: true })).toBeVisible();
  await page.getByLabel('Buscar obra').fill(name);
  await expect(page.getByRole('link', { name, exact: true })).toBeVisible();
  await page.screenshot({ path: `evidence/projects-list-${info.project.name}.png`, fullPage: true });
  await page.getByRole('link', { name, exact: true }).click();
  const detailUrl = page.url();
  await expect(page.getByText('Revisão de alçadas: 0')).toBeVisible();
  await page.getByRole('button', { name: 'Editar nome' }).click();
  await input.fill(`${name} editada`); await page.getByRole('button', { name: 'Salvar alterações' }).click();
  await expect(page.getByRole('heading', { name: `${name} editada`, exact: true })).toBeVisible();
  await page.reload(); await expect(page.getByRole('heading', { name: `${name} editada`, exact: true })).toBeVisible();
  await expect(page.getByText('Revisão de alçadas: 0')).toBeVisible();
  expect(await page.evaluate(() => document.documentElement.scrollWidth <= window.innerWidth)).toBe(true);
  await page.screenshot({ path: `evidence/project-detail-${info.project.name}.png`, fullPage: true });
  await page.request.post('/api/v1/auth/logout', { headers: { 'X-CSRF-Token': await token(page), Origin: 'http://frontend' } });
  await login(page, 'amanda@demo.obraflow.test');
  const projectId = new URL(detailUrl).pathname.split('/').at(-1);
  const detail = await page.request.get(`/api/v1/projects/${projectId}`);
  expect(detail.status()).toBe(200); expect(await detail.json()).toMatchObject({ name: `${name} editada`, rulesRevision: 0 });
  expect((await page.request.get('/api/v1/users')).status()).toBe(403);
  for (const resource of ['projects', 'users', 'suppliers']) {
    expect((await page.request.post(`/api/v1/${resource}`, { headers: { 'X-CSRF-Token': await token(page) }, data: { name: 'Denied' } })).status()).toBe(403);
  }
  expect((await page.request.patch(`/api/v1/projects/${projectId}`, { headers: { 'X-CSRF-Token': await token(page) }, data: { name: 'Denied' } })).status()).toBe(403);
  await page.goto(detailUrl); await expect(page.getByRole('heading', { name: 'Acesso restrito' })).toBeVisible();
});
