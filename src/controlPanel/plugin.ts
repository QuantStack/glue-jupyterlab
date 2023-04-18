import { ControlPanelModel } from './model';
import { ControlPanelWidget } from './widget';
import { glueIcon } from '../tools';
import {
  ILayoutRestorer,
  JupyterFrontEnd,
  JupyterFrontEndPlugin
} from '@jupyterlab/application';
import { IGlueSessionTracker } from '../token';
import { CommandIDs } from './commands';

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
    const { shell, commands } = app;

    const controlModel = new ControlPanelModel({ tracker });

    const controlPanel = new ControlPanelWidget({
      model: controlModel,
      tracker,
      commands
    });

    controlPanel.id = 'glueLab::controlPanel';
    controlPanel.title.caption = 'GlueLab';
    controlPanel.title.icon = glueIcon;

    if (restorer) {
      restorer.add(controlPanel, NAME_SPACE);
    }

    shell.add(controlPanel, 'left', { rank: 2000 });

    commands.addCommand(CommandIDs.new1DHistogram, {
      label: '1D Histogram',
      iconClass: 'fa fa-chart-bar',
      execute: () => {
        console.log('create new viewer for', controlModel.selectedDataset);
      }
    });

    commands.addCommand(CommandIDs.new2DScatter, {
      label: '2D Scatter',
      iconClass: 'fa fa-circle',
      execute: () => {
        console.log('create new viewer for', controlModel.selectedDataset);
      }
    });

    commands.addCommand(CommandIDs.new2DImage, {
      label: '2D Image',
      iconClass: 'fa fa-image',
      execute: () => {
        console.log('create new viewer for', controlModel.selectedDataset);
      }
    });
  }
};
