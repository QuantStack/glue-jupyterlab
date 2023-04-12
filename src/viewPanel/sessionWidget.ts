import { PromiseDelegate } from '@lumino/coreutils';
import { BoxPanel } from '@lumino/widgets';

import { Dialog, showDialog } from '@jupyterlab/apputils';
import { IRenderMimeRegistry } from '@jupyterlab/rendermime';
import { DocumentRegistry } from '@jupyterlab/docregistry';
import { INotebookTracker } from '@jupyterlab/notebook';

import { HTabPanel } from '../common/tabPanel';
import { IGlueSessionSharedModel } from '../types';
import { GlueSessionModel } from '../document/docModel';
import { mockNotebook } from '../tools';
import { TabView } from './tabView';
import { TabModel } from './tabModel';
import { LinkWidget } from '../linkPanel/linkPanel';

export class SessionWidget extends BoxPanel {
  constructor(options: SessionWidget.IOptions) {
    super({ direction: 'top-to-bottom' });
    this._model = options.model;
    this._rendermime = options.rendermime;
    this._notebookTracker = options.notebookTracker;
    this._context = options.context;
    const tabBarClassList = ['glue-Session-tabBar'];
    this._tabPanel = new HTabPanel({
      tabBarPosition: 'bottom',
      tabBarClassList,
      tabBarOption: {
        addButtonEnabled: true
      }
    });

    if (this._model) {
      this._linkWidget = new LinkWidget({ sharedModel: this._model });
      this._tabPanel.addTab(this._linkWidget, 0);
    }

    this.addWidget(this._tabPanel);
    BoxPanel.setStretch(this._tabPanel, 1);

    this._model.tabsChanged.connect(this._onTabsChanged, this);
    this._model.loadLogChanged.connect(this._startKernel, this);
  }

  get rendermime(): IRenderMimeRegistry {
    return this._rendermime;
  }

  private async _startKernel() {
    const panel = mockNotebook(this._rendermime, this._context);
    await this._context?.sessionContext.initialize();
    await this._context?.sessionContext.ready;
    // TODO: Make ipywidgets independent from a Notebook context
    // eslint-disable-next-line @typescript-eslint/ban-ts-comment
    // @ts-ignore
    this._notebookTracker.widgetAdded.emit(panel);
    const kernel = this._context?.sessionContext.session?.kernel;

    if (!kernel) {
      void showDialog({
        title: 'Error',
        body: 'Failed to start the kernel for the GLue session',
        buttons: [Dialog.cancelButton()]
      });
      return;
    }

    // TODO: dataPath is relative to the session file, so we need the kernel to be started relative to that session file!
    const dataPath = this._model.loadLog.path;

    const code = `
    import glue_jupyter as gj

    app = gj.jglue()

    data = app.load_data("${dataPath}")
    `;

    const future = kernel.requestExecute({ code }, false);
    future.onReply = msg => {
      console.log(msg);
    };
    await future.done;

    this._dataLoaded.resolve();
  }

  private _onTabsChanged(): void {
    Object.entries(this._model.tabs).forEach(
      async ([tabName, tabData], idx) => {
        const model = new TabModel({
          tabName,
          tabData,
          rendermime: this._rendermime,
          context: this._context,
          notebookTracker: this._notebookTracker,
          dataLoaded: this._dataLoaded
        });
        const tabWidget = new TabView({ model });

        this._tabPanel.addTab(tabWidget, idx + 1);
      }
    );
    this._tabPanel.activateTab(1);
  }

  private _dataLoaded: PromiseDelegate<void> = new PromiseDelegate<void>();
  private _tabPanel: HTabPanel;
  private _linkWidget: LinkWidget | undefined = undefined;
  private _model: IGlueSessionSharedModel;
  private _rendermime: IRenderMimeRegistry;
  private _context: DocumentRegistry.IContext<GlueSessionModel>;
  private _notebookTracker: INotebookTracker;
}

export namespace SessionWidget {
  export interface IOptions {
    model: IGlueSessionSharedModel;
    rendermime: IRenderMimeRegistry;
    context: DocumentRegistry.IContext<GlueSessionModel>;
    notebookTracker: INotebookTracker;
  }
}
