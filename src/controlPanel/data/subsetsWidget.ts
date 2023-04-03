import { Widget } from '@lumino/widgets';
import { IControlPanelModel } from '../../types';
export class SubsetsWidget extends Widget {
  constructor(options: { model: IControlPanelModel }) {
    super();
    this.title.label = 'Subsets';
    this._model = options.model;
    void this._model;
  }
  private _model: IControlPanelModel;
}
