import { OutputAreaModel, SimplifiedOutputArea } from '@jupyterlab/outputarea';
import { InputDialog } from '@jupyterlab/apputils';
import { CommandRegistry } from '@lumino/commands';
import { Message } from '@lumino/messaging';
import { ContextMenu, Widget } from '@lumino/widgets';
import { ArrayExt } from '@lumino/algorithm';

import { TabLayout, ViewInfo } from './tabLayout';
import { GridStackItem } from './gridStackItem';
import {
  IDict,
  IGlueSessionSharedModel,
  IGlueSessionViewerTypes
} from '../types';
import { globalMutex } from '../document/sharedModel';
import { Signal } from '@lumino/signaling';
import { DocumentRegistry } from '@jupyterlab/docregistry';
import { GlueSessionModel } from '../document/docModel';
import { IRenderMimeRegistry } from '@jupyterlab/rendermime';
import { INotebookTracker } from '@jupyterlab/notebook';
import { JSONObject, PromiseDelegate } from '@lumino/coreutils';

export class TabView extends Widget {
  constructor(options: TabView.IOptions) {
    super();
    this.addClass('grid-editor');

    this._model = options.model;
    this._tabName = this.title.label = options.tabName;
    this._context = options.context;
    this._dataLoaded = options.dataLoaded;
    this._rendermime = options.rendermime;

    const layout = (this.layout = new TabLayout());

    this._commands = new CommandRegistry();
    this._contextMenu = new ContextMenu({ commands: this._commands });

    this._addCommands();

    this._ready = new Signal<this, null>(this);
    this._ready.connect(() => {
      this._updateViewers();
    });

    this._context.sessionContext.ready.then(() => {
      this._ready.emit(null);
    });

    layout.gridItemChanged.connect(this._onLayoutChanged, this);
    this._model.tabChanged.connect(this._onTabChanged, this);
  }

  dispose(): void {
    if (this.disposed) {
      return;
    }

    (this.layout as TabLayout).gridItemChanged.disconnect(
      this._onLayoutChanged,
      this
    );
    this._model.tabChanged.disconnect(this._onTabChanged, this);

    super.dispose();
  }

  /**
   * The tab name
   */
  get tabName(): string {
    return this._tabName;
  }

  /**
   * The tab data
   */
  get tabData(): IDict<IGlueSessionViewerTypes> {
    return this._model.getTabData(this._tabName) ?? {};
  }

  /**
   * Handle the DOM events for the widget.
   *
   * @param event - The DOM event sent to the widget.
   *
   * #### Notes
   * This method implements the DOM `EventListener` interface and is
   * called in response to events on the notebook panel's node. It should
   * not be called directly by user code.
   */
  handleEvent(event: Event): void {
    switch (event.type) {
      case 'contextmenu':
        if (event.eventPhase === Event.CAPTURING_PHASE) {
          this._evtContextMenu(event as PointerEvent);
        }
        break;
      default:
        break;
    }
  }

  /**
   * Handle `after-attach` messages for the widget.
   */
  protected onAfterAttach(msg: Message): void {
    super.onAfterAttach(msg);
    const node = this.node;
    node.addEventListener('contextmenu', this, true);
  }

  /**
   * Handle `before-detach` messages for the widget.
   */
  protected onBeforeDetach(msg: Message): void {
    const node = this.node;
    node.removeEventListener('contextmenu', this, true);
    super.onBeforeAttach(msg);
  }

  /**
   * Update the viewers.
   */
  private async _updateViewers(): Promise<void> {
    for (const [viewerId, viewerData] of Object.entries(this.tabData)) {
      // TODO Update already existing viewers
      if (viewerId in this._viewers) {
        // TODO
        continue;
      }

      // Create new viewers
      const viewer = (this._viewers[viewerId] = await this._createViewer(
        viewerId,
        viewerData
      ));

      if (!viewer) {
        console.error(`Unable to create viewer for ${viewerId}`);
        continue;
      }

      (this.layout as TabLayout).addGridItem(viewer);
    }

    // Remove old viewers
    for (const viewerId in this._viewers) {
      if (!(viewerId in this.tabData)) {
        (this.layout as TabLayout).removeGridItem(viewerId);
        delete this._viewers[viewerId];
      }
    }
  }

