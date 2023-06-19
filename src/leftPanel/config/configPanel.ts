import { SidePanel } from '@jupyterlab/ui-components';
// import { CanvasControlWidget } from './canvasControl';
import { IControlPanelModel } from '../../types';
import { ConfigWidget } from './configWidget';
export class ConfigPanel extends SidePanel {
  constructor(options: { model: IControlPanelModel }) {
    super();
    this.title.label = 'Control Panel';
    this._model = options.model;
    const widgetControl = new ConfigWidget({ model: this._model });
    this.addWidget(widgetControl);
  }
  private _model: IControlPanelModel;
}
