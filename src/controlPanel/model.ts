import {
  IControlPanelModel,
  IGlueCanvasWidget,
  IGlueSessionSharedModel
} from '../types';
import { IGlueCanvasTracker } from '../token';
import { Signal, ISignal } from '@lumino/signaling';

export class ControlPanelModel implements IControlPanelModel {
  constructor(options: ControlPanelModel.IOptions) {
    this._tracker = options.tracker;
    this._tracker.currentChanged.connect((_, changed) => {
      this._canvasChanged.emit(changed);
    });
  }
  get sharedModel(): IGlueSessionSharedModel | undefined {
    return this._tracker.currentWidget?.context.model.sharedModel;
  }

  get canvasChanged(): ISignal<IControlPanelModel, IGlueCanvasWidget | null> {
    return this._canvasChanged;
  }

  private readonly _tracker: IGlueCanvasTracker;
  private _canvasChanged = new Signal<
    IControlPanelModel,
    IGlueCanvasWidget | null
  >(this);
}

namespace ControlPanelModel {
  export interface IOptions {
    tracker: IGlueCanvasTracker;
  }
}