  private async _createViewer(
    viewerId: string,
    viewerData: IGlueSessionViewerTypes
  ): Promise<GridStackItem | undefined> {
    let item: GridStackItem | undefined = undefined;

    await this._dataLoaded.promise;

    // Extract plot state
    const state: { [k: string]: any } = {};
    if (viewerData.state.values) {
      for (const prop in viewerData.state.values) {
        const value = viewerData.state.values[prop];
        // TODO Why do we need to do this??
        if (typeof value === 'string' && value.startsWith('st__')) {
          state[prop] = value.slice(4);
          continue;
        }

        state[prop] = value;
      }
    }
    // Merging the state with what's specified in "layers"
    // Only taking the state of the first layer
    // TODO Support multiple layers??
    if (
      viewerData.layers &&
      viewerData.layers[0]['state'] in this._model.contents
    ) {
      const extraState = (
        this._model.contents[viewerData.layers[0]['state']] as JSONObject
      ).values as JSONObject;
      for (const prop in extraState) {
        const value = extraState[prop];
        // TODO Why do we need to do this??
        if (typeof value === 'string' && value.startsWith('st__')) {
          state[prop] = value.slice(4);
          continue;
        }

        state[prop] = value;
      }
    }

    switch (viewerData._type) {
      case 'glue.viewers.scatter.qt.data_viewer.ScatterViewer': {
        const outputAreaModel = new OutputAreaModel({ trusted: true });
        const out = new SimplifiedOutputArea({
          model: outputAreaModel,
          rendermime: this._rendermime
        });

        item = new GridStackItem({
          cellIdentity: viewerId,
          cell: out,
          itemTitle: '2D Scatter',
          pos: viewerData.pos,
          size: viewerData.size
        });
        const cellOutput = item.cellOutput as SimplifiedOutputArea;
        if (this._context) {
          SimplifiedOutputArea.execute(
            `
            state = json.loads('${JSON.stringify(state)}')

            scatter = app.scatter2d(data=data[state["layer"]])

            for key, value in state.items():
                try:
                    setattr(scatter.state, key, value)
                except:
                    pass
            `,
            cellOutput,
            this._context.sessionContext
          );
        }
        break;
      }
      case 'glue.viewers.image.qt.data_viewer.ImageViewer': {
        const outputAreaModel = new OutputAreaModel({ trusted: true });
        const out = new SimplifiedOutputArea({
          model: outputAreaModel,
          rendermime: this._rendermime
        });

        item = new GridStackItem({
          cellIdentity: viewerId,
          cell: out,
          itemTitle: 'Image',
          pos: viewerData.pos,
          size: viewerData.size
        });
        const cellOutput = item.cellOutput as SimplifiedOutputArea;
        if (this._context) {
          SimplifiedOutputArea.execute(
            `
            state = json.loads('${JSON.stringify(state)}')

            image = app.imshow(data=data[state["layer"]])
            `,
            cellOutput,
            this._context.sessionContext
          );
        }
        break;
      }
      case 'glue.viewers.histogram.qt.data_viewer.HistogramViewer': {
        const outputAreaModel = new OutputAreaModel({ trusted: true });
        const out = new SimplifiedOutputArea({
          model: outputAreaModel,
          rendermime: this._rendermime
        });

        item = new GridStackItem({
          cellIdentity: viewerId,
          cell: out,
          itemTitle: 'Histogram',
          pos: viewerData.pos,
          size: viewerData.size
        });
        const cellOutput = item.cellOutput as SimplifiedOutputArea;
        if (this._context) {
          SimplifiedOutputArea.execute(
            `
            state = json.loads('${JSON.stringify(state)}')

            hist = app.histogram1d(data=data[state["layer"]])

            for key, value in state.items():
                try:
                    setattr(hist.state, key, value)
                except:
                    pass
            `,
            cellOutput,
            this._context.sessionContext
          );
        }
        break;
      }
      case 'glue.viewers.table.qt.data_viewer.TableViewer': {
        const outputAreaModel = new OutputAreaModel({ trusted: true });
        const out = new SimplifiedOutputArea({
          model: outputAreaModel,
          rendermime: this._rendermime
        });

        item = new GridStackItem({
          cellIdentity: viewerId,
          cell: out,
          itemTitle: 'Table',
          pos: viewerData.pos,
          size: viewerData.size
        });
        const cellOutput = item.cellOutput as SimplifiedOutputArea;
        if (this._context) {
          SimplifiedOutputArea.execute(
            `
            state = json.loads('${JSON.stringify(state)}')

            hist = app.table(data=data[state["layer"]])

            for key, value in state.items():
                try:
                    setattr(hist.state, key, value)
                except:
                    pass
            `,
            cellOutput,
            this._context.sessionContext
          );
        }
        break;
      }
    }
    return item;
  }

