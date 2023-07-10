import { OutputAreaModel, SimplifiedOutputArea } from '@jupyterlab/outputarea';
import { InputDialog } from '@jupyterlab/apputils';
import { CommandRegistry } from '@lumino/commands';
import { Message } from '@lumino/messaging';
import { ContextMenu, Widget } from '@lumino/widgets';
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

export class TabView extends Widget {
  constructor(options: TabView.IOptions) {
    super();
    this.addClass('grid-editor');
    const { model, tabName, context, rendermime, commands } = options;
    this._model = model;
    this._tabName = this.title.label = tabName;
    this._context = context;
    this._rendermime = rendermime;

    const layout = (this.layout = new TabLayout(commands));

    this._localCommands = new CommandRegistry();
    this._contextMenu = new ContextMenu({ commands: this._localCommands });

    this._addCommands();

    this._context.sessionContext.ready.then(() => this._initGrid());

    layout.gridItemChanged.connect(this._onLayoutChanged, this);
    this._model.tabChanged.connect(this._onTabChanged, this);
    this._model.localStateChanged.connect(this._onLocalStateChanged, this);
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
    this._model.localStateChanged.disconnect(this._onLocalStateChanged);
    super.dispose();
  }

  protected onCloseRequest(msg: Message): void {
    this.dispose();
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
  private async _initGrid(): Promise<void> {
    const viewerKeys = Object.keys(this.tabData).sort();

    for (const viewerId of viewerKeys) {
      const viewerData = this.tabData[viewerId];
      // Create new viewers
      const viewer = await this._createViewer(
        this.tabName,
        viewerId,
        viewerData
      );

      if (!viewer) {
        console.error(`Unable to create viewer for ${viewerId}`);
        continue;
      }

      // Use the "mutex" to prevent this client triggering a change in the shared model.
      globalMutex(() => {
        (this.layout as TabLayout).addGridItem(viewer);
      });
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
        size: viewerData.size,
        tabName: tabName
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
    this._localCommands.addCommand('moveItem', {
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
      this._selectedItem = this._findItem(target);

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
  private _findItem(elem: HTMLElement): GridStackItem | null {
    let el: HTMLElement | null = elem;
    while (el && el !== this.node) {
      if (el.classList.contains('glue-item')) {
        for (const item of this.layout as TabLayout) {
          if (item.node === el) {
            return item as GridStackItem;
          }
        }
        break;
      }
      el = el.parentElement;
    }
    return null;
  }

  private _onTabChanged(
    sender: IGlueSessionSharedModel,
    args: IDict<any>
  ): void {
    if (args.tab && args.tab === this.tabName) {
      // Use the "mutex" to prevent this client triggering a change in the shared model.
      globalMutex(async () => {
        // Update existing viewers or create new
        for (const [viewerId, viewerData] of Object.entries(this.tabData)) {
          const item = (this.layout as TabLayout).gridItems.get(viewerId);
          if (item) {
            const { size, pos } = viewerData;
            if (item.size !== size || item.pos !== pos) {
              (this.layout as TabLayout).updateGridItem(viewerId, {
                id: viewerId,
                size: size,
                pos: pos
              });
            }
          } else {
            // Create new viewers
            const viewer = await this._createViewer(
              this._tabName,
              viewerId,
              viewerData
            );

            if (!viewer) {
              console.error(`Unable to create viewer for ${viewerId}`);
              continue;
            }

            (this.layout as TabLayout).addGridItem(viewer);
          }
        }

        // Remove viewers
        const toDelete: GridStackItem[] = [];
        (this.layout as TabLayout).gridItems.forEach(item => {
          if (this.tabData[item.cellIdentity] === undefined) {
            toDelete.push(item);
          }
        });
        toDelete.forEach(item =>
          (this.layout as TabLayout).removeGridItem(item.cellIdentity)
        );
      });
    }
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

  private _onLocalStateChanged(
    sender: IGlueSessionSharedModel,
    changes: { keys: string[] }
  ) {
    if (changes.keys.includes('selectedTab')) {
      (this.layout as TabLayout).unselectGridItems();
    }
  }
  private _selectedItem: GridStackItem | null = null;
  private _model: IGlueSessionSharedModel;
  private _context: DocumentRegistry.IContext<GlueSessionModel>;
  private _rendermime: IRenderMimeRegistry;
  private _tabName: string;
  private _contextMenu: ContextMenu;
  private _localCommands: CommandRegistry;
}

export namespace TabView {
  export interface IOptions {
    tabName: string;
    model: IGlueSessionSharedModel;
    rendermime: IRenderMimeRegistry;
    context: DocumentRegistry.IContext<GlueSessionModel>;
    notebookTracker: INotebookTracker;
    commands: CommandRegistry;
  }
}
