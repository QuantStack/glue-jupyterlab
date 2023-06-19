import { SidePanel } from '@jupyterlab/ui-components';
// import { CanvasControlWidget } from './canvasControl';
import { IControlPanelModel } from '../../types';
import { ConfigWidget } from './configWidget';
import { IRenderMimeRegistry } from '@jupyterlab/rendermime';
export class ConfigPanel extends SidePanel {
  constructor(options: {
    model: IControlPanelModel;
    rendermime: IRenderMimeRegistry;
  }) {
    super();
    this.title.label = 'Control Panel';
    const { model, rendermime } = options;
    this._model = model;
    const widgetControl = new ConfigWidget({ model: this._model, rendermime });
    this.addWidget(widgetControl);
  }
  private _model: IControlPanelModel;
}
