import { SidePanel } from '@jupyterlab/ui-components';
// import { CanvasControlWidget } from './canvasControl';
import { IControlPanelModel } from '../../types';
import { ConfigWidget } from './configWidget';
import { IRenderMimeRegistry } from '@jupyterlab/rendermime';
import { Widget } from '@lumino/widgets';
import { ConfigWidgetModel } from './configWidgetModel';
export class ConfigPanel extends SidePanel {
  constructor(options: {
    model: IControlPanelModel;
    rendermime: IRenderMimeRegistry;
  }) {
    super();
    const { model, rendermime } = options;
    this.title.label = 'Control Panel';
    this._model = model;

    const viewerControl = new ConfigWidget({
      model: new ConfigWidgetModel({
        model: this._model,
        config: 'Viewer',
        rendermime
      })
    });

    const layerControl = new ConfigWidget({
      model: new ConfigWidgetModel({
        model: this._model,
        config: 'Layer',
        rendermime
      })
    });
    this.addWidget(viewerControl);
    this.addWidget(layerControl);
    this._createHeader();
  }

  private _createHeader(): void {
    const header = new Widget();
    this.toolbar.addItem('Header', header);
    this._model.displayConfigRequested.connect((_, args) => {
      header.node.innerHTML = `<b>${args.tabId.toUpperCase()} - ${args.cellId?.toUpperCase()}</b>`;
    });
  }
  private _model: IControlPanelModel;
}
