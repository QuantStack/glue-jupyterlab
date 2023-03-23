import { ControlPanelModel } from './model';
import { ControlPanelWidget } from './widget';
import { glueIcon } from '../tools';
import {
  ILayoutRestorer,
  JupyterFrontEnd,
  JupyterFrontEndPlugin
} from '@jupyterlab/application';

const NAME_SPACE = 'gluelab';

export const controlPanel: JupyterFrontEndPlugin<void> = {
  id: 'glue-lab:control-panel',
  autoStart: true,
  requires: [ILayoutRestorer],
  activate: (app: JupyterFrontEnd, restorer: ILayoutRestorer) => {
    const controlModel = new ControlPanelModel({});

    const controlPanel = new ControlPanelWidget({
      model: controlModel
    });
    controlPanel.id = 'glueLab::controlPanel';
    controlPanel.title.caption = 'GlueLab Control Panel';
    controlPanel.title.icon = glueIcon;
    if (restorer) {
      restorer.add(controlPanel, NAME_SPACE);
    }
    app.shell.add(controlPanel, 'left', { rank: 2000 });
  }
};
