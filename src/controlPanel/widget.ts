import { SidePanel } from '@jupyterlab/ui-components';
import { IControlPanelModel } from '../types';
import { ControlPanelHeader } from './header';

export class ControlPanelWidget extends SidePanel {
  constructor(options: LeftPanelWidget.IOptions) {
    super();
    this.addClass('gluelab-sidepanel-widget');
    this._model = options.model;
    console.log('th', this._model);
    const header = new ControlPanelHeader();
    this.header.addWidget(header);
  }

  dispose(): void {
    super.dispose();
  }

  private _model: IControlPanelModel;
}

export namespace LeftPanelWidget {
  export interface IOptions {
    model: IControlPanelModel;
  }
}
