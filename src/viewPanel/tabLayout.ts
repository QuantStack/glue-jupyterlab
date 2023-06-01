import { Layout, Widget } from '@lumino/widgets';

import { Signal, ISignal } from '@lumino/signaling';

import { Message, MessageLoop } from '@lumino/messaging';

import {
  GridStack,
  GridStackNode,
  GridItemHTMLElement,
  GridStackWidget
} from 'gridstack';

import { GridStackItem } from './gridStackItem';

const COLUMNS = 12;
const CELL_HEIGHT = 40;

export type ViewInfo = {
  id: string;
  pos: number[];
  size: number[];
};

export type ItemInfo = {
  id: string;
  width: number;
  height: number;
  column: number;
  row: number;
};

/**
 * A gridstack layout to host the visible Notebook's Cells.
 */
export class TabLayout extends Layout {
  /**
   * Construct a `GridStackLayout`.
   *
   * @param info - The `DashboardView` metadata.
   */
  constructor() {
    super();

    this._gridItems = new Map();
    this._gridHost = document.createElement('div');
    this._gridHost.className = 'grid-stack';
    this._gridHost.classList.add('glue-Session-gridhost');

    this._grid = GridStack.init(
      {
        float: true,
        column: COLUMNS,
        margin: 3,
        cellHeight: CELL_HEIGHT,
        styleInHead: true,
        disableOneColumnMode: true,
        draggable: { handle: '.glue-Session-tab-toolbar' },
        resizable: { autoHide: true, handles: 'e, se, s, sw, w' },
        alwaysShowResizeHandle:
          /Android|webOS|iPhone|iPad|iPod|BlackBerry|IEMobile|Opera Mini/i.test(
            navigator.userAgent
          )
      },
      this._gridHost
    );

    this._grid.on(
      'change',
      (
        event: Event,
        items?: GridItemHTMLElement | GridStackNode | GridStackNode[]
      ) => {
        this._onChange(event, items as GridStackNode[]);
      }
    );

    this._grid.on(
      'removed',
      (
        event: Event,
        items?: GridItemHTMLElement | GridStackNode | GridStackNode[]
      ) => {
        if ((items as GridStackNode[]).length <= 1) {
          this._onRemoved(event, items as GridStackNode[]);
        }
      }
    );

    this._grid.on(
      'resize',
      (
        event: Event,
        item?: GridItemHTMLElement | GridStackNode | GridStackNode[]
      ) => {
        if (item && (item as GridItemHTMLElement).gridstackNode) {
          this._onResize(event, (item as GridItemHTMLElement).gridstackNode!);
        }
      }
    );

    this._grid.on('resizestop', (event, elem) => {
      window.dispatchEvent(new Event('resize'));
    });
  }

  get gridItemChanged(): ISignal<this, TabLayout.IChange> {
    return this._gridItemChanged;
  }

  /**
   * Dispose of the resources held by the widget.
   */
  dispose(): void {
    this._grid.destroy();
    super.dispose();
  }

  /**
   * Init the gridstack layout
   */
  init(): void {
    super.init();
    this.parent!.node.appendChild(this._gridHost);
    // fake window resize event to resize bqplot
    window.dispatchEvent(new Event('resize'));
  }

  /**
   * Handle `update-request` messages sent to the widget.
   */
  protected onUpdateRequest(msg: Message): void {
    const items = this._grid?.getGridItems();
    items?.forEach(item => {
      this._grid.removeWidget(item, true, false);
      this._grid.addWidget(item);
    });
  }

  /**
   * Handle `resize-request` messages sent to the widget.
   */
  protected onResize(msg: Message): void {
    // Using timeout to wait until the resize stop
    // rerendering all the widgets every time uses
    // too much resources
    clearTimeout(this._resizeTimeout);
    this._resizeTimeout = setTimeout(this._onResizeStops, 500);
    this._prepareGrid();
  }

  /**
   * Handle `fit-request` messages sent to the widget.
   */
  protected onFitRequest(msg: Message): void {
    this._prepareGrid();
  }

  /**
   * Create an iterator over the widgets in the layout.
   *
   * @returns A new iterator over the widgets in the layout.
   */
  *[Symbol.iterator](): IterableIterator<Widget> {
    yield* this._gridItems.values();
  }

  /**
   * Remove a widget from the layout.
   *
   * @param widget - The `widget` to remove.
   */
  removeWidget(widget: Widget): void {
    return;
  }

  /**
   * Helper to get access to underlying GridStack object
   */
  get grid(): GridStack {
    return this._grid;
  }

  /**
   * Get the list of `GridStackItem` (Lumino widgets).
   */
  get gridItems(): Map<string, GridStackItem> {
    return this._gridItems;
  }

  /**
   * Get the list of `GridItemHTMLElement`.
   */
  get gridElements(): GridItemHTMLElement[] {
    return this._grid.getGridItems() ?? [];
  }

