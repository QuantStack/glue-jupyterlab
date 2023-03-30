import { SidePanel, ToolbarButton } from '@jupyterlab/ui-components';
import { CommandRegistry } from '@lumino/commands';

import { CommandIDs } from '../../token';
import { DatasetsWidget } from './datasetsWidget';
import { SubsetsWidget } from './subsetsWidget';
import { DataPanelModel } from './dataPanelModel';

export class DataPanel extends SidePanel {
  constructor(options: DataPanel.IOptions) {
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
    this.toolbar.addItem(
      'Link data',
      new ToolbarButton({
        tooltip: 'Link Data',
        label: 'Link Data',
        onClick: () => options.commands.execute(CommandIDs.openLinkEditor)
      })
    );
    const dataset = new DatasetsWidget({ model: this._model });
    this.addWidget(dataset);

    const subset = new SubsetsWidget({ model: this._model });
    this.addWidget(subset);
  }

  private _model: DataPanelModel;
}

namespace DataPanel {
  /**
   * The DataPanel options.
   */
  export interface IOptions {
    model: DataPanelModel;
    commands: CommandRegistry;
  }
}
