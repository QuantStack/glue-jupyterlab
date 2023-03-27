import { Widget } from '@lumino/widgets';
import { LayersPanelModel } from './layersPanelModel';
import { IDict } from '../../types';
export class CanvasControlWidget extends Widget {
  constructor(options: { model: LayersPanelModel; data: IDict }) {
    super();
    this._model = options.model;
    console.log('this._model', this._model, options.data);
    this.node.style.padding = '5px';
    this.node.style.background = 'var(--jp-layout-color1)';
    const inner = new Widget();
    inner.node.style.height = '100%';
    inner.node.style.background = '#a085ff3d';
    this.node.appendChild(inner.node);
  }
  private _model: LayersPanelModel;
}
