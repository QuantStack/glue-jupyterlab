import { Widget } from '@lumino/widgets';
import { IControlPanelModel } from '../../types';
export class ConfigWidget extends Widget {
  constructor(options: { model: IControlPanelModel }) {
    super();
    this._model = options.model;
    this.node.style.padding = '5px';
    this.node.style.background = 'var(--jp-layout-color1)';
    const inner = new Widget();
    inner.node.style.height = '100%';
    inner.node.style.background = 'pink';
    this.node.appendChild(inner.node);
    this._model.displayConfigRequested.connect((_, args) => {
      this.title.label = `${args.tabId} - ${args.cellId}`;
    });
  }

  private _model: IControlPanelModel;
}
