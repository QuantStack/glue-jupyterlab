import { IRenderMimeRegistry } from '@jupyterlab/rendermime';
import { SidePanel } from '@jupyterlab/ui-components';
import { Widget } from '@lumino/widgets';

import {
  IControlPanelModel,
  IDict,
  IGlueSessionSharedModel,
  IGlueSessionWidget,
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
    this._model.glueSessionChanged.connect(this._onSessionChanged, this);
  }

  dispose(): void {
    this._model.glueSessionChanged.disconnect(this._onSessionChanged);
    this._model.sharedModel?.tabChanged?.disconnect(this._removeHeader);
    this._model.displayConfigRequested.disconnect(this._updateHeader);
    super.dispose();
  }

  private _onSessionChanged(
    sender: IControlPanelModel,
    glueSessionWidget: IGlueSessionWidget | null
  ) {
    if (!glueSessionWidget) {
      this._panelHeader.node.innerHTML = '';
      this._headerData.clear();
      return;
    }

    const headerData = this._headerData.get(glueSessionWidget) ?? {};
    const { tabId, cellId } = headerData;

    this._panelHeader.node.innerHTML = this._headerFactory(tabId, cellId);
    this._model.sharedModel?.tabChanged.connect(this._removeHeader, this);
  }

  private _removeHeader(sender: IGlueSessionSharedModel, args: IDict): void {
    if (!this._model.currentSessionWidget) {
      return;
    }
    const headerData =
      this._headerData.get(this._model.currentSessionWidget) ?? {};
    const { sharedModel, tabId, cellId } = headerData;
    const { tab, changes } = args;
    if (sender === sharedModel && tab === tabId) {
      const keys = changes.keys as Map<string, { action: string }>;
      keys.forEach((v, k) => {
        if (v.action === 'delete' && k === cellId) {
          this._panelHeader.node.innerHTML = '';
          this._headerData.delete(this._model.currentSessionWidget!);
        }
      });
    }
  }

  private _createHeader(): void {
    this.toolbar.addItem('Header', this._panelHeader);
    this._model.displayConfigRequested.connect(this._updateHeader, this);
    this._model.clearConfigRequested.connect(() => {
      this._panelHeader.node.innerHTML = '';
      if (this._model.currentSessionWidget) {
        this._headerData.delete(this._model.currentSessionWidget);
      }
    }, this);
  }

  private _updateHeader(
    sender: IControlPanelModel,
    args: IRequestConfigDisplay
  ): void {
    const headerData = {
      sharedModel: sender.sharedModel,
      tabId: args.tabId,
      cellId: args.cellId
    };
    if (this._model.currentSessionWidget) {
      this._headerData.set(this._model.currentSessionWidget, headerData);
    }
    this._panelHeader.node.innerHTML = this._headerFactory(
      args.tabId,
      args.cellId
    );
  }

  private _headerFactory(tabId?: string, cellId?: string): string {
    return `<b>${tabId?.toUpperCase() ?? ''} - ${
      cellId?.toUpperCase() ?? ''
    }</b>`;
  }

  private _model: IControlPanelModel;

  private _headerData = new Map<
    IGlueSessionWidget,
    {
      sharedModel?: IGlueSessionSharedModel;
      tabId?: string;
      cellId?: string;
    }
  >();
  private _panelHeader = new Widget();
}
