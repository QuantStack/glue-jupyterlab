import { PromiseDelegate } from '@lumino/coreutils';
import { TabBar, BoxPanel, Widget } from '@lumino/widgets';

import { Dialog, InputDialog, showDialog } from '@jupyterlab/apputils';
import { IRenderMimeRegistry } from '@jupyterlab/rendermime';
import { DocumentRegistry } from '@jupyterlab/docregistry';
import { INotebookTracker } from '@jupyterlab/notebook';

import { HTabPanel } from '../common/tabPanel';
import { DATASET_MIME, IDict, IGlueSessionSharedModel, ILoadLog } from '../types';
import { GlueSessionModel } from '../document/docModel';
import { mockNotebook } from '../tools';
import { TabView } from './tabView';
import { LinkEditor } from '../linkPanel/linkEditor';
import { PathExt } from '@jupyterlab/coreutils';
import { Message } from '@lumino/messaging';
import { CommandRegistry } from '@lumino/commands';
import { CommandIDs } from '../commands';

export class SessionWidget extends BoxPanel {
  constructor(options: SessionWidget.IOptions) {
    super({ direction: 'top-to-bottom' });
    this.addClass('grid-panel');

    this._model = options.model;
    this._rendermime = options.rendermime;
    this._notebookTracker = options.notebookTracker;
    this._context = options.context;
    this._commands = options.commands;

    const tabBarClassList = ['glue-Session-tabBar'];
    this._tabPanel = new HTabPanel({
      tabBarPosition: 'bottom',
      tabBarClassList,
      tabBarOption: {
        addButtonEnabled: true
      }
    });

    if (this._model) {
      this._linkWidget = new LinkEditor({ sharedModel: this._model });
      this._tabPanel.addTab(this._linkWidget, 0);
    }

    this.addWidget(this._tabPanel);
    BoxPanel.setStretch(this._tabPanel, 1);

    this._model.tabsChanged.connect(this._onTabsChanged, this);

    this._tabPanel.topBar.currentChanged.connect(
      this._onFocusedTabChanged,
      this
    );

    this._startKernel();
  }

  get rendermime(): IRenderMimeRegistry {
    return this._rendermime;
  }

  protected onAfterAttach(msg: Message): void {
    super.onAfterAttach(msg);

    this.node.addEventListener('dragover', this._ondragover.bind(this));
    this.node.addEventListener('drop', this._ondrop.bind(this));
  }

  protected onBeforeDetach(msg: Message): void {
    this.node.removeEventListener('dragover', this._ondragover.bind(this));
    this.node.removeEventListener('drop', this._ondrop.bind(this));

    super.onBeforeDetach(msg);
  }

  private _ondragover(event: DragEvent) {
    event.preventDefault();
  }

  private async _ondrop(event: DragEvent) {
    const datasetId = event.dataTransfer?.getData(DATASET_MIME);

    const items: IDict<string> = {
      'Histogram': CommandIDs.new1DHistogram,
      '2D Scatter': CommandIDs.new2DScatter,
      '2D Image': CommandIDs.new2DImage
    };

    const res = await InputDialog.getItem({
      title: 'Viewer Type',
      items: Object.keys(items)
    });

    if (res.button.accept && res.value) {
      this._commands.execute(items[res.value], {
        position: [event.offsetX, event.offsetY],
        dataset: datasetId
      });
    }
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

    // TODO Handle loading errors and report in the UI?
    const code = `
    # Ignoring warnings so they don't show up in viewers
    # TODO don't suppress warnings but redirect them?
    import warnings
    warnings.filterwarnings("ignore")

    import json
    import glue_jupyter as gj

    app = gj.jglue()
    `;

    const future = kernel.requestExecute({ code }, false);
    future.onReply = msg => {
      console.log(msg);
    };
    await future.done;

    await this._loadData();
    this._model.contentsChanged.connect(this._loadData, this);
  }

  private async _loadData() {
    const kernel = this._context?.sessionContext.session?.kernel;

    if (!kernel) {
      console.error('No kernel running');
      return;
    }

    // Extract session path
    let sessionPath: string;
    if (this._context.path.includes(':')) {
      sessionPath = this._context.path.split(':')[1];
    } else {
      sessionPath = this._context.path;
    }

    // Extract paths to datasets
    const dataPaths: { [k: string]: string } = {};
    if ('LoadLog' in this._model.contents) {
      const path = (this._model.contents['LoadLog'] as unknown as ILoadLog)
        .path;
      dataPaths[PathExt.basename(path).replace(PathExt.extname(path), '')] =
        PathExt.join(PathExt.dirname(sessionPath), path);
    }
    let i = 0;
    while (`LoadLog_${i}` in this._model.contents) {
      const path = (this._model.contents[`LoadLog_${i}`] as unknown as ILoadLog)
        .path;
      dataPaths[PathExt.basename(path).replace(PathExt.extname(path), '')] =
        PathExt.join(PathExt.dirname(sessionPath), path);
      i++;
    }

    if (!dataPaths) {
      return;
    }

    // TODO Handle loading errors and report in the UI?
    const code = `
    data_paths = json.loads('${JSON.stringify(dataPaths)}')

    data = {}
    for name, path in data_paths.items():
        data[name] = app.load_data(path)
    `;

    const future = kernel.requestExecute({ code }, false);
    future.onReply = msg => {
      console.log(msg);
    };
    await future.done;

    this._dataLoaded.resolve();
  }

  private _onTabsChanged(): void {
    const tabNames = this._model.getTabNames();

    tabNames.forEach((tabName, idx) => {
      // Tab already exists, we don't do anything
      if (tabName in this._tabViews) {
        return;
      }

      // Tab does not exist, we create it
      const tabWidget = (this._tabViews[tabName] = new TabView({
        tabName,
        model: this._model,
        rendermime: this._rendermime,
        context: this._context,
        notebookTracker: this._notebookTracker,
        dataLoaded: this._dataLoaded
      }));

      this._tabPanel.addTab(tabWidget, idx + 1);
    });

    // TODO Remove leftover tabs
    // for (const tabName in Object.keys(this._tabViews)) {
    //   if (!(tabName in tabNames)) {
    //     todo
    //   }
    // }

    this._tabPanel.activateTab(1);
  }

  private _onFocusedTabChanged(
    sender: TabBar<Widget>,
    args: TabBar.ICurrentChangedArgs<Widget>
  ) {
    this._model.setSelectedTab(args.currentIndex);
  }

  private _tabViews: { [k: string]: TabView } = {};
  private _dataLoaded: PromiseDelegate<void> = new PromiseDelegate<void>();
  private _tabPanel: HTabPanel;
  private _linkWidget: LinkEditor | undefined = undefined;
  private _model: IGlueSessionSharedModel;
  private _rendermime: IRenderMimeRegistry;
  private _context: DocumentRegistry.IContext<GlueSessionModel>;
  private _notebookTracker: INotebookTracker;
  private _commands: CommandRegistry;
}

export namespace SessionWidget {
  export interface IOptions {
    model: IGlueSessionSharedModel;
    rendermime: IRenderMimeRegistry;
    context: DocumentRegistry.IContext<GlueSessionModel>;
    notebookTracker: INotebookTracker;
    commands: CommandRegistry;
  }
}
