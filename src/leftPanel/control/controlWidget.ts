import { Widget } from '@lumino/widgets';
import { IControlPanelModel } from '../../types';
export class CanvasControlWidget extends Widget {
  constructor(options: { model: IControlPanelModel; tabName: string }) {
    super();
    this._model = options.model;
    this._tabName = options.tabName;
    console.log('tabName', this._tabName, this._model);

    this.node.style.padding = '5px';
    this.node.style.background = 'var(--jp-layout-color1)';
    const inner = new Widget();
    inner.node.style.height = '100%';
    this.node.appendChild(inner.node);
  }

  private _model: IControlPanelModel;
  private _tabName: string;
}
