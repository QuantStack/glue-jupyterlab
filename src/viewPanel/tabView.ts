import { Panel, Widget } from '@lumino/widgets';
import { TabModel } from './tabModel';
import { GridStack } from 'gridstack';
import { GridStackItem } from './gridStackItem';
import { MessageLoop } from '@lumino/messaging';

export class TabView extends Panel {
  constructor(options: TabView.IOptions) {
    super();
    this._model = options.model;
    this.title.label = this._model?.tabName ?? '';
    this._gridHost = document.createElement('div');
    this._gridHost.className = 'grid-stack';
    this._gridHost.classList.add('glue-Session-gridhost');
    this.node.appendChild(this._gridHost);
    this.node.style.overflow = 'auto';
    this._grid = GridStack.init(
      {
        float: true,
        column: 12,
        margin: 3,
        cellHeight: 40,
        styleInHead: true,
        disableOneColumnMode: true,
        draggable: {
          handle: '.glue-Session-tab-toolbar'
        }
      },
      this._gridHost
    );
    this.render()
      .catch(console.error)
      .then(() => window.dispatchEvent(new Event('resize')));
  }

  async render(): Promise<void> {
    const viewWidgets = this._model?.createView();
    if (!viewWidgets) {
      return;
    }
    for await (const view of viewWidgets) {
      if (view) {
        this.addGridItem(view);
      }
    }
  }

  protected onResize(msg: Widget.ResizeMessage): void {
    window.dispatchEvent(new Event('resize'));
  }

  addGridItem(out: GridStackItem): void {
    this._gridElements.push(out);

    const id = out.cellIdentity;

    const options: { [key: string]: any } = {
      id,
      autoPosition: true,
      noMove: false,
      noResize: false,
      locked: false,
      w: 6,
      h: 12
    };
    // out.node.style.background = '#34aadc'
    MessageLoop.sendMessage(out, Widget.Msg.BeforeAttach);
    this._grid.addWidget(out.node, options);
    MessageLoop.sendMessage(out, Widget.Msg.AfterAttach);
  }

  private _model?: TabModel;
  private _gridHost: HTMLElement;
  private _grid: GridStack;
  private _gridElements: GridStackItem[] = [];
}

export namespace TabView {
  export interface IOptions {
    model?: TabModel;
  }
}
