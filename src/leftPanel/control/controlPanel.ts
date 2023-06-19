import { SidePanel } from '@jupyterlab/ui-components';
// import { CanvasControlWidget } from './canvasControl';
import { IControlPanelModel } from '../../types';
export class ControlPanel extends SidePanel {
  constructor(options: { model: IControlPanelModel }) {
    super();
    this.title.label = 'Control Panel';
    this._model = options.model;
    console.log('this._mode', this._model.getTabs());
  }
  private _model: IControlPanelModel;
}
