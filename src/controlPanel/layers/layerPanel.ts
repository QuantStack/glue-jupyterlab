import { SidePanel, ToolbarButton } from '@jupyterlab/ui-components';
import { CommandRegistry } from '@lumino/commands';

import { CommandIDs } from '../../token';
import { CanvasControlWidget } from './canvasControl';
import { LayersPanelModel } from './layersPanelModel';

export class LayerPanel extends SidePanel {
  constructor(options: LayerPanel.IOptions) {
    super();
    this.title.label = 'Layers';
    this._model = options.model;
    this.toolbar.addItem(
      'New canvas',
      new ToolbarButton({
        tooltip: 'New canvas',
        label: 'New canvas',
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
    this._model.sessionChanged.connect(() => {
      this.content.widgets.forEach(w => this.content.layout?.removeWidget(w));

      const canvasList = this._model.getCanvas();
      canvasList.forEach((item, idx) => {
        const widget = new CanvasControlWidget({
          model: this._model,
          data: item
        });
        widget.title.label = 'Canvas ' + idx;
        this.addWidget(widget);
      });
    });
  }
  private _model: LayersPanelModel;
}

namespace LayerPanel {
  /**
   * Tha LayerPanel options.
   */
  export interface IOptions {
    model: LayersPanelModel;
    commands: CommandRegistry;
  }
}
