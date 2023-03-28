import { IDisposable } from '@lumino/disposable';
import { IGlueSessionModel } from '../types';
import { ISignal, Signal } from '@lumino/signaling';

export class SubPanelModel implements IDisposable {
  constructor(options: { sessionModel?: IGlueSessionModel }) {
    this._sessionModel = options.sessionModel;
    this._sessionChanged = new Signal(this);
  }
  get isDisposed(): boolean {
    return this._isDisposed;
  }
  get sessionChanged(): ISignal<this, IGlueSessionModel | undefined> {
    return this._sessionChanged;
  }

  setSession(session: IGlueSessionModel | undefined): void {
    this._sessionModel = session;
    this._sessionChanged.emit(this._sessionModel);
  }
  dispose(): void {
    if (this._isDisposed) {
      return;
    }
    Signal.clearData(this);
    this._isDisposed = true;
  }
  protected _sessionChanged: Signal<this, IGlueSessionModel | undefined>;

  protected _sessionModel: IGlueSessionModel | undefined;
  protected _isDisposed = false;
}
