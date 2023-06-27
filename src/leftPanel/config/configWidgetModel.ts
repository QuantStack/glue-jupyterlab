import {
  IControlPanelModel,
  IGlueSessionWidget,
  IRequestConfigDisplay
} from '../../types';
import { SimplifiedOutputArea, OutputAreaModel } from '@jupyterlab/outputarea';
import { IRenderMimeRegistry } from '@jupyterlab/rendermime';
import { ISignal, Signal } from '@lumino/signaling';
import { IDisposable } from '@lumino/disposable';
import { SessionWidget } from '../../viewPanel/sessionWidget';

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
    this._model.glueSessionChanged.connect(this._sessionChanged, this);
    this._model.displayConfigRequested.connect(this._showConfig, this);
    this._model.clearConfigRequested.connect(this._clearConfig, this);
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
    this._model.displayConfigRequested.disconnect(this._showConfig);
    this._model.clearConfigRequested.disconnect(this._clearConfig);

    Signal.clearData(this);
  }

  private _clearConfig(): void {
    const context = this._model.currentSessionContext();

    if (context && this._currentSessionWidget) {
      const output = this._outputs.get(this._currentSessionWidget);
      if (!output) {
        return;
      }
      output.model.clear();
      this._currentArgs = undefined;
    }
  }
  private _showConfig(
    sender: IControlPanelModel,
    args: IRequestConfigDisplay
  ): void {
    const context = this._model.currentSessionContext();
    if (this._currentArgs) {
      const { gridItem, tabId, cellId } = this._currentArgs;
      if (
        gridItem === args.gridItem &&
        tabId === args.tabId &&
        cellId === args.cellId
      ) {
        return;
      }
    }

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
      this._currentArgs = { ...args };
    }
  }

  private _sessionChanged(
    sender: IControlPanelModel,
    glueSessionWidget: IGlueSessionWidget | null
  ): void {
    if (!glueSessionWidget) {
      if (this._currentSessionWidget) {
        this._outputs.delete(this._currentSessionWidget);
        this._currentSessionWidget = null;
        this._outputChanged.emit({
          oldOuput: null,
          newOutput: null
        });
      }
    } else {
      if (!this._outputs.has(glueSessionWidget)) {
        const output = new SimplifiedOutputArea({
          model: new OutputAreaModel({ trusted: true }),
          rendermime: (glueSessionWidget.content as SessionWidget).rendermime
        });
        output.id = glueSessionWidget.context.path;
        this._outputs.set(glueSessionWidget, output);
      }
      this._outputChanged.emit({
        oldOuput: this._currentSessionWidget
          ? this._outputs.get(this._currentSessionWidget)
          : null,
        newOutput: this._outputs.get(glueSessionWidget)!
      });

      this._currentSessionWidget = glueSessionWidget;
    }
  }

  private _outputs = new Map<IGlueSessionWidget, SimplifiedOutputArea>();
  private _model: IControlPanelModel;
  private _config: 'Layer' | 'Viewer';
  private _disposed = false;
  private _currentSessionWidget: IGlueSessionWidget | null = null;
  private _outputChanged = new Signal<ConfigWidgetModel, IOutputChangedArg>(
    this
  );
  private _currentArgs?: IRequestConfigDisplay;
}
