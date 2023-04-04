import { Panel, Widget } from '@lumino/widgets';
import { Toolbar, ToolbarButton, closeIcon } from '@jupyterlab/ui-components';
export class GridStackItem extends Panel {
  constructor(options: GridStackItem.IOptions) {
    super();
    this.removeClass('lm-Widget');
    this.removeClass('p-Widget');
    this.addClass('grid-stack-item');
    const { cellIdentity, cell, itemTitle = '' } = options;
    this._toolbar = this._createToolbar(itemTitle);
    const content = new Panel();
    content.addClass('grid-stack-item-content');
    cell.addClass('grid-item-widget');
    content.addWidget(this._toolbar);
    content.addWidget(cell);
    this.addWidget(content);
    this._cellOutput = cell;
    this.cellIdentity = cellIdentity;
  }
  readonly cellIdentity: string;

  get cellOutput(): Widget {
    return this._cellOutput;
  }

  private _createToolbar(itemTitle: string): Toolbar {
    const toolbar = new Toolbar();
    toolbar.addClass('glue-Session-tab-toolbar');
    toolbar.addItem(
      'Close',
      new ToolbarButton({
        tooltip: 'Close',
        icon: closeIcon,
        onClick: () => console.log('clicked')
      })
    );
    const title = new Widget();
    title.node.innerText = itemTitle;
    title.node.style.flexGrow = '1';
    title.node.style.justifyContent = 'center';
    toolbar.addItem('Title', title);
    return toolbar;
  }

  private _toolbar: Toolbar;
  private _cellOutput: Widget;
}

export namespace GridStackItem {
  export interface IOptions {
    cellIdentity: string;
    cell: Widget;
    itemTitle?: string;
  }
}
