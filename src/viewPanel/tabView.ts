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
import { DocumentRegistry } from '@jupyterlab/docregistry';
import { GlueSessionModel } from '../document/docModel';
import { IRenderMimeRegistry } from '@jupyterlab/rendermime';
import { INotebookTracker } from '@jupyterlab/notebook';
import { PromiseDelegate } from '@lumino/coreutils';

export class TabView extends Widget {
  constructor(options: TabView.IOptions) {
    super();
    this.addClass('grid-editor');

    this._model = options.model;
    this._tabName = this.title.label = options.tabName;
    this._context = options.context;
    this._rendermime = options.rendermime;

    const layout = (this.layout = new TabLayout());

    this._commands = new CommandRegistry();
    this._contextMenu = new ContextMenu({ commands: this._commands });

    this._addCommands();

    this._context.sessionContext.ready.then(() => {
      this._updateViewers();
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
        this.tabName,
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
    tabName: string,
    viewerId: string,
    viewerData: IGlueSessionViewerTypes
  ): Promise<GridStackItem | undefined> {
    const itemTitle = (viewerData._type as string)?.split('.').pop();
    if (itemTitle) {
      const outputAreaModel = new OutputAreaModel({ trusted: true });
      const out = new SimplifiedOutputArea({
        model: outputAreaModel,
        rendermime: this._rendermime
      });

      const item = new GridStackItem({
        cellIdentity: viewerId,
        cell: out,
        itemTitle: itemTitle.match(/($[a-z])|[A-Z][^A-Z]+/g)?.join(' '),
        pos: viewerData.pos,
        size: viewerData.size
      });
      const cellOutput = item.cellOutput as SimplifiedOutputArea;
      if (this._context) {
        SimplifiedOutputArea.execute(
          `
          GLUE_SESSION.create_viewer("${tabName}", "${viewerId}")
          `,
          cellOutput,
          this._context.sessionContext
        );
      }
      return item;
    }
  }

  private _addCommands(): void {
    this._commands.addCommand('moveItem', {
      label: 'Move Item',
      isEnabled: () => true,
      execute: async () => {
        if (this._model && this._selectedItem) {
          const res = await InputDialog.getItem({
            title: 'Move To Tab',
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
