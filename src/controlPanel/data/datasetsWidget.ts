import { Widget } from '@lumino/widgets';
import { IControlPanelModel } from '../../types';
export class DatasetsWidget extends Widget {
  constructor(options: { model: IControlPanelModel }) {
    super();
    this._model = options.model;
    this.title.label = 'Datasets';
    void this._model;
  }

  private _model: IControlPanelModel;
}
