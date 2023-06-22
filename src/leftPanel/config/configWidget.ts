import { Signal } from '@lumino/signaling';
import { Panel } from '@lumino/widgets';

import { ConfigWidgetModel, IOutputChangedArg } from './configWidgetModel';

export class ConfigWidget extends Panel {
  constructor(options: { model: ConfigWidgetModel }) {
    super();
    this.addClass('glue-LeftPanel-configWidget');
    this._model = options.model;
    this.title.label = `${this._model.config} Options`;
    this._model.outputChanged.connect(this._outputChangedHandler, this);
  }

  private _outputChangedHandler(
    sender: ConfigWidgetModel,
    args: IOutputChangedArg
  ): void {
    const { oldOuput, newOutput } = args;
    if (oldOuput) {
      this.layout?.removeWidget(oldOuput);
    }
    if (newOutput) {
      this.addWidget(newOutput);
    }
    if (!oldOuput && !newOutput) {
      for (const iterator of this.children()) {
        this.layout?.removeWidget(iterator);
      }
    }
  }

  dispose(): void {
    this._model.outputChanged.disconnect(this._outputChangedHandler);
    Signal.clearData(this);
    super.dispose();
  }

  private _model: ConfigWidgetModel;
}
