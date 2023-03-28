import { SidePanel } from '@jupyterlab/ui-components';
import { IControlPanelModel } from '../types';
import { ControlPanelHeader } from './header';
import { IGlueSessionTracker } from '../token';
import { HTabPanel } from '../common/tabPanel';
import { BoxPanel } from '@lumino/widgets';
import { Message } from '@lumino/messaging';
import { DataPanel } from './data/dataPanel';
import { LayerPanel } from './layers/layerPanel';
import { DataPanelModel } from './data/dataPanelModel';
import { LayersPanelModel } from './layers/layersPanelModel';

export class ControlPanelWidget extends SidePanel {
  constructor(options: LeftPanelWidget.IOptions) {
    const content = new BoxPanel();
    super({ content });
    this.addClass('gluelab-sidepanel-widget');
    this._model = options.model;
    const header = new ControlPanelHeader();
    this.header.addWidget(header);

    this._tabPanel = new HTabPanel({
      tabBarPosition: 'top',
      tabBarClassList: ['lm-DockPanel-tabBar', 'glue-Panel-tabBar']
    });
    const dataPanelModel = new DataPanelModel({});
    const data = new DataPanel({ model: dataPanelModel });

    const layerPanelModel = new LayersPanelModel({});
    const canvas = new LayerPanel({ model: layerPanelModel });

    this._tabPanel.addTab(data, 0);
    this._tabPanel.addTab(canvas, 1);
    this._tabPanel.activateTab(0);
    this.addWidget(this._tabPanel);
    BoxPanel.setStretch(this._tabPanel, 1);

    this._model.glueSessionChanged.connect((_, changed) => {
      if (changed) {
        header.title.label = changed.context.localPath;
        dataPanelModel.setSession(changed.context.model);
        layerPanelModel.setSession(changed.context.model);
      } else {
        header.title.label = '-';
        dataPanelModel.setSession(undefined);
        layerPanelModel.setSession(undefined);
      }
    });
  }

  protected onActivateRequest(msg: Message): void {
    this._tabPanel.activate();
    this._tabPanel.show();
  }
  dispose(): void {
    super.dispose();
  }

  private _model: IControlPanelModel;
  private _tabPanel: HTabPanel;
}

export namespace LeftPanelWidget {
  export interface IOptions {
    model: IControlPanelModel;
    tracker: IGlueSessionTracker;
  }
}
