import { Panel, Widget } from '@lumino/widgets';
import { Toolbar, ToolbarButton, closeIcon } from '@jupyterlab/ui-components';
import { Message } from '@lumino/messaging';
import { ISignal, Signal } from '@lumino/signaling';
import { DATASET_MIME } from '../types';

export class GridStackItem extends Panel {
  constructor(options: GridStackItem.IOptions) {
    super();
    this.removeClass('lm-Widget');
    this.removeClass('p-Widget');
    this.addClass('grid-stack-item');
    this.addClass('glue-item');

    const { cellIdentity, cell, itemTitle = '', pos, size, tabName } = options;
    this._cellOutput = cell;
    this.cellIdentity = cellIdentity;
    this._pos = pos;
    this._size = size;
    this._title = itemTitle;
    this._tabName = tabName;

    const content = new Panel();
    content.addClass('grid-stack-item-content');

    const toolbar = this._createToolbar(itemTitle);
    content.addWidget(toolbar);
    cell.addClass('grid-item-widget');
    content.addWidget(cell);

    this._spinner = document.createElement('div');
    this._spinner.classList.add('glue-Spinner');
    const spinnerContent = document.createElement('div');
    spinnerContent.classList.add('glue-SpinnerContent');
    this._spinner.appendChild(spinnerContent);
    cell.node.appendChild(this._spinner);

    this.addWidget(content);

    this._changed = new Signal<GridStackItem, GridStackItem.IChange>(this);
  }

  readonly cellIdentity: string;

  get cellOutput(): Widget {
    return this._cellOutput;
  }

  get itemTitle(): string {
    return this._title;
  }

  get pos(): number[] {
    return this._pos;
  }

  set pos(value: number[]) {
    this._pos = value;
  }

  get size(): number[] {
    return this._size;
  }

  set size(value: number[]) {
    this._size = value;
  }

  get tabName(): string {
    return this._tabName;
  }

  set tabName(value: string) {
    this._tabName = value;
  }
  get changed(): ISignal<GridStackItem, GridStackItem.IChange> {
    return this._changed;
  }

  protected onAfterAttach(msg: Message): void {
    super.onAfterAttach(msg);
    this.node.addEventListener('drop', this._ondrop.bind(this));
  }

  protected onBeforeDetach(msg: Message): void {
    this.node.removeEventListener('drop', this._ondrop.bind(this));
    super.onBeforeDetach(msg);
  }

  private async _ondrop(event: DragEvent) {
    const datasetId = event.dataTransfer?.getData(DATASET_MIME);
    if (!datasetId) {
      return;
    }
    this._changed.emit({ action: 'layer', dataLayer: datasetId });
  }

  private _createToolbar(itemTitle: string): Toolbar {
    const toolbar = new Toolbar();
    toolbar.node.addEventListener('click', () => {
      this._changed.emit({ action: 'edit' });
    });
    toolbar.addClass('glue-Session-tab-toolbar');

    toolbar.addItem(
      'Close',
      new ToolbarButton({
        tooltip: 'Close',
        icon: closeIcon,
        onClick: () => this._changed.emit({ action: 'close' })
      })
    );

    const title = new Widget();
    title.node.innerText = itemTitle;
    title.node.style.flexGrow = '1';
    title.node.style.justifyContent = 'center';
    toolbar.addItem('Title', title);
    return toolbar;
  }

  private _spinner: HTMLDivElement;

  private _pos: number[];
  private _size: number[];
  private _title: string;
  private _cellOutput: Widget;
  private _tabName: string;
  private _changed: Signal<GridStackItem, GridStackItem.IChange>;
}

export namespace GridStackItem {
  export interface IOptions {
    cellIdentity: string;
    cell: Widget;
    itemTitle?: string;
    pos: number[];
    size: number[];
    tabName: string;
  }

  export interface IChange {
    action: 'close' | 'lock' | 'edit' | 'layer';
    dataLayer?: string;
  }
}
