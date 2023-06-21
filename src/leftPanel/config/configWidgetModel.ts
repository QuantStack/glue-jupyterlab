import {
  IControlPanelModel,
  IGlueSessionWidget,
  IRequestConfigDisplay
} from '../../types';
import { SimplifiedOutputArea, OutputAreaModel } from '@jupyterlab/outputarea';
import { IRenderMimeRegistry } from '@jupyterlab/rendermime';
import { ISignal, Signal } from '@lumino/signaling';
import { IDisposable } from '@lumino/disposable';

export interface IOutputChangedArg {
  oldOuput: SimplifiedOutputArea | null | undefined;
  newOutput: SimplifiedOutputArea | null | undefined;
}
export class ConfigWidgetModel implements IDisposable {
  constructor(options: {
    config: 'Layer' | 'Viewer';
    model: IControlPanelModel;
    rendermime: IRenderMimeRegistry;
  }) {
    this._model = options.model;
    this._config = options.config;
    this._rendermime = options.rendermime;
    this._model.glueSessionChanged.connect(this._sessionChanged, this);
    this._model.displayConfigRequested.connect(this._showConfig, this);
  }

  get config(): 'Layer' | 'Viewer' {
    return this._config;
  }
  get isDisposed(): boolean {
    return this._disposed;
  }

  get outputChanged(): ISignal<ConfigWidgetModel, IOutputChangedArg> {
    return this._outputChanged;
  }

  dispose(): void {
    if (this._disposed) {
      return;
    }

    this._disposed = true;
    this._model.glueSessionChanged.disconnect(this._sessionChanged);
    Signal.clearData(this);
  }

  private _showConfig(
    sender: IControlPanelModel,
    args: IRequestConfigDisplay
  ): void {
    const context = this._model.currentSessionContext();

    if (context && this._currentSessionWidget) {
      const output = this._outputs.get(this._currentSessionWidget);
      if (!output) {
        return;
      }
      SimplifiedOutputArea.execute(
        `GLUE_SESSION.render_config("${this._config}","${args.tabId}","${args.cellId}")`,
        output,
        context
      );
    }
  }

  private _sessionChanged(
    sender: IControlPanelModel,
    sessionWidget: IGlueSessionWidget | null
  ): void {
    if (!sessionWidget) {
      if (this._currentSessionWidget) {
        this._outputs.delete(this._currentSessionWidget);
        this._currentSessionWidget = null;
        this._outputChanged.emit({
          oldOuput: null,
          newOutput: null
        });
      }
    } else {
      if (!this._outputs.has(sessionWidget)) {
        const output = new SimplifiedOutputArea({
          model: new OutputAreaModel({ trusted: true }),
          rendermime: this._rendermime
        });
        output.id = sessionWidget.context.path;
        this._outputs.set(sessionWidget, output);
      }
      this._outputChanged.emit({
        oldOuput: this._currentSessionWidget
          ? this._outputs.get(this._currentSessionWidget)
          : null,
        newOutput: this._outputs.get(sessionWidget)!
      });

      this._currentSessionWidget = sessionWidget;
    }
  }

  private _outputs = new Map<IGlueSessionWidget, SimplifiedOutputArea>();
  private _model: IControlPanelModel;
  private _rendermime: IRenderMimeRegistry;
  private _config: 'Layer' | 'Viewer';
  private _disposed = false;
  private _currentSessionWidget: IGlueSessionWidget | null = null;
  private _outputChanged = new Signal<ConfigWidgetModel, IOutputChangedArg>(
    this
  );
}