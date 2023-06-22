import { CommandRegistry } from '@lumino/commands';

import { SidePanel, ToolbarButton } from '@jupyterlab/ui-components';

import { FileDialog } from '@jupyterlab/filebrowser';
import { IDocumentManager } from '@jupyterlab/docmanager';

import { DatasetsWidget } from './datasetsWidget';
import { SubsetsWidget } from './subsetsWidget';
import { IControlPanelModel } from '../../types';

export class DataPanel extends SidePanel {
  constructor(options: {
    model: IControlPanelModel;
    commands: CommandRegistry;
    manager: IDocumentManager;
  }) {
    super();

    this.title.label = 'Data';
    this.toolbar.addItem(
      'Add data',
      new ToolbarButton({
        tooltip: 'Add Data',
        label: 'Add Data',
        onClick: async () => {
          if (!options.model.currentSessionPath) {
            // TODO Show an error dialog, or disable the button?
            return;
          }

          const output = await FileDialog.getOpenFiles({
            title: 'Load Data Files Into Glue Session',
            manager: options.manager
          });

          if (!output.value) {
            return;
          }

          const kernel = this._model.currentSessionKernel();
          if (kernel === undefined) {
            // TODO Show an error dialog
            return;
          }

          for (const file of output.value) {
            const filePath = file.path.includes(':')
              ? file.path.split(':')[1]
              : file.path;
            const code = `
            GLUE_SESSION.add_data("${filePath}")
            `;

            const future = kernel.requestExecute({ code }, false);
            await future.done;
          }
        }
      })
    );
    this._model = options.model;
    this.toolbar.addItem(
      'New Subset',
      new ToolbarButton({
        tooltip: 'New Subset',
        label: 'New Subset',
        onClick: () => console.log('clicked')
      })
    );
    const dataset = new DatasetsWidget({
      model: this._model,
      commands: options.commands
    });
    this.addWidget(dataset);

    const subset = new SubsetsWidget({ model: this._model });
    this.addWidget(subset);
  }

  private _model: IControlPanelModel;
}