  private _addCommands(): void {
    this._commands.addCommand('moveItem', {
      label: 'Move Item',
      isEnabled: () => true,
      execute: async () => {
        if (this._model && this._selectedItem) {
          const res = await InputDialog.getItem({
            title: 'Select the destination tab.',
            items: this._model
              .getTabNames()
              .filter(name => name !== this._tabName)
          });

          if (res.button.accept && res.value) {
            this._model.moveTabItem(
              this._selectedItem.cellIdentity,
              this._tabName,
              res.value
            );
          }
        }
      }
    });
    this._contextMenu.addItem({
      command: 'moveItem',
      selector: '.glue-item',
      rank: 0
    });
  }

  /**
   * Handle `contextmenu` event.
   */
  private _evtContextMenu(event: PointerEvent): void {
    if (event.shiftKey) {
      return;
    }

    const opened = this._contextMenu.open(event);
    if (opened) {
      const target = event.target as HTMLElement;
      const pos = this._findItem(target);
      this._selectedItem = (this.layout as TabLayout).gridWidgets[pos];

      event.preventDefault();
      event.stopPropagation();
    }
  }

  /**
   * Find the index of the item containing the target html element.
   *
   * #### Notes
   * Returns -1 if the cell is not found.
   */
  private _findItem(elem: HTMLElement): number {
    let el: HTMLElement | null = elem;
    while (el && el !== this.node) {
      if (el.classList.contains('glue-item')) {
        const i = ArrayExt.findFirstIndex(
          (this.layout as TabLayout).gridWidgets,
          widget => widget.node === el
        );
        if (i !== -1) {
          return i;
        }
        break;
      }
      el = el.parentElement;
    }
    return -1;
  }

  private _onTabChanged(
    sender: IGlueSessionSharedModel,
    args: IDict<any>
  ): void {
    globalMutex(() => {
      // Use the "mutex" to prevent this client from rerendering the tab.
      if (args.tab && args.tab === this.tabName) {
        this._updateViewers();
      }
    });
  }

  private _onLayoutChanged(sender: TabLayout, change: TabLayout.IChange): void {
    const tabName = this._tabName;

    switch (change.action) {
      case 'move':
      case 'resize':
        globalMutex(() => {
          // Use the "mutex" to prevent this client from rerendering the tab.
          this._model.transact(() => {
            (change.items as ViewInfo[]).forEach(item => {
              const data = this._model.getTabItem(tabName, item.id);
              this._model.updateTabItem(tabName, item.id, {
                ...data,
                pos: item.pos,
                size: item.size
              });
            });
          }, false);
        });
        break;
      case 'remove':
        globalMutex(() => {
          // Use the "mutex" to prevent this client from rerendering the tab.
          this._model.transact(() => {
            (change.items as string[]).forEach(item =>
              this._model.removeTabItem(tabName, item)
            );
          }, false);
        });
        break;
    }
  }

  private _viewers: { [viewerId: string]: GridStackItem | undefined } = {};
  private _ready: Signal<this, null>;
  private _dataLoaded: PromiseDelegate<void>;
  private _selectedItem: GridStackItem | null = null;
  private _model: IGlueSessionSharedModel;
  private _context: DocumentRegistry.IContext<GlueSessionModel>;
  private _rendermime: IRenderMimeRegistry;
  private _tabName: string;
  private _contextMenu: ContextMenu;
  private _commands: CommandRegistry;
}

export namespace TabView {
  export interface IOptions {
    tabName: string;
    model: IGlueSessionSharedModel;
    rendermime: IRenderMimeRegistry;
    context: DocumentRegistry.IContext<GlueSessionModel>;
    notebookTracker: INotebookTracker;
    dataLoaded: PromiseDelegate<void>;
  }
}
