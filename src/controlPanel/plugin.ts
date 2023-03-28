import { ControlPanelModel } from './model';
import { ControlPanelWidget } from './widget';
import { glueIcon } from '../tools';
import {
  ILayoutRestorer,
  JupyterFrontEnd,
  JupyterFrontEndPlugin
} from '@jupyterlab/application';
import { IGlueSessionTracker } from '../token';

const NAME_SPACE = 'gluelab';

export const controlPanel: JupyterFrontEndPlugin<void> = {
  id: 'glue-lab:control-panel',
  autoStart: true,
  requires: [ILayoutRestorer, IGlueSessionTracker],
  activate: (
    app: JupyterFrontEnd,
    restorer: ILayoutRestorer,
    tracker: IGlueSessionTracker
  ) => {
    const controlModel = new ControlPanelModel({ tracker });

    const controlPanel = new ControlPanelWidget({
      model: controlModel,
      tracker
    });
    controlPanel.id = 'glueLab::controlPanel';
    controlPanel.title.caption = 'GlueLab';
    controlPanel.title.icon = glueIcon;
    if (restorer) {
      restorer.add(controlPanel, NAME_SPACE);
    }
    app.shell.add(controlPanel, 'left', { rank: 2000 });
  }
};
