import { SidePanel, ToolbarButton } from '@jupyterlab/ui-components';
import { CanvasControlWidget } from './canvasControl';
import { IControlPanelModel } from '../../types';
export class LayerPanel extends SidePanel {
  constructor(options: { model: IControlPanelModel }) {
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
        onClick: () => console.log('clicked')
      })
    );
    this._model.tabsChanged.connect(() => {
      this.content.widgets.forEach(w => this.content.layout?.removeWidget(w));

      const allTabs = this._model.getTabs();
      Object.keys(allTabs).forEach(tabName => {
        const widget = new CanvasControlWidget({
          model: this._model,
          tabName
        });
        widget.title.label = tabName;
        this.addWidget(widget);
      });
    });
  }
  private _model: IControlPanelModel;
}
