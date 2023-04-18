import { CommandRegistry } from '@lumino/commands';
import { SidePanel, ToolbarButton } from '@jupyterlab/ui-components';
import { DatasetsWidget } from './datasetsWidget';
import { SubsetsWidget } from './subsetsWidget';
import { IControlPanelModel } from '../../types';

export class DataPanel extends SidePanel {
  constructor(options: {
    model: IControlPanelModel;
    commands: CommandRegistry;
  }) {
    super();

    this.title.label = 'Data';
    this.toolbar.addItem(
      'Add data',
      new ToolbarButton({
        tooltip: 'Add Data',
        label: 'Add Data',
        onClick: () => console.log('clicked')
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
