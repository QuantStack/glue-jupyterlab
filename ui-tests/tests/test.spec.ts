import { IJupyterLabPageFixture, expect, test } from '@jupyterlab/galata';
import { Locator } from '@playwright/test';

async function closeSideTab(page: IJupyterLabPageFixture): Promise<void> {
  await page
    .getByRole('tablist', { name: 'main sidebar' })
    .getByRole('tab', { name: 'glue-jupyterlab' })
    .click();
}

async function openSession(
  page: IJupyterLabPageFixture,
  session: string,
  waitUntilReady = true
): Promise<void> {
  await expect(page.getByText(`${session}.glu`)).toBeVisible();
  await page.getByText(`${session}.glu`).dblclick();
  if (waitUntilReady) {
    // TODO Wait for spinner to not be visible once we have one
    await page.waitForSelector('.bqplot');
  }
}

async function createLink(
  page: IJupyterLabPageFixture,
  datasets: [string, string],
  attributes: [string, string]
): Promise<void> {
  // Switch to link editor
  await (await page.waitForSelector('text="Link Data"')).click();

  await page.click(
    `.glue-LinkEditor-linkingDatasetsPanel:first-child > div:text('${datasets[0]}')`
  );
  await page.click(
    `.glue-LinkEditor-linkingDatasetsPanel:last-child > div:text('${datasets[1]}')`
  );

  let attr = page.locator(
    `.firstAttributePanel > div:text('${attributes[0]}')`
  );
  if (!(await attr.getAttribute('class'))?.includes('selected')) {
    await page.click(`.firstAttributePanel > div:text('${attributes[0]}')`);
  }
  attr = page.locator(`.secondAttributePanel > div:text('${attributes[1]}')`);
  if (!(await attr.getAttribute('class'))?.includes('selected')) {
    await page.click(`.secondAttributePanel > div:text('${attributes[1]}')`);
  }

  await page.click('.glue-LinkEditor-linkingGlueButton');
}

async function selectPlotRange(
  page: IJupyterLabPageFixture,
  viewer: Locator
): Promise<void> {
  await viewer.locator('button[value="bqplot:xrange"]').click();

  await page.waitForSelector('g.selector.brushintsel');

  const figureBox = await viewer.locator('.bqplot.figure').boundingBox();
  await page.mouse.move(
    figureBox!.x + figureBox!.width / 3,
    figureBox!.y + figureBox!.height / 3
  );
  await page.mouse.down();
  await page.mouse.move(
    figureBox!.x + figureBox!.width / 2,
    figureBox!.y + figureBox!.height / 2
  );
  await page.mouse.up();
  await expect(viewer.locator('.glue__subset-select')).toContainText(
    ' Subset 1 '
  );
}

/**
 * Don't load JupyterLab webpage before running the tests.
 * This is required to ensure we capture all log messages.
 */
test.use({
  autoGoto: false,
  mockSettings: {
    '@jupyterlab/apputils-extension:notification': {
      fetchNews: 'false'
    }
  }
});

test('should render session file', async ({ page }) => {
  await page.goto();

  await openSession(page, 'session');

  await closeSideTab(page);

  expect(await page.screenshot()).toMatchSnapshot('session-tab1.png');
});

test('should switch tab', async ({ page }) => {
  await page.goto();

  await openSession(page, 'session');

  await closeSideTab(page);

  // Switch tab
  await page.getByRole('tab', { name: 'Tab 2' }).click();

  await page.waitForSelector('li#tab-key-2-6.lm-TabBar-tab.lm-mod-current');

  expect(await page.screenshot()).toMatchSnapshot('session-tab2.png');
});

test('should open link editor', async ({ page }) => {
  await page.goto();

  await openSession(page, 'session');

  // Switch to link editor
  await (await page.waitForSelector('text="Link Data"')).click();

  expect(await page.screenshot()).toMatchSnapshot('link-editor.png');
});

test('should open the control panel on widget clicking', async ({ page }) => {
  await page.goto();

  await openSession(page, 'session');
  await page.getByText('Histogram Viewer').click();
  page.getByText('TAB 1 - HISTOGRAMVIEWER');

  expect(await page.screenshot()).toMatchSnapshot('control-panel.png');
});

