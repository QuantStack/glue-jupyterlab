import { SidePanel } from '@jupyterlab/ui-components';
import { IControlPanelModel } from '../types';
import { ControlPanelHeader } from './header';
import { IGlueCanvasTracker } from '../token';
import { HTabPanel } from '../common/tabPanel';
import { Widget, BoxPanel } from '@lumino/widgets';
import { Message } from '@lumino/messaging';

export class ControlPanelWidget extends SidePanel {
  constructor(options: LeftPanelWidget.IOptions) {
    const content = new BoxPanel();
    super({ content });
    this.addClass('gluelab-sidepanel-widget');
    this._model = options.model;
    const header = new ControlPanelHeader();
    this.header.addWidget(header);
    this._model.canvasChanged.connect((_, changed) => {
      if (changed) {
        header.title.label = changed.context.localPath;
      } else {
        header.title.label = '-';
      }
    });
    this._tabPanel = new HTabPanel();
    const data = new Widget();
    data.node.innerText = 'Data';
    data.title.label = 'Data';

    const canvas = new Widget();
    canvas.node.innerText = 'Layers';
    canvas.title.label = 'Layers';

    this._tabPanel.addTab(data, 0);
    this._tabPanel.addTab(canvas, 1);
    this._tabPanel.activateTab(0);
    this.addWidget(this._tabPanel);
    BoxPanel.setStretch(this._tabPanel, 1);
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
    tracker: IGlueCanvasTracker;
  }
}
