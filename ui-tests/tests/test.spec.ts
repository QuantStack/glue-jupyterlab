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

test('should open the control panel on widget clicking', async ({ page }) => {
  await page.goto();

  await expect(page.getByText('session.glu')).toBeVisible();
  await page.getByText('session.glu').dblclick();
  await page.waitForSelector('.bqplot');
  await page.getByText('Histogram Viewer').click();
  await page.getByText('TAB 1 - HISTOGRAMVIEWER');

  expect(await page.screenshot()).toMatchSnapshot('control-panel.png');
});

test('should hide the control panel on tab switching', async ({ page }) => {
  await page.goto();

  await expect(page.getByText('session.glu')).toBeVisible();
  await page.getByText('session.glu').dblclick();
  await page.waitForSelector('.bqplot');
  await page.getByText('Histogram Viewer').click();
  await page.getByText('TAB 1 - HISTOGRAMVIEWER');

  // Switch tab
  await page.getByRole('tab', { name: 'Tab 2' }).click();
  await page.waitForSelector('li#tab-key-2-6.lm-TabBar-tab.lm-mod-current');
  expect(await page.screenshot()).toMatchSnapshot(
    'control-panel-switch-tab.png'
  );
});

test('should add new dataset and create a viewer', async ({ page }) => {
  await page.goto();

  await expect(page.getByText('session.glu')).toBeVisible();
  await page.getByText('session.glu').dblclick();
  await page.waitForSelector('.bqplot');

  // Open the "Add Data" dialog
  await page.getByText('Add Data').click();

  await (
    await page.waitForSelector('text="Load Data Files Into Glue Session"')
  ).click();
  expect(await page.screenshot()).toMatchSnapshot('add-data-file-browser.png');

  // Select new dataset in the dialog
  let dialog = await page.waitForSelector('div.jp-Dialog-content');

  await (await dialog.waitForSelector('text="w6_psc.vot"')).click();
  await (await dialog.waitForSelector('text="Select"')).click();

  // Wait for data to be loaded
  await page.waitForSelector('#w6_psc');
  const w6Psc = page.locator('#w6_psc');

  // expect(await page.screenshot()).toMatchSnapshot('add-data-data-added.png');

  // Create a new tab
  await (
    await page.waitForSelector('.glue-Session-tabBar .lm-TabBar-addButton')
  ).click();

  // Drag and drop the dataset into the view to create a viewer
  await page.waitForSelector('.glue-Session-gridhost:visible');
  const view = page.locator('.glue-Session-gridhost:visible');
  const viewBoundingBox = await view.boundingBox();

  if (viewBoundingBox === null) {
    throw 'Not view bounding box';
  }

  w6Psc.dragTo(view, {
    targetPosition: {
      x: viewBoundingBox.x + viewBoundingBox.width / 2,
      y: viewBoundingBox.y + viewBoundingBox.height / 2
    }
  });

  dialog = await page.waitForSelector('div.jp-Dialog-content');

  expect(await page.screenshot()).toMatchSnapshot(
    'add-data-viewer-selection.png'
  );

  // Confirm creating an Histogram
  await (await dialog.waitForSelector('text="Ok"')).click();
  await (
    await page.waitForSelector('.glue-Session-gridhost:visible')
  ).waitForSelector('.bqplot');

  expect(await page.screenshot()).toMatchSnapshot(
    'add-data-viewer-created.png'
  );
});
