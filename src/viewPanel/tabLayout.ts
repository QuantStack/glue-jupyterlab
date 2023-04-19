import { Layout, Widget } from '@lumino/widgets';

import { Signal, ISignal } from '@lumino/signaling';

import { Message, MessageLoop } from '@lumino/messaging';

import { GridStack, GridStackNode, GridItemHTMLElement } from 'gridstack';

import { GridStackItem } from './gridStackItem';

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

    this._gridHost = document.createElement('div');
    this._gridHost.className = 'grid-stack';
    this._gridHost.classList.add('glue-Session-gridhost');

    this._grid = GridStack.init(
      {
        float: true,
        column: 12,
        margin: 3,
        cellHeight: 40,
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

  get gridItemChanged(): ISignal<this, GridStackNode[]> {
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
    yield* this._gridItems;
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
  get gridWidgets(): Array<GridStackItem> {
    return this._gridItems;
  }

  /**
   * Get the list of `GridItemHTMLElement`.
   */
  get gridItems(): GridItemHTMLElement[] {
    return this._grid.getGridItems() ?? [];
  }

  /**
   * Add new cell to gridstack.
   *
   * @param item - The cell widget.
   */
  addGridItem(item: GridStackItem): void {
    const id = item.cellIdentity;

    const options = {
      id,
      autoPosition: true,
      noMove: false,
      noResize: false,
      locked: false,
      w: 6,
      h: 12
    };

    this._gridItems.push(item);

    MessageLoop.sendMessage(item, Widget.Msg.BeforeAttach);
    this._grid.addWidget(item.node, options);
    MessageLoop.sendMessage(item, Widget.Msg.AfterAttach);
    this.updateGridItem(id, options);
  }

  /**
   * Update a cell from gridstack.
   *
   * @param id - The Cell id.
   * @param info - The dashboard cell metadata parameters.
   */
  updateGridItem(id: string, info: any): void {
    const items = this._grid.getGridItems();
    const item = items?.find(value => value.gridstackNode?.id === id);
    this._grid.update(item!, {
      w: info.w,
      h: info.h,
      autoPosition: true
    });
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
      this._gridItems = this._gridItems.filter(obj => obj.cellIdentity !== id);
      this._grid.removeWidget(item, true, false);
    }
  }

  /**
   * Handle change-event messages sent to from gridstack.
   */
  private _onChange(event: Event, items: GridStackNode[]): void {
    this._gridItemChanged.emit(items ?? []);
  }

  /**
   * Handle remove event messages sent from gridstack.
   */
  private _onRemoved(event: Event, items: GridStackNode[]): void {
    items.forEach(el => {
      //this._model.hideCell(el.id as string);
    });
  }

  /**
   * Handle resize event messages sent from gridstack.
   */
  private _onResize(event: Event, item: GridStackNode): void {
    const widget = this._gridItems.find(
      value => value.cellIdentity === item.id
    );
    if (widget) {
      MessageLoop.sendMessage(widget, Widget.Msg.UpdateRequest);
    }
  }

  /**
   * Handle resize-stop event messages in the layout.
   */
  private _onResizeStops = (): void => {
    this._gridItems.forEach(item => {
      MessageLoop.sendMessage(item, Widget.Msg.UpdateRequest);
    });
  };

  private _prepareGrid(): void {
    const rect = this.parent!.node.getBoundingClientRect();
    this._gridHost.style.minHeight = `${rect.height}px`;
    this._grid.onParentResize();
  }

  private _gridHost: HTMLElement;
  private _grid: GridStack;
  private _gridItems: GridStackItem[] = [];
  private _gridItemChanged = new Signal<this, GridStackNode[]>(this);
  private _resizeTimeout = 0;
}
