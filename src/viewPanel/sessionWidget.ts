import { ISessionContext } from '@jupyterlab/apputils';
import { IRenderMimeRegistry } from '@jupyterlab/rendermime';
import { BoxPanel } from '@lumino/widgets';
import { HTabPanel } from '../common/tabPanel';
import { IGlueSessionSharedModel } from '../types';
import { TabView } from './tabView';
import { TabModel } from './tabModel';
import { LinkWidget } from '../linkPanel/linkPanel';

export class SessionWidget extends BoxPanel {
  constructor(options: SessionWidget.IOptions) {
    super({ direction: 'top-to-bottom' });
    this._model = options.model;
    this._rendermime = options.rendermime;
    this._sessionContext = options.sessionContext;
    const tabBarClassList = ['glue-Session-tabBar'];
    this._tabPanel = new HTabPanel({
      tabBarPosition: 'bottom',
      tabBarClassList,
      tabBarOption: {
        addButtonEnabled: true
      }
    });

    if (this._model) {
      this._linkWidget = new LinkWidget({ sharedModel: this._model });
      this._tabPanel.addTab(this._linkWidget, 0);
    }

    this.addWidget(this._tabPanel);
    BoxPanel.setStretch(this._tabPanel, 1);
    this._model.tabsChanged.connect(this._onTabsChanged, this);
  }

  private _onTabsChanged(): void {
    Object.entries(this._model.tabs).forEach(([tabName, tabData], idx) => {
      const model = new TabModel({
        tabName,
        tabData,
        rendermime: this._rendermime,
        sessionContext: this._sessionContext
      });
      const tabWidget = new TabView({ model });

      this._tabPanel.addTab(tabWidget, idx + 1);
    });
    this._tabPanel.activateTab(1);
  }
  private _tabPanel: HTabPanel;
  private _linkWidget: LinkWidget | undefined = undefined;
  private _model: IGlueSessionSharedModel;
  private _rendermime: IRenderMimeRegistry;
  private _sessionContext: ISessionContext;
}

export namespace SessionWidget {
  export interface IOptions {
    model: IGlueSessionSharedModel;
    rendermime: IRenderMimeRegistry;
    sessionContext: ISessionContext;
  }
}
