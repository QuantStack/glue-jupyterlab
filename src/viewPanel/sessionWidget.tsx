import { BoxPanel, Widget } from '@lumino/widgets';
import { HTabPanel } from '../common/tabPanel';
import { IGlueSessionModel } from '../types';

export class SessionWidget extends BoxPanel {
  constructor(options: { model: IGlueSessionModel }) {
    super({ direction: 'top-to-bottom' });
    this._model = options.model;
    const tabBarClassList = ['glue-Session-tabBar'];
    this._tabPanel = new HTabPanel({
      tabBarPosition: 'bottom',
      tabBarClassList,
      tabBarOption: {
        addButtonEnabled: true
      }
    });
    this._tabPanel.activateTab(0);

    this.addWidget(this._tabPanel);
    BoxPanel.setStretch(this._tabPanel, 1);
    this._model.sharedModel.tabsChanged.connect(this._onTabsChanged, this);
  }

  private _onTabsChanged(): void {
    Object.keys(this._model.sharedModel.tabs).forEach((tab, idx) => {
      const canvas = new Widget();
      canvas.node.innerText = tab;
      canvas.title.label = tab;
      this._tabPanel.addTab(canvas, idx);
    });
  }
  private _tabPanel: HTabPanel;
  private _model: IGlueSessionModel;
}
