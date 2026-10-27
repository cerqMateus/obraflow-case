import { expect } from '@playwright/test';
import type { Page } from '@playwright/test';

interface Options { projectName: string; testName: string; csrfToken: string }
export const exerciseResponsibilities = async (page: Page, { projectName, testName, csrfToken }: Options): Promise<void> => {
  const headers = { 'X-CSRF-Token': csrfToken, Origin: 'http://frontend' };
  const suffix = `${testName}-${Date.now()}`;
  // API-only fixtures create operators; there is intentionally no user registration screen.
  for (let index = 0; index < 21; index += 1) {
    const response = await page.request.post('/api/v1/users', { headers, data: {
      name: `Spec07 ${suffix} ${String(index).padStart(2, '0')}`, email: `spec07-${suffix}-${index}@e2e.test`, role: 'operator', password: 'Operator-E2E-2026!',
    } }); expect(response.status()).toBe(201);
  }
  const detailUrl = page.url();
  const trigger = page.getByRole('button', { name: 'Adicionar responsável', exact: true }); await trigger.click();
  const dialog = page.getByRole('dialog'); await expect(dialog.getByRole('button', { name: 'Cancelar' })).toBeFocused();
  await page.keyboard.press('Tab'); await expect(dialog.getByLabel('Buscar Operador')).toBeFocused();
  await dialog.getByLabel('Buscar Operador').fill(`Spec07 ${suffix}`);
  await expect(dialog.getByText('Página 1 de 2')).toBeVisible(); await dialog.getByRole('button', { name: 'Próxima' }).click();
  await dialog.getByRole('radio', { name: new RegExp(`Spec07 ${suffix} 20`) }).check();
  await page.screenshot({ path: `evidence/responsibility-grant-${testName}.png`, fullPage: true });
  await dialog.getByRole('button', { name: 'Adicionar responsável' }).click();
  await expect(page.getByText('Responsabilidade concedida.')).toBeVisible(); await expect(page.getByText('Revisão de alçadas: 1')).toBeVisible(); await expect(trigger).toBeFocused();
  const revoke = page.getByRole('button', { name: `Revogar Spec07 ${suffix} 20` }); await revoke.click();
  await expect(dialog).toContainText(`Spec07 ${suffix} 20`); await expect(dialog).toContainText(projectName);
  await page.keyboard.press('Escape'); await expect(revoke).toBeFocused(); await revoke.click();
  await page.screenshot({ path: `evidence/responsibility-revoke-${testName}.png`, fullPage: true });
  await dialog.getByRole('button', { name: 'Confirmar revogação' }).click();
  await expect(page.getByText('Responsabilidade revogada.')).toBeVisible(); await expect(page.getByText('Revisão de alçadas: 2')).toBeVisible();
  await expect(trigger).toBeFocused();
  await page.getByLabel('Situação do vínculo').selectOption('false'); await page.reload();
  await expect(page.getByText('Revogado', { exact: true })).toBeVisible();
  expect(await page.evaluate(() => document.documentElement.scrollWidth <= window.innerWidth)).toBe(true);
  await page.screenshot({ path: `evidence/responsibilities-${testName}.png`, fullPage: true });
  const projectId = new URL(detailUrl).pathname.split('/').at(-1);
  const path = `/api/v1/projects/${projectId}/responsibilities`;
  const list = await page.request.get(path); expect(list.status()).toBe(200);
  const data: unknown = await list.json();
  if (!data || typeof data !== 'object' || !('data' in data) || !Array.isArray(data.data)) throw new Error('Invalid page');
  const entry: unknown = data.data[0];
  if (!entry || typeof entry !== 'object' || !('id' in entry) || typeof entry.id !== 'string') throw new Error('Invalid responsibility');
  const repeated = await page.request.delete(`${path}/${entry.id}`, { headers });
  expect(repeated.status()).toBe(204); expect(repeated.headers()['x-rules-revision']).toBe('2');
};
