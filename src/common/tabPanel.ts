import { LabIcon, classes, TabBarSvg } from '@jupyterlab/ui-components';
import { Widget, TabBar, StackedPanel, BoxPanel, Title } from '@lumino/widgets';
import { find, ArrayExt } from '@lumino/algorithm';
import { Signal, ISignal } from '@lumino/signaling';

export class HTabPanel extends BoxPanel {
  constructor(options: HTabPanel.IOptions) {
    const direction = options.tabBarPosition
      ? options.tabBarPosition === 'top'
        ? 'top-to-bottom'
        : 'bottom-to-top'
      : 'top-to-bottom';
    super({ direction });
    const tabBarOption = options.tabBarOption ?? {
      insertBehavior: 'none',
      removeBehavior: 'none',
      allowDeselect: false,
      orientation: 'horizontal'
    };
    this._topBar = new TabBarSvg<Widget>(tabBarOption);
    const tabBarClasses = options.tabBarClassList ?? [];
    tabBarClasses.forEach(cls => this._topBar.addClass(cls));

    BoxPanel.setStretch(this._topBar, 0);
    this._topBar.hide();
    this._topBar.tabActivateRequested.connect(
      this._onTabActivateRequested,
      this
    );
    this._topBar.currentChanged.connect(this._onCurrentChanged, this);
    this._stackedPanel = new StackedPanel();
    this._stackedPanel.hide();
    BoxPanel.setStretch(this._stackedPanel, 1);

    this.addWidget(this._topBar);
    this.addWidget(this._stackedPanel);
  }

  /**
   * Get the tab bar managed by the handler.
   */
  get topBar(): TabBar<Widget> {
    return this._topBar;
  }

  /**
   * Get the stacked panel managed by the handler
   */
  get stackedPanel(): StackedPanel {
    return this._stackedPanel;
  }

  /**
   * Signal fires when the stack panel or the sidebar changes
   */
  get updated(): ISignal<this, void> {
    return this._updated;
  }

  /**
   * Activate a widget residing in the side bar by ID.
   *
   * @param id - The widget's unique ID.
   */
  activateById(id: string): void {
    const widget = this._findWidgetByID(id);
    if (widget) {
      this._topBar.currentTitle = widget.title;
      widget.activate();
    }
  }

  activateTab(idx: number): void {
    if (idx < this._topBar.titles.length) {
      this._topBar.currentIndex = idx;
    }
  }
  addTab(widget: Widget, rank: number): void {
    widget.parent = null;
    widget.hide();
    const item = { widget, rank };
    const index = this._findInsertIndex(item);
    ArrayExt.insert(this._items, index, item);
    this._stackedPanel.insertWidget(index, widget);
    const title = this._topBar.insertTab(index, widget.title);
    // Store the parent id in the title dataset
    // in order to dispatch click events to the right widget.
    title.dataset = { id: widget.id };

    if (title.icon instanceof LabIcon) {
      // bind an appropriate style to the icon
      title.icon = title.icon.bindprops({
        stylesheet: 'sideBar'
      });
    } else if (typeof title.icon === 'string' && title.icon !== '') {
      // add some classes to help with displaying css background imgs
      title.iconClass = classes(title.iconClass, 'jp-Icon', 'jp-Icon-20');
    }
    this._refreshVisibility();
  }

  protected onActivateRequest(msg: any): void {
    this._topBar.show();
    this._stackedPanel.show();
  }

  /**
   * Find the widget with the given id, or `null`.
   */
  private _findWidgetByID(id: string): Widget | null {
    const item = find(this._items, value => value.widget.id === id);
    return item ? item.widget : null;
  }

  /**
   * Find the insertion index for a rank item.
   */
  private _findInsertIndex(item: Private.IRankItem): number {
    return ArrayExt.upperBound(this._items, item, Private.itemCmp);
  }

  private _findWidgetByTitle(title: Title<Widget>): Widget | null {
    const item = find(this._items, value => value.widget.title === title);
    return item ? item.widget : null;
  }

  /**
   * Refresh the visibility of the side bar and stacked panel.
   */
  private _refreshVisibility(): void {
    this._stackedPanel.setHidden(this._topBar.currentTitle === null);
    this._topBar.setHidden(
      this._isHiddenByUser || this._topBar.titles.length === 0
    );
    this._updated.emit();
  }
  /**
   * Handle a `tabActivateRequest` signal from the sidebar.
   */
  private _onTabActivateRequested(
    sender: TabBar<Widget>,
    args: TabBar.ITabActivateRequestedArgs<Widget>
  ): void {
    args.title.owner.activate();
    args.title.owner.show();
  }

  private _onCurrentChanged(
    sender: TabBar<Widget>,
    args: TabBar.ICurrentChangedArgs<Widget>
  ): void {
    const oldWidget = args.previousTitle
      ? this._findWidgetByTitle(args.previousTitle)
      : null;
    const newWidget = args.currentTitle
      ? this._findWidgetByTitle(args.currentTitle)
      : null;
    if (oldWidget) {
      oldWidget.hide();
    }
    if (newWidget) {
      newWidget.show();
    }
  }

  private _topBar: TabBar<Widget>;
  private _stackedPanel: StackedPanel;
  private _items = new Array<Private.IRankItem>();
  private _updated: Signal<this, void> = new Signal(this);
  private _isHiddenByUser = false;
}

namespace Private {
  /**
   * An object which holds a widget and its sort rank.
   */
  export interface IRankItem {
    /**
     * The widget for the item.
     */
    widget: Widget;

    /**
     * The sort rank of the widget.
     */
    rank: number;
  }

  export function itemCmp(first: IRankItem, second: IRankItem): number {
    return first.rank - second.rank;
  }
}

export namespace HTabPanel {
  export interface IOptions {
    tabBarPosition?: 'top' | 'bottom';
    tabBarOption?: TabBar.IOptions<Widget>;
    tabBarClassList?: string[];
  }
}
