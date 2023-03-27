import { Widget } from '@lumino/widgets';
import { DataPanelModel } from './dataPanelModel';
export class DatasetsWidget extends Widget {
  constructor(options: { model: DataPanelModel }) {
    super();
    this._model = options.model;
    this.title.label = 'Datasets';

    this._model.sessionChanged.connect(() => {
      /** */
    });
  }

  private _model: DataPanelModel;
}
