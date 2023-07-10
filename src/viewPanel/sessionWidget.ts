import { Dialog, InputDialog, showDialog } from '@jupyterlab/apputils';
import { DocumentRegistry } from '@jupyterlab/docregistry';
import { INotebookTracker } from '@jupyterlab/notebook';
import { IRenderMimeRegistry } from '@jupyterlab/rendermime';
import { IKernelConnection } from '@jupyterlab/services/lib/kernel/kernel';
import { CommandRegistry } from '@lumino/commands';
import { PromiseDelegate } from '@lumino/coreutils';
import { Message } from '@lumino/messaging';
import { BoxPanel, TabBar, Widget } from '@lumino/widgets';
import { IJupyterYWidgetManager } from 'yjs-widgets';

import { CommandIDs } from '../commands';
import { HTabPanel } from '../common/tabPanel';
import { GlueSessionModel } from '../document/docModel';
import { LinkEditor } from '../linkPanel/linkEditor';
import { mockNotebook } from '../tools';
import { DATASET_MIME, IDict, IGlueSessionSharedModel } from '../types';
import { TabView } from './tabView';

export class SessionWidget extends BoxPanel {
  constructor(options: SessionWidget.IOptions) {
    super({ direction: 'top-to-bottom' });
    this.addClass('grid-panel');
    this.addClass('glue-Session-panel');

    this._spinner = document.createElement('div');
    this._spinner.classList.add('glue-Spinner');
    const spinnerContent = document.createElement('div');
    spinnerContent.classList.add('glue-SpinnerContent');
    this._spinner.appendChild(spinnerContent);
    this.node.appendChild(this._spinner);

    this._model = options.model;
    this._rendermime = options.rendermime.clone();
    this._notebookTracker = options.notebookTracker;
    this._context = options.context;
    this._commands = options.commands;
    this._yWidgetManager = options.yWidgetManager;

    const tabBarClassList = ['glue-Session-tabBar'];
    this._tabPanel = new HTabPanel({
      tabBarPosition: 'bottom',
      tabBarClassList,
      tabBarOption: {
        addButtonEnabled: true
      }
    });
    this._tabPanel.topBar.addRequested.connect(() => {
      this._model.addTab();
    });
    this._tabPanel.topBar.tabCloseRequested.connect(async (tab, arg) => {
      const confirm = await showDialog({
        title: 'Delete Tab',
        body: 'Are you sure you want to delete this tab?',
        buttons: [Dialog.cancelButton(), Dialog.okButton({ label: 'Delete' })]
      });
      if (confirm.button.accept) {
        arg.title.owner.close();
        this._tabPanel.topBar.removeTabAt(arg.index);
        this._model.removeTab(arg.title.label);
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

    this._kernel = undefined;
    this._startKernel();
  }

  get rendermime(): IRenderMimeRegistry {
    return this._rendermime;
  }

  get kernel(): IKernelConnection | undefined {
    return this._kernel!;
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
    const target = event.target as HTMLElement;
    const viewer = target.closest('.grid-stack-item.glue-item');
    // No-op if the target is a viewer, it will be managed by the viewer itself.
    if (viewer) {
      return;
    }

    const datasetId = event.dataTransfer?.getData(DATASET_MIME);
    const items: IDict<string> = {
      Histogram: CommandIDs.new1DHistogram,
      '1D Profile': CommandIDs.new1DProfile,
      '2D Scatter': CommandIDs.new2DScatter,
      '3D Scatter': CommandIDs.new3DScatter,
      '2D Image': CommandIDs.new2DImage,
      Table: CommandIDs.newTable
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
        body: 'Failed to start the kernel for the Glue session',
        buttons: [Dialog.cancelButton()]
      });
      return;
    }
    this._yWidgetManager.registerKernel(kernel);

    this._kernel = kernel;

    // TODO Handle loading errors and report in the UI?
    const code = `
    from glue_jupyterlab.glue_session import SharedGlueSession
    GLUE_SESSION = SharedGlueSession("${this._context.localPath}")
    `;

    const future = kernel.requestExecute({ code }, false);
    await future.done;
    this._pythonSessionCreated.resolve();

    this._spinner.style.display = 'none';
  }

  private async _onTabsChanged() {
    await this._pythonSessionCreated.promise;
    let newTabIndex: number | undefined = undefined;
    const currentIndex = this._tabPanel.topBar.currentIndex;
    const tabNames = this._model.getTabNames();
    Object.keys(this._tabViews).forEach(k => {
      if (!tabNames.includes(k)) {
        this._tabViews[k].dispose();
        delete this._tabViews[k];
      }
    });
    tabNames.forEach((tabName, idx) => {
      // Tab already exists, we don't do anything
      if (tabName in this._tabViews) {
        return;
      }
      newTabIndex = idx;
      // Tab does not exist, we create it
      const tabWidget = (this._tabViews[tabName] = new TabView({
        tabName,
        model: this._model,
        rendermime: this._rendermime,
        context: this._context,
        notebookTracker: this._notebookTracker,
        commands: this._commands
      }));
      tabWidget.title.closable = true;
      this._tabPanel.addTab(tabWidget, idx + 1);
    });

    // TODO Remove leftover tabs
    // for (const tabName in Object.keys(this._tabViews)) {
    //   if (!(tabName in tabNames)) {
    //     todo
    //   }
    // }
    if (newTabIndex !== undefined) {
      if (currentIndex === 0) {
        newTabIndex = 0;
      }
      this._tabPanel.activateTab(newTabIndex + 1);
    }
  }

  private _onFocusedTabChanged(
    sender: TabBar<Widget>,
    args: TabBar.ICurrentChangedArgs<Widget>
  ) {
    this._model.setSelectedTab(args.currentIndex);
    this._commands.execute(CommandIDs.closeControlPanel);
  }

  private _kernel: IKernelConnection | undefined;
  private _spinner: HTMLDivElement;
  private _tabViews: { [k: string]: TabView } = {};
  private _pythonSessionCreated: PromiseDelegate<void> =
    new PromiseDelegate<void>();
  private _tabPanel: HTabPanel;
  private _linkWidget: LinkEditor | undefined = undefined;
  private _model: IGlueSessionSharedModel;
  private _rendermime: IRenderMimeRegistry;
  private _context: DocumentRegistry.IContext<GlueSessionModel>;
  private _notebookTracker: INotebookTracker;
  private _commands: CommandRegistry;
  private _yWidgetManager: IJupyterYWidgetManager;
}

export namespace SessionWidget {
  export interface IOptions {
    model: IGlueSessionSharedModel;
    rendermime: IRenderMimeRegistry;
    context: DocumentRegistry.IContext<GlueSessionModel>;
    notebookTracker: INotebookTracker;
    commands: CommandRegistry;
    yWidgetManager: IJupyterYWidgetManager;
  }
}
