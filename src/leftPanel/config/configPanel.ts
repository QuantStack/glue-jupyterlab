import { IRenderMimeRegistry } from '@jupyterlab/rendermime';
import { SidePanel } from '@jupyterlab/ui-components';
import { Widget } from '@lumino/widgets';
import {
  IControlPanelModel,
  IDict,
  IGlueSessionSharedModel,
  IRequestConfigDisplay
} from '../../types';
import { ConfigWidget } from './configWidget';
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
    this._model.glueSessionChanged.connect(() => {
      this._model.sharedModel?.tabChanged.connect(this._removeHeader, this);
    }, this);
  }

  dispose(): void {
    this._model.sharedModel?.tabChanged?.disconnect(this._removeHeader);
    this._model.displayConfigRequested.disconnect(this._updateHeader);
    super.dispose();
  }
  private _removeHeader(sender: IGlueSessionSharedModel, args: IDict): void {
    const { sharedModel, tabId, cellId } = this._headerData;
    const { tab, changes } = args;
    if (sender === sharedModel && tab === tabId) {
      const keys = changes.keys as Map<string, { action: string }>;
      keys.forEach((v, k) => {
        if (v.action === 'delete' && k === cellId) {
          this._panelHeader.node.innerHTML = '';
          this._headerData = {};
        }
      });
    }
  }

  private _createHeader(): void {
    this.toolbar.addItem('Header', this._panelHeader);
    this._model.displayConfigRequested.connect(this._updateHeader, this);
  }
  private _updateHeader(
    sender: IControlPanelModel,
    args: IRequestConfigDisplay
  ): void {
    this._headerData = {
      sharedModel: sender.sharedModel,
      tabId: args.tabId,
      cellId: args.cellId
    };
    this._panelHeader.node.innerHTML = `<b>${args.tabId.toUpperCase()} - ${args.cellId?.toUpperCase()}</b>`;
  }
  private _model: IControlPanelModel;
  private _headerData: {
    sharedModel?: IGlueSessionSharedModel;
    tabId?: string;
    cellId?: string;
  } = {};
  private _panelHeader = new Widget();
}
