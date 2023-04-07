import { IRenderMimeRegistry } from '@jupyterlab/rendermime';
import { BoxPanel } from '@lumino/widgets';
import { HTabPanel } from '../common/tabPanel';
import { IGlueSessionSharedModel } from '../types';
import { TabView } from './tabView';
import { TabModel } from './tabModel';

export class SessionWidget extends BoxPanel {
  constructor(options: SessionWidget.IOptions) {
    super({ direction: 'top-to-bottom' });
    this._model = options.model;
    this._rendermime = options.rendermime;
    const tabBarClassList = ['glue-Session-tabBar'];
    this._tabPanel = new HTabPanel({
      sharedModel: this._model,
      tabBarPosition: 'bottom',
      tabBarClassList,
      tabBarOption: {
        addButtonEnabled: true
      }
    });
    this._tabPanel.activateTab(0);

    this.addWidget(this._tabPanel);
    BoxPanel.setStretch(this._tabPanel, 1);
    this._model.tabsChanged.connect(this._onTabsChanged, this);
  }

  private _onTabsChanged(): void {
    Object.entries(this._model.tabs).forEach(([tabName, tabData], idx) => {
      const model = new TabModel({
        tabName,
        tabData,
        rendermime: this._rendermime
      });
      const tabWidget = new TabView({ model });

      this._tabPanel.addTab(tabWidget, idx);
    });
  }
  private _tabPanel: HTabPanel;
  private _model: IGlueSessionSharedModel;
  private _rendermime: IRenderMimeRegistry;
}

export namespace SessionWidget {
  export interface IOptions {
    model: IGlueSessionSharedModel;
    rendermime: IRenderMimeRegistry;
  }
}
