import { SidePanel } from '@jupyterlab/ui-components';
import { IControlPanelModel } from '../types';
import { ControlPanelHeader } from './header';
import { IGlueCanvasTracker } from '../token';

export class ControlPanelWidget extends SidePanel {
  constructor(options: LeftPanelWidget.IOptions) {
    super();
    this.addClass('gluelab-sidepanel-widget');
    this._model = options.model;
    console.log('th', this._model);
    const header = new ControlPanelHeader();
    this.header.addWidget(header);
    this._model.canvasChanged.connect((_, changed) => {
      if (changed) {
        header.title.label = changed.context.localPath;
      } else {
        header.title.label = '-';
      }
    });
  }

  dispose(): void {
    super.dispose();
  }

  private _model: IControlPanelModel;
}

export namespace LeftPanelWidget {
  export interface IOptions {
    model: IControlPanelModel;
    tracker: IGlueCanvasTracker;
  }
}
