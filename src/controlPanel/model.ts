import {
  IControlPanelModel,
  IGlueSessionWidget,
  IGlueSessionSharedModel
} from '../types';
import { IGlueSessionTracker } from '../token';
import { Signal, ISignal } from '@lumino/signaling';

export class ControlPanelModel implements IControlPanelModel {
  constructor(options: ControlPanelModel.IOptions) {
    this._tracker = options.tracker;
    this._tracker.currentChanged.connect((_, changed) => {
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

  private readonly _tracker: IGlueSessionTracker;
  private _glueSessionChanged = new Signal<
    IControlPanelModel,
    IGlueSessionWidget | null
  >(this);
}

namespace ControlPanelModel {
  export interface IOptions {
    tracker: IGlueSessionTracker;
  }
}
