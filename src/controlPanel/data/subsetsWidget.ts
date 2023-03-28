import { Widget } from '@lumino/widgets';
import { DataPanelModel } from './dataPanelModel';
export class SubsetsWidget extends Widget {
  constructor(options: { model: DataPanelModel }) {
    super();
    this.title.label = 'Subsets';
    this._model = options.model;
    this._model.sessionChanged.connect(() => {
      /** */
    });
  }
  private _model: DataPanelModel;
}
