import { Signal, ISignal } from '@lumino/signaling';

import {
  IControlPanelModel,
  IGlueSessionWidget,
  IGlueSessionSharedModel,
  IGlueSessionModel
} from '../types';
import { IGlueSessionTracker } from '../token';
import { IGlueSessionTabs } from '../_interface/glue.schema';

export class ControlPanelModel implements IControlPanelModel {
  constructor(options: ControlPanelModel.IOptions) {
    this._tracker = options.tracker;
    this._tracker.currentChanged.connect(async (_, changed) => {
      await changed?.context.ready;
      if (this._sessionModel) {
        this._sessionModel.sharedModel.tabsChanged.disconnect(
          this._onTabsChanged
        );
      }
      this._sessionModel = changed?.context.model;
      this._tabs = this._sessionModel?.sharedModel.tabs ?? {};
      this._sessionModel?.sharedModel.tabsChanged.connect(
        this._onTabsChanged,
        this
      );
      this._glueSessionChanged.emit(changed);
    });
  }

  get sharedModel(): IGlueSessionSharedModel | undefined {
    return this._tracker.currentSharedModel();
  }

  get glueSessionChanged(): ISignal<
    IControlPanelModel,
    IGlueSessionWidget | null
  > {
    return this._glueSessionChanged;
  }

  get tabsChanged(): ISignal<IControlPanelModel, void> {
    return this._tabsChanged;
  }

  getTabs(): IGlueSessionTabs {
    return this._tabs;
  }

  private _onTabsChanged(_: any, e: any): void {
    this._tabs = this._sessionModel?.sharedModel.tabs ?? {};
    this._tabsChanged.emit();
  }

  private readonly _tracker: IGlueSessionTracker;
  private _glueSessionChanged = new Signal<
    IControlPanelModel,
    IGlueSessionWidget | null
  >(this);
  private _tabsChanged = new Signal<IControlPanelModel, void>(this);

  private _sessionModel?: IGlueSessionModel;
  private _tabs: IGlueSessionTabs = {};
}

namespace ControlPanelModel {
  export interface IOptions {
    tracker: IGlueSessionTracker;
  }
}
