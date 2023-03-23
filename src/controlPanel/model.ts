import { IControlPanelModel, IGlueSessionSharedModel } from '../types';

export class ControlPanelModel implements IControlPanelModel {
  constructor(options: ControlPanelModel.IOptions) {
    this._sharedModel = options.sharedModel;
  }

  get sharedModel(): IGlueSessionSharedModel | undefined {
    return this._sharedModel;
  }

  private _sharedModel?: IGlueSessionSharedModel;
}

namespace ControlPanelModel {
  export interface IOptions {
    sharedModel?: IGlueSessionSharedModel;
  }
}
