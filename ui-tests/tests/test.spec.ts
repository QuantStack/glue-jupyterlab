import { expect, test } from '@jupyterlab/galata';

/**
 * Don't load JupyterLab webpage before running the tests.
 * This is required to ensure we capture all log messages.
 */
test.use({ autoGoto: false });

test('should render session file', async ({ page }) => {
  await page.goto();

  await expect(page.getByText('session.glu')).toBeVisible();
  await page.getByText('session.glu').dblclick();

  await page.sidebar.close('left');

  // TODO Wait for spinner to not be visible once we have one
  await page.waitForSelector('.bqplot');

  expect(
    await page.screenshot()
  ).toMatchSnapshot('session-tab1.png');
});

test('should switch tab', async ({ page }) => {
  await page.goto();

  await expect(page.getByText('session.glu')).toBeVisible();
  await page.getByText('session.glu').dblclick();

  await page.sidebar.close('left');

  // TODO Wait for spinner to not be visible once we have one
  await page.waitForSelector('.bqplot');

  // Switch tab
  page
    .locator(
      '.glue-Session-tabBar > .lm-TabBar-content > .lm-TabBar-tab:nth-of-type(3)'
    )
    .click();

  await page.waitForSelector('.bqplot');

  expect(
    await page.screenshot()
  ).toMatchSnapshot('session-tab2.png');
});

test('should open link editor', async ({ page }) => {
  await page.goto();

  await expect(page.getByText('session.glu')).toBeVisible();
  await page.getByText('session.glu').dblclick();

  // TODO Wait for spinner to not be visible once we have one
  await page.waitForSelector('.bqplot');

  // Switch to link editor
  await (await page.waitForSelector('text="Link Data"')).click();

  expect(
    await page.screenshot()
  ).toMatchSnapshot('link-editor.png');
});
