import { expect, test } from '@playwright/test';

test('homepage renders and supports web/settings navigation', async ({ page }, testInfo) => {
  await page.goto('/');
  await expect(page.getByRole('heading', { name: 'Find anything. Anywhere.' })).toBeVisible();
  await page.screenshot({ path: testInfo.outputPath('awesearch-desktop.png'), fullPage: true });
  await page.getByRole('button', { name: 'Web', exact: true }).click();
  await expect(page.getByRole('heading', { name: 'Search the open web' })).toBeVisible();
  await page.getByRole('button', { name: 'Change provider' }).click();
  await expect(page.getByRole('heading', { name: 'Search settings' })).toBeVisible();
  await page.getByRole('button', { name: 'Close' }).click();
  await page.getByRole('button', { name: 'All', exact: true }).first().click();
  await page.locator('input[type=file]').first().setInputFiles({ name: 'awesearch-smoke.txt', mimeType: 'text/plain', buffer: Buffer.from('AWESEARCH local index smoke test content') });
  await expect(page.getByText(/Indexed 1 file/)).toBeVisible();
  await page.getByRole('textbox', { name: 'Search' }).fill('smoke test');
  await expect(page.getByRole('heading', { name: 'awesearch-smoke.txt' })).toBeVisible();
  await page.getByRole('button', { name: 'Open' }).click();
  await expect(page.getByText(/AWESEARCH local index smoke test content/)).toBeVisible();
});

test('responsive mobile layout renders without horizontal overflow', async ({ page }, testInfo) => {
  await page.setViewportSize({ width: 390, height: 844 });
  await page.goto('/');
  await expect(page.getByRole('heading', { name: 'Find anything. Anywhere.' })).toBeVisible();
  const dimensions = await page.evaluate(() => ({ scrollWidth: document.documentElement.scrollWidth, clientWidth: document.documentElement.clientWidth }));
  expect(dimensions.scrollWidth).toBeLessThanOrEqual(dimensions.clientWidth + 1);
  await page.screenshot({ path: testInfo.outputPath('awesearch-mobile.png'), fullPage: true });
});
