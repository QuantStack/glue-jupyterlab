import { Signal, ISignal } from '@lumino/signaling';

import {
  IControlPanelModel,
  IGlueSessionWidget,
  IGlueSessionSharedModel,
  IGlueSessionModel,
  IRequestConfigDisplay
} from '../types';
import { IGlueSessionTracker } from '../token';
import { IGlueSessionTabs } from '../_interface/glue.schema';
import { ISessionContext } from '@jupyterlab/apputils';
import { IKernelConnection } from '@jupyterlab/services/lib/kernel/kernel';

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
      this._currentSessionPath = changed?.context.path;
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
  get currentSessionWidget(): IGlueSessionWidget | null {
    return this._tracker.currentWidget;
  }
  get glueSessionChanged(): ISignal<
    IControlPanelModel,
    IGlueSessionWidget | null
  > {
    return this._glueSessionChanged;
  }
  get displayConfigRequested(): ISignal<
    IControlPanelModel,
    IRequestConfigDisplay
  > {
    return this._displayConfigRequested;
  }
  get clearConfigRequested(): ISignal<IControlPanelModel, void> {
    return this._clearConfigRequested;
  }

  get currentSessionPath(): string | undefined {
    return this._currentSessionPath;
  }

  get selectedDataset(): string | null {
    return this._selectedDataset;
  }

  set selectedDataset(value: string | null) {
    if (value !== this._selectedDataset) {
      this._selectedDataset = value;
      this._selectedDatasetChanged.emit();
    }
  }

  get selectedDatasetChanged(): ISignal<IControlPanelModel, void> {
    return this._selectedDatasetChanged;
  }

  get tabsChanged(): ISignal<IControlPanelModel, void> {
    return this._tabsChanged;
  }

  getTabs(): IGlueSessionTabs {
    return this._tabs;
  }

  currentSessionContext(): ISessionContext | undefined {
    return this._tracker.currentWidget?.context.sessionContext;
  }

  currentSessionKernel(): IKernelConnection | undefined {
    return this._tracker.currentWidget?.sessionWidget.kernel;
  }

  displayConfig(args: IRequestConfigDisplay): void {
    this._displayConfigRequested.emit(args);
  }
  clearConfig(): void {
    this._clearConfigRequested.emit();
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
  private _tabs: IGlueSessionTabs = {};
  private _currentSessionPath: string | undefined = undefined;
  private _tabsChanged = new Signal<IControlPanelModel, void>(this);
  private _selectedDataset: string | null = null;
  private _selectedDatasetChanged = new Signal<IControlPanelModel, void>(this);

  private _displayConfigRequested = new Signal<
    IControlPanelModel,
    IRequestConfigDisplay
  >(this);
  private _clearConfigRequested = new Signal<IControlPanelModel, void>(this);

  private _sessionModel?: IGlueSessionModel;
}

namespace ControlPanelModel {
  export interface IOptions {
    tracker: IGlueSessionTracker;
  }
}