  /**
   * Add new cell to gridstack.
   *
   * @param item - The cell widget.
   */
  addGridItem(item: GridStackItem): void {
    const options = Private.pixelToGrid(this._grid.cellWidth(), {
      id: item.cellIdentity,
      size: item.size,
      pos: item.pos
    });

    // Save item
    item.changed.connect(this._onItemChanged, this);
    this._gridItems.set(item.cellIdentity, item);

    // Add item to grid
    MessageLoop.sendMessage(item, Widget.Msg.BeforeAttach);
    this._grid.addWidget(item.node, options);
    MessageLoop.sendMessage(item, Widget.Msg.AfterAttach);
    //this.updateGridItem(id, options);
  }

  /**
   * Update a view from gridstack.
   *
   * @param id - The view id.
   * @param info - The view cell parameters.
   */
  updateGridItem(id: string, info: ViewInfo): void {
    const options = Private.pixelToGrid(this._grid.cellWidth(), {
      id: info.id,
      size: info.size,
      pos: info.pos
    });

    // Update Item
    const item = this._gridItems.get(id);
    if (!item) {
      return;
    }
    item.size = info.size;
    item.pos = info.pos;

    // Update grid
    const elems = this._grid.getGridItems();
    const el = elems?.find(value => value.gridstackNode?.id === id);
    this._grid.update(el!, options);
  }

  /**
   * Remove a cell from gridstack.
   *
   * @param id - The Cell id.
   */
  removeGridItem(id: string): void {
    const items = this._grid.getGridItems();
    const item = items?.find(value => value.gridstackNode?.id === id);

    if (item) {
      this._gridItems.delete(id);
      this._grid.removeWidget(item, true);
    }
  }

  /**
   * Remove all items from gridstack.
   */
  clearGrid(): void {
    const items = this._grid?.getGridItems();
    items?.forEach(item => this._grid.removeWidget(item, true, false));
  }

  /**
   * Handle change-event messages sent to from gridstack.
   */
  private _onChange(event: Event, items: GridStackNode[]): void {
    const data: ViewInfo[] = items.map(item => {
      return Private.gridToPixel(this._grid.cellWidth(), item);
    });
    this._gridItemChanged.emit({ action: 'move', items: data });
  }

  /**
   * Handle remove event messages sent from gridstack.
   */
  private _onRemoved(event: Event, items: GridStackNode[]): void {
    const data: string[] = items.map(item => item.id as string);
    this._gridItemChanged.emit({ action: 'remove', items: data });
  }

  /**
   * Handle resize event messages sent from gridstack.
   */
  private _onResize(event: Event, item: GridStackNode): void {
    const widget = this._gridItems.get(item.id as string);
    if (!widget) {
      return;
    }

    MessageLoop.sendMessage(widget, Widget.Msg.UpdateRequest);

    const info = Private.gridToPixel(this._grid.cellWidth(), item);

    this._gridItemChanged.emit({
      action: 'move',
      items: [info]
    });
  }

  /**
   * Handle resize-stop event messages in the layout.
   */
  private _onResizeStops = (): void => {
    this._gridItems.forEach(item => {
      MessageLoop.sendMessage(item, Widget.Msg.UpdateRequest);
    });
  };

  private _onItemChanged(
    sender: GridStackItem,
    change: GridStackItem.IChange
  ): void {
    if (change.action === 'close') {
      sender.changed.disconnect(this._onItemChanged, this);
      this.removeGridItem(sender.cellIdentity);
    }
  }

  private _prepareGrid(): void {
    const rect = this.parent!.node.getBoundingClientRect();
    this._gridHost.style.minHeight = `${rect.height}px`;
    this._grid.onParentResize();
  }

  private _gridHost: HTMLElement;
  private _grid: GridStack;
  private _gridItems: Map<string, GridStackItem>;
  private _gridItemChanged = new Signal<this, TabLayout.IChange>(this);
  private _resizeTimeout = 0;
}

export namespace TabLayout {
  export interface IChange {
    action: 'remove' | 'move' | 'resize';
    items: ViewInfo[] | string[];
  }
}

namespace Private {
  export function pixelToGrid(
    cellWidth: number,
    item: ViewInfo
  ): GridStackWidget {
    return {
      id: item.id,
      locked: true,
      w: Math.ceil(item.size[0] / cellWidth),
      h: Math.ceil(item.size[1] / CELL_HEIGHT),
      x: Math.ceil(item.pos[0] / cellWidth),
      y: Math.ceil(item.pos[1] / CELL_HEIGHT)
    };
  }

  export function gridToPixel(
    cellWidth: number,
    item: GridStackWidget
  ): ViewInfo {
    return {
      id: item.id as string,
      size: [Math.ceil(item.w! * cellWidth), Math.ceil(item.h! * CELL_HEIGHT)],
      pos: [Math.ceil(item.x! * cellWidth), Math.ceil(item.y! * CELL_HEIGHT)]
    };
  }
}