test('should hide the control panel on tab switching', async ({ page }) => {
  await page.goto();

  await openSession(page, 'session');
  await page.getByText('Histogram Viewer').click();
  await page.getByText('TAB 1 - HISTOGRAMVIEWER');

  // Switch tab
  await page.getByRole('tab', { name: 'Tab 2' }).click();
  await page.waitForSelector('li#tab-key-2-6.lm-TabBar-tab.lm-mod-current');
  expect(await page.screenshot()).toMatchSnapshot(
    'control-panel-switch-tab.png'
  );
});

test('should add and delete link', async ({ page }) => {
  await page.goto();

  await openSession(page, 'session');

  let linkCreated = false;
  await createLink(
    page,
    ['w5', 'w5_psc'],
    ['Pixel Axis 1 [x]', 'Pixel Axis 0 [x]']
  );

  const summaries = page.locator('.glue-LinkEditor-summaryIdentity');
  const summariesCount = await summaries.count();

  expect(summariesCount).toBe(3);

  for (let i = 0; i < summariesCount; i++) {
    if (
      (await summaries.nth(i).innerText()) ===
      'Pixel Axis 1 [x]\nPixel Axis 0 [x]'
    ) {
      linkCreated = true;
      break;
    }
  }

  expect(linkCreated).toBeTruthy();

  // Remove the last link
  await page.click('.glue-LinkEditor-deleteButton:last-child');
  expect(await summaries.count()).toBe(2);
});

test('should add new dataset and create a viewer', async ({ page }) => {
  await page.goto();

  await openSession(page, 'session');

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

test('should display linked data', async ({ page }) => {
  await page.goto();

  await openSession(page, 'session3');

  // Create a link between the ID of datasets
  await createLink(page, ['w5_psc', 'w6_psc'], ['ID', 'ID']);

  await page.getByRole('tab', { name: 'Tab 1' }).click();
  const viewers = page.locator('.glue-item');

  // force the size of histograms for snapshot comparison
  viewers
    .first()
    .locator('.bqplot.figure > svg.svg-figure > g > rect')
    .evaluate(element => {
      element.style.width = '571px';
      element.style.height = '410px';
    });

  viewers
    .last()
    .locator('.bqplot.figure > svg.svg-figure > g > rect')
    .evaluate(element => {
      element.style.width = '571px';
      element.style.height = '410px';
    });

  // select a range.
  await selectPlotRange(page, viewers.first());

  // expect the selected area and the linked one to match.
  expect(
    await viewers
      .first()
      .locator('.bqplot.figure > svg.svg-figure > g > rect')
      .screenshot()
  ).toMatchSnapshot('histogram-selection.png');

  expect(
    await viewers
      .last()
      .locator('.bqplot.figure > svg.svg-figure > g > rect')
      .screenshot()
  ).toMatchSnapshot('histogram-linked-selection.png');
});

test('should delete and restore links', async ({ page }) => {
  await page.goto();

  await openSession(page, 'session3');

  // remove the existing links
  await (await page.waitForSelector('text="Link Data"')).click();
  const deleteButton = page.locator('.glue-LinkEditor-deleteButton');
  while (await deleteButton.count()) {
    await deleteButton.first().click();
  }

  // select attributes in viewers
  await page.getByRole('tab', { name: 'Tab 1' }).click();
  const viewers = page.locator('.glue-item');

  // force the size of histograms for snapshot comparison
  viewers
    .first()
    .locator('.bqplot.figure > svg.svg-figure > g > rect')
    .evaluate(element => {
      element.style.width = '571px';
      element.style.height = '410px';
    });

  viewers
    .last()
    .locator('.bqplot.figure > svg.svg-figure > g > rect')
    .evaluate(element => {
      element.style.width = '571px';
      element.style.height = '410px';
    });

  // select a range.
  await selectPlotRange(page, viewers.first());

  // expect the selected area and the linked one to match
  expect(
    await viewers
      .first()
      .locator('.bqplot.figure > svg.svg-figure > g > rect')
      .screenshot()
  ).toMatchSnapshot('histogram-selection.png');

  expect(
    await viewers
      .last()
      .locator('.bqplot.figure > svg.svg-figure > g > rect')
      .screenshot()
  ).toMatchSnapshot('histogram-no-selection.png');

  await createLink(page, ['w5_psc', 'w6_psc'], ['ID', 'ID']);
  await page.getByRole('tab', { name: 'Tab 1' }).click();
  expect(
    await viewers
      .last()
      .locator('.bqplot.figure > svg.svg-figure > g > rect')
      .screenshot()
  ).toMatchSnapshot('histogram-linked-selection.png');
});
