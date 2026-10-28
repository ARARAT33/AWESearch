import { expect, test } from '@playwright/test';

test('homepage renders and supports web/settings navigation', async ({ page }, testInfo) => {
  await page.goto('/');
  await expect(page.getByRole('heading', { name: 'Find anything. Anywhere.' })).toBeVisible();
  await page.screenshot({ path: testInfo.outputPath('awesearch-desktop.png'), fullPage: true });
  await page.getByRole('button', { name: 'Web', exact: true }).click();
  await expect(page.getByRole('heading', { name: 'Search the open web' })).toBeVisible();
  await page.getByRole('button', { name: 'Change provider' }).click();
  await expect(page.getByRole('heading', { name: 'Search settings' })).toBeVisible();
  await page.getByRole('button', { name: 'Close', exact: true }).click();
  await page.getByRole('button', { name: 'All', exact: true }).first().click();
  await page.locator('input[type=file]').first().setInputFiles({ name: 'awesearch-smoke.txt', mimeType: 'text/plain', buffer: Buffer.from('AWESEARCH local index smoke test content') });
  await expect(page.getByText(/Indexed 1 file/)).toBeVisible();
  await page.getByRole('textbox', { name: 'Search' }).fill('smoke test');
  await expect(page.getByRole('heading', { name: 'awesearch-smoke.txt' })).toBeVisible();
  await page.getByRole('button', { name: 'Open' }).click();
  await expect(page.locator('pre.file-preview-content')).toContainText('AWESEARCH local index smoke test content');
  await page.getByRole('button', { name: 'Close', exact: true }).click();
  await page.getByRole('button', { name: 'Search settings' }).click();
  const downloadPromise = page.waitForEvent('download');
  await page.getByRole('button', { name: 'Export full index' }).last().click();
  const download = await downloadPromise;
  expect(download.suggestedFilename()).toBe('awesearch-index.json');
  await page.locator('input[accept="application/json,.json"]').setInputFiles({
    name: 'awesearch-backup.json',
    mimeType: 'application/json',
    buffer: Buffer.from(JSON.stringify({ format: 'awesearch-index', version: 1, files: [{
      id: 'restored.txt:41:1', name: 'restored.txt', path: 'restored.txt', size: 41,
      modified: 1, type: 'txt', text: 'Restored from a full searchable backup'
    }] }))
  });
  await expect(page.getByText(/Imported 1 files into the local index/)).toBeVisible();
  await page.getByRole('button', { name: 'Close', exact: true }).last().click();
  await page.getByRole('textbox', { name: 'Search' }).fill('Restored backup');
  await expect(page.getByRole('heading', { name: 'restored.txt' })).toBeVisible();
});

test('responsive mobile layout renders without horizontal overflow', async ({ page }, testInfo) => {
  await page.setViewportSize({ width: 390, height: 844 });
  await page.goto('/');
  await expect(page.getByRole('heading', { name: 'Find anything. Anywhere.' })).toBeVisible();
  const dimensions = await page.evaluate(() => ({ scrollWidth: document.documentElement.scrollWidth, clientWidth: document.documentElement.clientWidth }));
  expect(dimensions.scrollWidth).toBeLessThanOrEqual(dimensions.clientWidth + 1);
  await page.screenshot({ path: testInfo.outputPath('awesearch-mobile.png'), fullPage: true });
});
