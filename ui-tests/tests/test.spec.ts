import { IJupyterLabPageFixture, expect, test } from '@jupyterlab/galata';

async function closeSideTab(page: IJupyterLabPageFixture): Promise<void> {
  await page
    .getByRole('tablist', { name: 'main sidebar' })
    .getByRole('tab', { name: 'gluepyter' })
    .click();
}

/**
 * Don't load JupyterLab webpage before running the tests.
 * This is required to ensure we capture all log messages.
 */
test.use({ autoGoto: false });

test('should render session file', async ({ page }) => {
  await page.goto();

  await expect(page.getByText('session.glu')).toBeVisible();
  await page.getByText('session.glu').dblclick();

  await closeSideTab(page);

  // TODO Wait for spinner to not be visible once we have one
  await page.waitForSelector('.bqplot');

  expect(await page.screenshot()).toMatchSnapshot('session-tab1.png');
});

test('should switch tab', async ({ page }) => {
  await page.goto();

  await expect(page.getByText('session.glu')).toBeVisible();
  await page.getByText('session.glu').dblclick();

  await closeSideTab(page);

  // TODO Wait for spinner to not be visible once we have one
  await page.waitForSelector('.bqplot');

  // Switch tab
  await page.getByRole('tab', { name: 'Tab 2' }).click();

  await page.waitForSelector('li#tab-key-2-6.lm-TabBar-tab.lm-mod-current');

  expect(await page.screenshot()).toMatchSnapshot('session-tab2.png');
});

test('should open link editor', async ({ page }) => {
  await page.goto();

  await expect(page.getByText('session.glu')).toBeVisible();
  await page.getByText('session.glu').dblclick();

  // TODO Wait for spinner to not be visible once we have one
  await page.waitForSelector('.bqplot');

  // Switch to link editor
  await (await page.waitForSelector('text="Link Data"')).click();

  expect(await page.screenshot()).toMatchSnapshot('link-editor.png');
});
